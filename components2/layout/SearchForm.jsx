"use client";

import React, { useRef, useEffect } from "react";
import { useSearchContext } from "../context/SearchContext";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpIcon, ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FileUp, Table, Chrome, MoreHorizontal, ListFilter } from "lucide-react";
import Badge from "../elements/Badge";
import BadgeButton from "../elements/BadgeButton";
import ToggleSwitch from "../elements/ToggleSwitch";
import { badgeColors, jobTitleExamples, localBizExamples, industryExamples } from "../core/utils";

function SearchForm() {
  const {
    currentStep,
    answerType,
    text,
    setText,
    displayedText,
    hasText,
    hasBadges,
    canProceed,
    suggestion,
    suggestActive,
    setSuggestActive,
    headingText,
    handleSubmit,
    handleBack,
    handleBrainstormToggle,
    handleTextChange,
    handleKeyDown,
    handleExampleClick,
    handleBadgeRemove,
    guideOpen,
    setGuideOpen,
    brainstorm,
    shouldAdjustPadding,
    showExamples,
    setShowExamples,
    showIndustryExamples,
    setShowIndustryExamples,
    selectedExamples,
    brainstormExamples,
    selectedIndustries,
    isProcessing,
    showSuggestions,
    brainstormSuggestions,
    brainstormQuery,
    selectedKeywords,
    handleSuggestionSelect,
    handleKeywordRemove,
    handleNextStep,
    words,
    setDrawerOpen,
    setExportsDrawerOpen,
    setCreditsScreenOpen,
    setManualMode,
    setPendingSearchFilters,
    showUserDropdown,
    isExtensionLoading,
    setIsExtensionLoading,
    setShowExtensionToast,
    fetchSearchResults
  } = useSearchContext();

  // References
  const textareaRef = useRef(null);
  const plusButtonRef = useRef(null);
  const [showPlusOptions, setShowPlusOptions] = React.useState(false);

  // Auto-grow textarea height
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [text]);

  // Auto-focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (plusButtonRef.current && !plusButtonRef.current.contains(event.target)) {
        setShowPlusOptions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [plusButtonRef]);

  // Get examples for the current step
  let examples = [];
  if (currentStep === 1) {
    examples = answerType === "local biz" ? localBizExamples : jobTitleExamples;
  } else if (currentStep === 2) {
    examples = industryExamples;
  }

  // Determine heading key for animations
  const headingKey = `${headingText}-${answerType}-${currentStep}-${brainstorm}`;

  return (
    <div className="w-full max-w-[690px] relative">
      {/* back arrow */}
      {currentStep > 0 && (
        <button
          type="button"
          aria-label="back"
          onClick={() => handleBack(currentStep - 1)}
          className="absolute -left-10 top-1 text-neutral-400 hover:text-white focus:outline-none"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      )}

      {/* heading */}
      <AnimatePresence mode="wait">
        <motion.div
          key={headingKey}
          className={`flex flex-col items-center gap-2 mb-4 relative z-0 ${
            currentStep === 1
              && answerType === "people"
              && !brainstorm
                ? "-mt-28"
                : ""
          }`}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onAnimationComplete={() => {
            if ((brainstorm && !shouldAdjustPadding) || (!brainstorm && shouldAdjustPadding)) {
              setShouldAdjustPadding && setShouldAdjustPadding(brainstorm);
            }
          }}
        >
          {currentStep === 0 && (
            <p className="absolute -top-6 left-1/2 -translate-x-1/2 text-center text-sm text-neutral-400">
              build a list of...
            </p>
          )}
          {currentStep === 1 &&
            answerType === "people" &&
            brainstorm && (
              <p className="absolute -top-6 left-1/2 -translate-x-1/2 text-center text-sm text-neutral-400">
                Brainstorm job titles
              </p>
            )}
          {currentStep === 2 && (
            <p className="absolute -top-6 left-1/2 -translate-x-1/2 text-center text-sm text-neutral-400">
              Add industries
            </p>
          )}
          {currentStep < 3 && (
            <div className="w-full flex justify-center">
              <h1 className="text-3xl sm:text-2xl font-medium">
                {headingText}
                {currentStep === 1 &&
                  answerType === "people" &&
                  !brainstorm && (
                    <span className="text-neutral-500">(s)</span>
                  )}
              </h1>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* toggle switch */}
      {currentStep === 1 &&
        answerType === "people" &&
        !showSuggestions &&
        !isProcessing &&
        !brainstormQuery && (
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
          handleSubmit(currentStep);
        }}
        className="rounded-3xl bg-[#303030] shadow-sm relative"
      >
        <div className="flex flex-col px-4 py-2">
          <div className="flex items-center flex-wrap gap-2">
            {/* STEP 0: Build a list of... */}
            {currentStep === 0 && (
              <>
                <textarea
                  ref={textareaRef}
                  rows={2}
                  placeholder={displayedText}
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 ml-2 resize-none overflow-hidden bg-transparent placeholder:text-neutral-400 text-sm leading-6 outline-none"
                />
                
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
              </>
            )}
            
            {/* STEP 1: PEOPLE or LOCAL BIZ badges */}
            {currentStep === 1 && answerType === "people" && !brainstorm &&
              selectedExamples.map((example, index) => (
                <Badge
                  key={index}
                  onRemove={() => handleBadgeRemove(index)}
                >
                  {example}
                </Badge>
              ))}

            {currentStep === 1 && answerType === "people" && brainstorm && !showSuggestions &&
              brainstormExamples.map((example, index) => (
                <Badge
                  key={index}
                  onRemove={() => handleBadgeRemove(index)}
                >
                  {example}
                </Badge>
              ))}

            {/* STEP 2: Industry badges */}
            {currentStep === 2 &&
              selectedIndustries.map((ind, idx) => (
                <Badge
                  key={idx}
                  onRemove={() => handleBadgeRemove(idx)}
                >
                  {ind}
                </Badge>
              ))}

            {/* Step 1 & 2 common textarea */}
            {currentStep > 0 && (
              <>
                <textarea
                  ref={textareaRef}
                  rows={2}
                  placeholder={
                    currentStep === 1 && brainstorm
                      ? "i sell commercial window cleaning services..."
                      : currentStep === 2
                      ? "software, healthcare..."
                      : ""
                  }
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 ml-2 resize-none overflow-hidden bg-transparent placeholder:text-neutral-400 text-sm leading-6 outline-none"
                />

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
              </>
            )}
          </div>

          {/* ChatGPT-style buttons - only show on step 0 */}
          {currentStep === 0 && (
            <div className="flex items-center justify-start gap-2 mt-2 px-2 pt-2 border-t border-neutral-600/30">
              <button 
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2"
                data-tooltip="Enrich your data"
              >
                <FileUp className="h-4 w-4" />
                <span>Enrich</span>
              </button>
              <button 
                type="button"
                onClick={() => setExportsDrawerOpen(true)}
                className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2"
                data-tooltip="View your exports"
              >
                <Table className="h-4 w-4" />
                <span>Exports</span>
              </button>
              <button 
                type="button"
                onClick={() => setCreditsScreenOpen(true)}
                className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2"
                data-tooltip="Purchase credits"
              >
                <ListFilter className="h-4 w-4" />
                <span>Get Credits</span>
              </button>
              <div className="relative" ref={plusButtonRef}>
                <div className="flex items-center">
                  {/* Sliding glass door container that includes the button */}
                  <div className="overflow-hidden">
                    <motion.div 
                      className="flex items-center gap-2"
                      initial={{ width: 48 }} /* Initial width to show just the button */
                      animate={{ width: showPlusOptions ? 'auto' : 48 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      {/* Buttons revealed when sliding */}
                      <AnimatePresence mode="wait">
                        {showPlusOptions && (
                          <motion.div 
                            className="flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <button 
                              type="button"
                              className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2 whitespace-nowrap"
                              data-tooltip="Switch to manual mode"
                              onClick={() => {
                                setManualMode(true);
                                setShowPlusOptions(false);
                                // Add an initial empty filter
                                setPendingSearchFilters([{
                                  column: "",
                                  condition: "contains",
                                  tokens: [],
                                  pendingText: "",
                                  subop: ""
                                }]);
                                // Fetch initial results with no filters
                                fetchSearchResults(0);
                              }}
                            >
                              <ListFilter className="h-4 w-4" />
                              <span>Manual</span>
                            </button>
                            <button 
                              type="button"
                              className={`tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2 whitespace-nowrap ${isExtensionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                              data-tooltip="Install Chrome extension"
                              onClick={() => {
                                if (isExtensionLoading) return;
                                setIsExtensionLoading(true);
                                // Use a timeout to ensure the loading state is visible
                                setTimeout(() => {
                                  window.location.href = "/api/chrome-extension";
                                  // Show toast notification
                                  setShowExtensionToast(true);
                                  // Hide toast after 5 seconds
                                  setTimeout(() => setShowExtensionToast(false), 5000);
                                  // Reset loading state after a delay
                                  setTimeout(() => setIsExtensionLoading(false), 2000);
                                }, 300);
                              }}
                              disabled={isExtensionLoading}
                            >
                              {isExtensionLoading ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1"></div>
                              ) : (
                              <Chrome className="h-4 w-4" />
                              )}
                              <span>{isExtensionLoading ? "Downloading..." : "Extension"}</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Button that triggers the slide and moves with it */}
                      <button 
                        type="button"
                        onClick={() => setShowPlusOptions(!showPlusOptions)}
                        className="h-9 w-9 rounded-full flex items-center justify-center text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors ml-1"
                      >
                        {showPlusOptions ? (
                          <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 2L3 7L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* dropdown for step 0 suggestions */}
          <AnimatePresence>
            {currentStep === 0 && suggestion && (
              <motion.ul
                className="absolute left-0 top-full w-full mt-1 rounded-2xl bg-[#2b2b2b] border border-[#404040] overflow-hidden"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <li
                  className={`px-4 py-2 text-sm cursor-pointer select-none ${
                    suggestActive
                      ? "bg-[#3a3a3a]"
                      : "hover:bg-[#3a3a3a]"
                  }`}
                  onMouseEnter={() => setSuggestActive(true)}
                  onMouseLeave={() => setSuggestActive(false)}
                  onClick={() => handleNextStep(suggestion)}
                >
                  {suggestion}
                </li>
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* database size indicator - only visible on step 0 */}
      {currentStep === 0 && (
        <div className="text-right mt-1">
          <span className="text-xs text-neutral-600">270,394,457 contacts</span>
        </div>
      )}

      {/* STEP 0: Select people or local biz from icons on main search page */}
      {currentStep === 0 && !text.trim() && (
        <motion.div
          key="step-0-icons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center mt-6"
        >
          <div className="flex gap-5">
            {words.map((word, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setText("");
                  handleNextStep(word);
                }}
                className="flex flex-col items-center gap-3 py-5 px-12 rounded-xl bg-[#2b2b2b] hover:bg-[#303030] transition-colors group"
              >
                <div className={`h-16 w-16 flex items-center justify-center rounded-full ${
                  i === 0 ? "bg-blue-700/20" : "bg-orange-700/20"
                }`}>
                  <span className={`text-4xl ${
                    i === 0 ? "text-blue-400" : "text-orange-400"
                  }`}>
                    {i === 0 ? "👤" : "🏪"}
                  </span>
                </div>
                <span className="text-neutral-400 group-hover:text-white text-lg transition-colors">
                  {word}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Brainstorm processing indicator */}
      <AnimatePresence mode="wait">
        {currentStep === 1 &&
          brainstorm &&
          isProcessing && (
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

      {/* Container for brainstorm suggestion & selected boxes */}
      <AnimatePresence>
        {currentStep === 1 &&
          brainstorm &&
          !isProcessing &&
          brainstormQuery && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mt-4 w-full space-y-3"
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
                        <span className="text-sm">{suggestion}</span>
                        <span className="text-green-400 text-xs">+</span>
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
                        ? "bg-neutral-600 hover:bg-neutral-600"
                        : "bg-neutral-700 cursor-not-allowed"
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

      {/* examples list */}
      <AnimatePresence>
        {(currentStep === 1 || currentStep === 2) &&
          (currentStep === 1 ? showExamples : showIndustryExamples) &&
          !brainstorm && (
            <motion.div
              className="absolute top-full left-0 mt-2 w-[calc(100%+32px)] -translate-x-4 max-w-[calc(690px+32px)] flex flex-wrap gap-2 z-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {examples
                .filter((ex) =>
                  currentStep === 1
                    ? !selectedExamples.includes(ex)
                    : !selectedIndustries.includes(ex)
                )
                .map((ex, i) => (
                  <div key={ex}>
                    <BadgeButton
                      color={badgeColors[i % badgeColors.length]}
                      onClick={() => handleExampleClick(ex)}
                    >
                      {ex}
                    </BadgeButton>
                  </div>
                ))}
              <div className="w-full mt-2">
                <button
                  type="button"
                  onClick={() =>
                    currentStep === 1
                      ? setShowExamples(false)
                      : setShowIndustryExamples(false)
                  }
                  className="text-xs text-neutral-400 hover:underline"
                >
                  hide examples
                </button>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* toggle examples */}
      {currentStep === 1 && !brainstorm && !showExamples && (
        <motion.div layout className="mt-2">
          <button
            type="button"
            onClick={() => setShowExamples(true)}
            className="text-xs text-neutral-400 hover:underline"
          >
            see examples
          </button>
        </motion.div>
      )}

      {currentStep === 2 && !showIndustryExamples && (
        <motion.div layout className="mt-2">
          <button
            type="button"
            onClick={() => setShowIndustryExamples(true)}
            className="text-xs text-neutral-400 hover:underline"
          >
            see examples
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default SearchForm; 