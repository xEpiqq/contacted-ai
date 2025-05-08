import stripePkg from "stripe";
import { createClient } from "@/utils/supabase/server"; // or wherever your Supabase server client is

const stripe = stripePkg(process.env.STRIPE_SECRET_KEY);

/**
 * We keep track of plan details here (recurring plans only).
 * We are adding the "trial" plan, which will yield 50,000 tokens
 * only after the trial ends (i.e. once subscriptionStatus != "trialing").
 */
const PLAN_INFO = {
  [process.env.NEXT_PUBLIC_TRIAL_PRICE_ID]: {
    label: "Trial => $97/month after 14 days",
    tokens: 50000,
    isRecurring: true,
  },
  [process.env.NEXT_PUBLIC_PLAN2_PRICE_ID]: {
    label: "$97/month – 50,000 Credits",
    tokens: 50000,
    isRecurring: true,
  },
  [process.env.NEXT_PUBLIC_PLAN3_PRICE_ID]: {
    label: "$197/month – 200,000 Credits",
    tokens: 200000,
    isRecurring: true,
  },
  [process.env.NEXT_PUBLIC_PLAN4_PRICE_ID]: {
    label: "$297/month – Unlimited Credits",
    tokens: 9999999,
    isRecurring: true,
  },
};

/**
 * Main function to call from your webhook or /success route:
 *   await syncStripeDataToKV(customerId, event);
 *
 * This handles only recurring subscription logic. 
 * If no active subscription is found, the user is reverted to a free plan.
 *
 * Special note:
 * - If the plan is the “trial plan” and subscription is “trialing”,
 *   we do NOT award the 50k tokens yet (so tokens_total = 0).
 * - Once the trial ends and subscription goes to “active”, we award 50k tokens.
 */
export async function syncStripeDataToKV(stripeCustomerId, event = null) {
  try {
    // 1) Find which user has this stripeCustomerId
    const supabase = await createClient();
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (profileErr || !profile) {
      console.error("No profile found for customerId:", stripeCustomerId);
      return;
    }

    // 2) Attempt to retrieve subscription
    const subs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 1,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    if (!subs?.data?.length) {
      console.log("No subscription found; reverting user to free plan");
      await revertToFreePlan(supabase, profile.id);
      return;
    }

    // We have at least one subscription, pick the first
    const subscription = subs.data[0];
    const subscriptionStatus = subscription.status;
    const subscriptionId = subscription.id;
    const priceId = subscription.items?.data?.[0]?.price?.id || null;

    // If canceled or incomplete_expired => revert to free
    if (
      subscriptionStatus === "canceled" ||
      subscriptionStatus === "incomplete_expired"
    ) {
      console.log("Subscription fully canceled => revert user to free plan");
      await revertToFreePlan(supabase, profile.id);
      return;
    }

    // We'll store the subscription status exactly as is
    let newStatus = subscriptionStatus;

    // Timestamps
    const currentPeriodStart = subscription.current_period_start * 1000;
    const currentPeriodEnd = subscription.current_period_end * 1000;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end || false;

    // Payment method info
    let cardBrand = null;
    let cardLast4 = null;
    const pm = subscription.default_payment_method;
    if (pm && typeof pm !== "string") {
      cardBrand = pm.card?.brand || null;
      cardLast4 = pm.card?.last4 || null;
    }

    // Identify plan tokens
    let newTokensTotal = profile.tokens_total;
    let newPlanLabel = profile.plan;

    if (priceId && PLAN_INFO[priceId]?.isRecurring) {
      newTokensTotal = PLAN_INFO[priceId].tokens;
      newPlanLabel = PLAN_INFO[priceId].label;

      // If this is the trial plan and subscription is still "trialing",
      // set tokens_total=100 (they only get the 50k after trial ends).
      if (
        priceId === process.env.NEXT_PUBLIC_TRIAL_PRICE_ID &&
        subscriptionStatus === "trialing"
      ) {
        newTokensTotal = 100;
      }
    } else {
      // If we don't recognize the plan or it's not recurring, revert them to free
      newTokensTotal = 100;
      newPlanLabel = "free (unrecognized price)";
      newStatus = "inactive";
    }

    // Check if a new billing cycle has begun => reset tokens_used to 0
    const oldPeriodStart = profile.plan_current_period_start
      ? new Date(profile.plan_current_period_start).getTime()
      : 0;
    let newTokensUsed = profile.tokens_used;
    if (oldPeriodStart !== currentPeriodStart) {
      newTokensUsed = 0;
      console.log("New billing cycle => resetting subscription tokens_used to 0");
    }

    // Save changes to profile
    const updates = {
      plan: newPlanLabel,
      plan_status: newStatus, // can be "trialing", "active", "past_due", etc.
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      is_recurring: true,
      plan_current_period_start: new Date(currentPeriodStart).toISOString(),
      plan_current_period_end: new Date(currentPeriodEnd).toISOString(),
      cancel_at_period_end: cancelAtPeriodEnd,
      card_brand: cardBrand,
      card_last4: cardLast4,
      tokens_total: newTokensTotal,
      tokens_used: newTokensUsed,
    };

    const { error: updateErr } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    if (updateErr) {
      console.error("syncStripeDataToKV: Supabase update error:", updateErr);
      return;
    }

    console.log("Profile updated with subscription data successfully.");
  } catch (err) {
    console.error("syncStripeDataToKV error:", err);
  }
}

/**
 * Helper to revert user to a free plan:
 *   plan="free", plan_status="inactive",
 *   tokens_total=100, tokens_used=0
 */
async function revertToFreePlan(supabase, profileId) {
  const updates = {
    plan: "free",
    plan_status: "inactive",
    is_recurring: false,
    stripe_subscription_id: null,
    stripe_price_id: null,
    plan_current_period_start: null,
    plan_current_period_end: null,
    cancel_at_period_end: false,
    card_brand: null,
    card_last4: null,
    tokens_total: 100,
    tokens_used: 0,
  };

  const { error: updateErr } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", profileId);

  if (updateErr) {
    console.error("revertToFreePlan: update error:", updateErr);
    return;
  }
  console.log("User reverted to free plan successfully.");
}
