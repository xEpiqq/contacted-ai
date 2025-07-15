"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  
  /* ---------- guide state ---------- */
  // Removed guideOpen and setGuideOpen since we're handling it in the Guide component
  
  /* ---------- search flow states ---------- */
  const [currentStep, setCurrentStep] = useState(0);
  const [answerType, setAnswerType] = useState("");
  const [brainstorm, setBrainstorm] = useState(false);
  
  /* ---------- drawer states ---------- */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportsDrawerOpen, setExportsDrawerOpen] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  
  /* ---------- search results & filters ---------- */
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState([]); 
  const [pendingSearchFilters, setPendingSearchFilters] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const searchLimit = 20;
  
  /* ---------- filter drawer state ---------- */
  const [filterDrawerData, setFilterDrawerData] = useState({
    availableColumns: [],
    pendingFilters: [],
    selectedTable: null,
    onApplyFilters: null,
    onClose: null
  });
  
  /* ---------- toast states ---------- */
  const [isExtensionLoading, setIsExtensionLoading] = useState(false);
  const [toastConfig, setToastConfig] = useState(null); // { headerText, subText, color }
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  /* ---------- user data states ---------- */
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [creditsRemaining, setCreditsRemaining] = useState(2482);

  // Function to navigate to a specific step
  const navigateToStep = (targetStep) => {
    // Only allow navigation to steps 0-3
    if (targetStep >= 0 && targetStep <= 3) {
      setCurrentStep(targetStep);
    }
  };

  // Fetch user data from Supabase when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          
          // Fetch user profile from profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
            
            // Calculate credits
            const subscriptionUsed = profileData.tokens_used || 0;
            const subscriptionTotal = profileData.tokens_total || 0;
            const oneTime = profileData.one_time_credits || 0;
            const oneTimeUsed = profileData.one_time_credits_used || 0;
            
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

  // Fetch search results with initial data
  const fetchSearchResults = async () => {
    try {
      // In a real app, you would make an API call to fetch results
      // For now, we'll simulate loading with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // No dummy data; real implementation should set results here when available
      setSearchResults([]);
      setTotalResults(0);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  // The context value that will be shared
  const contextValue = {
    // UI States
    manualMode, setManualMode,
    creditsScreenOpen, setCreditsScreenOpen,
    
    // Guide States removed
    
    // Search Flow States
    currentStep, setCurrentStep,
    navigateToStep,
    answerType, setAnswerType,
    brainstorm, setBrainstorm,
    
    // Drawer States
    drawerOpen, setDrawerOpen,
    exportsDrawerOpen, setExportsDrawerOpen,
    filtersDrawerOpen, setFiltersDrawerOpen,
    
    // Search Results & Filters
    searchResults, setSearchResults,
    searchFilters, setSearchFilters,
    pendingSearchFilters, setPendingSearchFilters,
    totalResults, setTotalResults,
    searchLimit,
    
    // Filter Drawer Data
    filterDrawerData, setFilterDrawerData,
    
    // Toast States  
    isExtensionLoading, setIsExtensionLoading,
    toastConfig, setToastConfig,
    showUserDropdown, setShowUserDropdown,
    
    // User Data
    user, setUser,
    profile, setProfile,
    creditsRemaining, setCreditsRemaining,
    
    // Functions
    fetchSearchResults
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext; 