"use client";

import React, { useRef, useEffect, useState } from "react";
import { useSearchContext } from "../context/SearchContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Badge from "../elements/Badge";
import ToggleSwitch from "../elements/ToggleSwitch";
import { jobTitleExamples, localBizExamples } from "../core/utils";

function SearchStepTwo({
  text,
  setText,
  canProceed,
  handleBack,
  handleSubmit,
  answerType,
  brainstorm,
  handleBrainstormToggle,
  selectedExamples,
  brainstormExamples,
  handleExampleClick,
  handleBadgeRemove,
  showExamples,
  setShowExamples,
}) {
  const {
    shouldAdjustPadding,
    isProcessing,
    showSuggestions,
    brainstormSuggestions,
    brainstormQuery,
    selectedKeywords,
    handleSuggestionSelect,
    handleKeywordRemove
  } = useSearchContext();

  // Local state
  const [suggestion, setSuggestion] = useState("");
  const [suggestActive, setSuggestActive] = useState(false);

  // References
  const textareaRef = useRef(null);

  // Local heading text based on answer type and brainstorm mode
  const getHeadingText = () => {
    if (answerType === "people") {
      return brainstorm ? "Brainstorm Job Titles" : "Job Title";
    } else {
      return "Local Business Type";
    }
  };

  // Custom key handler
  const handleKeyDown = (e) => {
    // Handle tab for auto-completion
    if (e.key === "Tab" && suggestion && suggestActive) {
      e.preventDefault();
      const lastCommaIndex = text.lastIndexOf(",");
      const prefix = lastCommaIndex >= 0 ? text.slice(0, lastCommaIndex + 1) : "";
      const lastTerm = lastCommaIndex >= 0 ? text.slice(lastCommaIndex + 1) : text;
      const fullTerm = lastTerm.trim() + suggestion;
      
      setText(prefix + (prefix ? " " : "") + fullTerm);
      setSuggestion("");
      setSuggestActive(false);
    }
    
    // Handle enter to submit
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canProceed) {
        handleSubmit(1);
      }
    }

    // Handle backspace to delete badges
    if (e.key === "Backspace" && text === "") {
      e.preventDefault();
      const examples = brainstorm ? brainstormExamples : selectedExamples;
      if (examples.length > 0) {
        const lastIndex = examples.length - 1;
        handleBadgeRemove(lastIndex, brainstorm);
        const lastExample = examples[lastIndex];
        setText(lastExample);
      }
    }
  };

  // Handle text changes
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    // Handle auto-suggestion for job titles
    if (!brainstorm && answerType === "people") {
      const lastCommaIndex = newText.lastIndexOf(",");
      const lastTermRaw = lastCommaIndex >= 0 ? newText.slice(lastCommaIndex + 1) : newText;
      const lastTerm = lastTermRaw.trim().toLowerCase();
      
      if (lastTerm.length >= 2) {
        // Simple example, in a real app this would likely be more sophisticated
        const jobExamples = ["manager", "director", "engineer", "sales representative", "consultant"];
        const match = jobExamples.find(job => 
          job.toLowerCase().startsWith(lastTerm) && job.toLowerCase() !== lastTerm
        );
        
        if (match) {
          setSuggestion(match.slice(lastTerm.length));
          setSuggestActive(true);
        } else {
          setSuggestion("");
          setSuggestActive(false);
        }
      } else {
        setSuggestion("");
        setSuggestActive(false);
      }
    }
  };

  // Auto-grow textarea height
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [text]);

  // Auto-focus textarea when not in brainstorm mode or when showing suggestions
  useEffect(() => {
    if ((!brainstorm || showSuggestions) && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [brainstorm, showSuggestions]);

  // Get examples for step 2
  const examples = answerType === "local biz" ? localBizExamples : jobTitleExamples;

  return (
    <motion.div
      key={`search-step-two-${answerType}-${brainstorm}`}
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
        onClick={() => handleBack(0)}
        className="absolute -left-10 top-1 text-neutral-400 hover:text-white focus:outline-none"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </button>

      {/* heading */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`heading-${answerType}-${brainstorm}`}
          className={`flex flex-col items-center gap-2 mb-4 relative z-0 ${
            answerType === "people" && !brainstorm ? "-mt-28" : ""
          }`}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {answerType === "people" && brainstorm && (
            <p className="absolute -top-6 left-1/2 -translate-x-1/2 text-center text-sm text-neutral-400">
              Brainstorm job titles
            </p>
          )}
          <div className="w-full flex justify-center">
            <h1 className="text-3xl sm:text-2xl font-medium">
              {getHeadingText()}
              {answerType === "people" && !brainstorm && (
                <span className="text-neutral-500">(s)</span>
              )}
            </h1>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* toggle switch for brainstorm mode */}
      {answerType === "people" && !showSuggestions && !isProcessing && !brainstormQuery && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`absolute right-0 bottom-16 ${
            brainstorm && shouldAdjustPadding ? "pb-0" : "pb-2"
          } z-10 flex flex-col items-center gap-1`}
        >
          <ToggleSwitch
            value={brainstorm}
            onChange={handleBrainstormToggle}
          />
          <span className="text-[10px] text-neutral-400">brainstorm</span>
        </motion.div>
      )}

      {/* form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(1);
        }}
        className="rounded-3xl bg-[#303030] shadow-sm relative"
      >
        <div className="flex flex-col px-4 py-2">
          <div className="flex items-center flex-wrap gap-2">
            {/* People badges */}
            {answerType === "people" && !brainstorm &&
              selectedExamples.map((example, index) => (
                <Badge
                  key={index}
                  onRemove={() => handleBadgeRemove(index)}
                >
                  {example}
                </Badge>
              ))}

            {/* Brainstorm examples */}
            {answerType === "people" && brainstorm && !showSuggestions &&
              brainstormExamples.map((example, index) => (
                <Badge
                  key={index}
                  onRemove={() => handleBadgeRemove(index, true)}
                >
                  {example}
                </Badge>
              ))}

            {/* Local biz badges */}
            {answerType === "local biz" &&
              selectedExamples.map((example, index) => (
                <Badge
                  key={index}
                  onRemove={() => handleBadgeRemove(index)}
                >
                  {example}
                </Badge>
              ))}
            
            {/* Text input */}
            {(!brainstorm || (brainstorm && !showSuggestions)) && (
              <>
                <textarea
                  ref={textareaRef}
                  rows={2}
                  placeholder={`Add ${answerType === "people" ? (brainstorm ? "keywords" : "job titles") : "business types"}`}
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 ml-2 resize-none overflow-hidden bg-transparent placeholder:text-neutral-400 text-sm leading-6 outline-none min-w-[160px]"
                />

                {/* Auto-suggestion display */}
                {suggestActive && suggestion && (
                  <div 
                    className="absolute text-neutral-500 pointer-events-none"
                    style={{
                      left: `${textareaRef.current?.value.length * 8}px`,
                      top: `${textareaRef.current?.offsetTop}px`
                    }}
                  >
                    {suggestion}
                  </div>
                )}
              </>
            )}

            {/* Brainstorm keywords */}
            {brainstorm && showSuggestions && (
              <div className="w-full ml-2 mt-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedKeywords.map((keyword, idx) => (
                    <Badge
                      key={idx}
                      onRemove={() => handleKeywordRemove(idx)}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2 items-center">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="Add keywords to see suggestions..."
                    value={brainstormQuery}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 resize-none overflow-hidden bg-transparent placeholder:text-neutral-400 text-sm leading-6 outline-none"
                  />
                </div>
                
                {/* Suggestions grid */}
                {isProcessing ? (
                  <div className="mt-3 text-sm text-neutral-400 w-full flex items-center justify-center">
                    <span className="inline-flex">
                      Loading
                      <span className="ml-1">
                        <span className="wave-dot">.</span>
                        <span className="wave-dot">.</span>
                        <span className="wave-dot">.</span>
                      </span>
                    </span>
                  </div>
                ) : brainstormSuggestions.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                    {brainstormSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="text-left px-2 py-1 text-sm text-neutral-300 hover:bg-[#3a3a3a] rounded transition-colors truncate"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-neutral-400">
                    Add keywords to see suggestions
                  </div>
                )}
              </div>
            )}
            
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

      {/* Examples */}
      {showExamples && !showSuggestions && examples.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3"
        >
          <div className="flex justify-between items-center text-xs text-neutral-500 mb-1">
            <span>examples</span>
            <button
              type="button"
              onClick={() => setShowExamples(false)}
              className="text-neutral-500 hover:text-neutral-300"
            >
              hide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {examples.slice(0, 6).map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="px-2 py-1 bg-[#2b2b2b] hover:bg-[#3a3a3a] rounded-full text-sm text-neutral-400 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default SearchStepTwo; 