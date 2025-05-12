"use client";

import { useSearchContext } from "../context/SearchContext";
import { motion } from "framer-motion";

function StepBadges() {
  const { currentStep, navigateToStep } = useSearchContext();

  // Handle stepping back to previous steps for editing
  const handleStepClick = (targetStep) => {
    // Only allow navigation to completed steps
    if (targetStep <= currentStep) {
      navigateToStep(targetStep - 1);
    }
  };

  return (
    <div className="fixed top-20 left-4 flex flex-col gap-2 z-10 pointer-events-auto">
      {[1, 2, 3].map((step) => (
        <motion.button
          key={step}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStepClick(step)}
          className={`px-3 py-1 rounded-full text-sm ${
            step <= currentStep
              ? "bg-green-500/20 text-green-700 cursor-pointer hover:bg-green-500/30"
              : "bg-gray-500/20 text-gray-500 cursor-not-allowed"
          }`}
          disabled={step > currentStep}
        >
          Step {step}
        </motion.button>
      ))}
    </div>
  );
}

export default StepBadges; 