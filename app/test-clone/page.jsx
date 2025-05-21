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
  Gem
} from "lucide-react";
import NavMenu from '@/app/components/NavMenu';
import { Combobox } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";

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
  
  // Added state for search results
  const [searchResults, setSearchResults] = useState([]);
  const [totalSearchResults, setTotalSearchResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [page, setPage] = useState(0);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  
  // Added state for filter editing
  const [filters, setFilters] = useState([]);
  const [pendingFilters, setPendingFilters] = useState([]);
  const [showFiltersEditor, setShowFiltersEditor] = useState(false);
  const [editingFilterIndex, setEditingFilterIndex] = useState(null);

  // Added state for database selection
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [followUpOptions, setFollowUpOptions] = useState([]);
  const [selectedFollowUpOption, setSelectedFollowUpOption] = useState(null);
  const [recommendedDatabase, setRecommendedDatabase] = useState(null);
  const [actualDatabase, setActualDatabase] = useState("usa4_new_v2");

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
    setProcessingTime(null);
    setSearchResults([]);
    setTotalSearchResults(0);
    setSearchError(null);
    setRequiresFollowUp(false);
    setFollowUpMessage("");
    setFollowUpOptions([]);
    setSelectedFollowUpOption(null);
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
          // Include selected follow-up option if available
          followUpResponse: selectedFollowUpOption ? selectedFollowUpOption.value : null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      
      // Check if we need a follow-up for database selection
      if (data.requiresFollowUp && data.stage === "database-selection") {
        setRequiresFollowUp(true);
        setFollowUpMessage(data.message || "Please provide more information");
        setFollowUpOptions(data.options || []);
        
        // Calculate and set the processing time
        if (processStartTimeRef.current) {
          const endTime = Date.now();
          const timeInSeconds = ((endTime - processStartTimeRef.current) / 1000).toFixed(2);
          setProcessingTime(timeInSeconds);
        }
        
        setIsLoading(false);
        return;
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
      
      // Convert AI results to filter format
      const initialFilters = convertAIResultsToFilters(data);
      setFilters(initialFilters);
      setPendingFilters(JSON.parse(JSON.stringify(initialFilters)));
      
      // If we have valid filters, automatically fetch search results
      if (initialFilters.length > 0) {
        // Use a small delay to ensure state has been updated
        setTimeout(() => {
          fetchSearchResults(null, 0);
        }, 100);
      } else if (data.jobTitles && data.jobTitles.length > 0) {
        // We have job titles but couldn't create valid filters - try using the data object directly
        fetchSearchResults(data, 0);
      }
    } catch (error) {
      console.error("API call failed:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to convert AI results to filter format
  const convertAIResultsToFilters = (results) => {
    const newFilters = [];
    
    // For job titles, use the AI-suggested titles directly (blue bubbles)
    if (results.jobTitles && Array.isArray(results.jobTitles) && results.jobTitles.length > 0) {
      // Get valid, non-empty titles from AI suggestions
      const validTitles = results.jobTitles.filter(title => 
        typeof title === 'string' && title.trim() !== ''
      );
      
      if (validTitles.length > 0) {
        newFilters.push({
          column: "Job title",
          condition: "contains",
          tokens: validTitles,
          pendingText: "",
          subop: ""
        });
      }
    }
    
    // For industries, prioritize the verified database matches (red bubbles)
    if (results.industryKeywords && Array.isArray(results.industryKeywords) && results.industryKeywords.length > 0) {
      const verifiedIndustries = [];
      
      // Check if we have verified industry matches and collect the verified industries
      if (results.industryMatches && Array.isArray(results.industryMatches)) {
        results.industryMatches.forEach(match => {
          // If there's a winner that's not the control (i.e., a database match)
          if (match.winner && !match.winner.isControl && match.winner.keyword) {
            verifiedIndustries.push(match.winner.keyword);
          }
        });
      }
      
      // Use verified industries if available, otherwise fall back to AI suggestions
      const industriesToUse = verifiedIndustries.length > 0
        ? verifiedIndustries  // Use the verified industries (red bubbles)
        : results.industryKeywords.filter(industry => typeof industry === 'string' && industry.trim() !== ''); // Fallback
      
      if (industriesToUse.length > 0) {
        newFilters.push({
          column: "Industry",
          condition: "contains",
          tokens: industriesToUse,
          pendingText: "",
          subop: newFilters.length > 0 ? "AND" : ""
        });
      }
    }
    
    // Add location filter if available - prioritizing verified database matches
    if (results.locationInfo && 
        results.locationInfo.value && 
        typeof results.locationInfo.value === 'string' && 
        results.locationInfo.value.trim() !== '' && 
        results.locationInfo.locationType !== "none") {
      
      let locationColumn = "";
      let locationValue = results.locationInfo.value.trim();
      
      // Check if we have a verified location match
      if (results.locationMatches && 
          Array.isArray(results.locationMatches) && 
          results.locationMatches.length > 0 && 
          results.locationMatches[0].winner && 
          !results.locationMatches[0].winner.isControl && 
          results.locationMatches[0].winner.value) {
        // Use the verified location value
        locationValue = results.locationMatches[0].winner.value;
      }
      
      // Map the location type to the appropriate database column
      switch (results.locationInfo.locationType) {
        case "city":
          locationColumn = locationValue.includes(",") ? "Location" : "Locality";
          break;
        case "state":
          locationColumn = "Region";
          break;
        case "postal_code":
          locationColumn = "Postal Code";
          break;
        case "metro":
          locationColumn = "Metro";
          break;
        case "region":
          locationColumn = "Region";
          break;
        default:
          locationColumn = "Location";
      }
      
      if (locationColumn && locationValue) {
        newFilters.push({
          column: locationColumn,
          condition: "contains",
          tokens: [locationValue],
          pendingText: "",
          subop: newFilters.length > 0 ? "AND" : ""
        });
      }
    }
    
    return newFilters;
  };
  
  // Function to fetch search results based on AI criteria
  const fetchSearchResults = async (criteria, currentPage = 0) => {
    // Check if we have filters or if we can create them from criteria
    if (!criteria && filters.length === 0) {
      return;
    }
    
    // If we're using filters and they're empty, but we have criteria
    // Convert criteria to filters on the fly
    let searchFilters = filters;
    if (searchFilters.length === 0 && criteria) {
      searchFilters = convertAIResultsToFilters(criteria);
      // Update the filters state
      setFilters(searchFilters);
      setPendingFilters(JSON.parse(JSON.stringify(searchFilters)));
    }
    
    // Don't proceed if we still don't have any valid filters
    if (searchFilters.length === 0) {
      setSearchError("No valid search filters available. Please add at least one filter.");
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Use the current filters state instead of regenerating from criteria
      const payload = {
        filters: searchFilters, // Send the actual filters
        limit: resultsPerPage,
        offset: currentPage * resultsPerPage
      };
      
      // Call the search API
      const response = await fetch('/api/ai/test-clone-search-with-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Search request failed with status ${response.status}`);
      }
      
      setSearchResults(data.results || []);
      setTotalSearchResults(data.totalCount || 0);
      setPage(currentPage);
      
    } catch (error) {
      console.error("Search API call failed:", error);
      setSearchError(error.message);
      setSearchResults([]);
      setTotalSearchResults(0);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Add debounce reference for filter application
  const filterUpdateTimeoutRef = useRef(null);
  
  // Function to apply filters with debounce
  const debouncedFilterApplication = (fn) => {
    // Clear any pending timeout
    if (filterUpdateTimeoutRef.current) {
      clearTimeout(filterUpdateTimeoutRef.current);
    }
    
    // Set new timeout
    filterUpdateTimeoutRef.current = setTimeout(() => {
      fn();
      filterUpdateTimeoutRef.current = null;
    }, 500);
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

  // Filter management functions
  const toggleFiltersEditor = () => {
    if (!showFiltersEditor) {
      // Make a copy when opening so we can discard changes if needed
      setPendingFilters(JSON.parse(JSON.stringify(filters)));
    }
    setShowFiltersEditor(!showFiltersEditor);
  };
  
  const updateFilterLine = (index, field, value) => {
    setPendingFilters((prev) => {
      const arr = [...prev];
      arr[index][field] = value;
      return arr;
    });
    
    // Automatically apply filters when field changes (with debounce)
    debouncedFilterApplication(() => {
      applyFiltersAutomatically();
    });
  };
  
  const updateLineSubop = (index, newOp) => {
    setPendingFilters((prev) => {
      const arr = [...prev];
      arr[index].subop = newOp;
      return arr;
    });
    
    // Automatically apply filters when subop changes (with debounce)
    debouncedFilterApplication(() => {
      applyFiltersAutomatically();
    });
  };
  
  const updateLineTokens = (index, newTokens) => {
    setPendingFilters((prev) => {
      const arr = [...prev];
      arr[index].tokens = newTokens;
      return arr;
    });
    
    // Automatically apply filters when tokens change (with debounce)
    debouncedFilterApplication(() => {
      applyFiltersAutomatically();
    });
  };
  
  const updateLinePendingText = (index, txt) => {
    setPendingFilters((prev) => {
      const arr = [...prev];
      arr[index].pendingText = txt;
      return arr;
    });
  };
  
  // New function to apply filters automatically without closing the filter editor
  const applyFiltersAutomatically = async () => {
    // Process any pending text in tokens
    const updated = pendingFilters.map((rule) => {
      const newRule = {...rule};
      if ((rule.condition === "contains" || rule.condition === "equals") && rule.pendingText?.trim()) {
        if (!rule.tokens.includes(rule.pendingText.trim())) {
          newRule.tokens = [...(rule.tokens || []), rule.pendingText.trim()];
          // Don't clear pendingText so user can continue typing
        }
      }
      return newRule;
    });
    
    setFilters(updated);
    
    // Trigger a search with new filters if there are any valid filters
    if (updated.length > 0 && updated.some(f => f.tokens.length > 0 || f.condition === "is empty" || f.condition === "is not empty")) {
      await fetchSearchResults(apiResults);
    }
  };
  
  const applyFilters = async () => {
    // Process any pending text in tokens
    const updated = pendingFilters.map((rule) => {
      if ((rule.condition === "contains" || rule.condition === "equals") && rule.pendingText?.trim()) {
        if (!rule.tokens.includes(rule.pendingText.trim())) {
          rule.tokens.push(rule.pendingText.trim());
        }
      }
      const newRule = {...rule};
      newRule.pendingText = "";
      return newRule;
    });
    
    setFilters(updated);
    setShowFiltersEditor(false);
    
    // Trigger a search with new filters if there are any valid filters
    if (updated.length > 0 && updated.some(f => f.tokens.length > 0 || f.condition === "is empty" || f.condition === "is not empty")) {
      await fetchSearchResults(apiResults);
    }
  };
  
  const removeFilterLine = (index) => {
    setPendingFilters((prev) => prev.filter((_, i) => i !== index));
    
    // Automatically apply filters when a line is removed (with debounce)
    debouncedFilterApplication(() => {
      applyFiltersAutomatically();
    });
  };
  
  const addFilterLine = () => {
    const isFirst = pendingFilters.length === 0;
    setPendingFilters((prev) => [
      ...prev,
      {
        column: "",
        condition: "contains",
        tokens: [],
        pendingText: "",
        subop: isFirst ? "" : "AND"
      }
    ]);
    
    // We don't automatically apply when adding a new line because
    // it needs to be configured first
  };

  const cancelFilterEditing = () => {
    setPendingFilters(JSON.parse(JSON.stringify(filters)));
    setShowFiltersEditor(false);
  };

  // Handle selecting a follow-up option and resubmitting
  const handleFollowUpSelection = (option) => {
    setSelectedFollowUpOption(option);
    setRequiresFollowUp(false);
    
    // Automatically resubmit with the selected option
    setTimeout(() => {
      handleFormSubmit({ preventDefault: () => {} });
    }, 100);
  };

  return (
    <div
      className="w-full max-w-[690px] text-white"
    >
      <NavMenu />
      
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

      {/* Follow-up UI */}
      {requiresFollowUp && (
        <div className="mb-6 mt-6 p-4 bg-[#2b2b2b] border border-[#404040] rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-green-400">We need more information:</h3>
          <p className="mb-4 text-neutral-300">{followUpMessage}</p>
          
          {/* Custom response input */}
          <div className="mb-4">
            <input 
              type="text" 
              value={text}
              onChange={handleTextChange}
              placeholder="Or type your own response..."
              className="w-full bg-[#212121] border border-[#404040] rounded-md px-3 py-2 text-white placeholder:text-neutral-600 focus:outline-none focus:border-green-500 mb-2"
            />
            <button
              onClick={handleFormSubmit}
              className="px-3 py-1.5 bg-white text-black hover:opacity-90 text-sm font-medium rounded-md"
            >
              Submit
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <p className="text-sm text-neutral-400 mb-1">Or select one of these options:</p>
            {followUpOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleFollowUpSelection(option)}
                className="text-left p-3 bg-[#303030] border border-[#404040] rounded-lg hover:bg-[#343434] transition-colors"
              >
                <span className="text-white">{option.text}</span>
                {option.database && (
                  <span className="ml-2 text-xs py-1 px-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-full">
                    {formatDatabaseName(option.database)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Database Recommendation Info */}
      {!requiresFollowUp && recommendedDatabase && (
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
        <div className="mt-6 p-4 bg-[#2b2b2b] border border-[#404040] rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-green-400">Suggested Criteria:</h3>
          
          {/* Display job titles */}
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
              
              {apiResults.jobTitles.map((title, index) => {
                // Find the matching title data in titleMatches
                const titleMatch = apiResults.titleMatches?.find(match => match.title === title);
                
                return (
                  <div key={index} className="mb-4 pb-3 border-b border-neutral-700 last:border-b-0">
                    {/* AI-generated title */}
                    <div className="flex flex-wrap gap-2 mb-1.5">
                      <span 
                        className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                          titleMatch?.winner?.isControl 
                            ? "bg-red-600/20 border border-red-500/30 text-red-300" 
                            : "bg-blue-600/20 border border-blue-500/30 text-blue-300"
                        }`}
                      >
                        {title}
                        {titleMatch?.winner?.isControl && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {titleMatch?.winner?.count > 0 && (
                          <span className="text-[9px] font-medium bg-black/30 px-1.5 py-0.5 rounded">
                            {formatCount(titleMatch.winner.count)}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-neutral-500 self-center">
                        AI suggestion
                        {titleMatch?.winner?.isControl && (
                          <span className="text-[8px] ml-1 font-medium bg-neutral-700/40 text-neutral-400 px-1 py-0.5 rounded-sm">
                            Not used for search
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {/* Database matches */}
                    {titleMatch && (
                      <div className="ml-4 flex flex-col gap-1">
                        {/* Winner (if not the control) */}
                        {titleMatch.winner && !titleMatch.winner.isControl && (
                          <div className="mb-1">
                            <span className="text-xs text-neutral-400 mb-1">Selected match:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span 
                                className="px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-300 text-xs rounded-full flex items-center gap-1"
                                title={`${titleMatch.winner.count} profiles with this title`}
                              >
                                {titleMatch.winner.title}
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="text-red-400/80 text-[9px] font-medium bg-red-900/30 px-1.5 py-0.5 rounded">
                                  {formatCount(titleMatch.winner.count)}
                                </span>
                                {!titleMatch.winner.isControl && (
                                  <span className="text-[8px] ml-1 font-semibold bg-green-900/40 text-green-300 px-1 py-0.5 rounded-sm">
                                    Used for search
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Alternates */}
                        {titleMatch.alternates && titleMatch.alternates.length > 0 && (
                          <div>
                            <span className="text-xs text-neutral-400 mb-1">Other matches:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {titleMatch.alternates.slice(0, 3).map((match, matchIndex) => (
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
                        {!titleMatch.winner && !titleMatch.alternates && (
                          <span className="text-xs text-neutral-500">No similar titles found in database</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Display industry keywords */}
          {apiResults.industryKeywords && apiResults.industryKeywords.length > 0 && (
            <div className="mb-3">
              <h4 className="text-md font-medium text-neutral-300 mb-1.5">Industry Keywords:</h4>
              
              {apiResults.industryKeywords.map((keyword, index) => {
                // Find the matching keyword data in industryMatches
                const keywordMatch = apiResults.industryMatches?.find(match => match.keyword === keyword);
                
                return (
                  <div key={index} className="mb-4 pb-3 border-b border-neutral-700 last:border-b-0">
                    {/* AI-generated industry keyword */}
                    <div className="flex flex-wrap gap-2 mb-1.5">
                      <span 
                        className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                          keywordMatch?.winner?.isControl 
                            ? "bg-red-600/20 border border-red-500/30 text-red-300" 
                            : !keywordMatch
                            ? "bg-teal-600/20 border border-teal-500/30 text-teal-300"
                            : "bg-blue-600/20 border border-blue-500/30 text-blue-300"
                        }`}
                      >
                        {keyword}
                        {keywordMatch?.winner?.isControl && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {keywordMatch?.winner?.count > 0 && (
                          <span className="text-[9px] font-medium bg-black/30 px-1.5 py-0.5 rounded">
                            {formatCount(keywordMatch.winner.count)}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-neutral-500 self-center">
                        AI suggestion
                        {keywordMatch?.winner?.isControl && (
                          <span className="text-[8px] ml-1 font-medium bg-neutral-700/40 text-neutral-400 px-1 py-0.5 rounded-sm">
                            Not used for search
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {/* Database matches */}
                    {!keywordMatch && (
                      <div className="ml-4 flex flex-col gap-1">
                        <span className="text-xs text-neutral-500">Industry not verified against database</span>
                      </div>
                    )}
                    {keywordMatch && (
                      <div className="ml-4 flex flex-col gap-1">
                        {/* Winner (if not the control) */}
                        {keywordMatch.winner && !keywordMatch.winner.isControl && (
                          <div className="mb-1">
                            <span className="text-xs text-neutral-400 mb-1">Selected match:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span 
                                className="px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-300 text-xs rounded-full flex items-center gap-1"
                                title={`${keywordMatch.winner.count} profiles with this industry`}
                              >
                                {keywordMatch.winner.keyword}
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="text-red-400/80 text-[9px] font-medium bg-red-900/30 px-1.5 py-0.5 rounded">
                                  {formatCount(keywordMatch.winner.count)}
                                </span>
                                {!keywordMatch.winner.isControl && (
                                  <span className="text-[8px] ml-1 font-semibold bg-green-900/40 text-green-300 px-1 py-0.5 rounded-sm">
                                    Used for search
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Alternates */}
                        {keywordMatch.alternates && keywordMatch.alternates.length > 0 && (
                          <div>
                            <span className="text-xs text-neutral-400 mb-1">Other matches:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {keywordMatch.alternates.slice(0, 3).map((match, matchIndex) => (
                                <span 
                                  key={matchIndex} 
                                  className="px-3 py-1 bg-neutral-600/20 border border-neutral-500/30 text-neutral-300 text-xs rounded-full flex items-center gap-1"
                                  title={`${match.count} profiles with this industry`}
                                >
                                  {match.keyword}
                                  <span className="text-neutral-400/80 text-[9px] font-medium bg-neutral-900/30 px-1.5 py-0.5 rounded">
                                    {formatCount(match.count)}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* No matches case */}
                        {!keywordMatch.winner && !keywordMatch.alternates && (
                          <span className="text-xs text-neutral-500">No similar industries found in database</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* No results message */}
          {(!apiResults.jobTitles || apiResults.jobTitles.length === 0) && 
          (!apiResults.industryKeywords || apiResults.industryKeywords.length === 0) &&
          (!apiResults.businessCategories || apiResults.businessCategories.length === 0) && (
            <p className="text-neutral-400 text-sm">No specific criteria were extracted. Try refining your description.</p>
          )}

          {/* Display business categories if available */}
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

          {/* Display location keywords if available */}
          {apiResults.locationKeywords && apiResults.locationKeywords.length > 0 && (
            <div className="mb-3">
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

          {/* Display location information if available */}
          {apiResults.locationInfo && apiResults.locationInfo.value && apiResults.locationInfo.locationType !== "none" && (
            <div className="mb-3">
              <h4 className="text-md font-medium text-neutral-300 mb-1.5">Location:</h4>
              
              <div className="mb-4 pb-3 border-b border-neutral-700">
                {/* AI-generated location */}
                <div className="flex flex-wrap gap-2 mb-1.5">
                  <span 
                    className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                      apiResults.locationMatches?.[0]?.winner?.isControl 
                        ? "bg-blue-600/20 border border-blue-500/30 text-blue-300" 
                        : !apiResults.locationMatches
                        ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300"
                        : "bg-blue-600/20 border border-blue-500/30 text-blue-300"
                    }`}
                  >
                    {apiResults.locationInfo.value}
                    {apiResults.locationMatches?.[0]?.winner?.isControl && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {apiResults.locationMatches?.[0]?.winner?.count > 0 && (
                      <span className="text-[9px] font-medium bg-black/30 px-1.5 py-0.5 rounded">
                        {formatCount(apiResults.locationMatches[0].winner.count)}
                      </span>
                    )}
                    <span className="text-[8px] ml-1 font-semibold bg-green-900/40 text-green-300 px-1 py-0.5 rounded-sm">
                      Used for search
                    </span>
                  </span>
                  <span className="text-xs text-neutral-500 self-center">
                    {apiResults.locationInfo.locationType === "city" ? "City" : 
                      apiResults.locationInfo.locationType === "state" ? "State" : 
                      apiResults.locationInfo.locationType === "postal_code" ? "ZIP Code" : 
                      apiResults.locationInfo.locationType === "metro" ? "Metro Area" : 
                      apiResults.locationInfo.locationType === "region" ? "Region" : "Location"}
                  </span>
                </div>
                
                {/* Database matches */}
                {apiResults.locationMatches && apiResults.locationMatches[0] && (
                  <div className="ml-4 flex flex-col gap-1">
                    {/* Show the database matches as alternates */}
                    {apiResults.locationMatches[0].alternates && apiResults.locationMatches[0].alternates.length > 0 && (
                      <div>
                        <span className="text-xs text-neutral-400 mb-1">Database matches (not used for search):</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {apiResults.locationMatches[0].alternates.slice(0, 3).map((match, matchIndex) => (
                            <span 
                              key={matchIndex} 
                              className="px-3 py-1 bg-neutral-600/20 border border-neutral-500/30 text-neutral-300 text-xs rounded-full flex items-center gap-1"
                              title={`${match.count} profiles in this location`}
                            >
                              {match.value}
                              <span className="text-neutral-400/80 text-[9px] font-medium bg-neutral-900/30 px-1.5 py-0.5 rounded">
                                {formatCount(match.count)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No matches case */}
                    {!apiResults.locationMatches[0].alternates || apiResults.locationMatches[0].alternates.length === 0 && (
                      <span className="text-xs text-neutral-500">No similar locations found in database</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Results Section */}
      {searchResults.length > 0 && (
        <div className="mt-6 border-t border-neutral-700 pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-400">Search Results</h3>
            <span className="text-sm text-neutral-400">Found {totalSearchResults.toLocaleString()} contacts</span>
          </div>
          
          {/* Results Table */}
          <div className="overflow-x-auto w-full border border-[#333333] rounded-md mb-4">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[#252525] border-b border-[#333333]">
                  <th className="py-2 px-4 text-sm font-medium text-neutral-300 text-left">Full Name</th>
                  <th className="py-2 px-4 text-sm font-medium text-neutral-300 text-left">Job Title</th>
                  <th className="py-2 px-4 text-sm font-medium text-neutral-300 text-left">Company</th>
                  <th className="py-2 px-4 text-sm font-medium text-neutral-300 text-left">Industry</th>
                  <th className="py-2 px-4 text-sm font-medium text-neutral-300 text-left">Location</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result, index) => (
                  <tr key={index} className="border-b border-[#333333] hover:bg-[#252525]">
                    <td className="py-2 px-4 text-sm text-white">{result["Full name"] || "—"}</td>
                    <td className="py-2 px-4 text-sm text-white">{result["Job title"] || "—"}</td>
                    <td className="py-2 px-4 text-sm text-white">{result["Organization Name"] || "—"}</td>
                    <td className="py-2 px-4 text-sm text-white">{result["Industry"] || "—"}</td>
                    <td className="py-2 px-4 text-sm text-white">{result["Location"] || "—"}</td>
                  </tr>
                ))}
                {isSearching && Array(3).fill(0).map((_, i) => (
                  <tr key={`loading-${i}`} className="animate-pulse border-b border-[#333333]">
                    {Array(5).fill(0).map((_, j) => (
                      <td key={`cell-${i}-${j}`} className="py-2 px-4">
                        <div className="h-4 bg-[#303030] rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalSearchResults > resultsPerPage && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-neutral-400">
                Showing {page * resultsPerPage + 1} - {Math.min((page + 1) * resultsPerPage, totalSearchResults)} of {totalSearchResults.toLocaleString()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchSearchResults(apiResults, Math.max(0, page - 1))}
                  disabled={page === 0 || isSearching}
                  className={`px-3 py-1.5 text-xs rounded-md border ${
                    page === 0 || isSearching ? 'bg-[#252525] text-neutral-500 border-[#333333] cursor-not-allowed' : 'bg-[#252525] hover:bg-[#303030] text-white border-[#404040]'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchSearchResults(apiResults, page + 1)}
                  disabled={
                    (page + 1) * resultsPerPage >= totalSearchResults || isSearching
                  }
                  className={`px-3 py-1.5 text-xs rounded-md border ${
                    (page + 1) * resultsPerPage >= totalSearchResults || isSearching
                      ? 'bg-[#252525] text-neutral-500 border-[#333333] cursor-not-allowed'
                      : 'bg-[#252525] hover:bg-[#303030] text-white border-[#404040]'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {/* Show More Results Button */}
          {totalSearchResults > 10 && resultsPerPage === 10 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  setResultsPerPage(25);
                  fetchSearchResults(apiResults, 0);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list">
                  <line x1="8" x2="21" y1="6" y2="6" />
                  <line x1="8" x2="21" y1="12" y2="12" />
                  <line x1="8" x2="21" y1="18" y2="18" />
                  <line x1="3" x2="3" y1="6" y2="6" />
                  <line x1="3" x2="3" y1="12" y2="12" />
                  <line x1="3" x2="3" y1="18" y2="18" />
                </svg>
                Show More Results
              </button>
            </div>
          )}
          
          {/* Search Error Message */}
          {searchError && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <strong>Search Error:</strong> {searchError}
            </div>
          )}
        </div>
      )}
      
      {/* Search Loading Indicator */}
      {isSearching && searchResults.length === 0 && (
        <div className="mt-6 text-center text-neutral-400 border-t border-neutral-700 pt-4">
          <div className="inline-flex items-center">
            <div className="w-4 h-4 border-2 border-t-transparent border-blue-400 rounded-full animate-spin mr-2"></div>
            <span>Searching database for matching contacts...</span>
          </div>
        </div>
      )}
      
      {/* No Search Results Message */}
      {!isSearching && totalSearchResults === 0 && apiResults && apiResults.jobTitles && apiResults.jobTitles.length > 0 && !searchError && (
        <div className="mt-6 text-center text-neutral-400 border-t border-neutral-700 pt-4">
          <p>No matching contacts found. Try adjusting your criteria.</p>
        </div>
      )}

      {/* Button to view search results if not automatically loaded */}
      {!searchResults.length && !isSearching && !searchError && apiResults && apiResults.jobTitles && apiResults.jobTitles.length > 0 && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => fetchSearchResults(apiResults)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex items-center gap-2 mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            View Database Results
          </button>
        </div>
      )}
      
      {/* Active Filters and Edit Button */}
      {filters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-700">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-md font-medium text-neutral-300">Active Filters:</h4>
            <button
              onClick={toggleFiltersEditor}
              className="px-3 py-1.5 bg-[#252525] hover:bg-[#303030] text-white text-xs rounded-md border border-[#404040] flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Filters
            </button>
          </div>
          
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((f, i) => {
              const prefix = i === 0 ? "Where" : f.subop || "AND";
              const safeTokens = Array.isArray(f.tokens) ? f.tokens : [];
              let desc = "";
              if (f.condition === "is empty" || f.condition === "is not empty") {
                desc = f.condition;
              } else {
                desc = `${f.condition} [${safeTokens.join(", ")}]`;
              }
              return (
                <div key={i} className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-md">
                  <span>
                    <strong>{prefix}</strong> {f.column} {desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Editor Modal */}
      {showFiltersEditor && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-4 w-full max-w-3xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Edit Filters</h3>
              <div className="flex gap-2">
                <div className="text-white text-sm mr-2">
                  {isSearching ? (
                    <span className="flex items-center">
                      <div className="w-3 h-3 border-2 border-t-transparent border-green-400 rounded-full animate-spin mr-2"></div>
                      Updating...
                    </span>
                  ) : (
                    totalSearchResults > 0 && (
                      <span className="text-green-400">
                        {totalSearchResults.toLocaleString()} results found
                      </span>
                    )
                  )}
                </div>
                <button 
                  onClick={cancelFilterEditing}
                  className="px-3 py-1 text-white text-sm rounded-md bg-[#333] hover:bg-[#444] border border-[#555]"
                >
                  Cancel
                </button>
                <button 
                  onClick={applyFilters}
                  className="px-3 py-1 text-white text-sm rounded-md bg-blue-600 hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {pendingFilters.map((filter, index) => (
                <div key={index} className="p-3 bg-[#222] border border-[#444] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    {index > 0 && (
                      <select
                        value={filter.subop}
                        onChange={(e) => updateLineSubop(index, e.target.value)}
                        className="bg-[#333] border border-[#555] text-white py-1 px-2 rounded text-sm"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    {index === 0 && <div className="text-sm text-neutral-500">Where</div>}
                    <button
                      onClick={() => removeFilterLine(index)}
                      className="px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded-md text-xs hover:bg-red-900/50"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <select
                      value={filter.column}
                      onChange={(e) => updateFilterLine(index, "column", e.target.value)}
                      className="bg-[#333] border border-[#555] text-white py-2 px-3 rounded text-sm"
                    >
                      <option value="">Select column</option>
                      <option value="Job title">Job Title</option>
                      <option value="Industry">Industry</option>
                      <option value="Location">Location</option>
                      <option value="Locality">City</option>
                      <option value="Region">State/Region</option>
                      <option value="Postal Code">Postal Code</option>
                      <option value="Country">Country</option>
                      <option value="Organization Name">Company</option>
                      <option value="Organization Domain">Domain</option>
                      <option value="Organization Size">Company Size</option>
                    </select>
                    
                    <select
                      value={filter.condition}
                      onChange={(e) => updateFilterLine(index, "condition", e.target.value)}
                      className="bg-[#333] border border-[#555] text-white py-2 px-3 rounded text-sm"
                    >
                      <option value="contains">contains</option>
                      <option value="equals">equals</option>
                      <option value="is empty">is empty</option>
                      <option value="is not empty">is not empty</option>
                    </select>
                  </div>
                  
                  {(filter.condition === "contains" || filter.condition === "equals") && (
                    <div className="mt-3">
                      <TokensInput
                        tokens={filter.tokens}
                        setTokens={(tokens) => updateLineTokens(index, tokens)}
                        pendingText={filter.pendingText}
                        setPendingText={(text) => updateLinePendingText(index, text)}
                        column={filter.column}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              <button
                onClick={addFilterLine}
                className="w-full py-2 bg-[#333] hover:bg-[#444] border border-dashed border-[#666] text-neutral-400 rounded-md text-sm"
              >
                + Add Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A tokens input with auto-suggest from distinct values.
 */
function TokensInput({
  tokens,
  setTokens,
  pendingText,
  setPendingText,
  column,
  tableName = "usa4_new_v2"
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const dropdownRef = useRef(null);

  // Show suggestions as user types (filtered by `pendingText`)
  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes(pendingText.toLowerCase())
  );

  async function fetchSuggestions() {
    if (!column || !tableName) return;
    try {
      setIsFetching(true);
      const params = new URLSearchParams({
        table_name: tableName,
        column,
        limit: "100",
      });
      const res = await fetch(`/api/people/distinct-values?${params}`);
      const json = await res.json();
      if (res.ok && json.distinctValues) {
        setSuggestions(json.distinctValues);
      }
    } catch (err) {
      console.error("Suggestions fetch error:", err);
    } finally {
      setIsFetching(false);
    }
  }

  function handleFocus() {
    setShowSuggestions(true);
    // Show the dropdown right away, with a spinner:
    if (!suggestions.length) {
      fetchSuggestions();
    }
  }
  
  function handleBlur() {
    // Delay a bit so that if the user clicks a suggestion, we won't close immediately
    setTimeout(() => {
      if (
        !dropdownRef.current ||
        !dropdownRef.current.contains(document.activeElement)
      ) {
        setShowSuggestions(false);
      }
    }, 150);
  }
  
  function handleKeyDown(e) {
    if (e.key === "Enter" && pendingText.trim() !== "") {
      e.preventDefault();
      addToken(pendingText.trim());
      setPendingText("");
    }
  }
  
  function addToken(token) {
    if (token && !tokens.includes(token)) {
      const newTokens = [...tokens, token];
      setTokens(newTokens);
      // This triggers the filter update automatically
    }
  }

  function removeToken(token) {
    const newTokens = tokens.filter((t) => t !== token);
    setTokens(newTokens);
    // This triggers the filter update automatically
  }

  return (
    <div className="relative">
      {/* Display existing tokens */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tokens.map((token, idx) => (
          <div key={idx} className="bg-blue-600/10 border border-blue-500/20 text-blue-500 text-sm px-2 py-1 rounded-md flex items-center gap-2">
            <span>{token}</span>
            <button
              onClick={() => removeToken(token)}
              className="text-blue-500 hover:text-blue-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Input for new token */}
      <input
        type="text"
        value={pendingText}
        onChange={(e) => setPendingText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search (Enter to add new)"
        className="w-full bg-[#212121] border border-[#404040] rounded-md px-3 py-2 text-white placeholder:text-neutral-600 focus:outline-none focus:border-green-500"
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-[#252525] border border-[#404040] rounded-md shadow-md max-h-48 overflow-auto"
        >
          {isFetching ? (
            <div className="p-3 text-sm text-neutral-400 flex items-center gap-2">
              {/* Simple loading spinner */}
              <svg
                className="h-4 w-4 animate-spin mr-2 text-neutral-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              <span>Loading suggestions...</span>
            </div>
          ) : filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((item, i) => (
              <div
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent losing focus
                  addToken(item);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-[#333333] text-sm text-white"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-neutral-400">
              No suggestions found.
            </div>
          )}
        </div>
      )}
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
      <SearchForm />
    </div>
  );
} 