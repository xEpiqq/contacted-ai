"use client";

import React from "react";
import { useSearchContext } from "../context/SearchContext";
import { AnimatePresence } from "framer-motion";
import ManualSearch from "../layout/ManualSearch";
import CreditsScreen from "../modals/CreditsScreen";
import SearchForm from "../layout/SearchForm";
import ResultsDisplay from "../layout/ResultsDisplay";
import Toasts from "../elements/Toasts";
import DrawerManager from "../layout/DrawerManager";

function SearchContent() {
  const { 
    manualMode,
    currentStep,
    creditsScreenOpen,
    setCreditsScreenOpen
  } = useSearchContext();

  return (
    <>
      <AnimatePresence mode="wait">
        {manualMode ? (
          <ManualSearch />
        ) : (
          <main className="flex-1 flex flex-col items-center justify-center px-4 mt-72">
            {currentStep === 3 ? (
              <ResultsDisplay />
            ) : (
              <SearchForm />
            )}
          </main>
        )}
      </AnimatePresence>
      
      {/* Credits Screen Modal */}
      <AnimatePresence mode="wait">
        {creditsScreenOpen && (
          <CreditsScreen onClose={() => setCreditsScreenOpen(false)} />
        )}
      </AnimatePresence>
      
      {/* Drawers for enrichment, exports, etc. */}
      <DrawerManager />
      
      {/* Toast notifications */}
      <Toasts />
    </>
  );
}

export default SearchContent; 