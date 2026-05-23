import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@19.1.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function ok(data: any): Response {
  return new Response(
    JSON.stringify({ code: "SUCCESS", message: "Success", data }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

function fail(msg: string, code = 400): Response {
  return new Response(
    JSON.stringify({ code: "FAIL", message: msg }),
    {
      status: code,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Missing session_id");

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return ok({
        verified: false,
        status: session.payment_status,
        sessionId: session.id,
      });
    }

    const promotionId = session.metadata?.promotion_id;
    if (!promotionId) {
      throw new Error("Promotion ID not found in session metadata");
    }

    // Update payment status
    await supabase
      .from('promotion_payments')
      .update({
        status: 'completed',
        payment_data: {
          session_id: session.id,
          payment_intent: session.payment_intent,
          customer_email: session.customer_details?.email,
        },
      })
      .eq('transaction_id', sessionId);

    // Update promotion status
    const { data: promotion } = await supabase
      .from('store_promotions')
      .select('duration_days')
      .eq('id', promotionId)
      .maybeSingle();

    if (promotion) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + promotion.duration_days);

      await supabase
        .from('store_promotions')
        .update({
          payment_status: 'completed',
          transaction_id: session.payment_intent as string,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('id', promotionId);
    }

    return ok({
      verified: true,
      status: "paid",
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email,
      promotionId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return fail(error instanceof Error ? error.message : "Payment verification failed", 500);
  }
});
