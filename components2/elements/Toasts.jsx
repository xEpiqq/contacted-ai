"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from "lucide-react";
import { useSearchContext } from "../context/SearchContext";

// Generic toast component that takes parameters for customization
const Toast = ({ headerText, subText, color = "green", onClose }) => {
  const bgColor = `bg-${color}-900/80`;
  const borderColor = `border-${color}-700`;
  const textColor = `text-${color}-100`;
  const subTextColor = `text-${color}-300`;
  const iconColor = `text-${color}-400`;
  const closeColor = `text-${color}-300 hover:text-white`;

  return (
    <div className={`${bgColor} border ${borderColor} ${textColor} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
      <CheckCircle className={`h-5 w-5 ${iconColor}`} />
      <div>
        <p className="font-medium">{headerText}</p>
        <p className={`text-xs ${subTextColor} mt-0.5`}>{subText}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className={`ml-2 ${closeColor}`}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

function Toasts() {
  const {
    toastConfig,
    setToastConfig
  } = useSearchContext();

  const closeToast = () => {
    setToastConfig(null);
  };

  return (
    <div className="fixed bottom-5 right-5 space-y-3 z-50">
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