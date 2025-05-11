"use client";

import React, { useState, useEffect } from "react";
import { SearchContextProvider, useSearchContext } from "../context/SearchContext";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "../layout/Navbar";
import ManualSearch from "../layout/ManualSearch";
import CreditsScreen from "../layout/CreditsScreen";
import Guide from "../layout/Guide";
import SearchStepOne, { closestType } from "../pages/SearchStepOne";
import SearchStepTwo from "../pages/SearchStepTwo";
import SearchStepThree from "../pages/SearchStepThree";
import SearchStepFour from "../pages/SearchStepFour";
import EnrichmentDrawer from "../layout/EnrichmentDrawer";
import ExportsDrawer from "../layout/ExportsDrawer";
import Toasts from "@/components/toasts";

// Component that contains all the main UI and routing
function SearchApp() {
  const {
    manualMode,
    setManualMode,
    creditsScreenOpen,
    setCreditsScreenOpen,
    guideOpen,
    setGuideOpen,
    currentStep,
    setCurrentStep,
    answerType,
    setAnswerType,
    brainstorm,
    setBrainstorm,
    drawerOpen,
    exportsDrawerOpen,
    searchResults,
    setSearchResults,
    totalResults,
    setTotalResults,
    searchFilters,
    setSearchFilters,
    searchLimit
  } = useSearchContext();

  // Local state for search flow
  const [text, setText] = useState("");
  const [selectedExamples, setSelectedExamples] = useState([]);
  const [brainstormExamples, setBrainstormExamples] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [showExamples, setShowExamples] = useState(true);
  const [showIndustryExamples, setShowIndustryExamples] = useState(true);
  const [exactMatch, setExactMatch] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  
  // Text input helpers
  const hasText = text.trim().length > 0;
  const hasBadges = 
    (currentStep === 1 && 
     answerType === "people" && 
     ((brainstorm && brainstormExamples.length > 0) || 
      (!brainstorm && selectedExamples.length > 0))) || 
    (currentStep === 2 && selectedIndustries.length > 0);
  const canProceed = hasText || hasBadges;

  // Functions for search flow
  const proceedStep0 = (inputString) => {
    const type = closestType(inputString);
    setAnswerType(type);
    setCurrentStep(1);
    setText("");
    setShowExamples(true);
  };

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

  // Handle going back to previous step
  const handleBack = (targetStep) => {
    setCurrentStep(targetStep);
    
    // Clear text input when going back
    setText("");
    
    // Always keep guide open on steps 1 and 2
    if (targetStep === 1 || targetStep === 2) {
      setGuideOpen(true);
    }
    
    // If going back to step 0, reset everything
    if (targetStep === 0) {
      setAnswerType("");
      setSelectedExamples([]);
      setBrainstormExamples([]);
      setSelectedIndustries([]);
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
    
    // Mock search results
    setTimeout(() => {
      setSearchResults([
        {
          "Full name": "John Doe",
          "Job title": "Software Engineer",
          "Company": "Tech Co",
          "Emails": "john.doe@techco.com",
          "Phone numbers": "555-123-4567"
        },
        {
          "Full name": "Jane Smith",
          "Job title": "Marketing Manager",
          "Company": "Brand Inc",
          "Emails": "jsmith@brandinc.net",
          "Phone numbers": "555-987-6543"
        },
        {
          "Full name": "Alex Johnson",
          "Job title": "Product Manager",
          "Company": "Innovation LLC",
          "Emails": "ajohnson@innovation.co",
          "Phone numbers": "555-456-7890"
        }
      ]);
      setTotalResults(3);
      setResultsLoading(false);
    }, 1500);
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

  // Render the appropriate step component based on currentStep
  const renderSearchStep = () => {
    const commonProps = {
      text,
      setText,
      canProceed,
      handleBack,
      handleSubmit
    };

    switch (currentStep) {
      case 0:
        return <SearchStepOne 
          {...commonProps}
          proceedStep0={proceedStep0}
        />;
      case 1:
        return <SearchStepTwo 
          {...commonProps}
          answerType={answerType}
          brainstorm={brainstorm}
          handleBrainstormToggle={handleBrainstormToggle}
          selectedExamples={selectedExamples}
          brainstormExamples={brainstormExamples}
          handleExampleClick={handleExampleClick}
          handleBadgeRemove={handleBadgeRemove}
          showExamples={showExamples}
          setShowExamples={setShowExamples}
        />;
      case 2:
        return <SearchStepThree 
          {...commonProps}
          selectedIndustries={selectedIndustries}
          handleExampleClick={handleExampleClick}
          handleBadgeRemove={handleBadgeRemove}
          showIndustryExamples={showIndustryExamples}
          setShowIndustryExamples={setShowIndustryExamples}
        />;
      case 3:
        return <SearchStepFour 
          handleResetSearch={handleResetSearch}
          answerType={answerType}
          searchFilters={searchFilters}
          searchResults={searchResults}
          totalResults={totalResults}
          searchLimit={searchLimit}
        />;
      default:
        return <SearchStepOne 
          {...commonProps}
          proceedStep0={proceedStep0}
        />;
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#212121] text-white min-h-screen relative">
      <Navbar />
      
      {/* UI overlay elements that don't affect layout */}
      <div className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none">
        {/* Step Badges - only show when not in manual mode */}
        {!manualMode && currentStep <= 2 && (
          <div className="fixed top-20 left-4 flex flex-col gap-2 z-10 pointer-events-auto">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => step <= currentStep && handleBack(step - 1)}
                className={`px-3 py-1 rounded-full text-sm ${
                  step <= currentStep
                    ? "bg-green-500/20 text-green-700 cursor-pointer hover:bg-green-500/30"
                    : "bg-gray-500/20 text-gray-500"
                }`}
              >
                Step {step}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Guide Component - moved outside the pointer-events-none container */}
      {!manualMode && (
        <Guide />
      )}
      
      {/* Main content area with search or manual search */}
      <AnimatePresence mode="wait">
        {manualMode ? (
          <ManualSearch />
        ) : (
          <main className="flex-1 flex flex-col items-center justify-center px-4 mt-72">
            <AnimatePresence mode="wait">
              {renderSearchStep()}
            </AnimatePresence>
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