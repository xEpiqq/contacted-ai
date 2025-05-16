"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

// Step components for the onboarding flow
import { BusinessInfoStep, TargetAudienceStep, OutreachGoalsStep } from "@/components2/onboarding/OnboardingSteps.jsx";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentView, setCurrentView] = useState("steps"); // "steps", "tutorial", "celebration"
  const [userData, setUserData] = useState({
    name: "",
    businessType: "",
    teamSize: "",
    hasNiche: null,
    targetNiche: [],
    otherNicheValue: "",
    outreachGoals: [],
    monthlyProspects: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        
        if (!data?.user) {
          console.log('No authenticated user found');
          router.push('/sign-in');
          return;
        }
        
        setUser(data.user);
        console.log('User loaded:', data.user.id);
        
        // Check if user has already completed onboarding
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', data.user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (profile && profile.onboarding_completed) {
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    
    fetchUser();
  }, []);

  const steps = [
    { 
      component: BusinessInfoStep, 
      title: "Tell us about your business",
      shortTitle: "Business info" 
    },
    { 
      component: TargetAudienceStep, 
      title: "Do you have a niche?", 
      shortTitle: "Niche"
    },
    { 
      component: OutreachGoalsStep, 
      title: "What are your outreach goals?", 
      shortTitle: "Goals"
    }
  ];

  const updateUserData = (data) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      // Show tutorial offer
      setCurrentView("tutorial");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const saveOnboardingData = async (watchedTutorial) => {
    if (!user) {
      console.error('No user available to save onboarding data');
      return false;
    }
    
    setIsLoading(true);
    console.log('Saving onboarding for user ID:', user.id);
    
    try {
      const supabase = createClient();
      
      // Update the user's profile with onboarding data
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          business_name: userData.name || '',
          business_type: userData.businessType || '',
          team_size: userData.teamSize || '',
          has_niche: userData.hasNiche,
          target_niche: userData.targetNiche || [],
          other_niche_value: userData.otherNicheValue || '',
          monthly_prospects: userData.monthlyProspects || '',
          outreach_goals: userData.outreachGoals || [],
          watched_tutorial: watchedTutorial
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error saving onboarding data:', error);
        return false;
      }
      
      // Handle bonus credits for watching tutorial
      if (watchedTutorial) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('one_time_credits')
          .eq('user_id', user.id)
          .single();
          
        if (profileData) {
          const currentCredits = profileData.one_time_credits || 0;
          const newCredits = currentCredits + 2000;
          
          const { error: creditError } = await supabase
            .from('profiles')
            .update({ one_time_credits: newCredits })
            .eq('user_id', user.id);
            
          if (creditError) {
            console.error('Error updating credits:', creditError);
          }
        }
      }
      
      console.log('Onboarding data saved successfully');
      return true;
    } catch (error) {
      console.error('Error in onboarding process:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const skipTutorial = async () => {
    try {
      await saveOnboardingData(false);
    } catch (error) {
      console.error("Error in skip tutorial process:", error);
    }
    
    // Always transition to celebration screen
    setCurrentView("celebration");
    
    // Redirect after a delay
    setTimeout(() => {
      router.push("/");
    }, 5000);
  };
  
  const watchTutorial = async () => {
    try {
      await saveOnboardingData(true);
    } catch (error) {
      console.error("Error in watch tutorial process:", error);
    }
    
    // Always transition to celebration screen
    setCurrentView("celebration");
    
    // Redirect after a delay
    setTimeout(() => {
      router.push("/");
    }, 5000);
  };

  const CurrentStepComponent = steps[currentStep].component;
  
  // Determine the max-width class based on the current step
  const contentMaxWidthClass = currentStep === 1 ? "max-w-4xl" : "max-w-2xl";

  // Animation variants for smooth transitions
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  return (
    <AnimatePresence mode="wait">
      {currentView === "steps" && (
        <motion.div 
          key="steps"
          className="flex min-h-screen bg-[#181818] text-white"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          {/* Sidebar */}
          <div className="w-64 bg-[#212121] border-r border-[#333333] p-6 flex flex-col">
            <div className="mb-8">
              <div className="flex items-center">
                <div className="h-10 w-auto relative">
                  <Image 
                    src="/logo.png" 
                    alt="Contacted.ai Logo" 
                    width={120} 
                    height={40} 
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <ol className="space-y-5">
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
                    <span className={`text-sm font-medium ${
                      index <= currentStep ? "text-white" : "text-neutral-500"
                    }`}>
                      {step.shortTitle}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            
            <div className="mt-auto pt-6 border-t border-[#333333] text-xs text-neutral-500">
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
          <main className="flex-1 py-8 px-12">
            <div className={contentMaxWidthClass}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-2xl font-bold mb-4">{steps[currentStep].title}</h1>
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
        </motion.div>
      )}

      {currentView === "tutorial" && (
        <motion.div 
          key="tutorial"
          className="min-h-screen bg-[#181818] text-white flex flex-col items-center justify-center px-4"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          <div className="text-center max-w-2xl">
            <motion.div 
              className="mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 border-2 border-green-500">
                <svg className="w-10 h-10 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-3xl font-bold mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Want to earn 2,000 bonus credits?
            </motion.h1>
            
            <motion.p 
              className="text-neutral-400 mb-6 text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              Watch our quick 3-minute tutorial video to learn how to get the most out of our platform and receive 2,000 bonus credits!
            </motion.p>
            
            <motion.div 
              className="bg-[#212121] border border-[#333333] rounded-lg p-5 mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-5 w-5 rounded-full flex-shrink-0 bg-green-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-white text-sm">Learn how to set up your first campaign</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-5 w-5 rounded-full flex-shrink-0 bg-green-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-white text-sm">Discover how to create personalized outreach</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full flex-shrink-0 bg-green-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-white text-sm">See how to track your results and optimize</span>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              {/* Loading spinner for the buttons */}
              <button
                onClick={skipTutorial}
                disabled={isLoading}
                className={`px-6 py-3 bg-transparent hover:bg-[#252525] border border-[#333333] text-neutral-400 font-medium rounded-md transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : 'Skip for now'}
              </button>
              <button
                onClick={watchTutorial}
                disabled={isLoading}
                className={`px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                Watch & earn 2,000 credits
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {currentView === "celebration" && (
        <motion.div 
          key="celebration"
          className="min-h-screen bg-[#181818] text-white flex flex-col items-center justify-center px-4"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          <div className="text-center max-w-xl">
            <motion.div 
              className="mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <svg className="w-24 h-24 mx-auto text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>
            
            <motion.h1 
              className="text-3xl font-bold mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              Your account is ready!
            </motion.h1>
            
            <motion.p 
              className="text-neutral-400 mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              Your preferences have been saved. We're customizing your dashboard and you'll be redirected to the main page in just a moment...
            </motion.p>
            
            <motion.div 
              className="relative h-2 w-full bg-[#333333] rounded-full overflow-hidden"
              initial={{ scaleX: 0.8, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <motion.div
                className="absolute top-0 left-0 h-full bg-green-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4.5, ease: "linear", delay: 0.5 }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 