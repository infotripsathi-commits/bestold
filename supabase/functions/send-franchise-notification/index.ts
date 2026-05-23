import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'order_status' | 'return_reminder' | 'payout_eligible' | 'payout_released';
  to: string;
  data: {
    recipientName?: string;
    orderNumber?: string;
    orderStatus?: string;
    storeName?: string;
    productTitle?: string;
    amount?: number;
    returnPeriodEnds?: string;
    daysRemaining?: number;
    trackingNumber?: string;
    courierName?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { type, to, data }: EmailRequest = await req.json();

    // Get email configuration
    const { data: config, error: configError } = await supabaseClient
      .from('email_configuration')
      .select('*')
      .single();

    if (configError || !config) {
      throw new Error('Email configuration not found');
    }

    // Generate email content based on type
    let subject = '';
    let html = '';

    switch (type) {
      case 'order_status':
        subject = `Order #${data.orderNumber} - Status Updated to ${data.orderStatus}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .status-badge { display: inline-block; padding: 8px 16px; background: #10B981; color: white; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5; }
              .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Order Status Update</h1>
              </div>
              <div class="content">
                <p>Hello ${data.recipientName || 'Customer'},</p>
                <p>Your order has been updated:</p>
                
                <div class="info-box">
                  <p><strong>Order Number:</strong> #${data.orderNumber}</p>
                  <p><strong>Product:</strong> ${data.productTitle}</p>
                  <p><strong>Store:</strong> ${data.storeName}</p>
                  <p><strong>New Status:</strong> <span class="status-badge">${data.orderStatus}</span></p>
                  ${data.trackingNumber ? `
                    <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
                    <p><strong>Courier:</strong> ${data.courierName}</p>
                  ` : ''}
                </div>

                ${data.orderStatus === 'delivered' ? `
                  <p><strong>Important:</strong> You have 7 days from delivery to request a return if the product doesn't match the description.</p>
                ` : ''}

                <p>Thank you for shopping with BESTOLD!</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'return_reminder':
        subject = `Reminder: Return Period Ending Soon for Order #${data.orderNumber}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .warning-box { background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Return Period Reminder</h1>
              </div>
              <div class="content">
                <p>Hello ${data.recipientName || 'Seller'},</p>
                
                <div class="warning-box">
                  <p><strong>⚠️ Return period ending in ${data.daysRemaining} day(s)</strong></p>
                  <p>Order #${data.orderNumber} will become eligible for payout after the return period expires.</p>
                </div>

                <div class="info-box">
                  <p><strong>Order Number:</strong> #${data.orderNumber}</p>
                  <p><strong>Product:</strong> ${data.productTitle}</p>
                  <p><strong>Amount:</strong> ₹${data.amount?.toFixed(2)}</p>
                  <p><strong>Return Period Ends:</strong> ${data.returnPeriodEnds}</p>
                </div>

                <p>If no return is requested by the buyer, you'll be able to request payout after the return period expires.</p>
                
                <p>Best regards,<br>BESTOLD Team</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'payout_eligible':
        subject = `Payout Available for Order #${data.orderNumber}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .success-box { background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .cta-button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Payout Now Available!</h1>
              </div>
              <div class="content">
                <p>Hello ${data.recipientName || 'Seller'},</p>
                
                <div class="success-box">
                  <p><strong>🎉 Good news!</strong></p>
                  <p>The return period has ended and your payout is now eligible for request.</p>
                </div>

                <div class="info-box">
                  <p><strong>Order Number:</strong> #${data.orderNumber}</p>
                  <p><strong>Product:</strong> ${data.productTitle}</p>
                  <p><strong>Payout Amount:</strong> ₹${data.amount?.toFixed(2)}</p>
                  <p><strong>Store:</strong> ${data.storeName}</p>
                </div>

                <p>You can now request this payout from your seller dashboard.</p>
                
                <p style="text-align: center;">
                  <a href="${Deno.env.get('SITE_URL')}/seller/payouts" class="cta-button">Request Payout</a>
                </p>

                <p>Best regards,<br>BESTOLD Team</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case 'payout_released':
        subject = `Payout Released for Order #${data.orderNumber}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .success-box { background: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .amount { font-size: 32px; font-weight: bold; color: #10B981; text-align: center; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💰 Payout Released!</h1>
              </div>
              <div class="content">
                <p>Hello ${data.recipientName || 'Seller'},</p>
                
                <div class="success-box">
                  <p><strong>✅ Your payout has been released by the admin!</strong></p>
                </div>

                <div class="amount">₹${data.amount?.toFixed(2)}</div>

                <div class="info-box">
                  <p><strong>Order Number:</strong> #${data.orderNumber}</p>
                  <p><strong>Product:</strong> ${data.productTitle}</p>
                  <p><strong>Store:</strong> ${data.storeName}</p>
                  <p><strong>Released Amount:</strong> ₹${data.amount?.toFixed(2)}</p>
                </div>

                <p>The payment has been processed and should reflect in your account shortly.</p>
                
                <p>Thank you for being a valued franchise partner!</p>
                
                <p>Best regards,<br>BESTOLD Team</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        throw new Error('Invalid email type');
    }

    // Send email using SMTP configuration
    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': config.smtp_password,
      },
      body: JSON.stringify({
        sender: config.sender_email,
        to: [to],
        subject: subject,
        html_body: html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
