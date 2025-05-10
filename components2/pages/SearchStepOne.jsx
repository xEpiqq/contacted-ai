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
  Gem
} from "lucide-react";
import { closestType } from "../core/utils";

function SearchStepOne({ 
  text,
  setText,
  canProceed,
  handleSubmit,
  proceedStep0
}) {
  const {
    setExportsDrawerOpen,
    setDrawerOpen,
    setCreditsScreenOpen,
    isExtensionLoading,
    setIsExtensionLoading,
    setShowExtensionToast,
    setManualMode,
    setPendingSearchFilters,
    fetchSearchResults
  } = useSearchContext();

  // Local state for suggestions
  const [suggestion, setSuggestion] = useState("");
  const [suggestActive, setSuggestActive] = useState(false);

  // Local state for typewriter effect
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [words] = useState(["people", "local biz"]);

  // References
  const textareaRef = useRef(null);
  const plusButtonRef = useRef(null);
  
  // Local state for "plus" button dropdown
  const [showPlusOptions, setShowPlusOptions] = React.useState(false);

  // Custom key handler for step one
  const handleKeyDown = (e) => {
    /* ---- STEP 1 SUGGESTION DROPDOWN ---- */
    if (suggestion) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestActive(true);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestActive(false);
      } else if (e.key === "Enter" && suggestActive) {
        e.preventDefault();
        proceedStep0(suggestion);
        return;
      }
    }
    
    // Handle enter to submit
    if (e.key === "Enter" && !e.shiftKey && !suggestActive) {
      e.preventDefault();
      if (canProceed) {
        handleStep0Submit(e);
      }
    }
  };

  // Handle form submission for step 0
  const handleStep0Submit = (e) => {
    e.preventDefault();
    if (!canProceed) return;
    
    // Submit the text directly to proceed to the next step
    if (text.trim()) {
      proceedStep0(text.trim());
    }
  };
  
  // Handle text changes
  const handleTextChange = (e) => {
    setText(e.target.value);
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

  /* ---------- suggestion update ---------- */
  useEffect(() => {
    const cleaned = text.trim().toLowerCase();
    setSuggestion(cleaned ? closestType(cleaned) : "");
    setSuggestActive(false);
  }, [text]);

  return (
    <motion.div
      key="search-step-one"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-[690px]"
    >
      {/* heading */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <p className="text-neutral-400 text-sm text-center">
          build a list of...
        </p>
        <div className="w-full flex justify-center">
          <h1 className="text-3xl sm:text-2xl font-medium">
            local biz or people?
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
        </div>
        
        {/* dropdown for step 1 suggestions */}
        <AnimatePresence>
          {suggestion && (
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
                    ? "bg-[#3a3a3a] text-blue-400 font-medium"
                    : "hover:bg-[#3a3a3a]"
                }`}
                onMouseEnter={() => setSuggestActive(true)}
                onMouseLeave={() => setSuggestActive(false)}
                onClick={() => {
                  setSuggestActive(true);
                  proceedStep0(suggestion);
                }}
              >
                {suggestion}
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </form>
      
      {/* database size indicator - only visible on step 1 */}
      <div className="text-right mt-1">
        <span className="text-xs text-neutral-600">270,394,457 contacts</span>
      </div>
    </motion.div>
  );
}

export default SearchStepOne; 