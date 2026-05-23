import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  promotionId: string;
  approved: boolean;
  rejectionReason?: string;
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

    // Verify user authentication and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const request: VerifyPaymentRequest = await req.json();

    if (!request.promotionId) {
      throw new Error('Promotion ID is required');
    }

    // Get promotion details
    const { data: promotion, error: promotionError } = await supabaseClient
      .from('store_promotions')
      .select('*, stores(*)')
      .eq('id', request.promotionId)
      .single();

    if (promotionError || !promotion) {
      throw new Error('Promotion not found');
    }

    if (request.approved) {
      // Approve payment and activate promotion
      const { error: updateError } = await supabaseClient
        .from('store_promotions')
        .update({
          payment_status: 'completed',
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.promotionId);

      if (updateError) throw updateError;

      // Update store to mark as promoted
      const { error: storeError } = await supabaseClient
        .from('stores')
        .update({
          is_promoted: true,
          promotion_expires_at: promotion.end_date,
        })
        .eq('id', promotion.store_id);

      if (storeError) throw storeError;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment verified and store promoted successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      // Reject payment
      const { error: updateError } = await supabaseClient
        .from('store_promotions')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.promotionId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment rejected',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error('Error verifying UPI payment:', error);
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
