"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from "lucide-react";
import { useSearchContext } from "../context/SearchContext";

function Toasts() {
  const {
    showExtensionToast,
    setShowExtensionToast,
    showEnrichmentSuccessToast,
    setShowEnrichmentSuccessToast
  } = useSearchContext();

  return (
    <>
      {/* Toast notification for Chrome extension download */}
      <AnimatePresence>
        {showExtensionToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-5 right-5 bg-green-900/80 border border-green-700 text-green-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
          >
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="font-medium">Chrome Extension Download Started</p>
              <p className="text-xs text-green-300 mt-0.5">Unzip the file and follow the installation instructions</p>
            </div>
            <button 
              onClick={() => setShowExtensionToast(false)}
              className="ml-2 text-green-300 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enrichment success toast */}
      <AnimatePresence>
        {showEnrichmentSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-5 right-5 bg-green-900/80 border border-green-700 text-green-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
          >
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="font-medium">Enriched File Saved to Exports</p>
              <p className="text-xs text-green-300 mt-0.5">Your file has been saved and can be accessed anytime in the exports tab</p>
            </div>
            <button 
              onClick={() => setShowEnrichmentSuccessToast(false)}
              className="ml-2 text-green-300 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Toasts; 