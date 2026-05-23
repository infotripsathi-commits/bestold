import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log('Initializing Supabase client with service role key');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { email }: RequestBody = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists with this email
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error checking user:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userExists = authUser.users.some(u => u.email === email);
    
    if (!userExists) {
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If this email is registered, you will receive an OTP code shortly.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('password_reset_otps')
      .insert({
        email,
        otp_code: otpCode,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send OTP via email using configured email service
    // Get active email configuration using RPC function (bypasses RLS)
    console.log('Calling get_active_email_configuration RPC...');
    
    const { data: emailConfigArray, error: configError } = await supabase
      .rpc('get_active_email_configuration');

    const emailConfig = emailConfigArray?.[0] || null;

    console.log('Email configuration RPC result:', { 
      found: !!emailConfig, 
      hasError: !!configError,
      errorMessage: configError?.message,
      errorDetails: configError?.details,
      errorHint: configError?.hint,
      errorCode: configError?.code,
      provider: emailConfig?.provider,
      senderEmail: emailConfig?.sender_email
    });

    // Prepare email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">BestOld</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
          <p>You requested to reset your password. Use the OTP code below to verify your identity:</p>
          
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your OTP Code</p>
            <h1 style="margin: 0; color: #667eea; font-size: 36px; letter-spacing: 8px; font-weight: bold;">${otpCode}</h1>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Important:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404;">
              <li>This code expires in <strong>15 minutes</strong></li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© 2026 BestOld. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </body>
      </html>
    `;

    // If no email configuration is set up, return OTP in development mode
    if (!emailConfig || configError) {
      console.log(`⚠️ No active email configuration found. Returning OTP for development mode.`);
      console.log(`OTP for ${email}: ${otpCode}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP generated successfully.',
          // In development mode, return OTP for testing
          otp: otpCode
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Active email configuration found: ${emailConfig.provider}`);

    // Send email based on configured provider
    let emailSent = false;
    let errorMessage = '';

    try {
      if (emailConfig.provider === 'resend') {
        // Use Resend API
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailConfig.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${emailConfig.sender_name} <${emailConfig.sender_email}>`,
            to: email,
            subject: 'Password Reset - Your OTP Code',
            html: emailHtml,
          }),
        });

        if (response.ok) {
          emailSent = true;
          console.log(`✅ Email sent successfully via Resend to ${email}`);
        } else {
          const error = await response.json();
          errorMessage = error.message || 'Failed to send email via Resend';
          console.error('❌ Resend error:', error);
        }
      } else if (emailConfig.provider === 'sendgrid') {
        // Use SendGrid API
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailConfig.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email }],
              subject: 'Password Reset - Your OTP Code'
            }],
            from: { email: emailConfig.sender_email, name: emailConfig.sender_name },
            content: [{
              type: 'text/html',
              value: emailHtml
            }]
          }),
        });

        if (response.ok || response.status === 202) {
          emailSent = true;
          console.log(`✅ Email sent successfully via SendGrid to ${email}`);
        } else {
          const error = await response.json();
          errorMessage = error.errors?.[0]?.message || 'Failed to send email via SendGrid';
          console.error('❌ SendGrid error:', error);
        }
      } else {
        errorMessage = `Email provider ${emailConfig.provider} is not yet implemented`;
      }

      if (emailSent) {
        console.log(`✅ Password reset OTP email sent successfully to ${email}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'OTP sent successfully. Please check your email.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error(`❌ Failed to send email: ${errorMessage}`);
        console.log(`⚠️ Returning OTP for development mode. OTP for ${email}: ${otpCode}`);
        // Return OTP for development/testing when email fails
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'If this email is registered, you will receive an OTP code shortly.',
            // In development, include OTP for testing
            otp: otpCode,
            error: errorMessage // Include error for debugging
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Still return success to not reveal if email exists
      console.log(`OTP for ${email}: ${otpCode}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If this email is registered, you will receive an OTP code shortly.',
          // In development, include OTP for testing
          otp: otpCode
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in send-password-reset-otp:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
