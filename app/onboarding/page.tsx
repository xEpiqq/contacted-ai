"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// Step components for the onboarding flow
import WelcomeStep from "@/components2/onboarding/WelcomeStep.js";
import BusinessInfoStep from "@/components2/onboarding/BusinessInfoStep.js";
import TargetAudienceStep from "@/components2/onboarding/TargetAudienceStep.js";
import OutreachGoalsStep from "@/components2/onboarding/OutreachGoalsStep.js";
import FinalStep from "@/components2/onboarding/FinalStep.js";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    name: "",
    businessName: "",
    businessType: "",
    teamSize: "",
    targetAudience: [],
    targetIndustries: [],
    outreachGoals: [],
    monthlyProspects: "",
  });

  const steps = [
    { 
      component: WelcomeStep, 
      title: "10,000 credits added to your account",
      shortTitle: "Welcome" 
    },
    { 
      component: BusinessInfoStep, 
      title: "Tell us about your business", 
      shortTitle: "Business info"
    },
    { 
      component: TargetAudienceStep, 
      title: "Who do you want to reach?", 
      shortTitle: "Audience"
    },
    { 
      component: OutreachGoalsStep, 
      title: "What are your outreach goals?", 
      shortTitle: "Goals"
    },
    { 
      component: FinalStep, 
      title: "You're all set!", 
      shortTitle: "Complete"
    },
  ];

  const updateUserData = (data: Partial<typeof userData>) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      // Redirect to main app on completion
      router.push("/app");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="flex min-h-screen bg-[#181818] text-white">
      {/* Sidebar */}
      <div className="w-80 bg-[#212121] border-r border-[#333333] p-8 flex flex-col">
        <div className="mb-12">
          <div className="flex items-center">
            <div className="h-12 w-auto relative">
              <Image 
                src="/logo.png" 
                alt="Contacted.ai Logo" 
                width={140} 
                height={48} 
                className="object-contain"
              />
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  index < currentStep 
                    ? "bg-green-500 text-black" 
                    : index === currentStep
                    ? "bg-green-500/20 border border-green-500 text-green-500" 
                    : "bg-[#313131] text-neutral-500"
                }`}>
                  {index < currentStep ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`font-medium ${
                  index <= currentStep ? "text-white" : "text-neutral-500"
                }`}>
                  {step.shortTitle}
                </span>
              </li>
            ))}
          </ol>
        </div>
        
        <div className="mt-auto pt-8 border-t border-[#333333] text-xs text-neutral-500">
          <p>Need help?</p>
          <Link 
            href="mailto:support@contacted.ai" 
            className="text-green-500 hover:text-green-400 transition-colors block mb-2"
          >
            Contact support
          </Link>
          <div className="flex gap-x-4">
            <Link 
              href="/privacy-policy" 
              className="text-green-500 hover:text-green-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms-of-service" 
              className="text-green-500 hover:text-green-400 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 py-12 px-16">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold mb-6">{steps[currentStep].title}</h1>
              <CurrentStepComponent 
                userData={userData} 
                updateUserData={updateUserData} 
                nextStep={nextStep} 
                prevStep={prevStep}
                currentStep={currentStep}
                totalSteps={steps.length}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
} 