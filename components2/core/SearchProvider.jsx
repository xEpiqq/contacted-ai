"use client";

import React, { useState, useEffect } from "react";
import { SearchContextProvider, useSearchContext } from "../context/SearchContext";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Navbar from "../layout/Navbar";
import ManualSearch from "../layout/ManualSearch";
import CreditsScreen from "../layout/CreditsScreen";
import Guide from "../layout/Guide";
import SearchStepOne from "../pages/SearchStepOne";
import EnrichmentDrawer from "../layout/EnrichmentDrawer";
import ExportsDrawer from "../layout/ExportsDrawer";
import FiltersDrawer from "../layout/FiltersDrawer";
import Toasts from "@/components/toasts";

// Component that contains all the main UI and routing
function SearchApp() {
  const {
    manualMode,
    setManualMode,
    creditsScreenOpen,
    setCreditsScreenOpen,
    currentStep,
    setCurrentStep,
    answerType,
    setAnswerType,
    brainstorm,
    setBrainstorm,
    drawerOpen,
    exportsDrawerOpen,
    filtersDrawerOpen,
    setFiltersDrawerOpen,
    searchResults,
    setSearchResults,
    totalResults,
    setTotalResults,
    searchFilters,
    setSearchFilters,
    searchLimit,
    navigateToStep,
    user,
    profile,
    filterDrawerData
  } = useSearchContext();

  const router = useRouter();

  // Check if user has a pending trial and redirect to checkout if needed
  useEffect(() => {
    if (profile && profile.trial_pending) {
      router.push("/api/redirect-trial");
    }
  }, [profile, router]);

  // Local state for search flow
  const [text, setText] = useState("");
  const [selectedExamples, setSelectedExamples] = useState([]);
  const [brainstormExamples, setBrainstormExamples] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [showExamples, setShowExamples] = useState(true);
  const [showIndustryExamples, setShowIndustryExamples] = useState(true);
  const [exactMatch, setExactMatch] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  
  // AI Status tracking state
  const [aiStatus, setAiStatus] = useState("Search");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [resultsCount, setResultsCount] = useState(0);
  
  // Guide state
  const [guideOpen, setGuideOpen] = useState(false);
  
  // Text input helpers
  const hasText = text.trim().length > 0;
  const hasBadges = 
    (currentStep === 1 && 
     ((answerType === "people" && 
       ((brainstorm && brainstormExamples.length > 0) || 
        (!brainstorm && selectedExamples.length > 0))) ||
      (answerType === "local biz" && selectedExamples.length > 0)
     )) || 
    (currentStep === 2 && selectedIndustries.length > 0);
  const canProceed = hasText || hasBadges;
  
  // Update AI status based on current state
  useEffect(() => {
    if (isAiProcessing) {
      // Status will be set to "Thinking..." during processing
      return;
    }
    
    if (resultsCount > 0) {
      setAiStatus(`${resultsCount.toLocaleString()} results`);
    } else {
      setAiStatus("Search");
    }
  }, [isAiProcessing, resultsCount]);

  // proceedStep0 no longer needed; kept as placeholder for compatibility
  const proceedStep0 = () => {};

  // Handle text submission 
  const handleSubmit = (step) => {
    // Process input text if any
    if (text.trim()) {
      const items = text.split(",").map(item => item.trim()).filter(Boolean);
      
      if (step === 1) {
        // Add to job titles or business types
        if (brainstorm) {
          setBrainstormExamples(prev => 
            [...new Set([...prev, ...items])]
          );
        } else {
          setSelectedExamples(prev => 
            [...new Set([...prev, ...items])]
          );
        }
      } else if (step === 2) {
        // Add to industries
        setSelectedIndustries(prev => 
          [...new Set([...prev, ...items])]
        );
      }
      
      setText("");
    }
    
    // Move to next step or submit search
    if (step < 2) {
      setCurrentStep(step + 1);
      
      // If moving from step 0 to step 1, guide should open in step 1
      if (step === 0) {
        setGuideOpen(true);
      }
    } else {
      // Final step - trigger search
      handleSearch();
    }
  };

  // Handle clicking on example badges
  const handleExampleClick = (example, isBrainstorm = false, isIndustry = false) => {
    if (isIndustry) {
      // Add to industries
      setSelectedIndustries(prev => 
        prev.includes(example) ? prev : [...prev, example]
      );
    } else if (isBrainstorm || brainstorm) {
      // Add to brainstorm examples
      setBrainstormExamples(prev => 
        prev.includes(example) ? prev : [...prev, example]
      );
    } else {
      // Add to normal examples
      setSelectedExamples(prev => 
        prev.includes(example) ? prev : [...prev, example]
      );
    }
  };

  // Handle removing badges
  const handleBadgeRemove = (example, isBrainstorm = false, isIndustry = false) => {
    if (isIndustry) {
      setSelectedIndustries(prev => 
        prev.filter((_, i) => i !== example)
      );
    } else if (isBrainstorm || brainstorm) {
      setBrainstormExamples(prev => 
        prev.filter((_, i) => i !== example)
      );
    } else {
      setSelectedExamples(prev => 
        prev.filter((_, i) => i !== example)
      );
    }
  };

  // Toggle brainstorm mode
  const handleBrainstormToggle = (value) => {
    setBrainstorm(value);
    setText("");
  };

  // Enhanced handleBack function for step navigation
  const handleBack = (targetStep) => {
    // Set the current step
    setCurrentStep(targetStep);
    
    // Always clear text input when navigating
    setText("");
    
    // Set guide state
    if (targetStep === 1 || targetStep === 2) {
      setGuideOpen(true);
    } else {
      setGuideOpen(false);
    }
    
    // If going back to step 0, reset everything
    if (targetStep === 0) {
      setAnswerType("");
      setSelectedExamples([]);
      setBrainstormExamples([]);
      setSelectedIndustries([]);
      setBrainstorm(false);
    }
  };

  // Function for search submission
  const handleSearch = () => {
    setCurrentStep(3);
    setResultsLoading(true);
    
    // Convert selections to filters
    const newFilters = [];
    
    if (selectedExamples.length > 0 || brainstormExamples.length > 0) {
      newFilters.push({
        column: "Job title",
        condition: "contains",
        tokens: brainstorm ? brainstormExamples : selectedExamples,
        subop: "WHERE"
      });
    }
    
    if (selectedIndustries.length > 0) {
      newFilters.push({
        column: "Industry",
        condition: "contains",
        tokens: selectedIndustries,
        subop: newFilters.length > 0 ? "AND" : "WHERE"
      });
    }
    
    // Update search filters
    setSearchFilters(newFilters);
    
    // TODO: Replace with real API call returning search results;
    // currently just ends loading state without adding dummy data.
      setResultsLoading(false);
  };

  // Reset search
  const handleResetSearch = () => {
    setCurrentStep(0);
    setAnswerType("");
    setText("");
    setSelectedExamples([]);
    setBrainstormExamples([]);
    setSelectedIndustries([]);
    setBrainstorm(false);
    setSearchResults([]);
    setSearchFilters([]);
    setTotalResults(0);
    setExactMatch(false);
  };

  // Guide content functions
  // Step 1 - Search Type Guide
  const Step1GuideContent = () => (
    <>
      <div>
        <p className="font-medium">
          1. People
        </p>
        <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300 mt-2">
          <p>
            <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
              software engineers in San Francisco
            </code>
          </p>
        </div>
      </div>

      <div>
        <p className="font-medium">
          2. Local businesses
        </p>

        <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300">
          <p>
            <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
              restaurants in downtown Seattle
            </code>
          </p>
        </div>
      </div>
    </>
  );

  // Step 2 - Brainstorm Guide
  const BrainstormGuideContent = () => (
    <>
      <div>
        <p className="font-medium">Brainstorm with AI</p>
        <ul className="text-xs text-neutral-400 mt-2 space-y-2">
          <li className="flex gap-2">
            <span>1.</span>
            <p>Describe your product or service</p>
          </li>
          <li className="flex gap-2">
            <span>2.</span>
            <p>AI will suggest relevant job titles</p>
          </li>
          <li className="flex gap-2">
            <span>3.</span>
            <p>Select titles you want to target</p>
          </li>
          <li className="flex gap-2">
            <span>4.</span>
            <p>Add them to your search with one click</p>
          </li>
        </ul>
      </div>

      <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-green-400">
        <p>
          <span className="font-medium">Pro tip:</span> Be
          specific about your customers. The more detailed you
          are, the better the AI suggestions will be.
        </p>
      </div>
    </>
  );

  // Step 2 - Job Titles Guide
  const JobTitlesGuideContent = () => (
    <>
      <div>
        <p className="font-medium">
          1. Multiple job titles? use commas
        </p>
        <p className="text-neutral-400 text-xs mt-0.5 italic">
          ceo, owner, founder
        </p>
      </div>

      <div>
        <p className="font-medium">
          2. Want an exact match? use quotes
        </p>

        <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300">
          <p>
            type{" "}
            <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
              ceo
            </code>{" "}
            (no quotes) and you might find a man whose title is{" "}
            <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
              'best ceo ever'
            </code>
          </p>
        </div>
        <div className="mt-2 space-y-1">
          <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300">
            <p>
              type{" "}
              <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
                "ceo"
              </code>{" "}
              and every person will have the exact title of{" "}
              <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
                "ceo"
              </code>
            </p>
          </div>
          <p className="text-neutral-400 text-xs mt-2 italic">
            "ceo", "owner", "founder" is allowed
          </p>
        </div>
      </div>
    </>
  );

  // Step 3 - Industry Guide
  const IndustryGuideContent = () => (
    <>
      <div>
        <p className="font-medium">
          1. Multiple industries? use commas
        </p>
        <p className="text-neutral-400 text-xs mt-0.5 italic">
          software, healthcare, finance
        </p>
      </div>
      <div>
        <p className="font-medium">
          2. Think broadly or get specific
        </p>
        <p className="text-neutral-400 text-xs mt-0.5">
          e.g. renewable energy <span className="italic">vs.</span>{" "}
          solar panel installers
        </p>
      </div>
    </>
  );

  // Step 4 - Results Guide
  const ResultsGuideContent = () => (
    <>
      <div>
        <p className="font-medium">Understanding Your Results</p>
        <ul className="text-xs text-neutral-400 mt-2 space-y-2">
          <li className="flex gap-2">
            <span>•</span>
            <p>Results are shown based on your search criteria</p>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <p>Up to {searchLimit} results are shown per page</p>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <p>Use pagination to navigate through results</p>
          </li>
        </ul>
      </div>

      <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300 mt-3">
        <p>
          <span className="font-medium">Pro tip:</span> You can export your 
          results in various formats. Click "Export Results" to download.
        </p>
      </div>
    </>
  );

  // Helper to determine which guide content to show
  const getGuideContent = () => {
    if (currentStep === 0) {
      return {
        title: "Guide",
        content: <Step1GuideContent />
      };
    } else if (currentStep === 1) {
      if (brainstorm) {
        return {
          title: "Brainstorm Guide",
          content: <BrainstormGuideContent />
        };
      } else {
        return {
          title: "Job Title Guide",
          content: <JobTitlesGuideContent />
        };
      }
    } else if (currentStep === 2) {
      return {
        title: "Industry Guide",
        content: <IndustryGuideContent />
      };
    } else if (currentStep === 3) {
      return {
        title: "Results Guide",
        content: <ResultsGuideContent />
      };
    }
  };

  // Determine if guide should be open by default for current step
  useEffect(() => {
    // Open guide automatically for steps 2 and 3 (pages 2 and 3), closed for others
    if (currentStep === 1 || currentStep === 2) {
      setGuideOpen(true);
    } else {
      setGuideOpen(false);
    }
  }, [currentStep]);

  // Render the appropriate step component based on currentStep
  const renderSearchStep = () => {
    const commonProps = {
      text,
      setText,
      canProceed,
      handleBack,
      handleSubmit,
      onAiStatusChange: setAiStatus,
      onAiProcessingChange: setIsAiProcessing,
      onResultsCountChange: setResultsCount
    };
    return <SearchStepOne {...commonProps} />;
  };

  return (
    <div className="w-full flex flex-col bg-[#212121] text-white min-h-screen relative">
      <Navbar />
      
      {/* Global Guide component */}
      {!manualMode && getGuideContent() && currentStep !== 3 && resultsCount === 0 && (
        <Guide 
          isVisible={true}
          defaultOpen={guideOpen}
          title={getGuideContent().title}
          primaryContent={getGuideContent().content}
        />
      )}
      
      {/* UI overlay elements that don't affect layout */}
      <div className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none">
        {/* AI Status Badge - shown only while processing or before results */}
        {!manualMode && currentStep < 3 && isAiProcessing && (
          <div className="fixed top-20 left-4 z-10 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-500/30"
            >
              {isAiProcessing && (
                <div className="w-3 h-3 border-2 border-t-transparent border-blue-300 rounded-full animate-spin"></div>
              )}
              <span>{aiStatus}</span>
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Main content area with search or manual search */}
      <AnimatePresence mode="wait">
        {manualMode ? (
          <ManualSearch />
        ) : (
          <main className={`flex-1 flex flex-col px-4 ${currentStep < 3 ? 'items-center mt-72' : 'mt-20'}`}>
            {/* Fixed position container for consistent input placement */}
            <div className={`w-full ${currentStep < 3 ? 'max-w-[690px]' : ''}`}>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentStep}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                {renderSearchStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        )}
      </AnimatePresence>

      {/* Credits Screen Modal */}
      <AnimatePresence mode="wait">
        {creditsScreenOpen && (
          <CreditsScreen onClose={() => setCreditsScreenOpen(false)} />
        )}
      </AnimatePresence>
      
      {/* Drawers */}
      <EnrichmentDrawer />
      <ExportsDrawer />
      <FiltersDrawer 
        availableColumns={filterDrawerData.availableColumns}
        pendingFilters={filterDrawerData.pendingFilters}
        selectedTable={filterDrawerData.selectedTable}
        onApplyFilters={filterDrawerData.onApplyFilters}
        onClose={filterDrawerData.onClose || (() => setFiltersDrawerOpen(false))}
      />
      
      {/* Toast notifications */}
      <Toasts />
    </div>
  );
}

// Provider component that wraps the app with context
function SearchProvider() {
  return (
    <SearchContextProvider>
      <SearchApp />
    </SearchContextProvider>
  );
}

export default SearchProvider; 