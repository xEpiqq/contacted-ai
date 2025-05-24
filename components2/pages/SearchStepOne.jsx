"use client";

import React, { useRef, useEffect, useState } from "react";
import { useSearchContext } from "../context/SearchContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowUpIcon, 
  XMarkIcon 
} from "@heroicons/react/24/outline";
import { 
  FileUp, 
  Table, 
  Upload, 
  MoreHorizontal, 
  Chrome, 
  Gem,
  ChevronDown,
  ArrowLeft
} from "lucide-react";
import ManualSearchClone from "../layout/ManualSearchClone";

/**
 * Guide component for the search page
 */
function Guide({ 
  isVisible = true,
  defaultOpen = true,
  title = "Search Guide",
  primaryContent = null,
  sections = [],
  width = 320,
  position = "left"
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
 * Results log content component - shows dynamic content based on search state
 */
function ResultsLogContent({ 
  isLoading, 
  apiResults, 
  apiError, 
  recommendedDatabase, 
  actualDatabase, 
  processingTime 
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-t-transparent border-blue-400 rounded-full animate-spin"></div>
            <span className="text-sm text-blue-300 font-medium">Processing your query...</span>
          </div>
          <p className="text-xs text-neutral-300 mt-2">AI is analyzing your description and extracting relevant criteria.</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-sm text-red-300 font-medium">Processing Error</span>
          </div>
          <p className="text-xs text-neutral-300">{apiError}</p>
        </div>
      </div>
    );
  }

  if (apiResults) {
    return (
      <div className="space-y-4">
        {/* Database Recommendation */}
        {recommendedDatabase && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <Gem className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">Database Selection</span>
            </div>
            <div className="text-xs text-neutral-300">
              <p><span className="font-medium">Recommended:</span> {formatDatabaseName(recommendedDatabase)}</p>
              {recommendedDatabase !== actualDatabase && (
                <p className="mt-1"><span className="font-medium">Using:</span> {formatDatabaseName(actualDatabase)}</p>
              )}
            </div>
          </div>
        )}

        {/* Processing Time */}
        {processingTime && (
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-md p-3">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="text-sm text-teal-300 font-medium">Processing Time: {processingTime}s</span>
            </div>
          </div>
        )}

        {/* Suggested Criteria */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-sm text-green-300 font-medium">Extracted Criteria</span>
          </div>
          
          <div className="space-y-3">
            {/* Job Titles / Business Types */}
            {((apiResults.jobTitles && apiResults.jobTitles.length > 0) || 
              (apiResults.businessTypes && apiResults.businessTypes.length > 0)) && (
              <div>
                <p className="text-xs font-medium text-neutral-300 mb-1">
                  {actualDatabase === "deez_3_v3" ? "Business Types:" : "Job Titles:"}
                </p>
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
              </div>
            )}

            {/* Industry Keywords */}
            {actualDatabase !== "deez_3_v3" && apiResults.industryKeywords && apiResults.industryKeywords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-neutral-300 mb-1">Industry:</p>
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

            {/* Location */}
            {apiResults.locationInfo && apiResults.locationInfo.hasLocation && (
              <div>
                <p className="text-xs font-medium text-neutral-300 mb-1">Location:</p>
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

            {/* Additional Filters */}
            {apiResults.hasAdditionalFilters && apiResults.additionalFilters && apiResults.additionalFilters.length > 0 && (
              <div>
                <p className="text-xs font-medium text-neutral-300 mb-1">Additional Filters:</p>
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
              <p className="text-xs text-neutral-400">No specific criteria were extracted. Try refining your description.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default state - no query sent yet
  return (
    <div className="space-y-4">
      <div className="bg-neutral-500/10 border border-neutral-500/20 rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-sm text-neutral-300 font-medium">Ready to Search</span>
        </div>
        <p className="text-xs text-neutral-400">
          Enter your target audience description above. AI will extract relevant criteria and populate the search interface below.
        </p>
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
        <p className="text-xs text-blue-300 font-medium mb-2">Search Tips:</p>
        <ul className="text-xs text-neutral-300 space-y-1">
          <li>• Be specific about job titles and industries</li>
          <li>• Include location for better targeting</li>
          <li>• More criteria = fewer but more targeted results</li>
        </ul>
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

function SearchStepOne({ 
  text,
  setText,
  canProceed,
  handleSubmit,
  proceedStep0,
  onAiStatusChange,
  onAiProcessingChange,
  onResultsCountChange
}) {
  const {
    setExportsDrawerOpen,
    setDrawerOpen,
    setCreditsScreenOpen,
    isExtensionLoading,
    setIsExtensionLoading,
    setToastConfig,
    setManualMode,
    setPendingSearchFilters,
    fetchSearchResults
  } = useSearchContext();

  // Local state for typewriter effect
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [words] = useState(["people", "local biz"]);

  // AI state management
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isVerifyingTitles, setIsVerifyingTitles] = useState(false);
  const [processingTime, setProcessingTime] = useState(null);
  const processStartTimeRef = useRef(null);
  
  // State for database selection
  const [recommendedDatabase, setRecommendedDatabase] = useState(null);
  const [actualDatabase, setActualDatabase] = useState("usa4_new_v2");

  // State for fixed example queries
  const [exampleQueries] = useState([
    "software engineers in fintech",
    "marketing directors",
    "healthcare professionals in Boston",
    "data scientists with AI experience"
  ]);

  // New state for view management
  const [viewMode, setViewMode] = useState("search"); // "search" or "results"
  const [showFilters, setShowFilters] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [totalResults, setTotalResults] = useState(0);

  // References
  const textareaRef = useRef(null);
  const plusButtonRef = useRef(null);
  
  // Local state for "plus" button dropdown
  const [showPlusOptions, setShowPlusOptions] = React.useState(false);

  // Custom key handler for step one
  const handleKeyDown = (e) => {
    // Handle enter to submit
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canProceed) {
        handleStep0Submit(e);
      }
    }
  };

  // Handle AI form submission
  const handleAISubmit = async (textToSubmit) => {
    const submissionText = textToSubmit || text;
    
    if (!submissionText.trim() || isLoading) return;
    
    setIsLoading(true);
    setApiResults(null);
    setApiError(null);
    setProcessingTime(null);
    setRecommendedDatabase(null);
    setActualDatabase("usa4_new_v2");
    
    // Update status callbacks if available
    if (onAiProcessingChange) onAiProcessingChange(true);
    if (onAiStatusChange) onAiStatusChange("Thinking...");
    
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
          description: submissionText,
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

      // Simulate fetching table data (replace with actual data fetching)
      setTimeout(() => {
        setTableData(generateMockTableData());
        setTotalResults(45234);
        setViewMode("results");
      }, 500);
      
    } catch (error) {
      console.error("API call failed:", error);
      setApiError(error.message);
      if (onAiStatusChange) onAiStatusChange("Search");
    } finally {
      setIsLoading(false);
      if (onAiProcessingChange) onAiProcessingChange(false);
    }
  };

  // Generate mock table data (replace with actual data)
  const generateMockTableData = () => {
    const mockData = [];
    const firstNames = ["John", "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Lisa", "James", "Ashley"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
    const companies = ["TechCorp", "InnovateLabs", "DataSystems", "FutureTech", "CloudWorks", "DigitalEdge", "SmartSolutions", "NextGen", "TechFlow", "CodeBase"];
    const titles = ["Software Engineer", "Senior Developer", "Tech Lead", "Engineering Manager", "Full Stack Developer", "Backend Engineer", "Frontend Developer", "DevOps Engineer"];
    const cities = ["San Francisco", "New York", "Austin", "Seattle", "Boston", "Denver", "Chicago", "Los Angeles"];

    for (let i = 0; i < 50; i++) {
      mockData.push({
        id: i + 1,
        firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
        lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
        email: `user${i + 1}@${companies[Math.floor(Math.random() * companies.length)].toLowerCase()}.com`,
        company: companies[Math.floor(Math.random() * companies.length)],
        title: titles[Math.floor(Math.random() * titles.length)],
        city: cities[Math.floor(Math.random() * cities.length)],
        phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
      });
    }
    return mockData;
  };

  // Handle form submission for step 0
  const handleStep0Submit = (e) => {
    e.preventDefault();
    if (!canProceed) return;
    
    // Submit to AI instead of proceeding to next step
    if (text.trim()) {
      handleAISubmit(text.trim());
    }
  };
  
  // Handle text changes
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setApiResults(null); // Clear previous results when text changes
    setApiError(null);   // Clear previous errors when text changes
    // Reset follow-up state when text changes
    setRecommendedDatabase(null);
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

  // Go back to search view
  const goBackToSearch = () => {
    setViewMode("search");
    setShowFilters(false);
  };

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

  /* ---------- typewriter ---------- */
  useEffect(() => {
    const currentWord = words[wordIndex];
    let t;
    if (!isDeleting && displayedText.length < currentWord.length) {
      t = setTimeout(
        () => setDisplayedText(currentWord.slice(0, displayedText.length + 1)),
        200
      );
    } else if (!isDeleting && displayedText.length === currentWord.length) {
      t = setTimeout(() => setIsDeleting(true), 1000);
    } else if (isDeleting && displayedText.length > 0) {
      t = setTimeout(
        () =>
          setDisplayedText(currentWord.slice(0, displayedText.length - 1)),
        100
      );
    } else if (isDeleting && displayedText.length === 0) {
      t = setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      }, 500);
    }
    return () => clearTimeout(t);
  }, [displayedText, isDeleting, wordIndex, words]);

  // Results Table Component
  const ResultsTable = () => (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goBackToSearch}
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-700/60 border border-neutral-600/30 hover:border-neutral-500/50 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Search</span>
          </button>
          <div className="text-neutral-400 text-sm">
            <span className="font-medium text-white">{formatCount(totalResults)}</span> results found
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>
            </svg>
            <span>Filters</span>
          </button>
          
          <button
            onClick={() => {
              // TODO: Implement export functionality
              setToastConfig({
                headerText: "Export Started",
                subText: "Your data will be ready for download shortly",
                color: "green"
              });
              setTimeout(() => setToastConfig(null), 3000);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export</span>
          </button>
          
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-700/60 border border-neutral-600/30 hover:border-neutral-500/50 rounded-lg transition-all duration-200"
          >
            <FileUp className="h-4 w-4" />
            <span>Enrich</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-[#252525] border border-[#404040] rounded-xl p-4">
              <ManualSearchClone 
                aiResults={apiResults}
                recommendedDatabase={recommendedDatabase || actualDatabase}
                className="border-none bg-transparent"
                onResultsCountChange={onResultsCountChange}
                compact={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Table */}
      <div className="bg-[#252525] border border-[#404040] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#2a2a2a] border-b border-[#404040]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#404040]">
              {tableData.map((row, index) => (
                <tr key={row.id} className="hover:bg-[#2a2a2a] transition-colors">
                  <td className="px-4 py-3 text-sm text-white">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-300">
                    {row.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-300">
                    {row.company}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-300">
                    {row.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-300">
                    {row.city}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-300">
                    {row.phone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="px-4 py-3 bg-[#2a2a2a] border-t border-[#404040] flex items-center justify-between">
          <div className="text-sm text-neutral-400">
            Showing 1-50 of {formatCount(totalResults)} results
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm text-neutral-400 hover:text-white bg-neutral-700/50 hover:bg-neutral-600/50 rounded border border-neutral-600/30 transition-all duration-200">
              Previous
            </button>
            <button className="px-3 py-1 text-sm text-neutral-400 hover:text-white bg-neutral-700/50 hover:bg-neutral-600/50 rounded border border-neutral-600/30 transition-all duration-200">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Information Guide on the left side */}
      <Guide 
        isVisible={viewMode === "search"}
        defaultOpen={false}
        title="Results Log"
        primaryContent={<ResultsLogContent isLoading={isLoading} apiResults={apiResults} apiError={apiError} recommendedDatabase={recommendedDatabase} actualDatabase={actualDatabase} processingTime={processingTime} />}
        position="left"
      />

      <AnimatePresence mode="wait">
        {viewMode === "search" ? (
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
                    placeholder={displayedText}
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
                    onClick={() => setCreditsScreenOpen(true)}
                    className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2"
                    data-tooltip="Purchase credits"
                  >
                    <Gem className="h-4 w-4" />
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
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-filter"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>
                                  <span>Manual</span>
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
            
            {/* <div className="text-right mt-1">
              <span className="text-xs text-neutral-600">270,394,457 contacts</span>
            </div> */}

            {/* Example Queries Section - Only show if no request has been sent */}
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
        ) : (
          <motion.div
            key="results-view"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full"
          >
            <ResultsTable />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default SearchStepOne; 