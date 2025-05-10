"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { DollarSign } from "lucide-react";

function CreditsScreen({ onClose }) {
  const [selectedPlan, setSelectedPlan] = useState("50k");
  
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
            {/* Plan 1 - 20K Credits */}
            <div 
              className={`bg-[#2b2b2b] hover:bg-[#303030] transition-colors border ${selectedPlan === "20k" ? "border-blue-500" : "border-[#404040]"} rounded-lg p-5 cursor-pointer`}
              onClick={() => setSelectedPlan("20k")}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border ${selectedPlan === "20k" ? "border-blue-500 bg-blue-500" : "border-[#505050] bg-transparent"} flex items-center justify-center`}>
                    {selectedPlan === "20k" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-lg">20,000 Credits</h3>
                    <p className="text-sm text-neutral-400 mt-1">Monthly subscription</p>
                  </div>
                </div>
                <div className="text-white font-medium">$79/mo</div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#404040] ml-8">
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-xs text-neutral-300">
                    ✓ 20,000 credits per month
                  </p>
                  <p className="text-xs text-neutral-300">
                    ✓ CSV exports
                  </p>
                  <p className="text-xs text-neutral-300">
                    ✓ Cancel anytime
                  </p>
                </div>
              </div>
            </div>
            
            {/* Plan 2 - 50K Credits */}
            <div 
              className={`bg-[#2b2b2b] hover:bg-[#303030] transition-colors border ${selectedPlan === "50k" ? "border-blue-500" : "border-[#404040]"} rounded-lg p-5 cursor-pointer`}
              onClick={() => setSelectedPlan("50k")}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border ${selectedPlan === "50k" ? "border-blue-500 bg-blue-500" : "border-[#505050] bg-transparent"} flex items-center justify-center`}>
                    {selectedPlan === "50k" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white text-lg">50,000 Credits</h3>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded">POPULAR</span>
                    </div>
                    <p className="text-sm text-neutral-400 mt-1">Monthly subscription</p>

                  </div>

                </div>
                <div className="text-white font-medium">$149/mo</div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#404040] ml-8">
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-xs text-neutral-300">
                    ✓ 50,000 credits per month
                  </p>
                  <p className="text-xs text-neutral-300">
                    ✓ CSV exports
                  </p>
                  <p className="text-xs text-neutral-300">
                    ✓ API access
                  </p>
                  <p className="text-xs text-neutral-300">
                    ✓ Cancel anytime
                  </p>
                </div>
              </div>
            </div>
            
            {/* Plan 3 - 100K Credits */}
            <div 
              className={`bg-[#2b2b2b] hover:bg-[#303030] transition-colors border ${selectedPlan === "100k" ? "border-blue-500" : "border-[#404040]"} rounded-lg p-5 cursor-pointer`}
              onClick={() => setSelectedPlan("100k")}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border ${selectedPlan === "100k" ? "border-blue-500 bg-blue-500" : "border-[#505050] bg-transparent"} flex items-center justify-center`}>
                    {selectedPlan === "100k" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-lg">100,000 Credits</h3>
                    <p className="text-sm text-neutral-400 mt-1">Monthly subscription</p>
                  </div>
                </div>
                <div className="text-white font-medium">$249/mo</div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#404040] ml-8">
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-xs text-neutral-300">
                    ✓ 100,000 credits per month
                  </p>
                  <p className="text-xs text-neutral-300">
                    ✓ CSV exports
                  </p>
                  <p className="text-xs text-neutral-300">
                    ✓ API access
                  </p>
                  <p className="text-xs text-neutral-300">
                    ✓ Priority support
                  </p>
                  <p className="text-xs text-neutral-300">
                    ✓ Cancel anytime
                  </p>
                </div>
              </div>
            </div>
            
            {/* Pay As You Go - One-time packages */}
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg p-5">
              <h3 className="font-medium text-white text-lg mb-4">Pay As You Go</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* One-time package 1 */}
                <div className="bg-[#303030] border border-[#505050] rounded-lg p-3 hover:border-blue-500/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white">5K Credits</h4>
                    <div className="text-white font-medium text-sm">$49</div>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">One-time purchase</p>
                </div>
                
                {/* One-time package 2 */}
                <div className="bg-[#303030] border border-[#505050] rounded-lg p-3 hover:border-blue-500/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white">10K Credits</h4>
                    <div className="text-white font-medium text-sm">$89</div>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">One-time purchase</p>
                </div>
                
                {/* One-time package 3 */}
                <div className="bg-[#303030] border border-[#505050] rounded-lg p-3 hover:border-blue-500/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white">25K Credits</h4>
                    <div className="text-white font-medium text-sm">$179</div>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">One-time purchase</p>
                </div>
              </div>
            </div>
            
            {/* Checkout Button */}
            <div className="mt-6">
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white font-medium flex items-center justify-center gap-2">
                <DollarSign className="h-5 w-5" />
                <span>Continue to Checkout</span>
              </button>
              <p className="text-center text-xs text-neutral-500 mt-3">
                Secured by Stripe. Your payment information is encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CreditsScreen; 