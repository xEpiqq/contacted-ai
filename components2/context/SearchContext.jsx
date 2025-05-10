"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

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
  /* ---------- global UI states ---------- */
  const [manualMode, setManualMode] = useState(false);
  const [creditsScreenOpen, setCreditsScreenOpen] = useState(false);
  
  /* ---------- drawer states ---------- */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportsDrawerOpen, setExportsDrawerOpen] = useState(false);
  
  /* ---------- search results & filters ---------- */
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState([]); 
  const [pendingSearchFilters, setPendingSearchFilters] = useState([]);
  const [searchPage, setSearchPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const searchLimit = 20;
  const totalPages = Math.ceil(totalResults / searchLimit) || 1;
  
  /* ---------- exports states ---------- */
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
  
  /* ---------- brainstorm states ---------- */
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [brainstormSuggestions, setBrainstormSuggestions] = useState([]);
  const [brainstormQuery, setBrainstormQuery] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [shouldAdjustPadding, setShouldAdjustPadding] = useState(false);
  
  /* ---------- enrichment states ---------- */
  const [csvData, setCsvData] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [uploadStep, setUploadStep] = useState(0); 
  const [autoDetectedColumn, setAutoDetectedColumn] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [matchingCount, setMatchingCount] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [enrichmentComplete, setEnrichmentComplete] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState(null);
  const [enrichButtonProcessing, setEnrichButtonProcessing] = useState(false);
  const [matchingResult, setMatchingResult] = useState(null);
  
  /* ---------- toast states ---------- */
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

  // Handle selecting a suggestion in brainstorm mode
  const handleSuggestionSelect = (suggestion) => {
    if (!brainstormExamples.includes(suggestion)) {
      setBrainstormExamples(prev => [...prev, suggestion]);
    }
  };

  // Handle keyword removal
  const handleKeywordRemove = (idx) => {
    setSelectedKeywords(prev => prev.filter((_, i) => i !== idx));
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

  // The context value that will be shared
  const contextValue = {
    // UI States
    manualMode, setManualMode,
    creditsScreenOpen, setCreditsScreenOpen,
    
    // Drawer States
    drawerOpen, setDrawerOpen,
    exportsDrawerOpen, setExportsDrawerOpen,
    
    // Search Results & Filters
    searchResults, setSearchResults,
    searchFilters, setSearchFilters,
    pendingSearchFilters, setPendingSearchFilters,
    searchPage, setSearchPage,
    totalResults, setTotalResults,
    resultsLoading, setResultsLoading,
    searchLimit,
    totalPages,
    
    // Export States
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
    
    // Brainstorm States
    isProcessing, setIsProcessing,
    showSuggestions, setShowSuggestions,
    brainstormSuggestions, setBrainstormSuggestions,
    brainstormQuery, setBrainstormQuery,
    selectedKeywords, setSelectedKeywords,
    shouldAdjustPadding, setShouldAdjustPadding,
    
    // Enrichment States
    csvData, setCsvData,
    csvColumns, setCsvColumns,
    selectedColumns, setSelectedColumns,
    uploadStep, setUploadStep,
    autoDetectedColumn, setAutoDetectedColumn,
    uploadError, setUploadError,
    enrichLoading, setEnrichLoading,
    matchingCount, setMatchingCount,
    showConfirmation, setShowConfirmation,
    enrichmentComplete, setEnrichmentComplete,
    enrichmentResult, setEnrichmentResult,
    enrichButtonProcessing, setEnrichButtonProcessing,
    matchingResult, setMatchingResult,
    
    // Toast States  
    isExtensionLoading, setIsExtensionLoading,
    showExtensionToast, setShowExtensionToast,
    showEnrichmentToast, setShowEnrichmentToast,
    showEnrichmentSuccessToast, setShowEnrichmentSuccessToast,
    showUserDropdown, setShowUserDropdown,
    
    // User Data
    user, setUser,
    creditsRemaining, setCreditsRemaining,
    
    // Loading States
    loadingText, setLoadingText,
    loadingSteps, setLoadingSteps,
    blinkingEllipsisText, setBlinkingEllipsisText,
    currentStepIndex, setCurrentStepIndex,
    
    // Functions
    fetchExports,
    formatExportDate,
    formatFileSize,
    fetchSearchResults,
    handleSuggestionSelect,
    handleKeywordRemove
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext; 