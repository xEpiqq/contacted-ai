"use client";

import React, { useRef, useEffect, useState } from "react";
import { useSearchContext } from "../context/SearchContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpIcon } from "@heroicons/react/24/outline";
import { FileUp, Table, MoreHorizontal, Chrome, Gem } from "lucide-react";
import ManualSearchClone from "../layout/ManualSearchClone";

function SearchStepOne({ text, setText, canProceed, handleSubmit, proceedStep0, onAiStatusChange, onAiProcessingChange, onResultsCountChange}) {

const { setExportsDrawerOpen, setDrawerOpen, setCreditsScreenOpen, isExtensionLoading, setIsExtensionLoading, setToastConfig, setManualMode, setPendingSearchFilters, fetchSearchResults } = useSearchContext();

  // AI state management
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isVerifyingTitles, setIsVerifyingTitles] = useState(false);
  const [recommendedDatabase, setRecommendedDatabase] = useState(null);
  const [actualDatabase, setActualDatabase] = useState("usa4_new_v2");
  const [exampleQueries] = useState(["software engineers in fintech", "marketing directors", "healthcare professionals in Boston", "data scientists with AI experience"]);
  const textareaRef = useRef(null);
  const plusButtonRef = useRef(null);
  // Flag to ensure default search only runs once
  const hasAutoSearchRun = useRef(false);
  const [showPlusOptions, setShowPlusOptions] = React.useState(false);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canProceed) {
        handleStep0Submit(e);
      }
    }
  }

  async function handleAISubmit(textToSubmit) {
    const submissionText = textToSubmit || text;
    if (!submissionText.trim() || isLoading) return;
    setIsLoading(true);
    setApiResults(null);
    setApiError(null);
    if (onAiProcessingChange) onAiProcessingChange(true);
    if (onAiStatusChange) onAiStatusChange("Thinking...");

    try {
      // Call our consolidated API endpoint
      const response = await fetch('/api/ai/test-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: submissionText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      if (data.recommendedDatabase) {
        setRecommendedDatabase(data.recommendedDatabase);
      }
      if (data.actualDatabase) {
        setActualDatabase(data.actualDatabase);
      }
      setApiResults(data);
      setIsVerifyingTitles(false);
      // Results view removed; stay on search view.
    } catch (error) {
      console.error("API call failed:", error);
      setApiError(error.message);
      if (onAiStatusChange) onAiStatusChange("Search");
    } finally {
      setIsLoading(false);
      if (onAiProcessingChange) onAiProcessingChange(false);
    }
  }

  // Handle form submission for step 0
  function handleStep0Submit(e) {
    e.preventDefault();
    if (!canProceed) return;
    if (text.trim()) {
      handleAISubmit(text.trim());
    }
  }
  
  // Handle text changes
  function handleTextChange(e) {
    const newText = e.target.value;
    setText(newText);
    setApiResults(null);
    setApiError(null);  
    setRecommendedDatabase(null);
  }

  // Use an example query
  function useExample(example) {
    setText(example);
    setApiResults(null);
    setApiError(null);
    setRecommendedDatabase(null);
    textareaRef.current?.focus();
  }

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



  return (
    <>
      {apiResults ? (
        <div className="fixed inset-0 p-4 pt-20 overflow-auto bg-[#212121]">
              <ManualSearchClone 
                aiResults={apiResults}
                recommendedDatabase={recommendedDatabase || actualDatabase}
                onResultsCountChange={onResultsCountChange}
            onBack={() => setApiResults(null)}
          />
        </div>
      ) : (
          <motion.div
            key="search-view"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-[690px]"
          >
            {/* heading */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <p className="text-neutral-400 text-sm text-center">
              270,394,457 contacts
              </p>
              <div className="w-full flex justify-center">
                <h1 className="text-3xl sm:text-2xl font-medium">
                  Generate leads now...
                </h1>
              </div>
            </div>

            {/* form */}
            <form
              onSubmit={handleStep0Submit}
              className="rounded-3xl bg-[#303030] shadow-sm relative"
            >
              <div className="flex flex-col px-4 py-2">
                <div className="flex items-center flex-wrap gap-2">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                  placeholder="Describe your target audience"
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 ml-2 resize-none overflow-hidden bg-transparent placeholder:text-neutral-400 text-sm leading-6 outline-none"
                    disabled={isLoading}
                  />
                  
                  <button
                    type="submit"
                    disabled={!canProceed || isLoading}
                    className={`ml-2 h-9 w-9 flex items-center justify-center rounded-full transition-all ${
                      isLoading 
                        ? "bg-neutral-600 text-white cursor-wait opacity-80"
                        : canProceed
                        ? "bg-white text-black hover:opacity-90"
                        : "bg-neutral-600 text-white cursor-not-allowed opacity-60"
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    ) : (
                      <ArrowUpIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* ChatGPT-style buttons - for step 1 */}
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
                    className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2"
                    data-tooltip="Switch to manual mode"
                    onClick={() => {
                      setManualMode(true);
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-filter"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>
                    <span>Manual</span>
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
                                  onClick={() => {
                                    setCreditsScreenOpen(true);
                                    setShowPlusOptions(false);
                                  }}
                                  className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2 whitespace-nowrap"
                                  data-tooltip="Purchase credits"
                                >
                                  <Gem className="h-4 w-4" />
                                  <span>Get Credits</span>
                                </button>
                                <button 
                                  className={`tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2 whitespace-nowrap ${isExtensionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                  data-tooltip="Install Chrome extension"
                                  onClick={() => {
                                    if (isExtensionLoading) return;
                                    setIsExtensionLoading(true);
                                    // Use a timeout to ensure the loading state is visible
                                    setTimeout(() => {
                                      window.location.href = "/api/chrome-extension";
                                      // Show toast notification with new config approach
                                      setToastConfig({
                                        headerText: "Chrome Extension Download Started",
                                        subText: "Unzip the file and follow the installation instructions",
                                        color: "green"
                                      });
                                      // Hide toast after 5 seconds
                                      setTimeout(() => setToastConfig(null), 5000);
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
              </div>
            </form>
            
            {!isLoading && !apiResults && !apiError && (
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {exampleQueries.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => useExample(suggestion)}
                    className="px-3 py-2 text-sm text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-700/60 border border-neutral-600/30 hover:border-neutral-500/50 rounded-full transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
    </>
  );
}

export default SearchStepOne; 