// /app/auth/callback/route.js
import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import stripe from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type"); // e.g., "recovery", "signup"
  const origin = url.origin;
  const redirectTo = url.searchParams.get("redirect_to") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/error`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);


  if (error || !data?.session) {
    console.error("Error confirming user:", error?.message);
    return NextResponse.redirect(`${origin}/error`);
  }

  let profileData = null;
  const user = data.session.user;

  // For non-recovery flows, attempt to fetch or create the user profile.
  if (type !== "recovery") {
    // Try to fetch existing profile (including the trial_pending flag).
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*, trial_pending")
      .eq("user_id", user.id)
      .single();

    if (existingProfile) {
      profileData = existingProfile;
    } else {
      // Create new profile and a new Stripe customer.
      let stripeCustomerId = "";
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        stripeCustomerId = customer.id;
      } catch (err) {
        console.error("Error creating Stripe customer:", err);
      }

      // Create the new profile with 10k free credits and mark trial_pending as true.
      const { error: profileError, data: newProfile } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          email: user.email,
          plan: "trial",
          tokens_used: 0,
          tokens_total: 0, // Give 10k free credits
          one_time_credits: 10000,
          avatar_url: "default/default.png",
          stripe_customer_id: stripeCustomerId,
          trial_pending: true, // Mark that a trial checkout is pending for new users
          onboarding_completed: false // Ensure new users complete onboarding
        })
        .select("*")
        .single();

      if (profileError) {
        console.error("Error inserting new profile:", profileError.message);
        return NextResponse.redirect(`${origin}/error`);
      }
      profileData = newProfile;
    }
  }

  // If the user's profile indicates a trial is pending, create the Stripe checkout session.
  if (profileData && profileData.trial_pending && profileData.stripe_customer_id) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: profileData.stripe_customer_id,
        payment_method_types: ["card"],
        line_items: [
          {
            price: process.env.NEXT_PUBLIC_TRIAL_PRICE_ID, // Using trial plan price
            quantity: 1,
          },
        ],
        mode: "subscription",
        subscription_data: {
          trial_period_days: 14,
        },
        success_url: `${origin}/trial-stripe-success`,
        cancel_url: `${origin}/`,
      });

      // Do NOT update trial_pending here.
      if (session.url) {
        return NextResponse.redirect(session.url);
      } else {
        return NextResponse.redirect(`${origin}/error?reason=checkout_failed`);
      }
    } catch (err) {
      console.error("Error creating Stripe checkout session:", err);
      return NextResponse.redirect(`${origin}/error`);
    }
  }

  // For recovery flows or if no trial is pending, check onboarding status
  if (type !== "recovery" && profileData && profileData.onboarding_completed === false) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  // Otherwise, redirect to the protected page or requested redirect
  return NextResponse.redirect(`${origin}${redirectTo}`);
}
