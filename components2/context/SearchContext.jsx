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
  const [guideOpen, setGuideOpen] = useState(true);
  
  /* ---------- search flow states ---------- */
  const [currentStep, setCurrentStep] = useState(0);
  const [answerType, setAnswerType] = useState("");
  const [brainstorm, setBrainstorm] = useState(false);
  
  /* ---------- drawer states ---------- */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportsDrawerOpen, setExportsDrawerOpen] = useState(false);
  
  /* ---------- search results & filters ---------- */
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState([]); 
  const [pendingSearchFilters, setPendingSearchFilters] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const searchLimit = 20;
  
  /* ---------- toast states ---------- */
  const [isExtensionLoading, setIsExtensionLoading] = useState(false);
  const [toastConfig, setToastConfig] = useState(null); // { headerText, subText, color }
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  /* ---------- user data states ---------- */
  const [user, setUser] = useState(null);
  const [creditsRemaining, setCreditsRemaining] = useState(2482);

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

  // Fetch search results with initial data
  const fetchSearchResults = async () => {
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
      setTotalResults(mockResults.length); // Mock total
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  // The context value that will be shared
  const contextValue = {
    // UI States
    manualMode, setManualMode,
    creditsScreenOpen, setCreditsScreenOpen,
    
    // Guide States
    guideOpen, setGuideOpen,
    
    // Search Flow States
    currentStep, setCurrentStep,
    answerType, setAnswerType,
    brainstorm, setBrainstorm,
    
    // Drawer States
    drawerOpen, setDrawerOpen,
    exportsDrawerOpen, setExportsDrawerOpen,
    
    // Search Results & Filters
    searchResults, setSearchResults,
    searchFilters, setSearchFilters,
    pendingSearchFilters, setPendingSearchFilters,
    totalResults, setTotalResults,
    searchLimit,
    
    // Toast States  
    isExtensionLoading, setIsExtensionLoading,
    toastConfig, setToastConfig,
    showUserDropdown, setShowUserDropdown,
    
    // User Data
    user, setUser,
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