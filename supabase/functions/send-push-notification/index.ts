import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// ─── Minimal VAPID / Web Push implementation in Deno ────────────────────────
// We implement JWT signing and encryption inline to avoid heavy npm deps.

const encoder = new TextEncoder();

function b64urlToBytes(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLen);
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function bytesToB64url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function importVapidPrivateKey(privateKeyB64: string): Promise<CryptoKey> {
  const rawPrivate = b64urlToBytes(privateKeyB64);
  // Build PKCS8 DER for P-256
  const pkcs8Prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const pkcs8 = new Uint8Array(pkcs8Prefix.length + rawPrivate.length);
  pkcs8.set(pkcs8Prefix);
  pkcs8.set(rawPrivate, pkcs8Prefix.length);
  return crypto.subtle.importKey('pkcs8', pkcs8, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}

async function importVapidPublicKey(publicKeyB64: string): Promise<CryptoKey> {
  const raw = b64urlToBytes(publicKeyB64);
  return crypto.subtle.importKey('raw', raw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}

async function buildVapidJwt(
  audience: string,
  subject: string,
  privateKeyB64: string,
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };
  const head = bytesToB64url(encoder.encode(JSON.stringify(header)));
  const body = bytesToB64url(encoder.encode(JSON.stringify(payload)));
  const sigInput = encoder.encode(`${head}.${body}`);
  const key = await importVapidPrivateKey(privateKeyB64);
  const sigRaw = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, sigInput);
  return `${head}.${body}.${bytesToB64url(new Uint8Array(sigRaw))}`;
}

// ─── HKDF helper ─────────────────────────────────────────────────────────────
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    keyMaterial,
    length * 8,
  );
  return new Uint8Array(bits);
}

// ─── AES-128-GCM encrypt (RFC 8291 / draft-ietf-httpbis-encryption-encoding) ─
async function encryptPayload(
  payload: string,
  subscriptionPublicKeyB64: string,
  subscriptionAuthB64: string,
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const plaintext = encoder.encode(payload);

  // Generate ephemeral ECDH key pair
  const ephemeral = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const ephemeralPublicKey = await crypto.subtle.exportKey('raw', ephemeral.publicKey);
  const ephemeralPublicKeyBytes = new Uint8Array(ephemeralPublicKey);

  // Import subscription public key
  const subscriberPublicKey = b64urlToBytes(subscriptionPublicKeyB64);
  const importedSubKey = await crypto.subtle.importKey(
    'raw', subscriberPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, [],
  );

  // ECDH shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: importedSubKey },
    ephemeral.privateKey,
    256,
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  const authSecret = b64urlToBytes(subscriptionAuthB64);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // PRK (RFC 8291 §3.4)
  const prkInfo = new Uint8Array([
    ...encoder.encode('WebPush: info\x00'),
    ...subscriberPublicKey,
    ...ephemeralPublicKeyBytes,
  ]);
  const prk = await hkdf(authSecret, sharedSecret, prkInfo, 32);

  // CEK & nonce
  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\x00');
  const nonceInfo = encoder.encode('Content-Encoding: nonce\x00');
  const cek = await hkdf(salt, prk, cekInfo, 16);
  const nonce = await hkdf(salt, prk, nonceInfo, 12);

  // Encrypt
  const cryptoKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  // Padding: 2 bytes (0x0002 = no padding delimiter for the data)
  const paddedPlain = new Uint8Array(2 + plaintext.length);
  paddedPlain[0] = 0;
  paddedPlain[1] = 0;
  paddedPlain.set(plaintext, 2);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cryptoKey, paddedPlain);

  return {
    ciphertext: new Uint8Array(cipherBuf),
    salt,
    serverPublicKey: ephemeralPublicKeyBytes,
  };
}

// ─── Build aes128gcm content-encoding body (RFC 8188) ────────────────────────
function buildBody(salt: Uint8Array, serverPublicKey: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  // Header: salt (16) + rs (4, big-endian) + idlen (1) + keyid (65) + ciphertext
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  const view = new DataView(header.buffer);
  view.setUint32(16, rs, false);
  header[20] = 65;
  header.set(serverPublicKey, 21);
  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header);
  body.set(ciphertext, header.length);
  return body;
}

// ─── Send a single push message ──────────────────────────────────────────────
async function sendWebPush(
  endpoint: string,
  p256dh: string,
  authKey: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
): Promise<{ ok: boolean; status: number }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await buildVapidJwt(audience, vapidSubject, vapidPrivateKey);

  const { ciphertext, salt, serverPublicKey } = await encryptPayload(payload, p256dh, authKey);
  const body = buildBody(salt, serverPublicKey, ciphertext);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Authorization': `vapid t=${jwt},k=${vapidPublicKey}`,
      'Content-Length': String(body.length),
    },
    body,
  });

  return { ok: res.ok, status: res.status };
}

// ─── Edge Function handler ────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      user_id,
      title,
      body,
      url: notifUrl = '/',
      icon = '/icon-192x192.png',
      badge = '/icon-72x72.png',
      tag,
    } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'user_id, title, and body are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@bestold.in';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Check if user has push enabled + per-type opt-out
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('push_enabled, push_new_messages, push_order_updates, push_new_orders, push_return_requests')
      .eq('user_id', user_id)
      .maybeSingle();

    if (prefs && !prefs.push_enabled) {
      return new Response(JSON.stringify({ sent: 0, reason: 'push_disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Per-type opt-out checks
    if (prefs) {
      if (tag?.startsWith('chat-')          && prefs.push_new_messages   === false) {
        return new Response(JSON.stringify({ sent: 0, reason: 'type_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (tag?.startsWith('order-')         && prefs.push_order_updates  === false) {
        return new Response(JSON.stringify({ sent: 0, reason: 'type_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (tag?.startsWith('new-order-')     && prefs.push_new_orders     === false) {
        return new Response(JSON.stringify({ sent: 0, reason: 'type_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (tag?.startsWith('return-')        && prefs.push_return_requests === false) {
        return new Response(JSON.stringify({ sent: 0, reason: 'type_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (tag?.startsWith('order-cancel-')  && prefs.push_order_updates  === false) {
        return new Response(JSON.stringify({ sent: 0, reason: 'type_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 2. Fetch subscriptions for this user
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth_key')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_subscriptions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({ title, body, url: notifUrl, icon, badge, tag });
    const expiredIds: string[] = [];
    let sent = 0;

    // 3. Send to all subscriptions
    await Promise.all(
      subs.map(async (sub) => {
        try {
          const result = await sendWebPush(
            sub.endpoint,
            sub.p256dh,
            sub.auth_key,
            payload,
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY,
            VAPID_SUBJECT,
          );
          if (result.ok) {
            sent++;
          } else if (result.status === 404 || result.status === 410) {
            // Subscription expired
            expiredIds.push(sub.id);
          }
        } catch {
          // Network / encryption error — skip silently
        }
      }),
    );

    // 4. Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    return new Response(JSON.stringify({ sent, expired: expiredIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-push-notification] error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
