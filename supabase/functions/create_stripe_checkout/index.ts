import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@19.1.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const successUrlPath = '/payment-success?session_id={CHECKOUT_SESSION_ID}';
const cancelUrlPath = '/seller/dashboard';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  promotion_id: string;
  store_id: string;
  duration_days: number;
  amount: number;
}

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
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const request: CheckoutRequest = await req.json();

    if (!request.promotion_id || !request.store_id || !request.amount) {
      throw new Error("Missing required fields");
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : { data: { user: null } };

    if (!user) throw new Error("Not authenticated");

    // Verify promotion exists and belongs to user's store
    const { data: promotion, error: promotionError } = await supabase
      .from('store_promotions')
      .select('*, store:stores!inner(seller_id)')
      .eq('id', request.promotion_id)
      .maybeSingle();

    if (promotionError || !promotion) {
      throw new Error("Promotion not found");
    }

    if (promotion.store.seller_id !== user.id) {
      throw new Error("Unauthorized");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Store Promotion - ${request.duration_days} days`,
            description: `Promote your store to appear at the top of search results`,
          },
          unit_amount: Math.round(request.amount * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}${successUrlPath}`,
      cancel_url: `${origin}${cancelUrlPath}`,
      metadata: {
        promotion_id: request.promotion_id,
        store_id: request.store_id,
        user_id: user.id,
      },
    });

    // Create payment record
    await supabase
      .from('promotion_payments')
      .insert({
        promotion_id: request.promotion_id,
        amount: request.amount,
        payment_method: 'stripe',
        transaction_id: session.id,
        status: 'pending',
      });

    return ok({
      url: session.url,
      sessionId: session.id,
      promotionId: request.promotion_id,
    });
  } catch (error) {
    console.error('Payment error:', error);
    return fail(error instanceof Error ? error.message : "Payment processing failed", 500);
  }
});
