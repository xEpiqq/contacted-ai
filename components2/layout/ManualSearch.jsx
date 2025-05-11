"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchContext } from "../context/SearchContext";
import { motion } from "framer-motion";
import { ChevronLeftIcon, Search, ListFilter, CheckCircle, PlusCircle, Trash2, Loader } from "lucide-react";
import { Combobox } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";

// TokensInput component embedded directly
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

function ManualSearch() {
  const {
    pendingSearchFilters,
    setPendingSearchFilters,
    searchFilters,
    searchResults,
    resultsLoading,
    searchPage,
    totalResults,
    totalPages,
    searchLimit,
    setManualMode,
    fetchSearchResults
  } = useSearchContext();

  // Available columns for search - these match what's actually in the database
  const columns = [
    "Full name",
    "Job title",
    "Emails",
    "Phone numbers",
    "Company",
    "City",
    "State",
    "Industry",
    "LinkedIn URL"
  ];

  // Available conditions for filters
  const conditions = [
    "contains",
    "does not contain",
    "is exactly",
    "is not",
    "is empty",
    "is not empty"
  ];

  // Available subops (AND/OR/WHERE) for filter lines
  const subops = ["WHERE", "AND", "OR"];

  // Handle exit from manual mode
  const onExit = () => {
    setManualMode(false);
  };
  
  // Apply filters and search
  const onApplyFilters = () => {
    // Update the actual search filters from pending
    fetchSearchResults(0);
  };
  
  // Add new filter line
  const addFilterLine = () => {
    setPendingSearchFilters([
      ...pendingSearchFilters,
      {
        column: "",
        condition: "contains",
        tokens: [],
        pendingText: "",
        subop: pendingSearchFilters.length > 0 ? "AND" : "WHERE"
      }
    ]);
  };
  
  // Remove filter line
  const removeFilterLine = (i) => {
    const newFilters = [...pendingSearchFilters];
    newFilters.splice(i, 1);
    
    // Update subops if first line is removed
    if (i === 0 && newFilters.length > 0) {
      newFilters[0].subop = "WHERE";
    }
    
    setPendingSearchFilters(newFilters);
  };
  
  // Update filter line field
  const updateFilterLine = (i, field, val) => {
    const newFilters = [...pendingSearchFilters];
    newFilters[i][field] = val;
    
    // Reset tokens when changing column
    if (field === 'column') {
      newFilters[i].tokens = [];
    }
    
    // When switching to "is empty" or "is not empty", clear tokens
    if (field === 'condition' && (val === 'is empty' || val === 'is not empty')) {
      newFilters[i].tokens = [];
    }
    
    setPendingSearchFilters(newFilters);
  };
  
  // Update filter tokens
  const updateFilterTokens = (i, tokens) => {
    const newFilters = [...pendingSearchFilters];
    newFilters[i].tokens = tokens;
    setPendingSearchFilters(newFilters);
  };
  
  // Update filter pending text
  const updateFilterPendingText = (i, text) => {
    const newFilters = [...pendingSearchFilters];
    newFilters[i].pendingText = text;
    setPendingSearchFilters(newFilters);
  };
  
  // Helper to format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  // Local state for column search
  const [columnSearch, setColumnSearch] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-[#212121] z-20 flex flex-col"
    >
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#404040]">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="h-8 w-8 rounded-full flex items-center justify-center bg-[#303030] hover:bg-[#3a3a3a] transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 text-neutral-400" />
          </button>
          <div>
            <h1 className="text-lg font-medium text-white">Manual Search Mode</h1>
            <p className="text-xs text-neutral-500">
              Database: USA | 31,177,584 contacts
              {searchFilters.length > 0 && (
                <span className="ml-2 text-green-400">
                  • {formatNumber(totalResults)} matching 
                  <span className="text-neutral-400"> ({((totalResults / 31177584) * 100).toFixed(2)}%)</span>
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onApplyFilters}
            disabled={resultsLoading}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-sm text-white transition-colors flex items-center gap-1"
          >
            {resultsLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>
                  {pendingSearchFilters.length > 0 ? 
                    `Search with ${pendingSearchFilters.length} filter${pendingSearchFilters.length > 1 ? 's' : ''}` : 
                    'Search'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 h-[calc(100vh-58px)]">
        {/* Left sidebar: Filters */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="w-96 border-r border-[#404040] overflow-y-auto thin-scrollbar bg-[#1f1f1f]"
        >
          <div className="p-4">
            <h2 className="text-lg font-medium text-white mb-4">Filters</h2>
            
            {/* Filter lines */}
            <div className="space-y-6">
              {pendingSearchFilters.map((filter, idx) => (
                <div key={idx} className="space-y-3 pb-6 border-b border-[#303030]">
                  {/* Filter header with subop (WHERE/AND/OR) */}
                  <div className="flex items-center justify-between">
                    {idx > 0 ? (
                      <Combobox
                        as="div"
                        value={filter.subop}
                        onChange={(val) => updateFilterLine(idx, 'subop', val)}
                        className="w-24"
                      >
                        <div className="relative">
                          <Combobox.Button className="w-full flex items-center justify-between bg-[#252525] border border-[#3a3a3a] rounded px-2 py-1 text-sm text-white">
                            <span>{filter.subop}</span>
                            <ChevronUpDownIcon className="h-4 w-4 text-neutral-400" />
                          </Combobox.Button>
                          <Combobox.Options className="absolute z-10 mt-1 w-full bg-[#252525] border border-[#3a3a3a] rounded-md shadow-lg max-h-48 overflow-auto">
                            {subops.map((subop) => (
                              <Combobox.Option
                                key={subop}
                                value={subop}
                                className={({ active }) =>
                                  `cursor-pointer select-none relative py-2 px-3 text-sm ${
                                    active ? "bg-[#303030] text-white" : "text-neutral-300"
                                  }`
                                }
                              >
                                {subop}
                              </Combobox.Option>
                            ))}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                    ) : (
                      <div className="w-24 px-2 py-1 text-sm font-medium text-white">WHERE</div>
                    )}
                    
                    <button
                      onClick={() => removeFilterLine(idx)}
                      className="h-7 w-7 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-[#303030] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Column selector */}
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">Column</label>
                    <Combobox
                      as="div"
                      value={filter.column}
                      onChange={(val) => updateFilterLine(idx, 'column', val)}
                    >
                      <div className="relative">
                        <div className="flex items-center bg-[#252525] border border-[#3a3a3a] rounded overflow-hidden">
                          <Combobox.Input
                            className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none text-white"
                            placeholder="Select column"
                            onChange={(e) => setColumnSearch(e.target.value)}
                            displayValue={(column) => column}
                          />
                          <Combobox.Button className="pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-neutral-400" />
                          </Combobox.Button>
                        </div>
                        <Combobox.Options className="absolute z-10 mt-1 w-full bg-[#252525] border border-[#3a3a3a] rounded-md shadow-lg max-h-48 overflow-auto">
                          {columns
                            .filter((col) => col.toLowerCase().includes(columnSearch.toLowerCase()))
                            .map((column) => (
                              <Combobox.Option
                                key={column}
                                value={column}
                                className={({ active }) =>
                                  `cursor-pointer select-none relative py-2 px-3 text-sm ${
                                    active ? "bg-[#303030] text-white" : "text-neutral-300"
                                  }`
                                }
                              >
                                {column}
                              </Combobox.Option>
                            ))}
                        </Combobox.Options>
                      </div>
                    </Combobox>
                  </div>
                  
                  {/* Condition selector */}
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">Condition</label>
                    <Combobox
                      as="div"
                      value={filter.condition}
                      onChange={(val) => updateFilterLine(idx, 'condition', val)}
                    >
                      <div className="relative">
                        <Combobox.Button className="w-full flex items-center justify-between bg-[#252525] border border-[#3a3a3a] rounded px-3 py-2 text-sm text-white">
                          <span>{filter.condition}</span>
                          <ChevronUpDownIcon className="h-5 w-5 text-neutral-400" />
                        </Combobox.Button>
                        <Combobox.Options className="absolute z-10 mt-1 w-full bg-[#252525] border border-[#3a3a3a] rounded-md shadow-lg max-h-48 overflow-auto">
                          {conditions.map((condition) => (
                            <Combobox.Option
                              key={condition}
                              value={condition}
                              className={({ active }) =>
                                `cursor-pointer select-none relative py-2 px-3 text-sm ${
                                  active ? "bg-[#303030] text-white" : "text-neutral-300"
                                }`
                              }
                            >
                              {condition}
                            </Combobox.Option>
                          ))}
                        </Combobox.Options>
                      </div>
                    </Combobox>
                  </div>
                  
                  {/* Value input (only shown for conditions that need values) */}
                  {filter.condition !== "is empty" && filter.condition !== "is not empty" && (
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400">Values</label>
                      <TokensInput
                        tokens={filter.tokens}
                        setTokens={(tokens) => updateFilterTokens(idx, tokens)}
                        pendingText={filter.pendingText}
                        setPendingText={(text) => updateFilterPendingText(idx, text)}
                        column={filter.column}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add filter button */}
              <button
                onClick={addFilterLine}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-[#252525] hover:bg-[#303030] text-sm text-neutral-300 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Filter</span>
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Right side: Results */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex-1 overflow-hidden flex flex-col"
        >
          {/* Active filters display */}
          {searchFilters.length > 0 && (
            <div className="px-4 py-3 border-b border-[#404040] flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-2 flex-1">
                {searchFilters.map((f, i) => {
                  const prefix = i === 0 ? "Where" : f.subop;
                  const safeTokens = Array.isArray(f.tokens) ? f.tokens : [];
                  let desc = "";
                  if (f.condition === "is empty" || f.condition === "is not empty") {
                    desc = f.condition;
                  } else {
                    desc = `${f.condition} [${safeTokens.join(", ")}]`;
                  }
                  return (
                    <div key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600/20 text-xs text-blue-400 border border-blue-700/30">
                      <strong>{prefix}</strong> {f.column} {desc}
                    </div>
                  );
                })}
              </div>
              <div className="text-sm text-green-400 font-medium flex items-center gap-1">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{formatNumber(totalResults)}</span>
                </span>
                <span className="text-xs text-neutral-400">matching contacts</span>
              </div>
            </div>
          )}
          
          {/* No filters but have results - Show count indicator */}
          {searchFilters.length === 0 && searchResults.length > 0 && (
            <div className="px-4 py-3 border-b border-[#404040] flex justify-between items-center">
              <div className="text-sm text-neutral-400">
                Showing all contacts
              </div>
              <div className="text-sm text-green-400 font-medium flex items-center gap-1">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{formatNumber(totalResults)}</span>
                </span>
                <span className="text-xs text-neutral-400">found</span>
              </div>
            </div>
          )}
          
          {/* Results table container with custom scrollbar */}
          <div className="flex-1 overflow-auto table-scrollbar">
            {resultsLoading ? (
              <div className="flex items-center justify-center h-full text-neutral-400">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin">
                    <Search className="h-8 w-8" />
                  </div>
                  <p>Searching...</p>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="bg-[#1a1a1a] sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">Full name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">Job title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">Emails</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">Phone numbers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#303030]">
                  {searchResults.map((result, idx) => (
                    <tr key={idx} className="hover:bg-[#1d1d1d] transition-colors">
                      <td className="px-4 py-3 text-sm text-neutral-300">{result["Full name"] || "-"}</td>
                      <td className="px-4 py-3 text-sm text-neutral-300">{result["Job title"] || "-"}</td>
                      <td className="px-4 py-3 text-sm text-neutral-300">{result["Company"] || "-"}</td>
                      <td className="px-4 py-3 text-sm text-neutral-300">{result["Emails"] || "-"}</td>
                      <td className="px-4 py-3 text-sm text-neutral-300">{result["Phone numbers"] || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-400">
                <div className="flex flex-col items-center gap-4">
                  <ListFilter className="h-10 w-10 text-neutral-500" />
                  <p>Use the filters on the left to search for contacts</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {searchResults.length > 0 && (
            <div className="px-4 py-3 border-t border-[#404040] flex justify-between items-center bg-[#1a1a1a]">
              <div className="text-xs text-neutral-500">
                Showing {searchPage * searchLimit + 1} to {Math.min((searchPage + 1) * searchLimit, totalResults)} of {formatNumber(totalResults)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchSearchResults(Math.max(0, searchPage - 1))}
                  disabled={searchPage === 0}
                  className="px-2 py-1 rounded text-xs text-neutral-400 hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchSearchResults(searchPage + 1)}
                  disabled={searchPage >= totalPages - 1}
                  className="px-2 py-1 rounded text-xs text-neutral-400 hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ManualSearch; 