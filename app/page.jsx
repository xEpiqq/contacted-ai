"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpIcon } from "@heroicons/react/24/outline";
import { FileUp, Table, MoreHorizontal, Chrome, Gem } from "lucide-react";
import ManualSearch from '@/components2/layout/ManualSearch';
import Navbar from '@/components2/layout/Navbar';
import { usePathname } from 'next/navigation';

export default function Search() {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/sign-in') || 
                     pathname?.includes('/sign-up') || 
                     pathname?.includes('/forgot-password');
  const [text, setText] = useState("");
  
  // UI state management (simplified - drawers now in layout)
  const [isExtensionLoading, setIsExtensionLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // AI state management
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isVerifyingTitles, setIsVerifyingTitles] = useState(false);
  const [recommendedDatabase, setRecommendedDatabase] = useState(null);
  const [actualDatabase, setActualDatabase] = useState("usa4_new_v2");
  const [followUpData, setFollowUpData] = useState(null);
  const [exampleQueries] = useState(["software engineers in fintech", "marketing directors", "healthcare professionals in Boston", "data scientists with AI experience"]);
  const textareaRef = useRef(null);
  const plusButtonRef = useRef(null);
  const manualSearchRef = useRef(null);
  // Flag to ensure default search only runs once
  const hasAutoSearchRun = useRef(false);
  const [showPlusOptions, setShowPlusOptions] = useState(false);
  const [creditsScreenOpen, setCreditsScreenOpen] = useState(false);
  
  // Modal states for ManualSearch
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showExportSection, setShowExportSection] = useState(false);
  
  // Column modal state
  const [columnSearch, setColumnSearch] = useState("");
  
  // Export modal state
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [rowsToExport, setRowsToExport] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportDone, setExportDone] = useState(false);

  const canProceed = text.trim().length > 0;

  // Initialize modals when they open
  useEffect(() => {
    if (showColumnSelector) {
      setColumnSearch("");
    }
  }, [showColumnSelector]);

  useEffect(() => {
    if (showExportSection && manualSearchRef.current) {
      setRowsToExport(manualSearchRef.current.matchingCount || 0);
      setExportProgress(0);
      setExportError("");
      setExportDone(false);
    }
  }, [showExportSection]);

  // Auto-open ExportsDrawer when export completes
  useEffect(() => {
    if (exportDone) {
      // Small delay to show success message, then open drawer
      setTimeout(() => {
        // Close the export modal
        setShowExportSection(false);
        // Open the exports drawer to show the new export
        window.dispatchEvent(new CustomEvent('openExportsDrawer'));
      }, 800); // Brief delay to show success message
    }
  }, [exportDone]);

  // Notify layout about guide visibility based on page state
  useEffect(() => {
    if (manualMode || apiResults) {
      window.dispatchEvent(new CustomEvent('hideGuide'));
    } else {
      window.dispatchEvent(new CustomEvent('showGuide')); 
    }
  }, [manualMode, apiResults]);

  // Listen for credits screen state changes
  useEffect(() => {
    const handleCreditsScreenStateChange = (event) => {
      setCreditsScreenOpen(event.detail);
    };

    window.addEventListener('creditsScreenStateChanged', handleCreditsScreenStateChange);
    
    return () => {
      window.removeEventListener('creditsScreenStateChanged', handleCreditsScreenStateChange);
    };
  }, []);

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
    setFollowUpData(null);

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

      // Check if follow-up is needed
      if (data.needsFollowUp) {
        setFollowUpData({
          originalQuery: submissionText,
          reason: data.followUpReason
        });
      } else {
        // Normal processing
      if (data.recommendedDatabase) {
        setRecommendedDatabase(data.recommendedDatabase);
      }
      if (data.actualDatabase) {
        setActualDatabase(data.actualDatabase);
      }
      setApiResults(data);
      setIsVerifyingTitles(false);
      }
    } catch (error) {
      console.error("API call failed:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
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
    setFollowUpData(null);
  }

  // Use an example query
  function useExample(example) {
    setText(example);
    setApiResults(null);
    setApiError(null);
    setRecommendedDatabase(null);
    setFollowUpData(null);
    textareaRef.current?.focus();
  }



  // Auto-grow textarea height
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [text]);

  // Handle mounting and auto-focus textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
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
      {/* Navbar - conditionally rendered */}
      {!isAuthPage && !creditsScreenOpen && (
        <Navbar onCreditsClick={() => window.dispatchEvent(new CustomEvent('openCreditsScreen'))} />
      )}
      
      <div className={`min-h-screen bg-[#212121] text-white flex items-center justify-center p-4 ${!isAuthPage && !creditsScreenOpen ? 'pt-20' : ''}`}>
        {apiResults ? (
          <div className={`fixed ${isAuthPage || creditsScreenOpen ? 'top-0' : 'top-16'} left-0 right-0 bottom-0 p-4 overflow-auto bg-[#212121]`}>
                            <ManualSearch 
              ref={manualSearchRef}
              aiResults={apiResults}
              recommendedDatabase={recommendedDatabase || actualDatabase}
              onBack={() => setApiResults(null)}
              showColumnSelector={showColumnSelector}
              setShowColumnSelector={setShowColumnSelector}
              showExportSection={showExportSection}
              setShowExportSection={setShowExportSection}
              columnSearch={columnSearch}
              setColumnSearch={setColumnSearch}
              exporting={exporting}
              setExporting={setExporting}
              exportProgress={exportProgress}
              setExportProgress={setExportProgress}
              rowsToExport={rowsToExport}
              setRowsToExport={setRowsToExport}
              exportError={exportError}
              setExportError={setExportError}
              exportDone={exportDone}
              setExportDone={setExportDone}
            />
          </div>
        ) : manualMode ? (
          <div className={`fixed ${isAuthPage || creditsScreenOpen ? 'top-0' : 'top-16'} left-0 right-0 bottom-0 p-4 overflow-auto bg-[#212121]`}>
            <ManualSearch 
              ref={manualSearchRef}
              aiResults={null}
              recommendedDatabase={null}
              onBack={() => setManualMode(false)}
              showColumnSelector={showColumnSelector}
              setShowColumnSelector={setShowColumnSelector}
              showExportSection={showExportSection}
              setShowExportSection={setShowExportSection}
              columnSearch={columnSearch}
              setColumnSearch={setColumnSearch}
              exporting={exporting}
              setExporting={setExporting}
              exportProgress={exportProgress}
              setExportProgress={setExportProgress}
              rowsToExport={rowsToExport}
              setRowsToExport={setRowsToExport}
              exportError={exportError}
              setExportError={setExportError}
              exportDone={exportDone}
              setExportDone={setExportDone}
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
                    onClick={() => window.dispatchEvent(new CustomEvent('openEnrichmentDrawer'))}
                    className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2"
                    data-tooltip="Enrich your data"
                  >
                    <FileUp className="h-4 w-4" />
                    <span>Enrich</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('openExportsDrawer'))}
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
                    onClick={() => setManualMode(true)}
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
                                    // Dispatch custom event to trigger credits screen in layout
                                    window.dispatchEvent(new CustomEvent('openCreditsScreen'));
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
                                      // Show toast notification via custom event
                                      window.dispatchEvent(new CustomEvent('showToast', {
                                        detail: {
                                          headerText: "Chrome Extension Download Started",
                                          subText: "Unzip the file and follow the installation instructions",
                                          color: "green"
                                        }
                                      }));
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
            
            {/* Follow-up message */}
            {followUpData && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-400">
                  {followUpData.reason}
                </p>
              </div>
            )}

            {/* API Error */}
            {apiError && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">
                  {apiError}
                </p>
              </div>
            )}
            
            {!apiResults && !apiError && !followUpData && (
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
      </div>

             {/* Column Selection Modal - Only show when ManualSearch is active */}
       {(apiResults || manualMode) && showColumnSelector && manualSearchRef.current && (
         <div className="z-[100]">
           {/* Semi-transparent overlay */}
           <div className="fixed inset-0 bg-black/60 z-[100]" />
          
                     <div 
             className="fixed inset-0 flex items-center justify-center z-[101] p-4"
             onClick={() => setShowColumnSelector(false)}
           >
             <div 
               className="bg-[#2a2a2a] border border-[#505050] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             >
              <div className="p-6">
                <h3 className="font-medium text-lg text-white mb-2">Column Selection</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Select which columns to display in your results table.
                </p>
                  
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search columns..."
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#505050] transition-all duration-200"
                  />
                </div>
                  
                <div className="max-h-60 overflow-y-auto space-y-1 mb-6">
                  {/* Select All Option */}
                  <label className="flex items-center gap-3 cursor-pointer py-3 px-4 hover:bg-[#333333] rounded-lg transition-all duration-200 border-b border-[#404040] mb-2">
                    <input
                      type="checkbox"
                      checked={manualSearchRef.current.visibleColumns.length === manualSearchRef.current.filteredAvailableColumns.length}
                      onChange={() => {
                        const { visibleColumns, filteredAvailableColumns, selectedTable } = manualSearchRef.current;
                        if (visibleColumns.length === filteredAvailableColumns.length) {
                          // Deselect all
                          manualSearchRef.current.setVisibleColumns([]);
                        } else {
                          // Select all - prioritize default columns first
                          const defaultCols = selectedTable.defaultColumns.filter(col => 
                            filteredAvailableColumns.includes(col)
                          );
                          const otherCols = filteredAvailableColumns.filter(col => 
                            !selectedTable.defaultColumns.includes(col)
                          );
                          manualSearchRef.current.setVisibleColumns([...defaultCols, ...otherCols]);
                        }
                      }}
                      className="h-4 w-4 accent-blue-500 rounded"
                    />
                    <span className="text-sm text-gray-300 font-medium">Select all</span>
                  </label>
                  
                  {manualSearchRef.current.filteredAvailableColumns.map((col) => (
                    <label key={col} className="flex items-center gap-3 cursor-pointer py-3 px-4 hover:bg-[#333333] rounded-lg transition-all duration-200">
                      <input
                        type="checkbox"
                        checked={manualSearchRef.current.visibleColumns.includes(col)}
                        onChange={() => manualSearchRef.current.toggleColumn(col)}
                        className="h-4 w-4 accent-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-300">{col}</span>
                    </label>
                  ))}
                </div>
                  
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowColumnSelector(false)}
                    className="flex-1 px-4 py-3 bg-[#404040] hover:bg-[#4a4a4a] text-white font-medium text-sm rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => manualSearchRef.current.closeColumnSelectorModal()}
                    className="flex-1 px-4 py-3 bg-[#505050] hover:bg-[#5a5a5a] text-white font-medium text-sm rounded-lg transition-all duration-200"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

             {/* Export Data Modal - Only show when ManualSearch is active */}
       {(apiResults || manualMode) && showExportSection && manualSearchRef.current && (
         <div className="z-[100]">
           {/* Semi-transparent overlay */}
           <div className="fixed inset-0 bg-black/60 z-[100]" />
          
                     <div 
             className="fixed inset-0 flex items-center justify-center z-[101] p-4"
             onClick={() => setShowExportSection(false)}
           >
             <div 
               className="bg-[#2a2a2a] border border-[#505050] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             >
              <div className="p-6">
                <h3 className="font-medium text-lg text-white mb-2">Export Data</h3>
                  
                {exporting ? (
                  <div className="text-center py-4">
                    <div className="w-full bg-[#404040] h-2 rounded-full mb-4 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-400">
                      {exportProgress}% Complete
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                      Choose how many rows to export. You'll be charged 1 token per
                      row, but only if the export completes successfully.
                    </p>
                      
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-300">Amount</div>
                        <div className="text-xs text-gray-500">Max: 200K</div>
                      </div>
                      <input
                        type="number"
                        value={rowsToExport === null ? "" : rowsToExport}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRowsToExport(val === "" ? null : Number(val));
                        }}
                        min="1"
                        max="200000"
                        placeholder="0.00"
                        className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#505050] transition-all duration-200"
                      />
                    </div>
                      
                    {exportError && (
                      <div className="mb-6 text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-3">
                        {exportError}
                      </div>
                    )}
                      
                    {!exportDone ? (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setShowExportSection(false)}
                          className="flex-1 px-4 py-3 bg-[#404040] hover:bg-[#4a4a4a] text-white font-medium text-sm rounded-lg transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => manualSearchRef.current.startExport()}
                          className="flex-1 px-4 py-3 bg-[#505050] hover:bg-[#5a5a5a] text-white font-medium text-sm rounded-lg transition-all duration-200"
                        >
                          Export
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
                  
                {exportDone && (
                  <div className="mt-6 text-sm text-green-400 bg-green-500/10 rounded-lg px-4 py-3 text-center">
                    ✅ Export completed! Opening exports...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 