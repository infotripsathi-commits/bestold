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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const { subject, body, recipients } = await req.json();
    // recipients: array of { email, name }

    if (!subject || !body || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'subject, body, and recipients[] are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active email config
    const { data: configData, error: configError } = await supabase.rpc('get_active_email_configuration');
    const config = Array.isArray(configData) ? configData[0] : configData;

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'No active email configuration. Set it up in Admin → Email Config.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build branded HTML wrapper around the admin-written body
    const buildHtml = (recipientName: string, htmlBody: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#16a34a;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">BESTOLD</h1>
              <p style="margin:6px 0 0;color:#dcfce7;font-size:14px;">Buy &amp; Sell Second-Hand Goods</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              ${recipientName ? `<p style="margin:0 0 20px;color:#374151;font-size:16px;">Hi <strong>${recipientName}</strong>,</p>` : ''}
              <div style="color:#374151;font-size:15px;line-height:1.7;">
                ${htmlBody}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="https://bestold.in"
                style="display:inline-block;padding:13px 32px;background-color:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;">
                Visit BESTOLD →
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">
                Questions? <a href="mailto:support@bestold.in" style="color:#16a34a;text-decoration:none;">support@bestold.in</a>
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} BESTOLD. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send one by one (Resend free tier: 2 req/s; add delay between batches)
    for (let i = 0; i < recipients.length; i++) {
      const { email, name } = recipients[i];
      if (!email) { failed++; continue; }

      const personalizedBody = buildHtml(name || '', body);

      try {
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
              html: personalizedBody,
            }),
          });
          if (res.ok) { sent++; } else {
            const err = await res.json();
            failed++;
            errors.push(`${email}: ${err.message || 'Resend error'}`);
          }
        } else if (config.provider === 'sendgrid') {
          const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.api_key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email, name }], subject }],
              from: { email: config.sender_email, name: config.sender_name },
              content: [{ type: 'text/html', value: personalizedBody }],
            }),
          });
          if (res.ok || res.status === 202) { sent++; } else {
            const err = await res.json();
            failed++;
            errors.push(`${email}: ${err.errors?.[0]?.message || 'SendGrid error'}`);
          }
        } else {
          failed++;
          errors.push(`Unsupported provider: ${config.provider}`);
          break;
        }

        // Rate limit: pause 500ms every 2 emails to respect Resend free tier (2 req/s)
        if ((i + 1) % 2 === 0) {
          await new Promise((r) => setTimeout(r, 500));
        }
      } catch (err) {
        failed++;
        errors.push(`${email}: ${err.message}`);
      }
    }

    console.log(`[broadcast] Sent: ${sent}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, errors }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[broadcast] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
