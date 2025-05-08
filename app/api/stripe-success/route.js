// app/checkout/success/route.js
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { syncStripeDataToKV } from "@/lib/syncStripeDataToKV";

export async function GET(request) {
  // 1) Auth via Supabase
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  // 2) If no user, redirect somewhere
  if (!user || authError) {
    return NextResponse.redirect("/");
  }

  // 3) Fetch their stripe_customer_id from "profiles"
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  // If no Stripe customer in DB, bounce out
  if (profileError || !profile?.stripe_customer_id) {
    return NextResponse.redirect("/");
  }

  // 4) Call your sync function
  await syncStripeDataToKV(profile.stripe_customer_id);

  // 5) Redirect wherever you wish
  return redirect("/");

//  return NextResponse.redirect("/protected/usa");
}
