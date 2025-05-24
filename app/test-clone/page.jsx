"use client";

import React, { useRef, useEffect, useState } from "react";
import { 
  ArrowUpIcon
} from "@heroicons/react/24/outline";
import { 
  FileUp, 
  Table, 
  MoreHorizontal, 
  Chrome, 
  Gem,
  ChevronDown,
  ArrowLeft
} from "lucide-react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import ManualSearchClone from "@/components2/layout/ManualSearchClone";

function SearchForm() {
  const [text, setText] = useState("");
  const [canProceed, setCanProceed] = useState(false);
  const [showPlusOptions, setShowPlusOptions] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isVerifyingTitles, setIsVerifyingTitles] = useState(false);
  const [processingTime, setProcessingTime] = useState(null);
  const processStartTimeRef = useRef(null);
  
  // State for fixed example queries
  const [exampleQueries] = useState([
    "software engineers in fintech",
    "marketing directors",
    "healthcare professionals in Boston",
    "data scientists with AI experience"
  ]);

  // State for database selection
  const [recommendedDatabase, setRecommendedDatabase] = useState(null);
  const [actualDatabase, setActualDatabase] = useState("usa4_new_v2");

  const textareaRef = useRef(null);
  const plusButtonRef = useRef(null);
  
  useEffect(() => {
    setCanProceed(text.trim().length > 0);
  }, [text]);
  
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setApiResults(null); // Clear previous results when text changes
    setApiError(null);   // Clear previous errors when text changes
    // Reset follow-up state when text changes
    setRecommendedDatabase(null);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canProceed) {
        handleFormSubmit(e);
      }
    }
  };
  
  // Use an example query
  const useExample = (example) => {
    setText(example);
    
    // Clear any previous state when using examples
    setApiResults(null);
    setApiError(null);
    setRecommendedDatabase(null);
    
    // Focus the textarea
    textareaRef.current?.focus();
  };
  
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canProceed || isLoading) return;
    
    setIsLoading(true);
    setApiResults(null);
    setApiError(null);
    setProcessingTime(null);
    setRecommendedDatabase(null);
    setActualDatabase("usa4_new_v2");
    
    // Start the timer
    processStartTimeRef.current = Date.now();

    try {
      // Call our consolidated API endpoint
      const response = await fetch('/api/ai/test-clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          description: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      
      // Store database recommendation if available
      if (data.recommendedDatabase) {
        setRecommendedDatabase(data.recommendedDatabase);
      }
      
      // Store actual database being used
      if (data.actualDatabase) {
        setActualDatabase(data.actualDatabase);
      }
      
      setApiResults(data);
      
      // Set verifying titles to false when done
      setIsVerifyingTitles(false);
      
      // Calculate and set the processing time
      if (processStartTimeRef.current) {
        const endTime = Date.now();
        const timeInSeconds = ((endTime - processStartTimeRef.current) / 1000).toFixed(2);
        setProcessingTime(timeInSeconds);
      }
      
    } catch (error) {
      console.error("API call failed:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to format large numbers
  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count;
  };

  // Use a suggestion
  const useSuggestion = (suggestion) => {
    setText(suggestion);
    
    // Focus the textarea
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [text]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);
  
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
    <div
      className="w-full max-w-[690px] text-white"
    >
      <div className="flex flex-col items-center gap-2 mb-4">
        <p className="text-neutral-400 text-sm text-center">
          AI-Powered Audience Targeting
        </p>
        <div className="w-full flex justify-center">
          <h1 className="text-3xl sm:text-2xl font-medium text-white">
            Describe your target audience
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleFormSubmit}
        className="rounded-3xl bg-[#303030] shadow-sm relative"
      >
        <div className="flex flex-col px-4 py-2">
          <div className="flex items-center flex-wrap gap-2 relative">
            <div className="flex-1 ml-2 relative">
              <textarea
                ref={textareaRef}
                rows={1} // Start with 1 row, will auto-grow
                placeholder="People who own a marketing agency in california..."
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                className="w-full resize-none overflow-hidden bg-transparent placeholder:text-neutral-500 text-sm leading-6 outline-none text-white"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={!canProceed || isLoading}
              className={`ml-2 h-9 w-9 flex items-center justify-center rounded-full transition-all ${
                isLoading 
                  ? "bg-neutral-600 text-white cursor-wait opacity-80 rotate-anim"
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

          <div className="flex items-center justify-start gap-2 mt-2 px-2 pt-2 border-t border-neutral-600/30">
            <button 
              type="button"
              className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2"
              data-tooltip="Enrich your data (placeholder)"
            >
              <FileUp className="h-4 w-4" />
              <span>Enrich</span>
            </button>
            <button 
              type="button"
              className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2"
              data-tooltip="View your exports (placeholder)"
            >
              <Table className="h-4 w-4" />
              <span>Exports</span>
            </button>
            <div className="relative" ref={plusButtonRef}>
              <div className="flex items-center">
                <div className="overflow-hidden">
                  <div 
                    className="flex items-center gap-2"
                    style={{ width: showPlusOptions ? 'auto' : '48px' }}
                  >
                    {showPlusOptions && (
                      <div 
                        className="flex items-center gap-2"
                      >
                        <button 
                          className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2 whitespace-nowrap"
                          data-tooltip="Get credits (placeholder)"
                        >
                          <Gem className="h-4 w-4" />
                           <span>Credits</span>
                        </button>
                        <button 
                          className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2 whitespace-nowrap"
                          data-tooltip="Install Chrome extension (placeholder)"
                        >
                          <Chrome className="h-4 w-4" />
                          <span>Extension</span>
                        </button>
                      </div>
                    )}
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      
      {/* Example Queries Section - Only show if no request has been sent */}
      {!isLoading && !apiResults && !apiError && (
        <div className="mt-3 mb-3 bg-[#252525] border border-[#333333] rounded-xl overflow-hidden shadow-lg">
          <div className="px-3 py-2 bg-[#2a2a2a] border-b border-[#333333] flex justify-between items-center">
            <div className="text-sm text-neutral-300 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              <span>Example Searches</span>
            </div>
          </div>
          <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {exampleQueries.map((suggestion, index) => {
              // Determine background color based on query complexity
              let bgColor = "bg-blue-500/10 hover:bg-blue-500/20";
              let borderColor = "border-blue-500/20";
              let iconColor = "text-blue-400";
              
              if (suggestion.includes(" in ") && suggestion.includes(" at ")) {
                // Most complex (job + industry + location)
                bgColor = "bg-purple-500/10 hover:bg-purple-500/20";
                borderColor = "border-purple-500/20";
                iconColor = "text-purple-400";
              } else if (suggestion.includes(" in ") || suggestion.includes(" at ") || suggestion.includes(" with ")) {
                // Medium complexity (job + industry/location)
                bgColor = "bg-green-500/10 hover:bg-green-500/20";
                borderColor = "border-green-500/20";
                iconColor = "text-green-400";
              }
              
              return (
                <button
                  key={index}
                  onClick={() => useExample(suggestion)}
                  className={`text-left px-3 py-2 text-sm text-white rounded-md transition-colors flex items-center gap-2 ${bgColor} border ${borderColor}`}
                >
                  <svg className={`w-4 h-4 ${iconColor} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                  <span>{suggestion}</span>
                </button>
              );
            })}
          </div>
          <div className="px-3 py-2 bg-[#232323] border-t border-[#333333] text-xs text-neutral-400">
            <p className="flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Click any example to use it or press Tab while typing to complete your query</span>
            </p>
          </div>
        </div>
      )}

      {/* Database Recommendation Info */}
      {recommendedDatabase && (
        <div className="mb-6 mt-3 p-3 bg-[#2b2b2b] border border-[#404040] rounded-lg">
          <div className="flex items-center gap-2">
            <Gem className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-neutral-300">
              <span className="font-medium text-purple-400">Recommended database:</span>{" "}
              {formatDatabaseName(recommendedDatabase)}
              {recommendedDatabase !== actualDatabase && (
                <span className="ml-2 text-xs py-1 px-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-full">
                  Using {formatDatabaseName(actualDatabase)}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mt-6 text-center text-neutral-400">
          <div className="inline-flex items-center">
            <div className="w-4 h-4 border-2 border-t-transparent border-blue-400 rounded-full animate-spin mr-2"></div>
            <span>Generating suggestions from AI...</span>
          </div>
        </div>
      )}

      {apiError && (
        <div className="mt-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <strong>Error:</strong> {apiError}
        </div>
      )}

      {apiResults && (
        <div className="mt-8">
          {/* AI Results Summary */}
          <div className="mb-6 p-4 bg-[#2b2b2b] border border-[#404040] rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-green-400">Suggested Criteria:</h3>
            
            {/* Compact display for all extracted data */}
            <div className="space-y-2">
              
              {/* Job Titles / Business Types - Compact List */}
              {((apiResults.jobTitles && apiResults.jobTitles.length > 0) || 
                (apiResults.businessTypes && apiResults.businessTypes.length > 0)) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-neutral-300">
                    {actualDatabase === "deez_3_v3" ? "Business Types:" : "Job Titles:"}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(actualDatabase === "deez_3_v3" ? apiResults.businessTypes : apiResults.jobTitles)?.map((item, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 text-xs rounded bg-blue-600/20 border border-blue-500/30 text-blue-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  {processingTime && (
                    <span className="text-xs text-teal-500 bg-teal-900/20 px-2 py-1 rounded flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      {processingTime}s
                    </span>
                  )}
                </div>
              )}

              {/* Industry Keywords - Compact List (skip for DEEZ since business types are shown above) */}
              {actualDatabase !== "deez_3_v3" && apiResults.industryKeywords && apiResults.industryKeywords.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-neutral-300">Industry:</span>
                  <div className="flex flex-wrap gap-1">
                    {apiResults.industryKeywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 text-xs rounded bg-purple-600/20 border border-purple-500/30 text-purple-300"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location - Compact Display */}
              {apiResults.locationInfo && apiResults.locationInfo.hasLocation && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-neutral-300">Location:</span>
                  <div className="flex flex-wrap gap-1">
                    {apiResults.locationInfo.components.city && (
                      <span className="px-2 py-1 text-xs rounded bg-green-600/20 border border-green-500/30 text-green-300">
                        {apiResults.locationInfo.components.city}
                      </span>
                    )}
                    {apiResults.locationInfo.components.state && (
                      <span className="px-2 py-1 text-xs rounded bg-green-600/20 border border-green-500/30 text-green-300">
                        {apiResults.locationInfo.components.state}
                      </span>
                    )}
                    {apiResults.locationInfo.components.zip && (
                      <span className="px-2 py-1 text-xs rounded bg-green-600/20 border border-green-500/30 text-green-300">
                        {apiResults.locationInfo.components.zip}
                      </span>
                    )}
                    {apiResults.locationInfo.components.region && (
                      <span className="px-2 py-1 text-xs rounded bg-green-600/20 border border-green-500/30 text-green-300">
                        {apiResults.locationInfo.components.region}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Filters - Compact List */}
              {apiResults.hasAdditionalFilters && apiResults.additionalFilters && apiResults.additionalFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-neutral-300">Additional Filters:</span>
                  <div className="flex flex-wrap gap-1">
                    {apiResults.additionalFilters.map((filter, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-1 text-xs rounded bg-orange-600/20 border border-orange-500/30 text-orange-300"
                        title={filter.note || ""}
                      >
                        {filter.column}: {Array.isArray(filter.values) ? filter.values.join(", ") : filter.values}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* No results message */}
              {((actualDatabase === "deez_3_v3" && (!apiResults.businessTypes || apiResults.businessTypes.length === 0)) ||
                (actualDatabase !== "deez_3_v3" && (!apiResults.jobTitles || apiResults.jobTitles.length === 0))) && 
              (actualDatabase === "deez_3_v3" || (!apiResults.industryKeywords || apiResults.industryKeywords.length === 0)) && 
              (!apiResults.locationInfo || !apiResults.locationInfo.hasLocation) &&
              (!apiResults.hasAdditionalFilters) && (
                <p className="text-neutral-400 text-sm">No specific criteria were extracted. Try refining your description.</p>
              )}
              
            </div>
          </div>
          
          {/* Manual Search Interface */}
          <div className="mb-6 p-4 bg-[#2b2b2b] border border-[#404040] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Table className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Manual Search Interface</h2>
            </div>
            <p className="text-sm text-neutral-400">
              Your AI-generated criteria have been automatically applied to the search interface below. 
              You can modify filters, select columns, and export data as needed.
            </p>
          </div>
          
          <ManualSearchClone 
            aiResults={apiResults}
            recommendedDatabase={recommendedDatabase || actualDatabase}
            className="rounded-lg border border-[#404040]"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Guide component for the test clone page, inspired by the existing guide from other areas of the app.
 */
function Guide({ 
  isVisible = true,
  defaultOpen = true,
  title = "Search Guide",
  primaryContent = null,
  sections = [],
  width = 320,
  position = "right"
}) {
  const [guideOpen, setGuideOpen] = useState(defaultOpen);

  useEffect(() => {
    setGuideOpen(defaultOpen);
  }, [defaultOpen]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-0 ${position}-0 bottom-0 w-auto z-50`}>
      <AnimatePresence>
        {guideOpen ? (
          <motion.aside
            key="guide"
            initial={{ x: position === "right" ? width : -width, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: position === "right" ? width : -width, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-0 ${position}-4 max-w-[90vw] bg-[#2b2b2b] border border-[#404040] rounded-2xl shadow-lg text-sm text-neutral-200 z-50 pointer-events-auto overflow-hidden`}
            style={{ width: width + 'px' }}
          >
            <button
              aria-label="minimize guide"
              onClick={() => setGuideOpen(false)}
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white z-10"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div 
                key={title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="p-4 space-y-3"
              >
                <h3 className="text-base font-semibold">{title}</h3>
                
                {primaryContent}
                
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
            className={`fixed top-1/2 ${position === "right" ? "right-2" : "left-2"} -translate-y-1/2 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white pointer-events-auto cursor-pointer`}
          >
            <ArrowLeft className={`h-4 w-4 ${position === "left" ? "rotate-180" : ""}`} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Location and Search Criteria guide content component
 */
function SearchGuideContent() {
  const [showCriteria, setShowCriteria] = useState(false);
  
  // These search criteria are extracted from the prompt in the extract-usa4-additional-filters route
  const searchCriteria = [
    { name: "Full name", coverage: "100.0%" },
    { name: "Job title", coverage: "82.7%" },
    { name: "Emails", coverage: "86.3%" },
    { name: "Phone numbers", coverage: "36.2%" },
    { name: "Company Size", coverage: "53.6%" },
    { name: "Years Experience", coverage: "61.7%" },
    { name: "Twitter Username", coverage: "3.1%" },
    { name: "Summary", coverage: "82.9%" },
    { name: "Sub Role", coverage: "25.2%" },
    { name: "Street Address", coverage: "23.9%" },
    { name: "Skills", coverage: "49.9%" },
    { name: "Region", coverage: "96.3%" },
    { name: "Gender", coverage: "85.4%" },
    { name: "Industry", coverage: "89.4%" },
    { name: "Company Name", coverage: "77.3%" }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3">
        <p className="text-sm text-green-300 font-medium mb-2">
          Search Tip: More Criteria = More Targeted But Less Results
        </p>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-full bg-gradient-to-r from-green-500/20 to-green-500/10 rounded p-1.5 flex justify-between">
              <span className="text-xs text-white">Job title only</span>
              <span className="text-xs text-green-300 font-medium">~1.2M results</span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-4/5 bg-gradient-to-r from-green-500/20 to-green-500/10 rounded p-1.5 flex justify-between">
              <span className="text-xs text-white">Job title + Industry</span>
              <span className="text-xs text-green-300 font-medium">~250K results</span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2/5 bg-gradient-to-r from-green-500/20 to-green-500/10 rounded p-1.5 flex justify-between">
              <span className="text-xs text-white">Job title + Industry + Location</span>
              <span className="text-xs text-green-300 font-medium">~50K results</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
        <p className="text-sm text-blue-300">
          If no location is specified, searches will default to the United States. We currently don't have local business data outside of the United States.
        </p>
      </div>
      
      <div>
        <button
          onClick={() => setShowCriteria(!showCriteria)}
          className="flex items-center justify-between w-full px-3 py-2 bg-[#3a3a3a] rounded-md hover:bg-[#454545] transition-colors"
        >
          <span className="font-medium">Available Search Criteria</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showCriteria ? "rotate-180" : ""}`} />
        </button>
        
        {showCriteria && (
          <div className="mt-2 border border-[#454545] rounded-md p-2 max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-neutral-400">
                <tr>
                  <th className="p-1 font-normal">Field</th>
                  <th className="p-1 font-normal">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {searchCriteria.map((criteria, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-[#2a2a2a]" : ""}>
                    <td className="p-1">{criteria.name}</td>
                    <td className="p-1">{criteria.coverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300">
        <p>
          <span className="font-medium">Pro tip:</span> Fields with higher coverage percentages will yield more complete results.
        </p>
      </div>
    </div>
  );
}

// Helper function to display friendly database names
function formatDatabaseName(dbName) {
  switch(dbName) {
    case "usa4_new_v2":
      return "US Professionals";
    case "otc1_new_v2":
      return "International Professionals";
    case "eap1_new_v2":
      return "Global B2B Contacts";
    case "deez_3_v3":
      return "US Local Businesses";
    default:
      return dbName;
  }
}

export default function TestClonePage() {
  return (
    <div className="min-h-screen bg-[#181818] flex items-center justify-center p-4">
      {/* Information Guide on the right side */}
      <Guide 
        isVisible={true}
        defaultOpen={true}
        title="Search Information Guide"
        primaryContent={<SearchGuideContent />}
        position="right"
      />
      
      {/* To-do Guide on the left side */}
      <Guide 
        isVisible={true}
        defaultOpen={true}
        title="To-do"
        primaryContent={
          <div className="space-y-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-md p-3">
              <p className="text-sm text-indigo-300 font-medium mb-2">5. Column Chaining</p>
              <p className="text-xs text-neutral-300">
                Introduce chaining so if multiple columns could apply for industry / job titles / location it chains them together in OR operation for more results
              </p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
              <p className="text-sm text-blue-300 font-medium mb-2">1. Keyword Validation</p>
              <p className="text-xs text-neutral-300">
                Introduce keyword validation as a final step to ensure filter quality.
              </p>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-3">
              <p className="text-sm text-purple-300 font-medium mb-2">2. Agentic Result Optimization</p>
              <p className="text-xs text-neutral-300">
                If not returning expected results, implement agentic flow to remove filters reductively and see which are causing problems. Generation of the big 3 could be a tool call.
              </p>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-3">
              <p className="text-sm text-orange-300 font-medium mb-2">3. Better Location Detection</p>
              <p className="text-xs text-neutral-300">
                Introduce better location queries and ensure proper location detection.
              </p>
            </div>
            
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-md p-3">
              <p className="text-sm text-cyan-300 font-medium mb-2">4. Speed Optimization</p>
              <p className="text-xs text-neutral-300">
                Speedmaxxing time - use shorter prompts and maybe even 4.1 nano for faster responses.
              </p>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
              <p className="text-sm text-yellow-300 font-medium mb-2">Follow-up Flow</p>
              <p className="text-xs text-neutral-300">
                After 2+ AI followups, redirect to manual mode with step-by-step job/industry/location filtering.
              </p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
              <p className="text-sm text-blue-300 font-medium mb-2">Reduce Failure Rate</p>
              <p className="text-xs text-neutral-300">
                AI performs counting operations on current filters, then tries 3x parallel queries for best results.
              </p>
            </div>
          </div>
        }
        position="left"
      />
      
      <SearchForm />
    </div>
  );
} 