"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { Combobox } from "@headlessui/react";
import { useSearchContext } from "../context/SearchContext";

/**
 * A tokens input with auto-suggest from distinct values.
 */
function TokensInput({
  tokens,
  setTokens,
  pendingText,
  setPendingText,
  column,
  tableName,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const dropdownRef = useRef(null);

  // Show suggestions as user types (filtered by `pendingText`)
  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes(pendingText.toLowerCase())
  );

  async function fetchSuggestions() {
    if (!column || !tableName) return;
    try {
      setIsFetching(true);
      const params = new URLSearchParams({
        table_name: tableName,
        column,
        limit: "100",
      });
      const res = await fetch(`/api/people/distinct-values?${params}`);
      const json = await res.json();
      if (res.ok && json.distinctValues) {
        setSuggestions(json.distinctValues);
      }
    } catch (err) {
      console.error("Suggestions fetch error:", err);
    } finally {
      setIsFetching(false);
    }
  }

  function handleFocus() {
    setShowSuggestions(true);
    // Show the dropdown right away, with a spinner:
    if (!suggestions.length) {
      fetchSuggestions();
    }
  }
  
  function handleBlur() {
    // Delay a bit so that if the user clicks a suggestion, we won't close immediately
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
  
  function addToken(token) {
    if (token && !tokens.includes(token)) {
      setTokens([...tokens, token]);
    }
  }

  function removeToken(token) {
    setTokens(tokens.filter((t) => t !== token));
  }

  return (
    <div className="relative">
      {/* Input for new token */}
      <input
        type="text"
        value={pendingText}
        onChange={(e) => setPendingText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Type and press Enter..."
        className="w-full bg-[#1a1a1a] rounded px-2 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-all duration-200"
      />

      {/* Display existing tokens below input */}
      {tokens.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tokens.map((token, idx) => (
            <div key={idx} className="bg-blue-600/10 text-blue-400 text-xs px-2 py-1 rounded flex items-center gap-1">
              <span>{token}</span>
              <button
                onClick={() => removeToken(token)}
                className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-[#1a1a1a] rounded shadow-lg max-h-32 overflow-auto"
        >
          {isFetching ? (
            <div className="p-2 text-xs text-gray-400 flex items-center gap-2">
              {/* Simple loading spinner */}
              <svg
                className="h-3 w-3 animate-spin mr-1 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              <span>Loading...</span>
            </div>
          ) : filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((item, i) => (
              <div
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent losing focus
                  addToken(item);
                }}
                className="px-2 py-1 cursor-pointer hover:bg-[#333333] text-xs text-gray-300 transition-colors"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="p-2 text-xs text-gray-400">
              No suggestions found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const FiltersDrawer = ({ 
  availableColumns = [],
  pendingFilters = [],
  selectedTable,
  onApplyFilters,
  onClose
}) => {
  const { filtersDrawerOpen } = useSearchContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [localPendingFilters, setLocalPendingFilters] = useState(pendingFilters);
  
  // Update local state when pendingFilters prop changes
  React.useEffect(() => {
    setLocalPendingFilters(pendingFilters);
  }, [pendingFilters]);

  // Filter functions
  function addFilterLine() {
    const isFirst = localPendingFilters.length === 0;
    setLocalPendingFilters((prev) => [
      ...prev,
      {
        column: "",
        condition: "contains",
        tokens: [],
        pendingText: "",
        subop: isFirst ? "" : "AND",
      },
    ]);
  }

  function removeFilterLine(index) {
    setLocalPendingFilters((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFilterLine(index, field, value) {
    setLocalPendingFilters((prev) => {
      const arr = [...prev];
      arr[index][field] = value;
      return arr;
    });
  }

  function updateLineSubop(index, newOp) {
    setLocalPendingFilters((prev) => {
      const arr = [...prev];
      arr[index].subop = newOp;
      return arr;
    });
  }

  function updateLineTokens(index, newTokens) {
    setLocalPendingFilters((prev) => {
      const arr = [...prev];
      arr[index].tokens = newTokens;
      return arr;
    });
  }

  function updateLinePendingText(index, txt) {
    setLocalPendingFilters((prev) => {
      const arr = [...prev];
      arr[index].pendingText = txt;
      return arr;
    });
  }

  async function handleApplyFilters() {
    const updated = localPendingFilters.map((rule) => {
      // If there's leftover text, add it as a token
      if (
        (rule.condition === "contains" || rule.condition === "equals") &&
        rule.pendingText?.trim()
      ) {
        if (!rule.tokens.includes(rule.pendingText.trim())) {
          rule.tokens.push(rule.pendingText.trim());
        }
      }
      rule.pendingText = "";
      return rule;
    });

    onApplyFilters(updated);
    onClose();
  }

  return (
    <AnimatePresence>
      {filtersDrawerOpen && (
        <>
          {/* Overlay for clicking outside to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-20"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.aside
            key="filters-drawer"
            initial={{ x: -450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -450, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-[450px] max-w-[90vw] bg-[#2b2b2b] border-r border-[#404040] shadow-lg text-sm text-neutral-200 z-30 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#404040] p-4">
              <div className="flex items-center">
                <h2 className="text-base font-semibold">Filter Settings</h2>
              </div>
              <button
                aria-label="close drawer"
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto thin-scrollbar pb-20">
              <div className="space-y-3">
                <p className="text-xs text-gray-400">
                  Create rules to filter your search results.
                </p>
                
                                                  <div className="space-y-0">
                   {localPendingFilters.map((rule, index) => (
                     <div
                       key={index}
                       className={`p-3 relative ${index > 0 ? 'border-t border-[#404040]' : ''}`}
                     >
                       {/* Remove button - X in top right */}
                       {localPendingFilters.length > 1 && (
                         <button
                           onClick={() => removeFilterLine(index)}
                           className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                         >
                           ×
                         </button>
                       )}
                       
                                              {/* Operator for subsequent rules */}
                       {index > 0 && (
                         <div className="flex items-center gap-2 mb-3">
                           <select
                             value={rule.subop}
                             onChange={(e) => updateLineSubop(index, e.target.value)}
                             className="bg-[#1a1a1a] rounded px-2 py-1 text-xs text-white focus:outline-none"
                           >
                             <option value="AND">AND</option>
                             <option value="OR">OR</option>
                           </select>
                         </div>
                       )}
                       
                       {/* Column and Condition in a single row */}
                       <div className="grid grid-cols-2 gap-2 mb-3">
                         <div>
                           <Combobox
                             value={rule.column}
                             onChange={(val) => updateFilterLine(index, "column", val)}
                           >
                             <div className="relative w-full">
                               <Combobox.Button
                                 className="relative w-full bg-[#1a1a1a] text-white text-left rounded py-2 px-2 text-xs focus:outline-none transition-all duration-200"
                               >
                                 <Combobox.Input
                                   onChange={(e) => {
                                     setSearchQuery(e.target.value);
                                     updateFilterLine(index, "column", e.target.value);
                                   }}
                                   displayValue={(val) => val}
                                   placeholder="Column..."
                                   className="w-full bg-transparent focus:outline-none text-white placeholder:text-gray-500 text-xs"
                                 />
                                 <span className="absolute inset-y-0 right-0 flex items-center pr-1">
                                   <ChevronUpDownIcon
                                     className="h-3 w-3 text-gray-400"
                                     aria-hidden="true"
                                   />
                                 </span>
                               </Combobox.Button>
                               <Combobox.Options
                                 className="absolute z-10 mt-1 w-full bg-[#1a1a1a] rounded max-h-32 overflow-auto shadow-lg"
                               >
                                 {(!searchQuery
                                   ? availableColumns
                                   : availableColumns.filter((c) =>
                                   c.toLowerCase().includes(searchQuery.toLowerCase())
                                     )
                                 ).map((c) => (
                                   <Combobox.Option
                                     key={c}
                                     value={c}
                                     className={({ active }) =>
                                       `cursor-pointer select-none px-2 py-1 text-xs ${
                                         active
                                           ? "bg-[#333333] text-white"
                                           : "text-gray-300"
                                       }`
                                     }
                                   >
                                     {c}
                                   </Combobox.Option>
                                 ))}
                               </Combobox.Options>
                             </div>
                           </Combobox>
                         </div>
                         
                         <div>
                                                        <select
                               value={rule.condition}
                               onChange={(e) =>
                                 updateFilterLine(index, "condition", e.target.value)
                               }
                               className="w-full bg-[#1a1a1a] rounded py-2 px-2 text-xs text-white focus:outline-none transition-all duration-200"
                             >
                             <option value="contains">Contains</option>
                             <option value="equals">Equals</option>
                             <option value="is empty">Is Empty</option>
                             <option value="is not empty">Is Not Empty</option>
                           </select>
                         </div>
                       </div>
                       
                       {/* Search terms pills at the bottom */}
                       {(rule.condition === "contains" || rule.condition === "equals") && (
                         <div>
                           <TokensInput
                             tokens={rule.tokens}
                             setTokens={(arr) => updateLineTokens(index, arr)}
                             pendingText={rule.pendingText || ""}
                             setPendingText={(txt) => updateLinePendingText(index, txt)}
                             tableName={selectedTable?.id}
                             column={rule.column}
                           />
                         </div>
                       )}
                     </div>
                   ))}
                  
                                     <div className="flex gap-2">
                     <button
                       onClick={addFilterLine}
                       className="px-3 py-2 bg-[#404040] hover:bg-[#4a4a4a] text-white text-xs rounded flex items-center gap-1 transition-all duration-200"
                     >
                       <span>+</span> Add Rule
                     </button>
                   </div>
                </div>
              </div>
            </div>
            
            {/* Fixed bottom-of-drawer buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#2b2b2b] border-t border-[#404040] shadow-lg">
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-[#404040] hover:bg-[#4a4a4a] text-white font-medium text-xs rounded transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApplyFilters}
                  className="flex-1 px-4 py-2.5 bg-[#505050] hover:bg-[#5a5a5a] text-white font-medium text-xs rounded transition-all duration-200"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default FiltersDrawer; 