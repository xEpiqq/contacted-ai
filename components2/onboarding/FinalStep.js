import React from "react";
import { motion } from "framer-motion";

const FinalStep = ({ userData, nextStep, currentStep, totalSteps }) => {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">You're all set, {userData.name || "there"}!</h2>
        <p className="text-neutral-300 max-w-md mx-auto">
          We've customized your Contacted.ai experience based on your preferences. Your dashboard is ready to go!
        </p>
      </motion.div>
      
      <div className="bg-[#212121] rounded-lg border border-[#333333] p-6 mb-10">
        <h3 className="text-lg font-medium mb-4">Your personalized setup includes:</h3>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div>
              <h4 className="font-medium">Targeted prospect lists</h4>
              <p className="text-sm text-neutral-400">
                Pre-filtered for {userData.targetAudience.length > 0 ? userData.targetAudience.length : "your selected"} target roles across {userData.targetIndustries.length > 0 ? userData.targetIndustries.length : "your chosen"} industries
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div>
              <h4 className="font-medium">Custom outreach templates</h4>
              <p className="text-sm text-neutral-400">
                Optimized for {userData.businessType || "your business type"} to achieve your outreach goals
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div>
              <h4 className="font-medium">Dashboard analytics</h4>
              <p className="text-sm text-neutral-400">
                Focused on tracking metrics that align with your specific outreach goals
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="h-5 w-5 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div>
              <h4 className="font-medium">10,000 free contacts</h4>
              <p className="text-sm text-neutral-400">
                Ready for you to start your outreach campaigns right away
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 flex justify-center">
        <button
          onClick={nextStep}
          className="px-8 py-3 bg-green-500 hover:bg-green-600 text-black font-medium rounded-md transition-colors flex items-center"
        >
          Go to Dashboard
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  );
};

export default FinalStep; 