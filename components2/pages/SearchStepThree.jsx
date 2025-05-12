"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { BadgeButton } from "@/components/badge";

// Internal Badge component for the comma-separated bubbles (copied from SearchStepTwo)
function Badge({ children, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#2b2b2b] text-sm text-neutral-400"
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="text-neutral-500 hover:text-neutral-300"
      >
        ×
      </button>
    </motion.div>
  );
}

// Sample industry examples
export const industryExamples = [
  "software",
  "healthcare",
  "finance",
  "manufacturing",
  "education",
  "retail",
  "construction",
  "hospitality",
  "renewable energy",
  "transportation",
  "agriculture",
];

// Badge color options - matching SearchStepTwo
const badgeColors = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "zinc",
];

function SearchStepThree({
  text,
  setText,
  canProceed,
  handleBack,
  handleSubmit,
  selectedIndustries,
  handleExampleClick,
  handleBadgeRemove,
  showIndustryExamples,
  setShowIndustryExamples
}) {
  // Reference for textarea auto-grow
  const textareaRef = useRef(null);

  // Auto-grow textarea height
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [text]);

  // Auto-focus the textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle text changes - added comma separation functionality
  const handleTextChange = (e) => {
    const newText = e.target.value;
    
    // Check for comma to create new badge
    if (newText.endsWith(",")) {
      const industry = newText.slice(0, -1).trim();
      if (industry) {
        handleExampleClick(industry, false, true);
        setText("");
      }
      return;
    }
    
    setText(newText);
  };

  // Handle key presses
  const handleKeyDown = (e) => {
    // Handle enter to submit
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canProceed) {
        handleSubmit(2);
      }
    }

    // Handle backspace to delete badges
    if (e.key === "Backspace" && text === "") {
      e.preventDefault();
      if (selectedIndustries.length > 0) {
        const lastIndex = selectedIndustries.length - 1;
        handleBadgeRemove(lastIndex, false, true);
        const lastIndustry = selectedIndustries[lastIndex];
        setText(lastIndustry);
      }
    }
  };

  return (
    <motion.div
      key="search-step-three"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-[690px] relative"
    >
      {/* back arrow */}
      <button
        type="button"
        aria-label="back"
        onClick={() => handleBack(1)}
        className="absolute -left-10 top-1 text-neutral-400 hover:text-white focus:outline-none"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </button>

      {/* heading */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <h1 className="text-3xl sm:text-2xl font-medium">
          Industry
          <span className="text-neutral-500">(optional)</span>
        </h1>
      </div>

      {/* input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(2);
        }}
        className="rounded-3xl bg-[#303030] shadow-sm"
      >
        <div className="flex flex-col px-4 py-2">
          <div className="flex items-center flex-wrap gap-2">
            {/* Industry badges - using internal Badge component */}
            <AnimatePresence>
              {selectedIndustries.map((industry, index) => (
                <Badge
                  key={index}
                  onRemove={() => handleBadgeRemove(index, false, true)}
                >
                  {industry}
                </Badge>
              ))}
            </AnimatePresence>
            
            {/* Text input */}
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Add industries (e.g. technology, healthcare)"
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="flex-1 ml-2 resize-none overflow-hidden bg-transparent placeholder:text-neutral-400 text-sm leading-6 outline-none min-w-[200px]"
            />
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={!canProceed}
              className={`ml-2 h-9 w-9 flex items-center justify-center rounded-full transition-opacity ${
                canProceed
                  ? "bg-white text-black hover:opacity-90"
                  : "bg-neutral-600 text-white cursor-not-allowed opacity-60"
              }`}
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </form>

      {/* Examples section - updated to match SearchStepTwo style */}
      {showIndustryExamples && industryExamples.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3"
        >
          <div className="flex flex-wrap gap-2 mb-2">
            {industryExamples
              .filter(example => !selectedIndustries.includes(example))
              .map((example, idx) => (
                <BadgeButton
                  key={idx}
                  color={badgeColors[idx % badgeColors.length]}
                  onClick={() => handleExampleClick(example, false, true)}
                >
                  {example}
                </BadgeButton>
              ))}
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowIndustryExamples(false)}
              className="text-xs text-neutral-400 hover:text-neutral-300"
            >
              hide examples
            </button>
          </div>
        </motion.div>
      )}

      {/* Show examples button (when hidden) */}
      {!showIndustryExamples && (
        <motion.div layout className="mt-2 text-right">
          <button
            type="button"
            onClick={() => setShowIndustryExamples(true)}
            className="text-xs text-neutral-400 hover:text-neutral-300"
          >
            show examples
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default SearchStepThree; 