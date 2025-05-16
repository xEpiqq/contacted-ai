import React from "react";
import { motion } from "framer-motion";

/**
 * Tutorial Offer Screen Component
 */
export const TutorialOfferScreen = ({ onSkip, onWatch }) => {
  return (
    <div className="min-h-screen bg-[#181818] text-white flex flex-col items-center justify-center px-4">
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
          <button
            onClick={onSkip}
            className="px-6 py-3 bg-transparent hover:bg-[#252525] border border-[#333333] text-neutral-400 font-medium rounded-md transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={onWatch}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-medium rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
            Watch & earn 2,000 credits
          </button>
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Celebration Screen Component
 */
export const CelebrationScreen = () => {
  return (
    <div className="min-h-screen bg-[#181818] text-white flex flex-col items-center justify-center px-4">
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
          We're customizing your experience based on your preferences. You'll be redirected in just a moment...
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
    </div>
  );
}; 