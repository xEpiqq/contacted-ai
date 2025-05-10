"use client";

import React from "react";
import { useSearchContext } from "../context/SearchContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, Download, Chrome } from "lucide-react";
import { XMarkIcon } from "@heroicons/react/24/outline";

function Toasts() {
  const {
    showExtensionToast,
    setShowExtensionToast,
    showEnrichmentToast,
    setShowEnrichmentToast,
    showEnrichmentSuccessToast,
    setShowEnrichmentSuccessToast,
    enrichmentResult,
  } = useSearchContext();

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-4">
      <AnimatePresence>
        {/* Chrome extension toast */}
        {showExtensionToast && (
          <Toast
            type="info"
            icon={<Chrome className="h-5 w-5 text-blue-400" />}
            title="Installing Extension"
            message="The Chrome extension will open in a new tab."
            onClose={() => setShowExtensionToast(false)}
          />
        )}

        {/* Enrichment in progress toast */}
        {showEnrichmentToast && (
          <Toast
            type="warning"
            icon={<AlertTriangle className="h-5 w-5 text-yellow-400" />}
            title="Enrichment in Progress"
            message="Your data is being enriched. Please don't close this window."
            onClose={() => setShowEnrichmentToast(false)}
          />
        )}

        {/* Enrichment success toast */}
        {showEnrichmentSuccessToast && (
          <Toast
            type="success"
            icon={<CheckCircle className="h-5 w-5 text-green-400" />}
            title="Enrichment Complete!"
            message={`Successfully enriched ${enrichmentResult?.matchesCount || 0} contacts.`}
            onClose={() => setShowEnrichmentSuccessToast(false)}
            action={{
              label: "Download",
              icon: <Download className="h-4 w-4" />,
              onClick: () => {
                // Download action would go here
                setShowEnrichmentSuccessToast(false);
              },
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable Toast component
function Toast({ type, icon, title, message, onClose, action }) {
  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/30";
      case "error":
        return "bg-red-500/10 border-red-500/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "info":
      default:
        return "bg-blue-500/10 border-blue-500/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`rounded-lg border ${getBgColor()} p-4 shadow-lg w-72`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-white">{title}</h3>
            <button
              className="ml-1.5 flex-shrink-0 -mt-1 text-neutral-400 hover:text-white"
              onClick={onClose}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-neutral-300 line-clamp-2">{message}</p>
          
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Toasts; 