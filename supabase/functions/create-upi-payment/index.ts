import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpiPaymentRequest {
  storeId: string;
  planType: string;
  amount: number;
  upiTransactionId?: string;
  paymentProofUrl?: string;
}

serve(async (req) => {
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

    // Verify user authentication
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const paymentRequest: UpiPaymentRequest = await req.json();

    // Get UPI configuration
    const upiId = Deno.env.get('UPI_ID');
    const upiPayeeName = Deno.env.get('UPI_PAYEE_NAME') || 'BestOld';

    if (!upiId) {
      throw new Error('UPI payment not configured');
    }

    // Generate unique transaction ID
    const transactionId = `UPI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate duration days
    const durationDays = paymentRequest.planType === 'basic' ? 7 : paymentRequest.planType === 'premium' ? 30 : 90;

    // Create promotion record in database
    const { data: promotion, error: promotionError } = await supabaseClient
      .from('store_promotions')
      .insert({
        store_id: paymentRequest.storeId,
        duration_days: durationDays,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        original_price: paymentRequest.amount,
        discount_amount: 0,
        final_price: paymentRequest.amount,
        payment_status: 'pending',
        payment_method: 'upi',
        transaction_id: transactionId,
      })
      .select()
      .single();

    if (promotionError) throw promotionError;

    // Generate UPI payment link
    // Format: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR&tn=ORDER_ID
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiPayeeName)}&am=${paymentRequest.amount}&cu=INR&tn=${encodeURIComponent(`Promotion ${transactionId}`)}`;

    // Generate QR code data URL (UPI link)
    const qrCodeData = upiLink;

    return new Response(
      JSON.stringify({
        success: true,
        promotionId: promotion.id,
        orderReference: transactionId,
        upiId,
        upiPayeeName,
        amount: paymentRequest.amount,
        upiLink,
        qrCodeData,
        message: 'Please complete the payment using any UPI app and submit the transaction ID',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating UPI payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
