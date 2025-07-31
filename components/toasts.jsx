"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from "lucide-react";

// Generic toast component that takes parameters for customization
const Toast = ({ headerText, subText, color = "green", onClose }) => {
  // Use explicit class names instead of template literals for Tailwind to recognize them
  const getColorClasses = () => {
    switch (color) {
      case "green":
        return {
          bg: "bg-green-900/80",
          border: "border-green-700",
          text: "text-green-100",
          subText: "text-green-300",
          icon: "text-green-400",
          close: "text-green-300 hover:text-white"
        };
      case "red":
        return {
          bg: "bg-red-900/80",
          border: "border-red-700",
          text: "text-red-100",
          subText: "text-red-300",
          icon: "text-red-400",
          close: "text-red-300 hover:text-white"
        };
      case "blue":
        return {
          bg: "bg-blue-900/80",
          border: "border-blue-700",
          text: "text-blue-100",
          subText: "text-blue-300",
          icon: "text-blue-400",
          close: "text-blue-300 hover:text-white"
        };
      default:
        return {
          bg: "bg-green-900/80",
          border: "border-green-700",
          text: "text-green-100",
          subText: "text-green-300",
          icon: "text-green-400",
          close: "text-green-300 hover:text-white"
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`${colors.bg} border ${colors.border} ${colors.text} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
      <CheckCircle className={`h-5 w-5 ${colors.icon}`} />
      <div>
        <p className="font-medium">{headerText}</p>
        <p className={`text-xs ${colors.subText} mt-0.5`}>{subText}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className={`ml-2 ${colors.close}`}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

function Toasts({ toastConfig, setToastConfig }) {
  const closeToast = () => {
    setToastConfig(null);
  };

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toastConfig) {
      const timer = setTimeout(() => {
        closeToast();
      }, 4000); // 4 seconds

      // Cleanup timer if component unmounts or toastConfig changes
      return () => clearTimeout(timer);
    }
  }, [toastConfig]);

  return (
    <div className="fixed bottom-5 right-5 space-y-3 z-10">
      <AnimatePresence>
        {toastConfig && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <Toast 
              headerText={toastConfig.headerText}
              subText={toastConfig.subText}
              color={toastConfig.color || "green"}
              onClose={closeToast}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Toasts; 