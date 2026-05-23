import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  storeId: string;
  planType: string;
}

// Generate checksum for Paytm
async function generateChecksum(params: Record<string, string>, merchantKey: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map(key => `${key}=${params[key]}`).join('|');
  const dataToHash = paramString + '|' + merchantKey;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
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

    const paymentRequest: PaymentRequest = await req.json();

    // Get Paytm credentials from environment
    const merchantId = Deno.env.get('PAYTM_MERCHANT_ID');
    const merchantKey = Deno.env.get('PAYTM_MERCHANT_KEY');
    const website = Deno.env.get('PAYTM_WEBSITE') || 'WEBSTAGING';
    const industryType = Deno.env.get('PAYTM_INDUSTRY_TYPE') || 'Retail';
    const channelId = Deno.env.get('PAYTM_CHANNEL_ID') || 'WEB';
    const callbackUrl = Deno.env.get('PAYTM_CALLBACK_URL');

    if (!merchantId || !merchantKey || !callbackUrl) {
      throw new Error('Paytm configuration missing');
    }

    // Create payment order in database
    const { data: order, error: orderError } = await supabaseClient
      .from('promotion_payments')
      .insert({
        store_id: paymentRequest.storeId,
        plan_type: paymentRequest.planType,
        amount: paymentRequest.amount,
        currency: 'INR',
        payment_status: 'pending',
        payment_provider: 'paytm',
        payment_provider_order_id: paymentRequest.orderId,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Prepare Paytm payment parameters
    const paytmParams: Record<string, string> = {
      MID: merchantId,
      WEBSITE: website,
      INDUSTRY_TYPE_ID: industryType,
      CHANNEL_ID: channelId,
      ORDER_ID: paymentRequest.orderId,
      CUST_ID: paymentRequest.customerId,
      EMAIL: paymentRequest.customerEmail,
      MOBILE_NO: paymentRequest.customerPhone,
      TXN_AMOUNT: paymentRequest.amount.toFixed(2),
      CALLBACK_URL: callbackUrl,
    };

    // Generate checksum
    const checksum = await generateChecksum(paytmParams, merchantKey);

    // Return payment parameters with checksum
    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        paytmParams: {
          ...paytmParams,
          CHECKSUMHASH: checksum,
        },
        paymentUrl: 'https://securegw-stage.paytm.in/order/process', // Use production URL in production
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating Paytm payment:', error);
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
