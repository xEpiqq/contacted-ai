// import { NextResponse } from "next/server";
// import stripe from "@/lib/stripe";
// import { createClient } from "@/utils/supabase/server";

// // --- Add your new plan here (Plan1) ---
// const PLAN_INFO = {
//   [process.env.NEXT_PUBLIC_PLAN1_PRICE_ID]: {
//     label: "$79 – 20,000 Credits (One-time)",
//     tokens: 20000,
//     isRecurring: false, // important: false for one-time
//   },
//   [process.env.NEXT_PUBLIC_PLAN2_PRICE_ID]: {
//     label: "$97/month – 50,000 Credits",
//     tokens: 50000,
//     isRecurring: true,
//   },
//   [process.env.NEXT_PUBLIC_PLAN3_PRICE_ID]: {
//     label: "$197/month – 200,000 Credits",
//     tokens: 200000,
//     isRecurring: true,
//   },
//   [process.env.NEXT_PUBLIC_PLAN4_PRICE_ID]: {
//     label: "$297/month – Unlimited Credits",
//     tokens: 9999999,
//     isRecurring: true,
//   },
//   [process.env.NEXT_PUBLIC_PLAN6_PRICE_ID]: {
//       label: "$1 – 5,000 Credits (One-time)",
//       tokens: 5000,
//       isRecurring: false,
//     },
// };

// export async function POST(request) {
//   try {
//     const { userId, priceId } = await request.json();
//     if (!userId) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }
//     // If plan is not recognized, you'll get 'Invalid plan priceId'
//     if (!PLAN_INFO[priceId]) {
//       return NextResponse.json({ error: "Invalid plan priceId" }, { status: 400 });
//     }

//     // 1) Auth: ensure valid session user
//     const supabase = await createClient();
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();

//     if (!user || authError || user.id !== userId) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     // 2) Fetch the user's Stripe customer ID from Supabase
//     const { data: profile, error: profileErr } = await supabase
//       .from("profiles")
//       .select("stripe_customer_id")
//       .eq("user_id", userId)
//       .single();
//     if (profileErr || !profile?.stripe_customer_id) {
//       return NextResponse.json(
//         { error: "User does not have a Stripe customer ID" },
//         { status: 400 }
//       );
//     }

//     // 3) Create the Checkout Session with the correct mode (payment or subscription)
//     const session = await stripe.checkout.sessions.create({
//       customer: profile.stripe_customer_id,
//       payment_method_types: ["card"],
//       line_items: [{ price: priceId, quantity: 1 }],
//       mode: PLAN_INFO[priceId].isRecurring ? "subscription" : "payment",
//       metadata: { user_id: userId },
//       success_url: `${
//         process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"
//       }/api/stripe-success`,
//       cancel_url: `${
//         process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"
//       }/protected/usa`,
//     });

//     return NextResponse.json({ sessionId: session.id });
//   } catch (err) {
//     console.error("Error creating checkout session:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// /app/api/checkout-sessions/route.js
import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";

const PLAN_INFO = {
  [process.env.NEXT_PUBLIC_PLAN1_PRICE_ID]: {
    label: "$79 – 20,000 Credits (One-time)",
    tokens: 20000,
    isRecurring: false, // important: false for one-time
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
  [process.env.NEXT_PUBLIC_PLAN6_PRICE_ID]: {
    label: "$1 – 5,000 Credits (One-time)",
    tokens: 5000,
    isRecurring: false,
  },
};

export async function POST(request) {
  try {
    const { userId, priceId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!PLAN_INFO[priceId]) {
      return NextResponse.json({ error: "Invalid plan priceId" }, { status: 400 });
    }

    // Extra check: If the plan is the $1 offer, verify if the user already purchased it.
    if (priceId === process.env.NEXT_PUBLIC_PLAN6_PRICE_ID) {
      const supabaseCheck = await createClient();
      const { data: profile, error: profileErr } = await supabaseCheck
        .from("profiles")
        .select("one_dollar_offer_purchased")
        .eq("user_id", userId)
        .single();
      if (profileErr) {
        console.error("Error fetching profile for one-dollar offer check:", profileErr);
        return NextResponse.json({ error: "Error verifying offer eligibility" }, { status: 500 });
      }
      if (profile && profile.one_dollar_offer_purchased) {
        return NextResponse.json({ error: "Exclusive $1 offer already purchased" }, { status: 400 });
      }
    }

    // 1) Auth: ensure valid session user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (!user || authError || user.id !== userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2) Fetch the user's Stripe customer ID from Supabase
    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();
    if (profileErr || !profileData?.stripe_customer_id) {
      return NextResponse.json(
        { error: "User does not have a Stripe customer ID" },
        { status: 400 }
      );
    }

    // 3) Create the Checkout Session with the correct mode (payment or subscription)
    const session = await stripe.checkout.sessions.create({
      customer: profileData.stripe_customer_id,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: PLAN_INFO[priceId].isRecurring ? "subscription" : "payment",
      metadata: { user_id: userId },
      success_url: `${
        process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"
      }/api/stripe-success`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"
      }/protected/usa`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
