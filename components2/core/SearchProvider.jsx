"use client";

import React, { useState, useEffect } from "react";
import { SearchContextProvider, useSearchContext } from "../context/SearchContext";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
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
    searchLimit,
    navigateToStep,
    user,
    profile
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

  // Functions for search flow
  const proceedStep0 = (inputString) => {
    const type = closestType(inputString);
    setAnswerType(type);
    setCurrentStep(1);
    setText("");
    setShowExamples(true);
    setGuideOpen(true);
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
        },
        {
          "Full name": "Emily Williams",
          "Job title": "UX Designer",
          "Company": "Design Studio",
          "Emails": "emily.w@designstudio.io",
          "Phone numbers": "555-234-5678"
        },
        {
          "Full name": "Michael Brown",
          "Job title": "Sales Director",
          "Company": "Growth Partners",
          "Emails": "mbrown@growthpartners.com",
          "Phone numbers": "555-345-6789"
        },
        {
          "Full name": "Sarah Miller",
          "Job title": "Content Strategist",
          "Company": "Media Solutions",
          "Emails": "sarah@mediasolutions.com",
          "Phone numbers": "555-456-7890"
        },
        {
          "Full name": "David Wilson",
          "Job title": "CTO",
          "Company": "Innovative Tech",
          "Emails": "david@innovativetech.co",
          "Phone numbers": "555-567-8901"
        },
        {
          "Full name": "Jennifer Taylor",
          "Job title": "HR Manager",
          "Company": "Global Enterprises",
          "Emails": "jtaylor@globalent.com",
          "Phone numbers": "555-678-9012"
        },
        {
          "Full name": "Robert Garcia",
          "Job title": "Data Scientist",
          "Company": "Analytics Pro",
          "Emails": "robert@analyticspro.ai",
          "Phone numbers": "555-789-0123"
        },
        {
          "Full name": "Lisa Martinez",
          "Job title": "Operations Manager",
          "Company": "Logistics Plus",
          "Emails": "lmartinez@logisticsplus.com",
          "Phone numbers": "555-890-1234"
        },
        {
          "Full name": "Thomas Anderson",
          "Job title": "Frontend Developer",
          "Company": "Web Solutions",
          "Emails": "tanderson@websolutions.dev",
          "Phone numbers": "555-901-2345"
        },
        {
          "Full name": "Michelle Lee",
          "Job title": "Digital Marketer",
          "Company": "Growth Hackers",
          "Emails": "michelle@growthhackers.io",
          "Phone numbers": "555-012-3456"
        },
        {
          "Full name": "Kevin Moore",
          "Job title": "Backend Engineer",
          "Company": "Server Solutions",
          "Emails": "kevin@serversolutions.net",
          "Phone numbers": "555-123-4567"
        },
        {
          "Full name": "Amanda Clark",
          "Job title": "Social Media Manager",
          "Company": "Viral Brands",
          "Emails": "amanda@viralbrands.co",
          "Phone numbers": "555-234-5678"
        },
        {
          "Full name": "Christopher Wright",
          "Job title": "Project Manager",
          "Company": "Delivery Masters",
          "Emails": "chris@deliverymasters.com",
          "Phone numbers": "555-345-6789"
        }
      ]);
      setTotalResults(15);
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

  // Guide content functions
  // Step 1 - Search Type Guide
  const Step1GuideContent = () => (
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
        title: "Search Type Guide",
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
          handleBack={handleBack}
          onReset={handleResetSearch}
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
      
      {/* Global Guide component */}
      {!manualMode && getGuideContent() && currentStep !== 3 && (
        <Guide 
          isVisible={true}
          defaultOpen={guideOpen}
          title={getGuideContent().title}
          primaryContent={getGuideContent().content}
        />
      )}
      
      {/* UI overlay elements that don't affect layout */}
      <div className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none">
        {/* Step Badges - implemented directly with context access */}
        {!manualMode && currentStep < 3 && (
          <div className="fixed top-20 left-4 flex flex-col gap-2 z-10 pointer-events-auto">
            {[1, 2, 3].map((step) => (
              <motion.button
                key={step}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Only allow navigation to completed steps
                  if (step <= currentStep) {
                    setCurrentStep(step - 1);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm ${
                  step <= currentStep
                    ? "bg-green-500/20 text-green-700 cursor-pointer hover:bg-green-500/30"
                    : "bg-gray-500/20 text-gray-500 cursor-not-allowed"
                }`}
                disabled={step > currentStep}
              >
                Step {step}
              </motion.button>
            ))}
          </div>
        )}
      </div>
      
      {/* Main content area with search or manual search */}
      <AnimatePresence mode="wait">
        {manualMode ? (
          <ManualSearch />
        ) : (
          <main className={`flex-1 flex flex-col items-center px-4 ${currentStep === 3 ? 'mt-20' : 'mt-72'}`}>
            {/* Fixed position container for consistent input placement */}
            <div className={`w-full ${currentStep === 3 ? 'max-w-[900px]' : 'max-w-[690px]'}`}>
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