"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowUpIcon
} from "@heroicons/react/24/outline";
import { 
  FileUp, 
  Table, 
  MoreHorizontal, 
  Chrome, 
  Gem
} from "lucide-react";

function SearchStepOne() {
  const [text, setText] = useState("");
  const [canProceed, setCanProceed] = useState(false);
  const [showPlusOptions, setShowPlusOptions] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isVerifyingTitles, setIsVerifyingTitles] = useState(false);
  const [titleMatches, setTitleMatches] = useState({});
  const [usedTitles, setUsedTitles] = useState([]);
  const [processingTime, setProcessingTime] = useState(null);
  const processStartTimeRef = useRef(null);

  const textareaRef = useRef(null);
  const plusButtonRef = useRef(null);
  
  useEffect(() => {
    setCanProceed(text.trim().length > 0);
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canProceed) {
        handleFormSubmit(e);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canProceed || isLoading) return;
    
    setIsLoading(true);
    setApiResults(null);
    setApiError(null);
    setTitleMatches({});
    setUsedTitles([]);
    setProcessingTime(null);
    
    // Start the timer
    processStartTimeRef.current = Date.now();

    try {
      // Step 1: Determine target type
      const targetTypeResponse = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: text }),
      });

      const targetTypeData = await targetTypeResponse.json();

      if (!targetTypeResponse.ok) {
        throw new Error(targetTypeData.error || `Request failed with status ${targetTypeResponse.status}`);
      }
      
      // Step 2: Based on target type, call the appropriate extraction endpoint
      let extractionResponse;
      if (targetTypeData.targetType === "local_businesses") {
        extractionResponse = await fetch('/api/ai/business', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description: text }),
        });
      } else {
        extractionResponse = await fetch('/api/ai/people', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description: text }),
        });
      }

      const extractionData = await extractionResponse.json();

      if (!extractionResponse.ok) {
        throw new Error(extractionData.error || `Request failed with status ${extractionResponse.status}`);
      }
      
      // Combine the results
      const combinedResults = {
        targetType: targetTypeData.targetType,
        targetTypeConfidence: targetTypeData.targetTypeConfidence,
        ...extractionData
      };
      
      setApiResults(combinedResults);
      
      // Step 3: Verify job titles if they exist
      if (combinedResults.targetType === "people" && 
          combinedResults.jobTitles && 
          combinedResults.jobTitles.length > 0) {
        await verifyJobTitles(combinedResults.jobTitles);
      }
    } catch (error) {
      console.error("API call failed:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const verifyJobTitles = async (jobTitles) => {
    if (!jobTitles || jobTitles.length === 0) return;
    
    setIsVerifyingTitles(true);
    
    try {
      const response = await fetch('/api/ai/verify-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ titles: jobTitles }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Verification failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Build a map of original title -> matches data
      const matchesMap = {};
      data.matches.forEach(match => {
        matchesMap[match.title] = match;
      });
      
      setTitleMatches(matchesMap);
      setUsedTitles(data.usedTitles || []);
    } catch (error) {
      console.error("Title verification failed:", error);
    } finally {
      setIsVerifyingTitles(false);
      
      // Calculate and set the processing time
      if (processStartTimeRef.current) {
        const endTime = Date.now();
        const timeInSeconds = ((endTime - processStartTimeRef.current) / 1000).toFixed(2);
        setProcessingTime(timeInSeconds);
      }
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
  
  const handleTextChange = (e) => {
    setText(e.target.value);
    setApiResults(null); // Clear previous results when text changes
    setApiError(null);   // Clear previous errors when text changes
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
    <motion.div
      key="search-step-one"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
          <div className="flex items-center flex-wrap gap-2">
            <textarea
              ref={textareaRef}
              rows={1} // Start with 1 row, will auto-grow
              placeholder="e.g., software engineers in the fintech sector, or marketing managers at Series B startups"
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="flex-1 ml-2 resize-none overflow-hidden bg-transparent placeholder:text-neutral-500 text-sm leading-6 outline-none text-white"
              disabled={isLoading}
            />
            
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
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ width: 48 }}
                    animate={{ width: showPlusOptions ? 'auto' : 48 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    {showPlusOptions && (
                      <motion.div 
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
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
                      </motion.div>
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
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

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
        <div className="mt-6 p-4 bg-[#2b2b2b] border border-[#404040] rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-green-400">Suggested Criteria:</h3>
          
          {apiResults.targetType && (
            <div className="mb-4 border-b border-neutral-700 pb-3">
              <h4 className="text-md font-medium text-neutral-300 mb-1.5">Target Type:</h4>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 ${
                  apiResults.targetType === "people" 
                    ? "bg-purple-600/20 border border-purple-500/30 text-purple-300" 
                    : "bg-amber-600/20 border border-amber-500/30 text-amber-300"
                } text-sm rounded-full`}>
                  {apiResults.targetType === "people" ? "👤 People" : "🏢 Local Businesses"}
                </span>
                {apiResults.targetTypeConfidence > 0 && (
                  <span className="text-xs text-neutral-500">
                    Confidence: {Math.round(apiResults.targetTypeConfidence * 100)}%
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Display job titles and industry keywords if target type is people */}
          {apiResults.targetType === "people" && (
            <>
          {apiResults.jobTitles && apiResults.jobTitles.length > 0 && (
            <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-md font-medium text-neutral-300">Job Titles:</h4>
                    <div className="flex items-center">
                      {isVerifyingTitles && (
                        <span className="text-xs text-neutral-500 flex items-center mr-3">
                          <div className="w-3 h-3 border-t-transparent border border-blue-400 rounded-full animate-spin mr-1"></div>
                          Finding optimal titles...
                        </span>
                      )}
                      {processingTime && (
                        <span className="text-xs text-teal-500 bg-teal-900/20 px-2 py-1 rounded flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          Process: {processingTime}s
                        </span>
                      )}
                    </div>
                  </div>
                  
                {apiResults.jobTitles.map((title, index) => (
                    <div key={index} className="mb-4 pb-3 border-b border-neutral-700 last:border-b-0">
                      {/* AI-generated title */}
                      <div className="flex flex-wrap gap-2 mb-1.5">
                        <span 
                          className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                            titleMatches[title]?.winner?.isControl 
                              ? "bg-red-600/20 border border-red-500/30 text-red-300" 
                              : "bg-blue-600/20 border border-blue-500/30 text-blue-300"
                          }`}
                        >
                    {title}
                          {titleMatches[title]?.winner?.isControl && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {titleMatches[title]?.winner?.count > 0 && (
                            <span className="text-[9px] font-medium bg-black/30 px-1.5 py-0.5 rounded">
                              {formatCount(titleMatches[title]?.winner?.count)}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-neutral-500 self-center">AI suggestion</span>
                      </div>
                      
                      {/* Database matches */}
                      {titleMatches[title] && (
                        <div className="ml-4 flex flex-col gap-1">
                          {/* Winner (if not the control) */}
                          {titleMatches[title].winner && !titleMatches[title].winner.isControl && (
                            <div className="mb-1">
                              <span className="text-xs text-neutral-400 mb-1">Selected match:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span 
                                  className="px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-300 text-xs rounded-full flex items-center gap-1"
                                  title={`${titleMatches[title].winner.count} profiles with this title`}
                                >
                                  {titleMatches[title].winner.title}
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <span className="text-red-400/80 text-[9px] font-medium bg-red-900/30 px-1.5 py-0.5 rounded">
                                    {formatCount(titleMatches[title].winner.count)}
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Alternates */}
                          {titleMatches[title].alternates && titleMatches[title].alternates.length > 0 && (
                            <div>
                              <span className="text-xs text-neutral-400 mb-1">Other matches:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {titleMatches[title].alternates.slice(0, 3).map((match, matchIndex) => (
                                  <span 
                                    key={matchIndex} 
                                    className="px-3 py-1 bg-neutral-600/20 border border-neutral-500/30 text-neutral-300 text-xs rounded-full flex items-center gap-1"
                                    title={`${match.count} profiles with this title`}
                                  >
                                    {match.title}
                                    <span className="text-neutral-400/80 text-[9px] font-medium bg-neutral-900/30 px-1.5 py-0.5 rounded">
                                      {formatCount(match.count)}
                                    </span>
                  </span>
                ))}
              </div>
                            </div>
                          )}
                          
                          {/* No matches case */}
                          {!titleMatches[title].winner && !titleMatches[title].alternates && (
                            <span className="text-xs text-neutral-500">No similar titles found in database</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
            </div>
          )}
          {apiResults.industryKeywords && apiResults.industryKeywords.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-neutral-300 mb-1.5">Industry Keywords:</h4>
              <div className="flex flex-wrap gap-2">
                {apiResults.industryKeywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-teal-600/20 border border-teal-500/30 text-teal-300 text-xs rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(!apiResults.jobTitles || apiResults.jobTitles.length === 0) && 
           (!apiResults.industryKeywords || apiResults.industryKeywords.length === 0) && (
            <p className="text-neutral-400 text-sm">No specific job titles or industry keywords were extracted. Try refining your description.</p>
              )}
            </>
          )}

          {/* Display business categories and location keywords if target type is local_businesses */}
          {apiResults.targetType === "local_businesses" && (
            <>
              {apiResults.businessCategories && apiResults.businessCategories.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-md font-medium text-neutral-300 mb-1.5">Business Categories:</h4>
                  <div className="flex flex-wrap gap-2">
                    {apiResults.businessCategories.map((category, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-600/20 border border-orange-500/30 text-orange-300 text-xs rounded-full">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {apiResults.locationKeywords && apiResults.locationKeywords.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-neutral-300 mb-1.5">Location Keywords:</h4>
                  <div className="flex flex-wrap gap-2">
                    {apiResults.locationKeywords.map((location, index) => (
                      <span key={index} className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs rounded-full">
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(!apiResults.businessCategories || apiResults.businessCategories.length === 0) && 
               (!apiResults.locationKeywords || apiResults.locationKeywords.length === 0) && (
                <p className="text-neutral-400 text-sm">No specific business categories or location keywords were extracted. Try refining your description.</p>
              )}
            </>
          )}
        </div>
      )}
      
      <div className="text-right mt-1">
        <span className="text-xs text-neutral-600">Powered by OpenAI</span>
      </div>
    </motion.div>
  );
}

export default function TestPage() {
  return (
    <div className="min-h-screen bg-[#181818] flex items-center justify-center p-4">
      <SearchStepOne />
    </div>
  );
} 