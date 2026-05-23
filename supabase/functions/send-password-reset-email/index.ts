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
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with explicit auth configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get active email configuration using RPC function
    const { data: config, error: configError } = await supabase.rpc('get_active_email_configuration');

    if (configError) {
      console.error('Error fetching email configuration:', configError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch email configuration',
          details: configError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!config) {
      return new Response(
        JSON.stringify({ error: 'No active email configuration found. Please configure email settings in Admin panel.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate password reset link using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (authError) {
      console.error('Error generating reset link:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset link', details: authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resetUrl = authData.properties?.action_link || '';

    // Prepare password reset email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
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
                      <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Password Reset Request</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Reset Your Password</h2>
                      <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                        We received a request to reset your password for your BestOld account. Click the button below to create a new password.
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Reset Password</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 10px 0 0 0; color: #667eea; font-size: 12px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                      
                      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                          <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                        </p>
                      </div>
                      
                      <p style="margin: 20px 0 0 0; color: #999999; font-size: 13px; line-height: 1.5;">
                        For security reasons, this password reset link can only be used once. If you need to reset your password again, please request a new link.
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
                        This is an automated email. Please do not reply.
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
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${config.sender_name} <${config.sender_email}>`,
          to: email,
          subject: 'Reset Your Password - BestOld',
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
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: email }],
            subject: 'Reset Your Password - BestOld'
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
    } else {
      errorMessage = `Provider ${config.provider} is not supported. Please use Resend or SendGrid.`;
    }

    if (emailSent) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Password reset email sent successfully!' 
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
    console.error('Error in send-password-reset-email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
