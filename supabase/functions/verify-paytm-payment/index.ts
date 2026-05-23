import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify checksum from Paytm
async function verifyChecksum(
  params: Record<string, string>,
  checksum: string,
  merchantKey: string
): Promise<boolean> {
  const paramsWithoutChecksum = { ...params };
  delete paramsWithoutChecksum.CHECKSUMHASH;
  
  const sortedKeys = Object.keys(paramsWithoutChecksum).sort();
  const paramString = sortedKeys.map(key => `${key}=${paramsWithoutChecksum[key]}`).join('|');
  const dataToHash = paramString + '|' + merchantKey;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex === checksum;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { orderId, paytmResponse } = await req.json();

    if (!orderId || !paytmResponse) {
      throw new Error('Missing required parameters');
    }

    // Get Paytm credentials
    const merchantKey = Deno.env.get('PAYTM_MERCHANT_KEY');
    if (!merchantKey) {
      throw new Error('Paytm merchant key not configured');
    }

    // Verify checksum
    const checksumValid = await verifyChecksum(
      paytmResponse,
      paytmResponse.CHECKSUMHASH,
      merchantKey
    );

    if (!checksumValid) {
      throw new Error('Invalid checksum');
    }

    // Get order from database
    const { data: order, error: orderError } = await supabaseClient
      .from('promotion_payments')
      .select('*, stores(*)')
      .eq('payment_provider_order_id', paytmResponse.ORDERID)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Check payment status from Paytm response
    const paymentSuccess = paytmResponse.STATUS === 'TXN_SUCCESS';
    const paymentStatus = paymentSuccess ? 'completed' : 'failed';

    // Update order status
    const { error: updateError } = await supabaseClient
      .from('promotion_payments')
      .update({
        payment_status: paymentStatus,
        payment_provider_transaction_id: paytmResponse.TXNID,
        payment_details: paytmResponse,
        paid_at: paymentSuccess ? new Date().toISOString() : null,
      })
      .eq('id', order.id);

    if (updateError) throw updateError;

    // If payment successful, update store promotion
    if (paymentSuccess) {
      const promotionDays = order.plan_type === 'basic' ? 7 : order.plan_type === 'premium' ? 30 : 90;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + promotionDays);

      const { error: storeError } = await supabaseClient
        .from('stores')
        .update({
          is_promoted: true,
          promotion_expires_at: expiresAt.toISOString(),
        })
        .eq('id', order.store_id);

      if (storeError) throw storeError;

      // Create promotion record
      const { error: promotionError } = await supabaseClient
        .from('store_promotions')
        .insert({
          store_id: order.store_id,
          plan_type: order.plan_type,
          start_date: new Date().toISOString(),
          end_date: expiresAt.toISOString(),
          amount_paid: order.amount,
          order_id: order.id,
        });

      if (promotionError) throw promotionError;
    }

    return new Response(
      JSON.stringify({
        success: paymentSuccess,
        paymentStatus,
        message: paymentSuccess ? 'Payment verified successfully' : 'Payment failed',
        order: {
          id: order.id,
          amount: order.amount,
          status: paymentStatus,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error verifying Paytm payment:', error);
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
