// /app/api/redirect-trial/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import stripe from "@/lib/stripe";

export async function GET(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const supabase = await createClient();

  // Authenticate the user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.redirect(`${origin}/sign-in`, { status: 302 });
  }

  // Get the user's profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profileData) {
    console.error("Profile fetch error:", profileError);
    return NextResponse.redirect(`${origin}/error`, { status: 302 });
  }

  // If trial is pending and we have a Stripe customer ID, create a trial checkout session
  if (profileData.trial_pending && profileData.stripe_customer_id) {
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
        cancel_url: `${origin}/protected/usa`,
      });

      // Do not update trial_pending here.
      return NextResponse.redirect(session.url, { status: 302 });
    } catch (err) {
      console.error("Error creating Stripe checkout session:", err);
      return NextResponse.redirect(`${origin}/error`, { status: 302 });
    }
  } else {
    // If trial is not pending, simply redirect to the dashboard
    return NextResponse.redirect(`${origin}/protected/usa`, { status: 302 });
  }
}
