import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitProofRequest {
  promotionId: string;
  upiTransactionId: string;
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

    const request: SubmitProofRequest = await req.json();

    if (!request.promotionId || !request.upiTransactionId) {
      throw new Error('Promotion ID and UPI Transaction ID are required');
    }

    // Update promotion with payment proof
    const { data: promotion, error: updateError } = await supabaseClient
      .from('store_promotions')
      .update({
        transaction_id: request.upiTransactionId,
        payment_status: 'pending', // Keep as pending until admin verifies
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.promotionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment proof submitted successfully. Your payment will be verified by admin within 24 hours.',
        promotion,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error submitting payment proof:', error);
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
