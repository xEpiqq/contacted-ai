"use client";

import React, { useState, useRef, useEffect } from "react";
import { Loader } from "lucide-react";

function TokensInput({
  tokens = [],
  setTokens,
  pendingText = "",
  setPendingText,
  column = "",
  tableName = "usa4_new_v2"
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch suggestions from API
  const fetchSuggestions = async () => {
    if (!column || column === "") return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        table_name: tableName,
        column,
        limit: "30" // Limit to prevent overwhelming the UI
      });
      
      // Mock API response for demo purposes
      // In real implementation, this would be a fetch call to your API
      // const response = await fetch(`/api/public-people/distinct-values?${params}`);
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock response based on column
      let mockSuggestions = [];
      if (column === "Job title") {
        mockSuggestions = [
          "Software Engineer", 
          "Product Manager", 
          "Marketing Director", 
          "CEO", 
          "CFO", 
          "CTO",
          "Sales Representative",
          "Account Manager",
          "Director of Operations",
          "HR Manager"
        ];
      } else if (column === "Industry") {
        mockSuggestions = [
          "Technology",
          "Healthcare",
          "Finance",
          "Education",
          "Manufacturing",
          "Retail",
          "Construction",
          "Transportation",
          "Energy",
          "Hospitality"
        ];
      } else if (column === "Company") {
        mockSuggestions = [
          "Google",
          "Microsoft",
          "Apple",
          "Amazon",
          "Facebook",
          "Netflix",
          "Tesla",
          "IBM",
          "Oracle",
          "Salesforce"
        ];
      } else if (column === "State") {
        mockSuggestions = [
          "California",
          "New York",
          "Texas",
          "Florida",
          "Illinois",
          "Pennsylvania",
          "Ohio",
          "Michigan",
          "Georgia",
          "North Carolina"
        ];
      } else {
        mockSuggestions = [
          "Value 1",
          "Example 2",
          "Sample 3",
          "Test 4",
          "Demo 5"
        ];
      }
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter suggestions based on pendingText
  const filtered = suggestions
    .filter(s => s && s.toLowerCase().includes(pendingText.toLowerCase()))
    .slice(0, 10); // Limit to 10 visible results for better performance

  /* Handlers */
  function handleFocus() {
    setShowSuggestions(true);
    if (suggestions.length === 0) {
      fetchSuggestions();
    }
  }
  
  function handleBlur() {
    setTimeout(() => {
      if (
        !dropdownRef.current ||
        !dropdownRef.current.contains(document.activeElement)
      ) {
        setShowSuggestions(false);
      }
    }, 150);
  }
  
  function handleKeyDown(e) {
    if (e.key === "Enter" && pendingText.trim() !== "") {
      e.preventDefault();
      addToken(pendingText.trim());
      setPendingText("");
    }
  }
  
  function addToken(tok) {
    if (tok && !tokens.includes(tok)) setTokens([...tokens, tok]);
  }
  
  function removeToken(tok) {
    setTokens(tokens.filter((t) => t !== tok));
  }

  // Fetch new suggestions when column changes
  useEffect(() => {
    setSuggestions([]);
    if (column) {
      fetchSuggestions();
    }
  }, [column]);

  /* Render */
  return (
    <div className="relative">
      {/* tokens */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tokens.map((t, i) => (
          <div 
            key={i} 
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#303030] text-sm text-blue-400 border border-blue-900/30"
          >
            <span>{t}</span>
            <button
              onClick={() => removeToken(t)}
              className="text-neutral-500 hover:text-neutral-300 leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center bg-[#252525] border border-[#3a3a3a] rounded-md overflow-hidden">
        <input
          value={pendingText}
          onChange={(e) => setPendingText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Type a value and press Enter"
          className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-neutral-200"
        />
      </div>
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-[#252525] border border-[#3a3a3a] rounded-md shadow-md max-h-48 overflow-auto"
        >
          {isLoading ? (
            <div className="p-3 text-sm text-neutral-500 flex items-center justify-center">
              <div className="h-4 w-4 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin mr-2"></div>
              Loading suggestions...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((item, i) => (
              <div
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addToken(item);
                }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-[#303030] text-neutral-200"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-neutral-500">
              {pendingText ? "No matching suggestions" : "Start typing to search"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TokensInput; 