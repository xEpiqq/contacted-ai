// app/api/manage-billing/route.js
import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch the stripe_customer_id from profiles
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (profileErr || !profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No stripe_customer_id found for this user" },
      { status: 400 }
    );
  }

  // Create a Stripe Billing Portal session using the existing customer
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: process.env.NEXT_PUBLIC_DOMAIN
      ? `${process.env.NEXT_PUBLIC_DOMAIN}/`
      : "http://localhost:3000/"
  });

  return NextResponse.json({ url: portalSession.url });
}
