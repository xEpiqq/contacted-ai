"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { closestType } from "../core/utils";

// Create context
const SearchContext = createContext(null);

// Custom hook to use the search context
export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchContext must be used within a SearchContextProvider");
  }
  return context;
};

export const SearchContextProvider = ({ children }) => {
  /* ---------- step states ---------- */
  const [currentStep, setCurrentStep] = useState(0); // 0,1,2 → displayed as 1,2,3
  const [answerType, setAnswerType] = useState("");
  const [text, setText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [exactMatch, setExactMatch] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const [headingText, setHeadingText] = useState(""); // For dynamic headings

  /* ---------- selection states ---------- */
  const [selectedExamples, setSelectedExamples] = useState([]);
  const [brainstormExamples, setBrainstormExamples] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [showIndustryExamples, setShowIndustryExamples] = useState(true);
  const [brainstorm, setBrainstorm] = useState(false);
  
  /* ---------- UI states ---------- */
  const [shouldAdjustPadding, setShouldAdjustPadding] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [suggestActive, setSuggestActive] = useState(false);
  
  /* ---------- brainstorm states ---------- */
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [brainstormSuggestions, setBrainstormSuggestions] = useState([]);
  const [brainstormQuery, setBrainstormQuery] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  
  /* ---------- drawer states ---------- */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [uploadStep, setUploadStep] = useState(0); // 0: upload, 1: columns, 2: settings
  const [autoDetectedColumn, setAutoDetectedColumn] = useState(null);
  const [uploadError, setUploadError] = useState("");
  
  /* ---------- manual search states ---------- */
  const [manualMode, setManualMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState([]); 
  const [pendingSearchFilters, setPendingSearchFilters] = useState([]);
  const [searchPage, setSearchPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const searchLimit = 20;
  
  /* ---------- exports states ---------- */
  const [exportsDrawerOpen, setExportsDrawerOpen] = useState(false);
  const [activeExport, setActiveExport] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newExportName, setNewExportName] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [exports, setExports] = useState([]);
  const [exportsLoading, setExportsLoading] = useState(false);
  const [exportsError, setExportsError] = useState("");
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const [exportsFetched, setExportsFetched] = useState(false);
  
  /* ---------- enrichment states ---------- */
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [matchingCount, setMatchingCount] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [enrichmentComplete, setEnrichmentComplete] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState(null);
  const [enrichButtonProcessing, setEnrichButtonProcessing] = useState(false);
  const [matchingResult, setMatchingResult] = useState(null);
  
  /* ---------- toast states ---------- */
  const [creditsScreenOpen, setCreditsScreenOpen] = useState(false);
  const [isExtensionLoading, setIsExtensionLoading] = useState(false);
  const [showExtensionToast, setShowExtensionToast] = useState(false);
  const [showEnrichmentToast, setShowEnrichmentToast] = useState(false);
  const [showEnrichmentSuccessToast, setShowEnrichmentSuccessToast] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  /* ---------- user data states ---------- */
  const [user, setUser] = useState(null);
  const [creditsRemaining, setCreditsRemaining] = useState(2482);
  
  /* ---------- loading states ---------- */
  const [loadingText, setLoadingText] = useState("");
  const [loadingSteps, setLoadingSteps] = useState([]);
  const [blinkingEllipsisText, setBlinkingEllipsisText] = useState("Counting matches");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Constants 
  const words = ["people", "local biz"];
  const totalPages = Math.ceil(totalResults / searchLimit) || 1;
  
  // Check if user has text or badges selected
  const hasText = text.trim().length > 0;
  const hasBadges = 
    (currentStep === 1 && 
     answerType === "people" && 
     ((brainstorm && brainstormExamples.length > 0) || 
      (!brainstorm && selectedExamples.length > 0))) || 
    (currentStep === 2 && selectedIndustries.length > 0);
  const canProceed = hasText || hasBadges;

  // Update heading text when step or answer type changes
  useEffect(() => {
    if (currentStep === 0) {
      setHeadingText("");
    } else if (currentStep === 1) {
      if (answerType === "people") {
        setHeadingText(brainstorm ? "Brainstorm Job Titles" : "Job Title");
      } else {
        setHeadingText("Local Business Type");
      }
    } else if (currentStep === 2) {
      setHeadingText("Industry");
    }
  }, [currentStep, answerType, brainstorm]);
  
  // Fetch user data from Supabase when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          
          // Fetch user profile from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
            
          if (profile) {
            // Calculate credits
            const subscriptionUsed = profile.tokens_used || 0;
            const subscriptionTotal = profile.tokens_total || 0;
            const oneTime = profile.one_time_credits || 0;
            const oneTimeUsed = profile.one_time_credits_used || 0;
            
            const totalUsed = subscriptionUsed + oneTimeUsed;
            const totalAll = subscriptionTotal + oneTime;
            const remaining = totalAll - totalUsed;
            
            setCreditsRemaining(remaining);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, []);

  // Process text input and add to appropriate selections
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    // Handle auto-suggestion for job titles
    if (currentStep === 1 && !brainstorm && answerType === "people") {
      const lastCommaIndex = newText.lastIndexOf(",");
      const lastTermRaw = lastCommaIndex >= 0 ? newText.slice(lastCommaIndex + 1) : newText;
      const lastTerm = lastTermRaw.trim().toLowerCase();
      
      if (lastTerm.length >= 2) {
        // Simple example, in a real app this would likely be more sophisticated
        const jobExamples = ["manager", "director", "engineer", "sales representative", "consultant"];
        const match = jobExamples.find(job => 
          job.toLowerCase().startsWith(lastTerm) && job.toLowerCase() !== lastTerm
        );
        
        if (match) {
          setSuggestion(match.slice(lastTerm.length));
          setSuggestActive(true);
        } else {
          setSuggestion("");
          setSuggestActive(false);
        }
      } else {
        setSuggestion("");
        setSuggestActive(false);
      }
    }
  };

  // Handle key down events, like tab for auto-complete and Enter for submission
  const handleKeyDown = (e) => {
    // Handle tab for auto-completion
    if (e.key === "Tab" && suggestion && suggestActive) {
      e.preventDefault();
      const lastCommaIndex = text.lastIndexOf(",");
      const prefix = lastCommaIndex >= 0 ? text.slice(0, lastCommaIndex + 1) : "";
      const lastTerm = lastCommaIndex >= 0 ? text.slice(lastCommaIndex + 1) : text;
      const fullTerm = lastTerm.trim() + suggestion;
      
      setText(prefix + (prefix ? " " : "") + fullTerm);
      setSuggestion("");
      setSuggestActive(false);
    }
    
    // Handle enter to submit
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canProceed) {
        handleSubmit(currentStep);
      }
    }
  };

  // Process text input and move to next step
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
        prev.filter(item => item !== example)
      );
    } else if (isBrainstorm || brainstorm) {
      setBrainstormExamples(prev => 
        prev.filter(item => item !== example)
      );
    } else {
      setSelectedExamples(prev => 
        prev.filter(item => item !== example)
      );
    }
  };

  // Handle selecting a suggestion in brainstorm mode
  const handleSuggestionSelect = (suggestion) => {
    if (!brainstormExamples.includes(suggestion)) {
      setBrainstormExamples(prev => [...prev, suggestion]);
    }
  };

  // Toggle brainstorm mode
  const handleBrainstormToggle = (value) => {
    setBrainstorm(value);
    // Clear the text input when toggling modes
    setText("");
    setSuggestion("");
    setSuggestActive(false);
  };

  // Handle going back to previous step
  const handleBack = (targetStep) => {
    setCurrentStep(targetStep);
    
    // Clear text input when going back
    setText("");
    setSuggestion("");
    setSuggestActive(false);
    
    // If going back to step 0, reset everything
    if (targetStep === 0) {
      setAnswerType("");
      setSelectedExamples([]);
      setBrainstormExamples([]);
      setSelectedIndustries([]);
    }
  };

  // Handle selecting search type and moving to step 1
  const handleNextStep = (type) => {
    const typeLower = type.toLowerCase();
    setAnswerType(closestType(typeLower));
    setCurrentStep(1);
  };

  // Mock function for search submission
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

  // Fetch exports data when needed
  const fetchExports = useCallback(async () => {
    setExportsLoading(true);
    setExportsError("");
    
    try {
      const response = await fetch("/api/people/saved-exports");
      
      if (!response.ok) {
        throw new Error("Failed to fetch exports");
      }
      
      const data = await response.json();
      
      if (data.exports) {
        // Format the date for display
        const formattedExports = data.exports.map(exp => ({
          ...exp,
          displayDate: formatExportDate(exp.created_at),
          displaySize: formatFileSize(exp.row_count * 200) // Estimate file size based on rows
        }));
        
        setExports(formattedExports);
        setExportsFetched(true);
        return formattedExports;
      } else {
        setExports([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching exports:", error);
      setExportsError("Failed to load your exports. Please try again.");
      return [];
    } finally {
      setExportsLoading(false);
    }
  }, []);

  // Helper function to format date for display
  const formatExportDate = (dateString) => {
    if (!dateString) return "Unknown date";
    
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return "Today";
    }
    
    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // Otherwise return MMM DD, YYYY format
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Helper function to format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "Unknown";
    
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${Math.round(kb)} KB`;
    }
    
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Function to handle file uploads
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setUploadError("");
    
    if (file) {
      // Use Papa Parse to parse CSV
      // This is a mock implementation - in the real app, you'd use the actual library
      try {
        // Simulate CSV parsing
        setTimeout(() => {
          // Mock CSV data and columns
          const mockData = [
            {
              "Name": "John Smith",
              "LinkedIn URL": "linkedin.com/in/johnsmith",
              "Email": ""
            },
            {
              "Name": "Jane Doe",
              "LinkedIn URL": "linkedin.com/in/janedoe",
              "Email": ""
            },
            {
              "Name": "Alex Johnson",
              "LinkedIn URL": "linkedin.com/in/alexjohnson",
              "Email": ""
            }
          ];
          
          setCsvData(mockData);
          
          // Extract columns
          const columns = Object.keys(mockData[0]);
          setCsvColumns(columns);
          
          // Auto-detect LinkedIn URL column
          const linkedInColumn = columns.find(col => 
            col.toLowerCase().includes("linkedin") || 
            col.toLowerCase().includes("url")
          );
          
          if (linkedInColumn) {
            setSelectedColumns([linkedInColumn]);
            setAutoDetectedColumn(linkedInColumn);
          }
          
          // Move to column selection step
          setUploadStep(1);
        }, 500);
      } catch (error) {
        setUploadError("Error parsing CSV file");
      }
    }
  };

  // Handle column selection
  const handleColumnSelect = (column) => {
    // If user is selecting a different column, clear the autoDetected status
    if (!selectedColumns.includes(column)) {
      setAutoDetectedColumn(null);
    }
    // Replace selection with the new column (only one at a time)
    setSelectedColumns([column]);
  };

  // Move to the next step of the enrichment process
  const handleContinue = () => {
    if (selectedColumns.length > 0) {
      setUploadStep(2);
    }
  };

  // Get sample data from the selected column
  const getColumnSamples = (columnName) => {
    if (!csvData || !columnName) return [];
    
    // Get up to 3 non-empty samples
    return csvData
      .filter(row => row[columnName] && String(row[columnName]).trim() !== '')
      .slice(0, 3)
      .map(row => row[columnName]);
  };

  // Start the enrichment process
  const handleEnrichData = async () => {
    if (selectedColumns.length === 0) return;
    
    setEnrichLoading(true);
    setMatchingCount(null);
    setMatchingResult(null);
    setLoadingSteps(['Counting matches...']);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response
      const mockCount = Math.floor(Math.random() * 2) + 2; // 2-3 matches
      setMatchingCount(mockCount);
      setMatchingResult({ matchCount: mockCount });
      
      // Add steps for terminal visualization
      setLoadingSteps(['Counting matches...', `• Found ${mockCount} matches`, 'Enriching data...']);
      
      // Auto-continue to enrichment after a delay
      setTimeout(() => {
        setLoadingSteps(['Counting matches...', `• Found ${mockCount} matches`, 'Enriching data...', '• Complete']);
        setEnrichmentComplete(true);
        setEnrichLoading(false);
      }, 1500);
      
    } catch (error) {
      setUploadError("Error checking for matches");
      setLoadingSteps(['Counting matches...', '• Error in enrichment preview']);
      setEnrichLoading(false);
    }
  };

  // Confirm and complete the enrichment process
  const handleConfirmEnrich = async (matchingResultParam, matchCountParam, prevLoadingSteps) => {
    const countToUse = matchCountParam || matchingCount;
    
    if (selectedColumns.length === 0 || !countToUse) {
      console.error("Missing matchingCount or selected column");
      return;
    }
    
    setEnrichButtonProcessing(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock enrichment result
      setEnrichmentResult({
        matchesCount: countToUse,
        exportName: "LinkedIn Contacts (Enriched)"
      });
      
      // Deduct credits
      setCreditsRemaining(prev => Math.max(0, prev - countToUse));
      
      // Show success toast
      setShowEnrichmentSuccessToast(true);
      setTimeout(() => setShowEnrichmentSuccessToast(false), 5000);
      
      // Close the drawer after successful enrichment
      setDrawerOpen(false);
      
    } catch (error) {
      setUploadError("Error in enrichment process");
    } finally {
      setEnrichButtonProcessing(false);
    }
  };

  // Close the drawer and reset all enrichment state
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    resetEnrichment();
  };

  // Reset upload state
  const resetUpload = () => {
    setCsvData(null);
    setCsvColumns([]);
    setSelectedColumns([]);
    setAutoDetectedColumn(null);
    setUploadStep(0);
    setUploadError("");
  };

  // Reset the entire enrichment process
  const resetEnrichment = () => {
    resetUpload();
    setEnrichmentComplete(false);
    setEnrichmentResult(null);
    setMatchingCount(null);
    setMatchingResult(null);
    setShowConfirmation(false);
    setEnrichButtonProcessing(false);
    setLoadingSteps([]);
    setLoadingText("");
  };

  // Reset all state for a new search
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
    setSearchPage(0);
    setTotalResults(0);
    setExactMatch(false);
    setSelectedKeywords([]);
    setBrainstormSuggestions([]);
    setShowSuggestions(false);
    setSuggestion("");
    setSuggestActive(false);
  };

  // Functions for exports management
  const handleDeleteExport = (id) => {
    setPendingDeleteId(id);
    setShowExportOptions(false);
  };
  
  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    
    // Store the export being deleted for rollback if needed
    const deletedExport = exports.find(e => e.id === pendingDeleteId);
    
    // Optimistic update - remove from UI immediately
    setExports(exports.filter(exp => exp.id !== pendingDeleteId));
    setPendingDeleteId(null);
    
    // In a real app, you would make an API call here to delete the export permanently
  };
  
  const cancelDelete = () => {
    setPendingDeleteId(null);
  };
  
  const handleRenameExport = (id) => {
    const exportItem = exports.find(exp => exp.id === id);
    if (exportItem) {
      setNewExportName(exportItem.name);
      setIsRenaming(true);
      setActiveExport(id);
      setShowExportOptions(false);
    }
  };
  
  const confirmRename = async () => {
    if (!newExportName.trim() || !activeExport) return;
    
    // Optimistic update - update the UI immediately
    setExports(exports.map(exp => 
      exp.id === activeExport 
        ? { ...exp, name: newExportName.trim() } 
        : exp
    ));
    
    // Reset the renaming state
    setIsRenaming(false);
    setNewExportName("");
    
    // In a real app, you would make an API call here to update the export name on the server
  };
  
  const handleDownloadExport = async (id) => {
    if (downloadInProgress) return;
    
    setDownloadInProgress(true);
    
    try {
      // In a real app, you would make an API call to download the export
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("Export downloaded successfully!");
    } catch (error) {
      console.error("Error downloading export:", error);
    } finally {
      setDownloadInProgress(false);
    }
  };
  
  // Fetch search results with pagination
  const fetchSearchResults = async (page = 0) => {
    setResultsLoading(true);
    setSearchPage(page);
    
    try {
      // In a real app, you would make an API call to fetch results
      // For now, we'll simulate loading with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      const mockResults = [
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
      ];
      
      setSearchResults(mockResults);
      setTotalResults(mockResults.length + (page * searchLimit)); // Mock total
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setResultsLoading(false);
    }
  };
  
  // The context value that will be shared
  const contextValue = {
    // State
    currentStep, setCurrentStep,
    answerType, setAnswerType,
    text, setText,
    displayedText, setDisplayedText,
    wordIndex, setWordIndex,
    isDeleting, setIsDeleting,
    showExamples, setShowExamples,
    exactMatch, setExactMatch,
    guideOpen, setGuideOpen,
    headingText, setHeadingText,
    selectedExamples, setSelectedExamples,
    brainstormExamples, setBrainstormExamples,
    selectedIndustries, setSelectedIndustries,
    showIndustryExamples, setShowIndustryExamples,
    brainstorm, setBrainstorm,
    shouldAdjustPadding, setShouldAdjustPadding,
    suggestion, setSuggestion,
    suggestActive, setSuggestActive,
    isProcessing, setIsProcessing,
    showSuggestions, setShowSuggestions,
    brainstormSuggestions, setBrainstormSuggestions,
    brainstormQuery, setBrainstormQuery,
    selectedKeywords, setSelectedKeywords,
    drawerOpen, setDrawerOpen,
    csvData, setCsvData,
    csvColumns, setCsvColumns,
    selectedColumns, setSelectedColumns,
    uploadStep, setUploadStep,
    autoDetectedColumn, setAutoDetectedColumn,
    uploadError, setUploadError,
    manualMode, setManualMode,
    searchResults, setSearchResults,
    searchFilters, setSearchFilters,
    pendingSearchFilters, setPendingSearchFilters,
    searchPage, setSearchPage,
    totalResults, setTotalResults,
    resultsLoading, setResultsLoading,
    searchLimit,
    totalPages,
    exportsDrawerOpen, setExportsDrawerOpen,
    activeExport, setActiveExport,
    showExportOptions, setShowExportOptions,
    isRenaming, setIsRenaming,
    newExportName, setNewExportName,
    pendingDeleteId, setPendingDeleteId,
    exports, setExports,
    exportsLoading, setExportsLoading,
    exportsError, setExportsError,
    downloadInProgress, setDownloadInProgress,
    exportsFetched, setExportsFetched,
    enrichLoading, setEnrichLoading,
    matchingCount, setMatchingCount,
    showConfirmation, setShowConfirmation,
    enrichmentComplete, setEnrichmentComplete,
    enrichmentResult, setEnrichmentResult,
    enrichButtonProcessing, setEnrichButtonProcessing,
    matchingResult, setMatchingResult,
    creditsScreenOpen, setCreditsScreenOpen,
    isExtensionLoading, setIsExtensionLoading,
    showExtensionToast, setShowExtensionToast,
    showEnrichmentToast, setShowEnrichmentToast,
    showEnrichmentSuccessToast, setShowEnrichmentSuccessToast,
    showUserDropdown, setShowUserDropdown,
    user, setUser,
    creditsRemaining, setCreditsRemaining,
    loadingText, setLoadingText,
    loadingSteps, setLoadingSteps,
    blinkingEllipsisText, setBlinkingEllipsisText,
    currentStepIndex, setCurrentStepIndex,
    words,
    hasText, hasBadges, canProceed,
    
    // Functions
    fetchExports,
    formatExportDate,
    formatFileSize,
    handleResetSearch,
    handleTextChange,
    handleKeyDown,
    handleSubmit,
    handleExampleClick,
    handleBadgeRemove,
    handleBrainstormToggle,
    handleBack,
    handleNextStep,
    handleSuggestionSelect,
    handleFileUpload,
    handleColumnSelect,
    handleContinue,
    getColumnSamples,
    handleEnrichData,
    handleConfirmEnrich,
    handleDrawerClose,
    resetUpload,
    resetEnrichment,
    handleDeleteExport,
    confirmDelete,
    cancelDelete,
    handleRenameExport,
    confirmRename,
    handleDownloadExport,
    fetchSearchResults
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext; 