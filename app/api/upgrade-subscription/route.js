// app/api/upgrade-subscription/route.js
import { NextResponse } from 'next/server';
import stripePkg from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = stripePkg(process.env.STRIPE_SECRET_KEY);

/**
 * POST body: { userId: "...", newPriceId: "price_123" }
 * 
 * This route attempts to:
 *   1) Verify user is logged in & has a subscription
 *   2) Update that subscription to the new plan
 *   3) Prorate the difference
 */
export async function POST(request) {
  try {
    // 1) Parse JSON
    const { userId, newPriceId } = await request.json();
    if (!userId || !newPriceId) {
      return NextResponse.json({ error: "Missing userId or newPriceId" }, { status: 400 });
    }

    // 2) Auth user via Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError || user.id !== userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 3) Fetch user's existing subscription
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id, user_id, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    if (profErr || !profile) {
      return NextResponse.json({ error: "No profile found" }, { status: 404 });
    }

    const { stripe_customer_id, stripe_subscription_id } = profile;
    if (!stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer_id found" }, { status: 400 });
    }
    if (!stripe_subscription_id) {
      return NextResponse.json({
        error: "User does not have an existing subscription to upgrade",
      }, { status: 400 });
    }

    // 4) Retrieve the subscription from Stripe & get the itemId
    const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id, {
      expand: ["items.data"],
    });
    const itemId = subscription.items?.data?.[0]?.id;
    if (!itemId) {
      return NextResponse.json({
        error: "Unable to find subscription item to update",
      }, { status: 400 });
    }

    // 5) Update subscription => immediate proration
    const updatedSub = await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: false,
      proration_behavior: "always_invoice",
      items: [
        {
          id: itemId,
          price: newPriceId,
        },
      ],
    });

    // (Optional) If you want to update tokens right now, call your sync logic or rely on webhook
    // import { syncStripeDataToKV } from "@/utils/syncStripeDataToKV";
    // await syncStripeDataToKV(stripe_customer_id);

    return NextResponse.json({
      success: true,
      subscriptionId: updatedSub.id,
      status: updatedSub.status,
    });
  } catch (err) {
    console.error("Upgrade subscription error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
