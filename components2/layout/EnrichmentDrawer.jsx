"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { 
  FileUp, 
  Upload, 
  CheckCircle, 
  CirclePlus, 
  Loader, 
  Download
} from "lucide-react";
import Papa from "papaparse";
import { useSearchContext } from "../context/SearchContext";

const EnrichmentDrawer = () => {
  // Refs
  const fileInputRef = useRef(null);
  
  // Only get the absolutely necessary state from context
  const {
    drawerOpen,
    setDrawerOpen,
    setToastConfig,
    creditsRemaining,
    setCreditsRemaining
  } = useSearchContext();
  
  // Local state - moved from context
  const [uploadStep, setUploadStep] = useState(0); // 0: upload, 1: columns, 2: settings
  const [csvData, setCsvData] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [autoDetectedColumn, setAutoDetectedColumn] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [backgroundEnrichment, setBackgroundEnrichment] = useState(false); // Track background enrichment
  const [matchingCount, setMatchingCount] = useState(null);
  const [matchingResult, setMatchingResult] = useState(null); // Store full result from API
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [enrichmentComplete, setEnrichmentComplete] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState(null);
  const [enrichButtonProcessing, setEnrichButtonProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [loadingSteps, setLoadingSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const [dotAnimation, setDotAnimation] = useState('');
  
  // Close the drawer and reset all states
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    resetEnrichment();
    
    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Reset upload state
  const resetUpload = () => {
    setCsvData(null);
    setCsvColumns([]);
    setSelectedColumns([]);
    setAutoDetectedColumn(null);
    setMatchingResult(null); // Ensure this is reset when uploading a new file
    setUploadStep(0);
    setUploadError("");
  };
  
  // Reset the entire enrichment process
  const resetEnrichment = () => {
    console.log("Resetting all enrichment state"); // Debug
    resetUpload();
    setEnrichmentComplete(false);
    setEnrichmentResult(null);
    setMatchingCount(null);
    setMatchingResult(null); // Double-ensure this is reset
    setBackgroundEnrichment(false); // Ensure background enrichment state is reset
    setShowConfirmation(false);
    setEnrichButtonProcessing(false);
    setLoadingSteps([]);
    setLoadingText("");
    setDownloadInProgress(false); // Make sure download state is reset
  };
  
  // Handle file upload and parsing
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setUploadError("");
    
    console.log("New file upload, resetting states"); // Debug
    
    // Reset all states to ensure fresh start with new file
    resetEnrichment();
    
    if (file) {
      console.log(`Processing file: ${file.name}, size: ${file.size}`); // Debug
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          if (results.data && results.data.length > 0) {
            setCsvData(results.data);
            
            // Get columns and analyze them for LinkedIn URLs
            const fields = results.meta.fields || [];
            const analyzedColumns = analyzeColumnsForLinkedIn(fields, results.data);
            setCsvColumns(analyzedColumns);
            
            // Automatically select the highest-scoring column
            if (analyzedColumns.length > 0) {
              setSelectedColumns([analyzedColumns[0].name]);
              setAutoDetectedColumn(analyzedColumns[0].name); // Mark as auto-detected
              
              // Start background enrichment if we have a high-confidence match
              if (analyzedColumns[0].score > 20) {
                // Small delay to allow UI to update first
                setTimeout(() => {
                  startBackgroundEnrichment(analyzedColumns[0].name, results.data);
                }, 500);
              }
            }
            
            setUploadStep(1);
          } else {
            setUploadError("No data found in the CSV file.");
          }
        },
        error: function(error) {
          setUploadError(`Error parsing CSV: ${error.message}`);
        }
      });
    }
  };
  
  // Analyze columns to find those likely containing LinkedIn URLs
  const analyzeColumnsForLinkedIn = (columns, data) => {
    return columns.map(column => {
      // Take a sample of up to 20 rows to analyze
      const sampleSize = Math.min(20, data.length);
      const sample = data.slice(0, sampleSize);
      
      // Count occurrences of "linkedin" in this column
      let linkedinCount = 0;
      let hasUrl = false;
      
      sample.forEach(row => {
        const value = String(row[column] || '').toLowerCase();
        if (value.includes('linkedin')) {
          linkedinCount++;
        }
        if (value.includes('http') || value.includes('www.')) {
          hasUrl = true;
        }
      });
      
      // Calculate a score based on occurrences and whether it looks like a URL column
      // Higher score = more likely to be a LinkedIn URL column
      const score = linkedinCount * 10 + (hasUrl ? 5 : 0);
      
      // Check if column name itself suggests LinkedIn
      const nameScore = column.toLowerCase().includes('linkedin') ? 50 : 
                        column.toLowerCase().includes('url') || 
                        column.toLowerCase().includes('link') ? 10 : 0;
      
      return {
        name: column,
        score: score + nameScore,
        isLikely: (score + nameScore) > 0
      };
    }).sort((a, b) => b.score - a.score); // Sort by score descending
  };
  
  // New function to handle background enrichment
  const startBackgroundEnrichment = async (columnName, csvRows) => {
    if (!csvRows || !columnName) return;
    
    try {
      setBackgroundEnrichment(true);
      
      // Prepare data for enrichment
      const urls = csvRows.map(row => (row[columnName] || "").trim()).filter(Boolean);
      
      // Only do the counting/preview part in the background
      const response = await fetch("/api/people/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          linkedin_urls: urls, 
          confirm: false, 
          table_name: "all" 
        })
      });
      
      if (!response.ok) {
        // Silent fail in background mode - don't show errors to user
        setBackgroundEnrichment(false);
        return;
      }
      
      const responseData = await response.json();
      const matchCount = responseData.matchingCount || 0;
      
      // Store the results but don't show them yet
      if (matchCount > 0) {
        setMatchingResult(responseData);
        // Pre-fetch the data but don't display it until user clicks "Start Enrichment"
      }
      
      setBackgroundEnrichment(false);
    } catch (error) {
      console.error("Background enrichment error:", error);
      setBackgroundEnrichment(false);
    }
  };
  
  // Handle column selection
  const handleColumnSelect = (column) => {
    // If user is selecting a different column, clear the autoDetected status and background results
    if (!selectedColumns.includes(column)) {
      setAutoDetectedColumn(null);
      // Clear any background enrichment results
      setMatchingCount(null);
      setMatchingResult(null);
      setEnrichmentComplete(false);
    }
    // Replace selection with the new column (only one at a time)
    setSelectedColumns([column]);
  };
  
  // Get sample data from selected column
  const getColumnSamples = (columnName) => {
    if (!csvData || !columnName) return [];
    
    // Get up to 3 non-empty samples
    return csvData
      .filter(row => row[columnName] && String(row[columnName]).trim() !== '')
      .slice(0, 3)
      .map(row => row[columnName]);
  };
  
  // Handle enrichment preview
  const handleEnrichData = async () => {
    if (selectedColumns.length === 0) return;
    
    // If we have background enrichment results and the selected column is still the auto-detected one,
    // use the pre-fetched results
    if (matchingResult && selectedColumns[0] === autoDetectedColumn) {
      setEnrichLoading(true);
      setMatchingCount(matchingResult.matchingCount || 0);
      setLoadingSteps(['Matching urls with database...', `• Completed ✓ - ${matchingResult.matchingCount} matches found`, 'Adding contact information...']);
      
      // We can skip right to the actual enrichment since we already have the match count
      const urls = csvData.map(row => (row[selectedColumns[0]] || "").trim()).filter(Boolean);
      processEnrichData(urls, selectedColumns[0], matchingResult.matchingCount, ['Matching urls with database...', `• Completed ✓ - ${matchingResult.matchingCount} matches found`, 'Adding contact information...']);
      return;
    }
    
    // If no background results or user changed the column, do the regular flow
    setEnrichLoading(true);
    setMatchingCount(null);
    setLoadingSteps(['Matching urls with database...']); // Use ellipsis directly in the step text
    
    try {
      const selectedColumn = selectedColumns[0];
      const urls = csvData.map(row => (row[selectedColumn] || "").trim()).filter(Boolean);
      
      // Start both the match counting and enrichment in parallel
      let matchCountPromise = fetch("/api/people/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          linkedin_urls: urls, 
          confirm: false, 
          table_name: "all" 
        })
      }).then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error || "Failed to preview enrichment");
          });
        }
        return response.json();
      });
      
      // Wait for the match count to come back
      const matchData = await matchCountPromise;
      const matchCount = matchData.matchingCount || 0;
      
      setMatchingCount(matchCount);
      setMatchingResult(matchData);
      
      if (matchCount > 0) {
        console.log("Found matches:", matchCount, "- already started enrichment");
        
        // Update UI to show matches found
        const stepsBeforeConfirm = ['Matching urls with database...', `• Completed ✓ - ${matchCount} matches found`, 'Adding contact information...'];
        setLoadingSteps(stepsBeforeConfirm);
        
        // Immediately start the enrichment process without delay
        // Get original file name if available
        let filename = "enriched_contacts";
        if (fileInputRef.current && fileInputRef.current.files.length > 0) {
          const file = fileInputRef.current.files[0];
          filename = file.name.replace(/\.[^/.]+$/, "");
        }
        
        // Prepare data for enrichment
        const headers = Object.keys(csvData[0] || {});
        
        try {
          const enrichResponse = await fetch("/api/people/enrichment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              linkedin_urls: urls,
              csv_rows: csvData,
              csv_headers: headers,
              linkedinHeader: selectedColumn,
              prepare_export: true, // Prepare export but don't save yet
              confirm: false, // Not confirming/saving yet
              table_name: "all",
              original_filename: filename,
              row_count: matchCount
            })
          });
          
          if (!enrichResponse.ok) {
            const errorData = await enrichResponse.json();
            throw new Error(errorData.error || "Failed to process enrichment");
          }
          
          const enrichData = await enrichResponse.json();
          
          // Store enrichment result for later download
          setEnrichmentResult({
            rowsEnriched: enrichData.row_count || matchCount,
            exportId: enrichData.export_id || null,
            exportName: enrichData.exportName || `${filename} (Enriched)`,
            storage_path: enrichData.storage_path || null,
            allCols: enrichData.allCols || headers
          });
          
          // Mark enrichment as complete and update UI
          setLoadingSteps([...stepsBeforeConfirm, '• Completed ✓ added contact info']);
          setEnrichmentComplete(true);
          setEnrichLoading(false);
        } catch (enrichError) {
          console.error("Enrichment processing error:", enrichError);
          setUploadError("Error during enrichment: " + enrichError.message);
          setLoadingSteps([...stepsBeforeConfirm, '• Error during enrichment']);
          setEnrichLoading(false);
        }
      } else {
        setLoadingSteps(['Matching urls with database...', '• No matches found to enrich.']);
        setEnrichLoading(false);
      }
    } catch (error) {
      console.error("API error:", error);
      setUploadError("Error connecting to enrichment service: " + error.message);
      setLoadingSteps(['Matching urls with database...', '• Error in enrichment preview']);
      setEnrichLoading(false);
    }
  };
  
  // Process and enrich the data after matches are found
  const processEnrichData = async (urls, selectedColumn, matchCount, prevSteps) => {
    try {
      // Get original file name if available
      let filename = "enriched_contacts";
      if (fileInputRef.current && fileInputRef.current.files.length > 0) {
        const file = fileInputRef.current.files[0];
        filename = file.name.replace(/\.[^/.]+$/, "");
      }
      
      // Prepare data for enrichment
      const headers = Object.keys(csvData[0] || {});
      
      const response = await fetch("/api/people/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedin_urls: urls,
          csv_rows: csvData,
          csv_headers: headers,
          linkedinHeader: selectedColumn,
          prepare_export: true, // Prepare export but don't save yet
          confirm: false, // Not confirming/saving yet
          table_name: "all",
          original_filename: filename,
          row_count: matchCount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process enrichment");
      }
      
      const data = await response.json();
      
      // Store enrichment result for later download
      setEnrichmentResult({
        rowsEnriched: data.row_count || matchCount,
        exportId: data.export_id || null,
        exportName: data.exportName || `${filename} (Enriched)`,
        storage_path: data.storage_path || null,
        allCols: data.allCols || headers
      });
      
      // Mark enrichment as complete and update UI
      setLoadingSteps([...prevSteps, '• Completed ✓ added contact info']);
      setEnrichmentComplete(true);
      setEnrichLoading(false);
      
    } catch (error) {
      console.error("Enrichment processing error:", error);
      setUploadError("Error during enrichment: " + error.message);
      setLoadingSteps([...prevSteps, '• Error during enrichment']);
      setEnrichLoading(false);
    }
  };
  
  // Confirm enrichment and download - final step that deducts credits
  const handleConfirmEnrich = async () => {
    if (!matchingCount || !enrichmentResult || !enrichmentComplete) return;
    
    setEnrichButtonProcessing(true);
    setDownloadInProgress(true);
    
    // Remove optimistic credit update from here
    
    try {
      const selectedColumn = selectedColumns[0];
      const urls = csvData.map(row => (row[selectedColumn] || "").trim()).filter(Boolean);
      
      // Make final API call to confirm enrichment, save to exports, and deduct credits
      const response = await fetch("/api/people/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalize: true, // This triggers credit deduction and final save
          storage_path: enrichmentResult.storage_path,
          exportName: enrichmentResult.exportName,
          row_count: matchingCount, // Credits to deduct
          allCols: enrichmentResult.allCols,
          table_name: "all",
          linkedin_urls: urls
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to finalize enrichment");
      }
      
      const data = await response.json();
      
      // At this point, credits were deducted and export was saved
      console.log("Enrichment confirmed and credits deducted:", data);
      
      // Download the file using a direct blob approach
      try {
        // If we have an export_id, use that to download the file
        if (data.export_id) {
          const downloadResponse = await fetch(`/api/people/saved-exports/${data.export_id}/legit-download`);
          
          if (!downloadResponse.ok) {
            throw new Error(`Download failed with status: ${downloadResponse.status}`);
          }
          
          // Get the file content as blob
          const blob = await downloadResponse.blob();
          
          // Create a temporary link element and trigger the download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = enrichmentResult.exportName ? `${enrichmentResult.exportName}.csv` : 'enriched-data.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          // Now that download is successful, update credits in UI
          if (creditsRemaining && setCreditsRemaining && creditsRemaining >= matchingCount) {
            const newCredits = creditsRemaining - matchingCount;
            setCreditsRemaining(newCredits);
          }

          // Show toast notification before closing drawer
          setToastConfig({
            headerText: "Enriched File Saved to Exports",
            subText: "Your file has been saved and can be accessed anytime in the exports tab",
            color: "green"
          });
          setTimeout(() => setToastConfig(null), 5000);
          
          // Close drawer after short delay
          setTimeout(() => {
            handleDrawerClose();
          }, 500);
        } 
        // Fallback to using storage_path
        else if (enrichmentResult.storage_path) {
          const downloadResponse = await fetch(`/api/people/saved-exports/download-path`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storage_path: enrichmentResult.storage_path
            })
          });
          
          if (!downloadResponse.ok) {
            throw new Error("Failed to download enriched file");
          }
          
          const blob = await downloadResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${enrichmentResult.exportName || 'enriched'}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          // Now that download is successful, update credits in UI
          if (creditsRemaining && setCreditsRemaining && creditsRemaining >= matchingCount) {
            const newCredits = creditsRemaining - matchingCount;
            setCreditsRemaining(newCredits);
          }

          // Show toast notification before closing drawer
          setToastConfig({
            headerText: "Enriched File Saved to Exports",
            subText: "Your file has been saved and can be accessed anytime in the exports tab",
            color: "green"
          });
          setTimeout(() => setToastConfig(null), 5000);
          
          // Close drawer after short delay
          setTimeout(() => {
            handleDrawerClose();
          }, 500);
        } else {
          throw new Error("No download path available");
        }
      } catch (downloadError) {
        console.error("Error downloading file:", downloadError);
        setUploadError("Export saved but download failed. Please check your exports.");
        setDownloadInProgress(false);
      }
    } catch (error) {
      console.error("Error finalizing enrichment:", error);
      setUploadError("Error finalizing enrichment: " + error.message);
      setDownloadInProgress(false);
    } finally {
      setEnrichButtonProcessing(false);
    }
  };
  
  // Effect for dot animation
  useEffect(() => {
    if (!enrichLoading) {
      setDotAnimation('');
      return;
    }
    
    let isMounted = true;
    let phase = 0;
    
    const animateDots = () => {
      if (!isMounted) return;
      
      if (phase === 0) setDotAnimation('.');
      else if (phase === 1) setDotAnimation('..');
      else if (phase === 2) setDotAnimation('...');
      else if (phase === 3) setDotAnimation('..');
      else if (phase === 4) setDotAnimation('.');
      else if (phase === 5) setDotAnimation('');
      
      phase = (phase + 1) % 6;
      setTimeout(animateDots, 250);
    };
    
    animateDots();
    return () => { isMounted = false; };
  }, [enrichLoading]);
  
  // Effect to animate typing the terminal output
  useEffect(() => {
    if (!enrichLoading) return;
    
    // Initialize steps with proper formatting if needed
    if (loadingSteps.length === 0 && matchingCount === null) {
      setLoadingSteps(['Matching urls with database...']);
    }
    
    let isCancelled = false;
    let timeoutId;

    // Find the first line that is not fully typed
    let lines = loadingText.split('\n');
    let stepIndex = lines.length - 1;
    if (stepIndex < 0) stepIndex = 0;
    if (stepIndex >= loadingSteps.length) stepIndex = loadingSteps.length - 1;
    
    // Update the currentStepIndex state
    setCurrentStepIndex(stepIndex);
    
    let charIndex = lines[stepIndex]?.length || 0;

    function type() {
      if (isCancelled) return;
      // Build up all previous lines fully
      let text = '';
      if (stepIndex > 0) {
        // For completed lines, add them as they are in loadingSteps
        for (let i = 0; i < stepIndex; i++) {
          text += loadingSteps[i] + '\n';
        }
      } 

      // Current line being typed - get the current step without formatting
      const currentStep = loadingSteps[stepIndex];
      if (!currentStep) return; // Guard against undefined
      
      // Add the part of the current line that has been typed so far
      text += currentStep.substring(0, charIndex);
      
      setLoadingText(text);
      
      if (charIndex < currentStep.length) {
        charIndex++;
        // Slow down typing speed for counting/enriching - twice as slow
        const typingDelay = currentStep.includes('Matching urls with database') || currentStep.includes('Adding contact information') ? 70 : 35;
        timeoutId = setTimeout(type, typingDelay);
      } else if (stepIndex < loadingSteps.length - 1) {
        // Move to next line if there is one
        stepIndex++;
        setCurrentStepIndex(stepIndex); // Update the currentStepIndex state when advancing to next step
        charIndex = 0;
        timeoutId = setTimeout(type, 250); // Small pause before next line
      }
    }

    // Only animate if the last line is not fully typed
    if (
      lines.length < loadingSteps.length ||
      lines[lines.length - 1] !== loadingSteps[lines.length - 1]
    ) {
      type();
    }
    
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      if (!enrichLoading) {
        setLoadingText("");
      }
    };
  }, [enrichLoading, loadingSteps, loadingText, matchingCount]);
  
  useEffect(() => {
    // Reset states when drawer is opened
    if (drawerOpen) {
      // If there's an active download in progress, keep that state
      // Otherwise reset everything if we're opening from a previously closed state
      if (!downloadInProgress) {
        resetEnrichment();
      }
    }
  }, [drawerOpen]);
  
  // Add a function to go back to upload step
  const goBackToUpload = () => {
    resetEnrichment();
    
    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    setUploadStep(0);
  };
  
  // Update the back button functionality
  const handleBackButton = () => {
    if (uploadStep > 0) {
      // If we're in a step after file upload, go back to upload step
      goBackToUpload();
    } else {
      // Otherwise just close the drawer
      handleDrawerClose();
    }
  };
  
  // For the terminal view section - reorganize to show both the terminal and column selection at the same time
  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Overlay for clicking outside to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-20"
            onClick={handleDrawerClose}
          />
          
          {/* Drawer */}
          <motion.aside
            key="enrich-drawer"
            initial={{ x: -350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -350, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-96 max-w-[90vw] bg-[#2b2b2b] border-r border-[#404040] shadow-lg text-sm text-neutral-200 z-30 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#404040] p-4">
              <div className="flex items-center">
                {uploadStep > 0 && !enrichLoading && matchingCount === null && (
                  <button
                    onClick={handleBackButton}
                    className="mr-3 h-7 w-7 flex items-center justify-center rounded-full bg-[#303030] hover:bg-[#404040] transition-colors"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                )}
                <h2 className="text-base font-semibold">
                  {uploadStep === 0 
                    ? "Enrich Your Data" 
                    : (enrichLoading || matchingCount !== null)
                      ? "Enriching"
                      : "Select Column"}
                </h2>
              </div>
              <button
                aria-label="close drawer"
                onClick={handleDrawerClose}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto thin-scrollbar pb-24">
              {/* STEP 0: UPLOAD CSV */}
              {uploadStep === 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Upload a CSV with LinkedIn URLs</h3>
                  
                  {/* Traditional file upload area with dotted border */}
                  <div className="mb-6">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-[#404040] hover:border-[#606060] transition-colors rounded-md cursor-pointer w-full"
                    >
                      <Upload className="h-8 w-8 text-neutral-400" />
                      <span className="text-sm text-neutral-300">Click to upload CSV file</span>
                      <span className="text-xs text-neutral-500">File must contain LinkedIn URLs</span>
                    </label>
                  </div>
                  
                  {/* Example CSV format with before/after tables */}
                  <div className="mt-10">

                    {/* Before table */}
                    <div className="mb-4">
                      <div className="text-xs text-neutral-500 mb-1 px-1">Before</div>
                      <table className="w-full text-xs border-collapse">
                        <tbody>
                        <tr className="border-b border-[#404040]">
                            <td className="py-2 px-2">Kanye</td>
                            <td className="py-2 px-2 text-blue-400">linkedin.com/in/kanye</td>
                            <td className="py-2 px-2 text-neutral-600">{'\u00A0'.repeat(20)}</td>
                          </tr>
                        <tr>
                            <td className="py-2 px-2">Joe</td>
                            <td className="py-2 px-2 text-blue-400">linkedin.com/in/joe</td>
                            <td className="py-2 px-2 text-neutral-600">{'\u00A0'.repeat(20)}</td>
                          </tr>
                          <tr className="border-b border-[#404040]">
                            <td className="py-2 px-2">Adolf</td>
                            <td className="py-2 px-2 text-blue-400">linkedin.com/in/adolf</td>
                            <td className="py-2 px-2 text-neutral-600">{'\u00A0'.repeat(20)}</td>
                          </tr>

                        </tbody>
                      </table>
                    </div>
                    
                    {/* After table */}
                    <div>
                      <div className="text-xs text-neutral-500 mb-1 px-1">After</div>
                      <table className="w-full text-xs border-collapse">
                        <tbody>
                        <tr className="border-b border-[#404040]">
                            <td className="py-2 px-2">Kanye</td>
                            <td className="py-2 px-2 text-blue-400">linkedin.com/in/kanye</td>
                            <td className="py-2 px-2 text-green-400">kayne@yeezy.com</td>
                          </tr>
                        <tr>
                            <td className="py-2 px-2">Joe</td>
                            <td className="py-2 px-2 text-blue-400">linkedin.com/in/joe</td>
                            <td className="py-2 px-2 text-green-400">joe@mama.com</td>
                          </tr>
                          <tr className="border-b border-[#404040]">
                            <td className="py-2 px-2">Adolf</td>
                            <td className="py-2 px-2 text-blue-400">linkedin.com/in/adolf</td>
                            <td className="py-2 px-2 text-green-400">adolf@aushwitz.com</td>
                          </tr>

                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {uploadError && (
                    <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-md text-xs mt-4">
                      {uploadError}
                    </div>
                  )}
                  
                </div>
              )}
              
              {/* STEP 1: SELECT COLUMN AND TERMINAL VIEW */}
              {uploadStep === 1 && (
                <div className="space-y-4">
                  {/* Column selection heading */}
                  {!enrichLoading && matchingCount === null && <h3 className="font-medium">Which column contains LinkedIn URLs?</h3>}
                  
                  {/* When processing or has results - show terminal display */}
                  {(enrichLoading || matchingCount !== null) && (
                    <div className="min-h-[200px]">
                      {/* Terminal style display */}
                      <div className="w-full bg-[#212121]/30 rounded-md overflow-hidden">
                        <div className="p-6 font-mono text-sm min-h-[100px] text-left">
                          {/* For active loading terminal with typing animation */}
                          {enrichLoading && loadingText.split('\n').map((line, index) => {
                            const isCurrentTyping = (index === loadingText.split('\n').length - 1);
                            const isFullyTyped = index < loadingSteps.length && line === loadingSteps[index];
                            
                            // Custom styling for different message types
                            let textClass = 'text-neutral-300'; // Default: light gray text
                            
                            // Pre-assign green text for matches found and complete lines
                            if (line.includes('✓')) {
                              textClass = 'text-green-400 font-semibold'; // Green, bold
                            } else if (line.includes('Adding contact information')) {
                              textClass = 'text-neutral-200 font-medium';
                            } else if (line.includes('Error') || line.includes('No matches found')) {
                              textClass = 'text-red-400 font-semibold'; // Errors: red, bold
                            }
                            
                            return (
                              <div key={index} className={textClass}>
                                {line.endsWith('...') ? (
                                  <>
                                    {line.slice(0, -3)}
                                    {isCurrentTyping ? dotAnimation : '...'}
                                  </>
                                ) : (
                                  line
                                )}
                                {isCurrentTyping && enrichLoading && !isFullyTyped && !line.endsWith('...') && (
                                  <span className="inline-block h-4 w-2.5 bg-neutral-300 ml-0.5 animate-pulse"></span>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* For static terminal display (when processing is done) */}
                          {!enrichLoading && matchingCount !== null && (
                            <>
                              <div className="text-neutral-300">
                                Matching urls with database...
                              </div>
                              <div className="text-green-400 font-semibold">
                                • Completed ✓ - {matchingCount} matches found
                              </div>
                              {loadingSteps.some(step => step.includes('Adding contact information')) && (
                                <div className="text-neutral-200 font-medium mt-1">
                                  Adding contact information...
                                </div>
                              )}
                              {loadingSteps.some(step => step.includes('✓')) && loadingSteps.some(step => step.includes('Adding contact information')) && (
                                <div className="text-green-400 font-semibold mt-1">
                                  • Completed ✓ added contact info
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Selected columns display - always show */}
                  {!enrichLoading && matchingCount === null ? (
                    /* Only show column selection when not processing */
                    <div className="space-y-2">
                      {csvColumns.map((column, idx) => {
                        const isSelected = selectedColumns.includes(column.name);
                        const isAutoDetected = column.name === autoDetectedColumn;
                        return (
                          <div key={idx} className="space-y-1">
                            <button
                              onClick={() => handleColumnSelect(column.name)}
                              className={`p-3 rounded-md border ${
                                isSelected 
                                  ? 'bg-green-900/20 border-green-800 text-green-400' 
                                  : 'bg-[#333333]/30 border-[#404040]/30 text-white/50 hover:bg-[#333333]/50 hover:border-[#404040]/50'
                              } w-full flex justify-between items-center relative transition-colors`}
                            >
                              <div className="flex flex-col items-start">
                                <span>{column.name}</span>
                              </div>
                              {isSelected ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <CirclePlus className="h-4 w-4 text-neutral-500/30" />
                              )}
                              
                              {/* Auto-detected label */}
                              {isAutoDetected && (
                                <div className="absolute -top-2.5 right-12 text-[9px] text-neutral-200 font-medium px-1.5 bg-[#2b2b2b] rounded-sm">
                                  auto detected
                                </div>
                              )}
                            </button>
                            
                            {/* Sample data display */}
                            {isSelected && getColumnSamples(column.name).length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="ml-3 overflow-hidden"
                              >
                                <div className="border-l border-green-800/30 pl-3 py-1 space-y-1">
                                  {getColumnSamples(column.name).map((sample, i) => (
                                    <div key={i} className="text-xs text-neutral-400 truncate max-w-full">
                                      {sample}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Reset button - only show when in column selection state */}
                      <div className="mt-6 flex justify-end items-center">
                        <button 
                          onClick={resetUpload}
                          className="text-xs text-neutral-500 hover:text-neutral-300"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* After column selection, show nothing in this area */
                    null
                  )}
                  
                  {uploadError && (
                    <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-md text-xs">
                      {uploadError}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Fixed bottom-of-drawer buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#2b2b2b] border-t border-[#404040] shadow-lg">
              {/* When in column selection, show "Start Enrichment" button */}
              {csvData && uploadStep === 1 && !enrichLoading && matchingCount === null && (
                <button 
                  onClick={handleEnrichData}
                  disabled={selectedColumns.length === 0 || enrichButtonProcessing}
                  className="w-full py-3 text-sm rounded-md bg-[#404040] hover:bg-[#4a4a4a] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enrichButtonProcessing ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Start Enrichment</span>
                    </>
                  )}
                </button>
              )}
              
              {/* When enrichment is loading or complete, show "Confirm & Download" button */}
              {(enrichLoading || matchingCount !== null) && (
                <div className="flex flex-col items-center w-full">
                  <button
                    onClick={handleConfirmEnrich}
                    className="w-full py-3 text-sm rounded-md bg-[#404040] hover:bg-[#4a4a4a] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={!enrichmentComplete || downloadInProgress}
                  >
                    {downloadInProgress ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        <span>Downloading...</span>
                      </>
                    ) : enrichmentComplete && matchingCount > 0 ? (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        <span>Export File <span className="text-white/60">({matchingCount} credits)</span></span>
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        <span>Export File</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default EnrichmentDrawer; 