"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpIcon, ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { BadgeButton } from "@/components/badge";

// Internal Badge component for the comma-separated bubbles
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

// Internal ToggleSwitch component
function ToggleSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      aria-label="toggle brainstorm mode"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        value ? "bg-green-500" : "bg-gray-500/50"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          value ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// Sample data for job titles and business types
export const jobTitleExamples = [
  "owner",
  "president",
  "teacher",
  "manager",
  "chief executive officer",
  "project manager",
  "registered nurse",
  "vice president",
  "office manager",
  "director",
  "administrative assistant",
  "realtor",
  "general manager",
  "partner",
  "principal",
  "sales",
  "consultant",
  "account manager",
  "attorney",
  "software engineer",
  "executive director",
  "operations manager",
  "account executive",
  "sales manager",
  "sales representative",
  "founder",
  "associate",
  "executive assistant",
  "supervisor",
  "chief financial officer",
  

];

export const localBizExamples = [
  "local coffee shop",
  "family-owned bakery",
  "neighborhood gym",
  "downtown florist",
  "independent bookstore",
  "pet grooming salon",
];

// Badge color options - matching pageeee.jsx
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
  // Local state for brainstorming
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [brainstormSuggestions, setBrainstormSuggestions] = useState([]);
  const [brainstormQuery, setBrainstormQuery] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [shouldAdjustPadding, setShouldAdjustPadding] = useState(false);
  
  // Local state for suggestions
  const [suggestion, setSuggestion] = useState("");
  const [suggestActive, setSuggestActive] = useState(false);

  // References
  const textareaRef = useRef(null);

  // Local heading text based on answer type and brainstorm mode
  const getHeadingText = () => {
    if (answerType === "people") {
      return brainstorm ? "Brainstorm Job Titles" : "Job Title";
    } else {
      return "Describe the local biz you're looking for";
    }
  };

  // Handle keyword selection from suggestions
  const handleSuggestionSelect = (suggestion) => {
    if (!selectedKeywords.includes(suggestion)) {
      setSelectedKeywords(prev => [...prev, suggestion]);
    }
  };

  // Handle keyword removal
  const handleKeywordRemove = (idx) => {
    setSelectedKeywords(prev => prev.filter((_, i) => i !== idx));
  };

  // Simulate fetching brainstorm suggestions
  const fetchBrainstormSuggestions = (query) => {
    if (!query || !query.trim()) return;
    
    setIsProcessing(true);
    setShowSuggestions(false);
    
    // Simulate API call delay
    setTimeout(() => {
      let mockSuggestions = [];
      
      // Simple keyword-based suggestion logic
      if (query.toLowerCase().includes("software") || 
          query.toLowerCase().includes("app") || 
          query.toLowerCase().includes("tech")) {
        mockSuggestions = [
          "Software Engineer",
          "Product Manager",
          "CTO",
          "Technical Lead",
          "QA Manager",
        ];
      } else if (query.toLowerCase().includes("marketing") || 
                query.toLowerCase().includes("ads") || 
                query.toLowerCase().includes("brand")) {
        mockSuggestions = [
          "Marketing Director",
          "Brand Manager",
          "Social Media Specialist",
          "SEO Expert",
          "Content Strategist",
        ];
      } else if (query.toLowerCase().includes("finance") || 
                query.toLowerCase().includes("accounting") || 
                query.toLowerCase().includes("money")) {
        mockSuggestions = [
          "CFO",
          "Financial Analyst",
          "Accounting Manager",
          "Controller",
          "Investment Advisor",
        ];
      } else {
        mockSuggestions = [
          "CEO",
          "Operations Manager",
          "Department Head",
          "Director of Sales",
          "HR Manager",
        ];
      }
      
      setBrainstormSuggestions(mockSuggestions);
      setIsProcessing(false);
      setShowSuggestions(true);
    }, 1500);
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
      
      if (brainstorm && !showSuggestions && text.trim()) {
        // Process brainstorm query on Enter when in brainstorm mode and not showing suggestions
        setBrainstormQuery(text.trim());
        fetchBrainstormSuggestions(text.trim());
        setText("");
        return;
      }
      
      if (canProceed && !brainstorm) {
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
    
    // Step 2 job titles (people)
    if (answerType === "people") {
      if (newText.endsWith(",")) {
        const keyword = newText.slice(0, -1).trim();
        if (keyword) {
          if (brainstorm) {
            handleExampleClick(keyword, true);
          } else {
            handleExampleClick(keyword);
          }
          setText("");
        }
        return;
      }
    }
    
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
  
  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (brainstorm && !showSuggestions && !isProcessing && text.trim()) {
      // When in brainstorm mode and text is entered, process for suggestions
      setBrainstormQuery(text.trim());
      fetchBrainstormSuggestions(text.trim());
      setText("");
      return;
    }
    
    // Only proceed to next step if not in brainstorm mode or if no text entered
    if (!brainstorm) {
      handleSubmit(1);
    }
  };
  
  // Handle toggle to brainstorm mode
  const localHandleBrainstormToggle = (value) => {
    setShouldAdjustPadding(value);
    if (!value) {
      // If turning off brainstorm mode
      setShowSuggestions(false);
      setBrainstormSuggestions([]);
      setSelectedKeywords([]);
      setBrainstormQuery("");
    }
    handleBrainstormToggle(value);
  };

  // Auto-grow textarea height
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [text]);

  // Auto-focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [brainstorm]);

  // Handle next step button click in brainstorm mode
  const handleNextStep = () => {
    // Add selected keywords to brainstormExamples
    if (selectedKeywords.length > 0) {
      // Instead of using setBrainstormExamples directly, use handleExampleClick for each keyword
      selectedKeywords.forEach(keyword => {
        handleExampleClick(keyword, true);
      });
      setSelectedKeywords([]);
      setShowSuggestions(false);
      setBrainstormSuggestions([]);
      handleSubmit(1);
    }
  };

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
          <div className="w-full flex justify-center relative">
            <h1 className="text-3xl sm:text-2xl font-medium">
              {getHeadingText()}
              {answerType === "people" && !brainstorm && (
                <span className="text-neutral-500">(s)</span>
              )}
            </h1>
            
            {/* toggle switch for brainstorm mode */}
            {answerType === "people" && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <ToggleSwitch
                  value={brainstorm}
                  onChange={localHandleBrainstormToggle}
                />
                <span className="text-[10px] text-neutral-400 mt-1">brainstorm</span>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* form */}
      <form
        onSubmit={handleFormSubmit}
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
            {answerType === "people" && brainstorm && !showSuggestions && !isProcessing &&
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
            {(!brainstorm || (brainstorm && !showSuggestions && !isProcessing)) && (
              <>
                <textarea
                  ref={textareaRef}
                  rows={2}
                  placeholder={brainstorm ? "I sell commercial window cleaning services..." : `Add ${answerType === "people" ? "job titles" : "business types"}`}
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
            
            {/* Submit button - Moved to the end of container for right alignment */}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={(!canProceed && !brainstorm) || (brainstorm && !text.trim() && !showSuggestions && !isProcessing)}
                className={`h-9 w-9 flex items-center justify-center rounded-full transition-opacity ${
                  (canProceed && !brainstorm) || (brainstorm && text.trim()) || (brainstorm && (showSuggestions || isProcessing))
                    ? "bg-white text-black hover:opacity-90"
                    : "bg-neutral-600 text-white cursor-not-allowed opacity-60"
                }`}
              >
                <ArrowUpIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Brainstorm processing indicator */}
      <AnimatePresence mode="wait">
        {brainstorm && isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4 flex flex-col items-center"
          >
            <div className="flex gap-2 items-center">
              <div className="relative w-5 h-5">
                <div className="absolute inset-0 rounded-full border-2 border-gray-400 border-t-white animate-spin"></div>
              </div>
              <p className="text-sm text-neutral-300">Thinking...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Container for brainstorm suggestions & selected boxes */}
      <AnimatePresence>
        {brainstorm && !isProcessing && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4 w-full space-y-4"
          >
            {/* Suggestions box */}
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-medium">
                  Suggestions based on your input
                </h3>
                <button
                  onClick={() => {
                    setBrainstormSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="text-neutral-400 hover:text-white"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>

              {brainstormSuggestions.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {brainstormSuggestions.map((suggestion, i) => (
                    <motion.button
                      key={suggestion}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        transition: { delay: i * 0.05 },
                      }}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md bg-[#333333] hover:bg-[#3a3a3a] text-left transition-colors text-xs"
                    >
                      <span className="text-sm truncate mr-1">{suggestion}</span>
                      <span className="text-green-400 text-xs flex-shrink-0">+</span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="py-2 text-center">
                  <p className="text-xs text-neutral-500 italic">
                    No suggestions found. Try being more specific about
                    your target audience.
                  </p>
                </div>
              )}

              {brainstormSuggestions.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[#404040] text-center">
                  <p className="text-xs text-neutral-400">
                    Not seeing what you want? Try being more specific.
                  </p>
                </div>
              )}
            </div>

            {/* Selected job titles box */}
            <div className="bg-[#252525] border border-[#404040] rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-medium text-white">
                  Selected Job Titles
                </h3>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[40px] bg-[#2b2b2b] p-2 rounded-md relative">
                {selectedKeywords.map((keyword, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-900/30 text-xs text-green-400 border border-green-800/50"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleKeywordRemove(index)}
                      className="text-green-400 hover:text-white ml-0.5"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {selectedKeywords.length === 0 && (
                  <p className="text-xs text-neutral-500 italic">
                    No job titles selected yet
                  </p>
                )}
                <button
                  onClick={handleNextStep}
                  disabled={selectedKeywords.length === 0}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                    selectedKeywords.length > 0
                      ? "bg-neutral-600 hover:bg-neutral-500"
                      : "bg-neutral-700 cursor-not-allowed opacity-50"
                  }`}
                >
                  <span>Next Step</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Examples section */}
      {showExamples && !brainstorm && examples.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3"
        >
          <div className="flex flex-wrap gap-2 mb-2">
            {examples
              .filter(example => {
                // Filter out examples that are already selected
                const isSelected = brainstorm
                  ? brainstormExamples.includes(example)
                  : selectedExamples.includes(example);
                return !isSelected;
              })
              .map((example, idx) => (
                <BadgeButton
                  key={idx}
                  color={badgeColors[idx % badgeColors.length]}
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </BadgeButton>
              ))}
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowExamples(false)}
              className="text-xs text-neutral-400 hover:text-neutral-300"
            >
              hide examples
            </button>
          </div>
        </motion.div>
      )}

      {/* Show examples button (when hidden) */}
      {!showExamples && !brainstorm && (
        <motion.div layout className="mt-2 text-right">
          <button
            type="button"
            onClick={() => setShowExamples(true)}
            className="text-xs text-neutral-400 hover:text-neutral-300"
          >
            show examples
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default SearchStepTwo; 