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
    const { configId, testEmail } = await req.json();

    if (!configId || !testEmail) {
      return new Response(
        JSON.stringify({ error: 'Config ID and test email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get email configuration
    const { data: config, error: configError } = await supabase
      .from('email_configuration')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'Email configuration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare test email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">BestOld</h1>
                      <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Email Configuration Test</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">✅ Test Successful!</h2>
                      <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                        Your email configuration is working correctly. This is a test email sent from BestOld.
                      </p>
                      
                      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; color: #333333; font-weight: bold;">Configuration Details:</p>
                        <p style="margin: 5px 0; color: #666666; font-size: 14px;">
                          <strong>Provider:</strong> ${config.provider.toUpperCase()}
                        </p>
                        <p style="margin: 5px 0; color: #666666; font-size: 14px;">
                          <strong>Sender:</strong> ${config.sender_name} &lt;${config.sender_email}&gt;
                        </p>
                        <p style="margin: 5px 0; color: #666666; font-size: 14px;">
                          <strong>Test Email:</strong> ${testEmail}
                        </p>
                        <p style="margin: 5px 0; color: #666666; font-size: 14px;">
                          <strong>Timestamp:</strong> ${new Date().toLocaleString()}
                        </p>
                      </div>
                      
                      <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        You can now use this configuration to send password reset emails and other notifications.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        © 2026 BestOld. All rights reserved.
                      </p>
                      <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px;">
                        This is an automated test email. Please do not reply.
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

    // Send email based on provider
    let emailSent = false;
    let errorMessage = '';

    if (config.provider === 'resend') {
      // Use Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${config.sender_name} <${config.sender_email}>`,
          to: testEmail,
          subject: 'BestOld - Email Configuration Test',
          html: emailHtml,
        }),
      });

      if (response.ok) {
        emailSent = true;
      } else {
        const error = await response.json();
        errorMessage = error.message || 'Failed to send email via Resend';
      }
    } else if (config.provider === 'sendgrid') {
      // Use SendGrid API
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: testEmail }],
            subject: 'BestOld - Email Configuration Test'
          }],
          from: { email: config.sender_email, name: config.sender_name },
          content: [{
            type: 'text/html',
            value: emailHtml
          }]
        }),
      });

      if (response.ok || response.status === 202) {
        emailSent = true;
      } else {
        const error = await response.json();
        errorMessage = error.errors?.[0]?.message || 'Failed to send email via SendGrid';
      }
    } else if (config.provider === 'aws_ses') {
      // AWS SES requires complex authentication (AWS Signature V4)
      // For now, provide a helpful message
      errorMessage = 'AWS SES is not yet fully supported. Please use Resend (recommended) or SendGrid for email delivery. AWS SES support coming soon.';
    } else if (config.provider === 'custom') {
      // Custom SMTP requires additional SMTP library
      errorMessage = 'Custom SMTP provider is not yet supported. Please use Resend (recommended) or SendGrid for email delivery. Custom SMTP support coming soon.';
    } else {
      errorMessage = `Provider ${config.provider} is not supported. Please use Resend or SendGrid.`;
    }

    if (emailSent) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Test email sent successfully! Check your inbox.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in test-email-configuration:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
