"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { DollarSign } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { useSearchContext } from "../context/SearchContext";

// Stripe promise
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Define the plan IDs
const PLANS = [
  {
    priceId: process.env.NEXT_PUBLIC_PLAN2_PRICE_ID,
    name: "20,000 Credits",
    price: "$99/mo",
    popular: true,
    features: [
      "20,000 credits per month",
      "CSV exports",
      "API access",
      "Cancel anytime"
    ],
    id: "20k"
  },
  {
    priceId: process.env.NEXT_PUBLIC_PLAN3_PRICE_ID,
    name: "50,000 Credits",
    price: "$199/mo",
    features: [
      "50,000 credits per month",
      "CSV exports",
      "API access",
      "Priority support",
      "Cancel anytime"
    ],
    id: "50k"
  },
  {
    priceId: process.env.NEXT_PUBLIC_PLAN4_PRICE_ID,
    name: "200,000 Credits",
    price: "$297/mo",
    features: [
      "200,000 credits per month",
      "CSV exports",
      "API access",
      "Priority support",
      "Cancel anytime"
    ],
    id: "200k"
  }
];

function CreditsScreen({ onClose }) {
  const { user, profile } = useSearchContext();
  const [selectedPlan, setSelectedPlan] = useState("20k");
  const [processingPriceId, setProcessingPriceId] = useState("");
  
  // Force display all plans regardless of user status
  // Always show all three plans
  const displayedPlans = PLANS;
  
  // Log plans for debugging
  useEffect(() => {
    console.log("All available plans:", PLANS);
    console.log("User profile:", profile);
    console.log("Plans being displayed:", displayedPlans);
  }, [profile]);

  // Helper function to determine which plans to show based on user's current plan
  // This is now unused but kept for reference
  const getFilteredPlansForUser = () => {
    // If no profile yet or not on active plan, show all plans
    if (!profile || profile.plan_status !== "active") return PLANS;
    
    // Always show all plans for users on a trial
    if (profile.stripe_price_id === process.env.NEXT_PUBLIC_TRIAL_PRICE_ID) {
      return PLANS;
    }

    // For users on regular plans, determine which plans to show
    const currentPlan = PLANS.find(p => p.priceId === profile.stripe_price_id);
    if (!currentPlan) return PLANS;

    // Get plans that are higher tier than current plan
    const upgradePlans = PLANS.filter(p => {
      const currentIndex = PLANS.findIndex(plan => plan.priceId === profile.stripe_price_id);
      const planIndex = PLANS.findIndex(plan => plan.priceId === p.priceId);
      return planIndex > currentIndex;
    });
    
    // Always include the basic plan (20k credits) if not already on it
    if (profile.stripe_price_id === process.env.NEXT_PUBLIC_PLAN2_PRICE_ID) {
      return upgradePlans; // Already on basic plan, only show upgrades
    }
    
    // Include basic plan with other upgrade options
    const basicPlan = PLANS.find(p => p.id === "20k");
    return [basicPlan, ...upgradePlans.filter(p => p.id !== "20k")];
  };

  // Handle plan checkout
  const handlePlanCheckout = async (priceId) => {
    if (!user) return;
    try {
      setProcessingPriceId(priceId);
      const stripe = await stripePromise;
      const res = await fetch("/api/checkout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, userEmail: user.email, priceId }),
      });
      const data = await res.json();

      if (data?.sessionId) {
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (error) console.error(error.message);
      } else {
        console.error("No sessionId returned:", data?.error || "Unknown error");
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setProcessingPriceId("");
    }
  };

  // Handle plan upgrade
  const handleUpgrade = async (priceId) => {
    if (!user) return;
    try {
      setProcessingPriceId(priceId);
      const res = await fetch("/api/upgrade-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newPriceId: priceId }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("Upgrade error:", json.error);
        alert(json.error || "Upgrade failed");
      } else {
        alert("Upgrade successful! We'll refresh your subscription status soon.");
        onClose();
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert(err.message);
    } finally {
      setProcessingPriceId("");
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut",
        exit: { duration: 0.15 } // Exit animation runs twice as fast
      }}
      className="fixed inset-0 bg-[#212121] z-50 overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto p-6 pt-16 flex flex-col md:flex-row gap-8">
        {/* Testimonials Column */}
        <div className="md:w-1/3">
          <h2 className="text-2xl font-semibold text-white mb-6">What our customers say</h2>
          
          <div className="space-y-8">
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg p-5">
              <p className="text-neutral-300 text-sm italic mb-4">
                "This tool has transformed our outreach process. We're connecting with the right decision-makers and seeing a 3x increase in response rates."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">M</div>
                <div>
                  <p className="text-white text-sm font-medium">Michael T.</p>
                  <p className="text-neutral-400 text-xs">VP of Sales, TechCorp</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg p-5">
              <p className="text-neutral-300 text-sm italic mb-4">
                "We scaled our B2B prospecting while maintaining quality. The enrichment data is accurate and always up to date."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">S</div>
                <div>
                  <p className="text-white text-sm font-medium">Sarah K.</p>
                  <p className="text-neutral-400 text-xs">Marketing Director, GrowthIQ</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg p-5">
              <p className="text-neutral-300 text-sm italic mb-4">
                "The data quality is exceptional. We're building targeted lists in minutes instead of days."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">J</div>
                <div>
                  <p className="text-white text-sm font-medium">James L.</p>
                  <p className="text-neutral-400 text-xs">Founder, LaunchPad</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Plans Column */}
        <div className="md:w-2/3">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-white">Get More Credits</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-white">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            {displayedPlans.length === 0 ? (
              <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg p-5">
                <p className="text-white">No higher plans available – you're on the top tier!</p>
              </div>
            ) : (
              displayedPlans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`bg-[#2b2b2b] hover:bg-[#303030] transition-colors border ${selectedPlan === plan.id ? "border-blue-500" : "border-[#404040]"} rounded-lg p-5 cursor-pointer`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full border ${selectedPlan === plan.id ? "border-blue-500 bg-blue-500" : "border-[#505050] bg-transparent"} flex items-center justify-center`}>
                        {selectedPlan === plan.id && <div className="h-2 w-2 rounded-full bg-white"></div>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white text-lg">{plan.name}</h3>
                          {plan.popular && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded">POPULAR</span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-400 mt-1">Monthly subscription</p>
                      </div>
                    </div>
                    <div className="text-white font-medium">{plan.price}</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#404040] ml-8">
                    <div className="grid grid-cols-1 gap-2">
                      {plan.features.map((feature, index) => (
                        <p key={index} className="text-xs text-neutral-300">
                          ✓ {feature}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Checkout Button */}
            {displayedPlans.length > 0 && (
              <div className="mt-6">
                <button 
                  onClick={() => {
                    const plan = PLANS.find(p => p.id === selectedPlan);
                    if (!plan) return;
                    
                    // Different handling based on user status
                    if (profile?.plan_status === "active") {
                      // For users switching from trial to regular plan
                      if (profile.stripe_price_id === process.env.NEXT_PUBLIC_TRIAL_PRICE_ID) {
                        // For trial users, just checkout with new plan
                        handlePlanCheckout(plan.priceId);
                      } else {
                        // For regular active users, use the upgrade flow
                        handleUpgrade(plan.priceId);
                      }
                    } else {
                      // For inactive/cancelled users or new users
                      handlePlanCheckout(plan.priceId);
                    }
                  }}
                  disabled={processingPriceId !== ""}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white font-medium flex items-center justify-center gap-2"
                >
                  <DollarSign className="h-5 w-5" />
                  <span>
                    {processingPriceId ? "Processing..." : 
                     (profile?.plan_status === "active" && profile?.stripe_price_id !== process.env.NEXT_PUBLIC_TRIAL_PRICE_ID) 
                      ? "Upgrade Plan" 
                      : "Continue to Checkout"}
                  </span>
                </button>
                <p className="text-center text-xs text-neutral-500 mt-3">
                  Secured by Stripe. Your payment information is encrypted.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CreditsScreen; 