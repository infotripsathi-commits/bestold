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
    const { email, storeName, sellerName } = await req.json();

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
      console.error('[store-welcome] Email config not found:', configError);
      return new Response(
        JSON.stringify({ error: 'No active email configuration found. Set it up in Admin → Email Config.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const greeting = sellerName ? `Hi ${sellerName}` : 'Hello';
    const subject = `🎉 Welcome to BESTOLD — Your Store "${storeName}" is Being Reviewed!`;

    // ─── Email HTML template ────────────────────────────────────────────────────
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to BESTOLD</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- ── Header ─────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#16a34a;padding:40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:800;letter-spacing:-0.5px;">BESTOLD</h1>
              <p style="margin:8px 0 0;color:#dcfce7;font-size:15px;">Buy &amp; Sell Second-Hand Goods</p>
            </td>
          </tr>

          <!-- ── Hero Message ────────────────────────────────────────── -->
          <tr>
            <td style="padding:40px 32px 24px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:24px;font-weight:700;">
                🎉 Congratulations — Your Store is Created!
              </h2>
              <p style="margin:0;color:#374151;font-size:16px;line-height:1.6;">
                ${greeting},<br /><br />
                Thank you for joining <strong>BESTOLD</strong>! Your store
                <strong style="color:#16a34a;">"${storeName}"</strong> has been
                successfully created and is currently under <strong>admin review</strong>.
              </p>
            </td>
          </tr>

          <!-- ── Status Box ─────────────────────────────────────────── -->
          <tr>
            <td style="padding:0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;color:#15803d;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      🔍 Current Status
                    </p>
                    <p style="margin:0;color:#166534;font-size:16px;font-weight:600;">
                      Pending Admin Verification
                    </p>
                    <p style="margin:8px 0 0;color:#166534;font-size:14px;line-height:1.5;">
                      Our team will review your store details and trade license within <strong>24–48 hours</strong>.
                      You'll receive another email once your store is approved and live.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── What Happens Next ──────────────────────────────────── -->
          <tr>
            <td style="padding:0 32px 28px;">
              <h3 style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:700;">
                What Happens Next?
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">

                <tr>
                  <td style="vertical-align:top;padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:14px;">
                          <div style="width:32px;height:32px;background-color:#16a34a;border-radius:50%;text-align:center;line-height:32px;color:#ffffff;font-weight:700;font-size:14px;">1</div>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">Admin Reviews Your Store</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">
                            We verify your store name, description, and trade license document.
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
                          <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">Store Gets Approved &amp; Goes Live</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">
                            Once approved, your store page is live and visible to all buyers on BESTOLD.
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
                          <div style="width:32px;height:32px;background-color:#16a34a;border-radius:50%;text-align:center;line-height:32px;color:#ffffff;font-weight:700;font-size:14px;">3</div>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">Start Adding Products</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">
                            Log in to your Seller Dashboard and list your first second-hand product with photos, price, and description.
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
                          <div style="width:32px;height:32px;background-color:#16a34a;border-radius:50%;text-align:center;line-height:32px;color:#ffffff;font-weight:700;font-size:14px;">4</div>
                        </td>
                        <td style="vertical-align:top;">
                          <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">Chat with Buyers &amp; Make Sales</p>
                          <p style="margin:4px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">
                            Buyers can message you directly. Respond quickly for better conversion.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ── CTA Button ─────────────────────────────────────────── -->
          <tr>
            <td style="padding:0 32px 36px;text-align:center;">
              <a href="https://bestold.in/seller/dashboard"
                style="display:inline-block;padding:14px 36px;background-color:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:700;">
                Go to Seller Dashboard →
              </a>
            </td>
          </tr>

          <!-- ── Tips Box ───────────────────────────────────────────── -->
          <tr>
            <td style="padding:0 32px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 10px;color:#111827;font-size:15px;font-weight:700;">💡 Tips for a Successful Store</p>
                    <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.9;">
                      <li>Upload <strong>clear, well-lit photos</strong> — more photos = more trust</li>
                      <li>Write an <strong>honest, detailed description</strong> of each item</li>
                      <li>Set a <strong>fair price</strong> — compare similar listings on BESTOLD</li>
                      <li>Keep your <strong>WhatsApp / phone</strong> active so buyers can reach you</li>
                      <li>Respond to <strong>chat messages quickly</strong> for best results</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ─────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">
                Questions? Contact our support team at
                <a href="mailto:support@bestold.in" style="color:#16a34a;text-decoration:none;">support@bestold.in</a>
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} BESTOLD. All rights reserved.<br />
                <a href="https://bestold.in/privacy" style="color:#9ca3af;">Privacy Policy</a> &nbsp;|&nbsp;
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

    // ─── Send via configured provider ──────────────────────────────────────────
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
        errorMessage = err.message || 'Resend: failed to send email';
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
        errorMessage = err.errors?.[0]?.message || 'SendGrid: failed to send email';
      }
    } else {
      errorMessage = `Provider "${config.provider}" is not supported. Use Resend or SendGrid.`;
    }

    if (emailSent) {
      console.log(`[store-welcome] Sent to ${email} for store "${storeName}"`);
      return new Response(
        JSON.stringify({ success: true, message: 'Welcome email sent!' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.error('[store-welcome] Failed to send:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[store-welcome] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
