"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

function Guide({ 
  // Core settings
  isVisible = true,           // Whether to render the guide at all
  defaultOpen = false,        // Should the guide be open by default
  title = "Guide",            // Guide header title
  
  // Content settings
  primaryContent = null,      // Main content (React node)
  sections = [],              // Alternative way to define content as sections array
  
  // Style settings
  width = 320,                // Width of the guide in pixels
  position = "right"          // Position of the guide (right, left)
}) {
  // Local state to track if guide is open
  const [guideOpen, setGuideOpen] = useState(defaultOpen);

  // Update guide state when default state changes
  useEffect(() => {
    setGuideOpen(defaultOpen);
  }, [defaultOpen]);

  // Don't render if guide isn't visible for current step
  if (!isVisible) return null;

  return (
    <div className={`fixed top-24 ${position}-0 bottom-0 w-auto z-50`}>
      <AnimatePresence>
        {guideOpen ? (
          <motion.aside
            key="guide"
            initial={{ x: position === "right" ? width : -width, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: position === "right" ? width : -width, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-24 ${position}-4 max-w-[90vw] bg-[#2b2b2b] border border-[#404040] rounded-2xl shadow-lg text-sm text-neutral-200 z-20 pointer-events-auto overflow-hidden`}
            style={{ width: width + 'px' }}
          >
            <button
              aria-label="minimize guide"
              onClick={() => setGuideOpen(false)}
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white z-10"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>

            {/* ---------- GUIDE CONTENT ---------- */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={title} // Use title as key to trigger animation when content changes
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="p-4 space-y-3"
              >
                <h3 className="text-base font-semibold">{title}</h3>
                
                {/* Render primary content if provided */}
                {primaryContent}
                
                {/* Or render sections if provided */}
                {sections.length > 0 && sections.map((section, index) => (
                  <div key={index} className="mt-3">
                    {section.title && <p className="font-medium">{section.title}</p>}
                    {section.content}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.aside>
        ) : (
          <motion.button
            key="guide-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            aria-label="open guide"
            onClick={() => setGuideOpen(true)}
            className={`fixed top-1/2 ${position === "right" ? "right-2" : "left-2"} -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white pointer-events-auto cursor-pointer`}
          >
            <ArrowLeftIcon className={`h-4 w-4 ${position === "left" ? "rotate-180" : ""}`} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Guide; 