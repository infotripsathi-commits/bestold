import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, storeName, sellerName, storeUrl } = await req.json();

    if (!email || !storeName) {
      return new Response(
        JSON.stringify({ error: 'email and storeName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch active email configuration
    const { data: configData, error: configError } = await supabase.rpc('get_active_email_configuration');

    // RPC returns a SETOF (array) — pick the first row
    const config = Array.isArray(configData) ? configData[0] : configData;

    if (configError || !config) {
      console.error('[store-approved] Email config not found:', configError);
      return new Response(
        JSON.stringify({ error: 'No active email configuration found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const greeting = sellerName ? `Hi ${sellerName}` : 'Hello';
    const subject = `🎉 Your Store "${storeName}" is Now LIVE on BESTOLD!`;
    const dashboardUrl = storeUrl || 'https://bestold.in/seller/dashboard';

    // ─── Email HTML ────────────────────────────────────────────────────────────
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Store Approved — BESTOLD</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#16a34a;padding:40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:800;letter-spacing:-0.5px;">BESTOLD</h1>
              <p style="margin:8px 0 0;color:#dcfce7;font-size:15px;">Buy &amp; Sell Second-Hand Goods</p>
            </td>
          </tr>

          <!-- Celebration Banner -->
          <tr>
            <td style="background-color:#f0fdf4;padding:32px;text-align:center;border-bottom:1px solid #bbf7d0;">
              <p style="margin:0;font-size:48px;">🎉</p>
              <h2 style="margin:12px 0 8px;color:#15803d;font-size:26px;font-weight:800;">
                Your Store is LIVE!
              </h2>
              <p style="margin:0;color:#166534;font-size:16px;font-weight:600;">
                "${storeName}" has been approved by our admin team
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
                ${greeting},<br /><br />
                Congratulations! Your store <strong style="color:#16a34a;">"${storeName}"</strong>
                has been <strong>approved and is now live</strong> on BESTOLD.
                Buyers across India can now discover your store and browse your listings.
              </p>

              <!-- Status box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 4px;color:#15803d;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      ✅ Current Status
                    </p>
                    <p style="margin:0;color:#166534;font-size:18px;font-weight:700;">
                      Approved &amp; Live
                    </p>
                  </td>
                </tr>
              </table>

              <!-- What to do now -->
              <h3 style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:700;">
                Start Selling — Do This Now
              </h3>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td style="vertical-align:top;padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:14px;">
                          <div style="width:32px;height:32px;background-color:#16a34a;border-radius:50%;text-align:center;line-height:32px;color:#ffffff;font-weight:700;font-size:14px;">1</div>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:4px 0 2px;color:#111827;font-size:15px;font-weight:600;">Add Your First Product</p>
                          <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.5;">
                            Go to Seller Dashboard → Add Product. Upload photos, set a price, and write a clear description.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align:top;padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:14px;">
                          <div style="width:32px;height:32px;background-color:#16a34a;border-radius:50%;text-align:center;line-height:32px;color:#ffffff;font-weight:700;font-size:14px;">2</div>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:4px 0 2px;color:#111827;font-size:15px;font-weight:600;">Share Your Store Link</p>
                          <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.5;">
                            Share your store page on WhatsApp, Facebook, and Instagram to get your first buyers.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align:top;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:14px;">
                          <div style="width:32px;height:32px;background-color:#16a34a;border-radius:50%;text-align:center;line-height:32px;color:#ffffff;font-weight:700;font-size:14px;">3</div>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:4px 0 2px;color:#111827;font-size:15px;font-weight:600;">Reply to Messages Quickly</p>
                          <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.5;">
                            Buyers will message you directly. Fast replies lead to more sales — check your inbox daily.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 32px 36px;text-align:center;">
              <a href="${dashboardUrl}"
                style="display:inline-block;padding:15px 40px;background-color:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:700;">
                Go to Seller Dashboard →
              </a>
            </td>
          </tr>

          <!-- Tips -->
          <tr>
            <td style="padding:0 32px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 10px;color:#111827;font-size:15px;font-weight:700;">
                      💡 Tips to Sell Faster
                    </p>
                    <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.9;">
                      <li>Use <strong>natural daylight</strong> for product photos — avoids blur and shadows</li>
                      <li>Add <strong>multiple angles</strong> — front, back, sides, and any defects</li>
                      <li>Price <strong>5–10% below</strong> market to sell quickly</li>
                      <li>Mention <strong>age, condition, and reason for selling</strong> in description</li>
                      <li>Respond to buyer messages <strong>within 1 hour</strong> for best results</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">
                Questions? Email us at
                <a href="mailto:support@bestold.in" style="color:#16a34a;text-decoration:none;">support@bestold.in</a>
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} BESTOLD. All rights reserved.<br />
                <a href="https://bestold.in/privacy" style="color:#9ca3af;">Privacy Policy</a>
                &nbsp;|&nbsp;
                <a href="https://bestold.in/terms" style="color:#9ca3af;">Terms &amp; Conditions</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // ─── Send via provider ─────────────────────────────────────────────────────
    let emailSent = false;
    let errorMessage = '';

    if (config.provider === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${config.sender_name} <${config.sender_email}>`,
          to: email,
          subject,
          html: emailHtml,
        }),
      });
      if (res.ok) {
        emailSent = true;
      } else {
        const err = await res.json();
        errorMessage = err.message || 'Resend: failed to send';
      }
    } else if (config.provider === 'sendgrid') {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }], subject }],
          from: { email: config.sender_email, name: config.sender_name },
          content: [{ type: 'text/html', value: emailHtml }],
        }),
      });
      if (res.ok || res.status === 202) {
        emailSent = true;
      } else {
        const err = await res.json();
        errorMessage = err.errors?.[0]?.message || 'SendGrid: failed to send';
      }
    } else {
      errorMessage = `Provider "${config.provider}" not supported. Use Resend or SendGrid.`;
    }

    if (emailSent) {
      console.log(`[store-approved] Sent to ${email} for store "${storeName}"`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.error('[store-approved] Failed:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[store-approved] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
