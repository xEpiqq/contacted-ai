/* app/login/page.jsx */
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUpIcon,
  ArrowLeftIcon,
  XMarkIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  UserIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeButton } from "@/components/badge";
import { FileUp, ListFilter, Table, Upload, CheckCircle, CirclePlus, Loader, Download, MoreHorizontal, Pencil, Trash2, CreditCard, Search, Chrome, DollarSign, Gem } from "lucide-react";
import Papa from "papaparse";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { Combobox } from "@headlessui/react";
import { createClient } from "@/utils/supabase/client";

/* Style block for tooltips */
const tooltipStyles = `
  .tooltip {
    position: relative;
  }
  .tooltip::before {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 8px;
    border-radius: 4px;
    background-color: #333;
    color: white;
    font-size: 10px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
    z-index: 10;
    pointer-events: none;
    margin-bottom: 5px;
  }
  .tooltip:hover::before {
    opacity: 1;
    visibility: visible;
  }
`;

/* Table scrollbar styles specifically for the results table */
const tableScrollbarStyles = `
  /* Table scrollbar styles */
  .table-scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  
  .table-scrollbar::-webkit-scrollbar-track {
    background: rgba(20, 20, 20, 0.2);
    border-radius: 3px;
  }
  
  .table-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(50, 50, 50, 0.7);
    border-radius: 3px;
  }
  
  .table-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(70, 70, 70, 0.8);
  }
  
  .table-scrollbar::-webkit-scrollbar-corner {
    background: rgba(20, 20, 20, 0.2);
  }
  
  /* For Firefox */
  .table-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(50, 50, 50, 0.7) rgba(20, 20, 20, 0.2);
  }
`;

/*────────────────────────────  SHARED  ───────────────────────────*/

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      aria-label="toggle brainstorm mode"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        value ? "bg-green-500" : "bg-gray-500/50"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          value ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function Badge({ children, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#2b2b2b] text-sm text-neutral-400"
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="text-neutral-500 hover:text-neutral-300"
      >
        ×
      </button>
    </motion.div>
  );
}

/* Tokens Input component for manual search */
function TokensInput({
  tokens,
  setTokens,
  pendingText,
  setPendingText,
  column,
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
      
      const response = await fetch(`/api/public-people/distinct-values?${params}`);
      const data = await response.json();
      
      if (response.ok && data.distinctValues) {
        setSuggestions(data.distinctValues);
      } else {
        console.error("Error fetching suggestions:", data.error);
        setSuggestions([]);
      }
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

/*────────────────────────────  HELPERS  ──────────────────────────*/

function levenshtein(a = "", b = "") {
  const m = a.length,
    n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function closestType(input) {
  const cleaned = input.trim().toLowerCase();
  if (cleaned.startsWith("p")) return "people";
  if (cleaned.startsWith("l")) return "local biz";
  if (cleaned.startsWith("b")) return "local biz";
  return levenshtein(cleaned, "people") <= levenshtein(cleaned, "local biz")
    ? "people"
    : "local biz";
}

/*────────────────────────────  PAGE  ────────────────────────────*/

// Modified Navbar component to include user profile
function Navbar({ onCreditsClick, user, creditsRemaining, onUserClick, showUserDropdown, userDropdownRef, onManageBilling, onSignOut }) {
  return (
    <header className="w-full flex items-center justify-between px-4 py-3 text-xs text-white">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-neutral-500" />
        {/* Email dropdown on the left side */}
        <div className="relative" ref={userDropdownRef}>
          <div 
            className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
            onClick={onUserClick}
          >
            <span className="text-white max-w-[200px] truncate">
              {user?.email || "User"}
        </span>
            <ChevronDownIcon className="h-4 w-4 text-neutral-400" />
          </div>
          
          {/* Dropdown menu */}
          <AnimatePresence>
            {showUserDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 w-48 bg-[#252525] border border-[#404040] rounded-lg shadow-lg overflow-hidden z-50"
              >
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-[#404040]">
                    <p className="text-sm font-medium text-white truncate">{user?.email || "User"}</p>
                  </div>
                  
                  <button
                    onClick={onManageBilling}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-[#303030] flex items-center"
                  >
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    <span>Manage Billing</span>
                  </button>
                  
                  <button
                    onClick={onSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-[#303030] flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-r from-green-900/40 to-green-700/40 px-2 py-0.5 rounded text-[10px] text-green-400 border border-green-800/30">
          Unlimited
        </div>
        <div 
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#303030] rounded-full cursor-pointer hover:bg-[#3a3a3a] transition-colors"
          onClick={onCreditsClick}
        >
          <Gem className="h-4 w-4 text-green-400" />
          <span className="text-white font-medium">{creditsRemaining?.toLocaleString() || "2,482"}</span>
          <span className="text-[10px] text-neutral-400 ml-1">credits</span>
        </div>
      </div>
    </header>
  );
}

// Add this component for the credits screen
function CreditsScreen({ onClose }) {
  const [selectedPlan, setSelectedPlan] = useState("50k");
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut",
        exit: { duration: 0.15 } // Exit animation runs twice as fast
      }}
      className="fixed inset-0 bg-[#212121] z-50 overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto p-6 pt-16 flex flex-col md:flex-row gap-8">
        {/* Testimonials Column */}
        <div className="md:w-1/3">
          <h2 className="text-2xl font-semibold text-white mb-6">What our customers say</h2>
          
          <div className="space-y-8">
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg p-5">
              <p className="text-neutral-300 text-sm italic mb-4">
                "This tool has transformed our outreach process. We're connecting with the right decision-makers and seeing a 3x increase in response rates."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">M</div>
                <div>
                  <p className="text-white text-sm font-medium">Michael T.</p>
                  <p className="text-neutral-400 text-xs">VP of Sales, TechCorp</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg p-5">
              <p className="text-neutral-300 text-sm italic mb-4">
                "We scaled our B2B prospecting while maintaining quality. The enrichment data is accurate and always up to date."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">S</div>
                <div>
                  <p className="text-white text-sm font-medium">Sarah K.</p>
                  <p className="text-neutral-400 text-xs">Marketing Director, GrowthIQ</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg p-5">
              <p className="text-neutral-300 text-sm italic mb-4">
                "The data quality is exceptional. We're building targeted lists in minutes instead of days."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">J</div>
                <div>
                  <p className="text-white text-sm font-medium">James L.</p>
                  <p className="text-neutral-400 text-xs">Founder, LaunchPad</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Plans Column */}
        <div className="md:w-2/3">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-white">Get More Credits</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-white">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Plan 1 - 20K Credits */}
            <div 
              className={`bg-[#2b2b2b] hover:bg-[#303030] transition-colors border ${selectedPlan === "20k" ? "border-blue-500" : "border-[#404040]"} rounded-lg p-5 cursor-pointer`}
              onClick={() => setSelectedPlan("20k")}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border ${selectedPlan === "20k" ? "border-blue-500 bg-blue-500" : "border-[#505050] bg-transparent"} flex items-center justify-center`}>
                    {selectedPlan === "20k" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-lg">20,000 Credits</h3>
                    <p className="text-sm text-neutral-400 mt-1">Monthly subscription</p>
                  </div>
                </div>
                <div className="text-white font-medium">$79/mo</div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#404040] ml-8">
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-xs text-neutral-300">
                    <span className={`${selectedPlan === "20k" ? "text-blue-400" : "text-green-400"}`}>✓</span> Basic enrichment
                  </p>
                  <p className="text-xs text-neutral-300">
                    <span className={`${selectedPlan === "20k" ? "text-blue-400" : "text-green-400"}`}>✓</span> Standard support
                  </p>
                  <p className="text-xs text-neutral-300">
                    <span className={`${selectedPlan === "20k" ? "text-blue-400" : "text-green-400"}`}>✓</span> API access
                  </p>
                </div>
              </div>
            </div>
            
            {/* Plan 2 - 50K Credits (Highlighted) */}
            <div 
              className={`bg-[#2b2b2b] hover:bg-[#303030] transition-colors border ${selectedPlan === "50k" ? "border-blue-500" : "border-[#404040]"} rounded-lg p-5 cursor-pointer relative`}
              onClick={() => setSelectedPlan("50k")}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border ${selectedPlan === "50k" ? "border-blue-500 bg-blue-500" : "border-blue-500 bg-transparent"} flex items-center justify-center`}>
                    {selectedPlan === "50k" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-lg">50,000 Credits</h3>
                    <p className="text-sm text-neutral-400 mt-1">Monthly subscription</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">$99/mo</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-800/20">
                    RECOMMENDED
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#404040] ml-8">
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-xs text-neutral-300">
                    <span className="text-blue-400">✓</span> Advanced enrichment
                  </p>
                  <p className="text-xs text-neutral-300">
                    <span className="text-blue-400">✓</span> Priority support
                  </p>
                  <p className="text-xs text-neutral-300">
                    <span className="text-blue-400">✓</span> Unlimited API access
                  </p>
                </div>
              </div>
            </div>
            
            {/* Plan 3 - Enterprise */}
            <div 
              className={`bg-[#2b2b2b] hover:bg-[#303030] transition-colors border ${selectedPlan === "enterprise" ? "border-blue-500" : "border-[#404040]"} rounded-lg p-5 cursor-pointer`}
              onClick={() => setSelectedPlan("enterprise")}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border ${selectedPlan === "enterprise" ? "border-blue-500 bg-blue-500" : "border-[#505050] bg-transparent"} flex items-center justify-center`}>
                    {selectedPlan === "enterprise" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-lg">Unlimited Credits</h3>
                    <p className="text-sm text-neutral-400 mt-1">For high-volume needs</p>
                  </div>
                </div>
                <div className="text-white font-medium">$1000/mo</div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#404040] ml-8">
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-xs text-neutral-300">
                    <span className={`${selectedPlan === "enterprise" ? "text-blue-400" : "text-green-400"}`}>✓</span> Custom volume pricing
                  </p>
                  <p className="text-xs text-neutral-300">
                    <span className={`${selectedPlan === "enterprise" ? "text-blue-400" : "text-green-400"}`}>✓</span> Dedicated account manager
                  </p>
                  <p className="text-xs text-neutral-300">
                    <span className={`${selectedPlan === "enterprise" ? "text-blue-400" : "text-green-400"}`}>✓</span> Enterprise API integrations
                  </p>
                </div>
              </div>
            </div>
            
            {/* Get Credits Button */}
            <div className="mt-8 pt-4">
              <button 
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                onClick={() => {
                  // Here you would handle the actual purchase flow
                  if (selectedPlan === "enterprise") {
                    // Show contact form or redirect to contact page
                    alert("We'll connect you with our sales team");
                  } else {
                    alert(`Selected the ${selectedPlan} plan`);
                  }
                }}
              >
                {selectedPlan === "enterprise" ? "Upgrade With Livechat" : "Get Credits Now"}
              </button>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-[#404040] text-center">
            <p className="text-xs text-neutral-400">
              Questions? <span className="text-blue-400 cursor-pointer hover:underline">karston@koldleads.com</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Manual Search Interface
function ManualSearch({ 
  onExit, 
  onApplyFilters,
  pendingFilters,
  onUpdateFilterLine,
  onUpdateFilterTokens,
  onUpdateFilterPendingText,
  onAddFilterLine,
  onRemoveFilterLine,
  searchFilters,
  searchResults,
  resultsLoading,
  searchPage,
  totalResults,
  totalPages,
  onPageChange,
  searchLimit
}) {
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
  
  // Local state for column search
  const [columnSearch, setColumnSearch] = useState("");
  
  // Helper to format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };
  
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
                  {pendingFilters.length > 0 ? 
                    `Search with ${pendingFilters.length} filter${pendingFilters.length > 1 ? 's' : ''}` : 
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
            
            <div className="space-y-4">
              {pendingFilters.map((filter, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="bg-[#252525] border border-[#404040] rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-end gap-3">
                    {idx > 0 && (
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">Join with</div>
                        <select
                          value={filter.subop}
                          onChange={(e) => onUpdateFilterLine(idx, "subop", e.target.value)}
                          className="bg-[#303030] border border-[#3a3a3a] rounded px-2 py-1 text-sm text-white w-24"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="text-xs text-neutral-500 mb-1">Column</div>
                      <Combobox
                        value={filter.column}
                        onChange={(val) => onUpdateFilterLine(idx, "column", val)}
                      >
                        <div className="relative">
                          <Combobox.Button className="relative w-full bg-[#303030] border border-[#3a3a3a] rounded px-3 py-2 text-left text-white">
                            <Combobox.Input
                              onChange={(e) => {
                                setColumnSearch(e.target.value);
                                onUpdateFilterLine(idx, "column", e.target.value);
                              }}
                              displayValue={(val) => val}
                              placeholder="Select column…"
                              className="w-full bg-transparent focus:outline-none text-sm"
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-neutral-400" />
                            </span>
                          </Combobox.Button>
                          <Combobox.Options className="absolute z-10 mt-1 w-full bg-[#252525] border border-[#3a3a3a] rounded-md max-h-60 overflow-auto">
                            {columns.filter(c => 
                              !columnSearch || c.toLowerCase().includes(columnSearch.toLowerCase())
                            ).map((c) => (
                              <Combobox.Option
                                key={c}
                                value={c}
                                className={({ active }) =>
                                  `cursor-pointer select-none px-3 py-2 text-sm ${
                                    active ? "bg-blue-600 text-white" : "text-neutral-300"
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
                      <div className="text-xs text-neutral-500 mb-1">Condition</div>
                      <select
                        value={filter.condition}
                        onChange={(e) => onUpdateFilterLine(idx, "condition", e.target.value)}
                        className="bg-[#303030] border border-[#3a3a3a] rounded px-2 py-1 text-sm text-white w-32"
                      >
                        <option value="contains">Contains</option>
                        <option value="equals">Equals</option>
                        <option value="is empty">Is Empty</option>
                        <option value="is not empty">Is Not Empty</option>
                      </select>
                    </div>
                  </div>

                  {(filter.condition === "contains" || filter.condition === "equals") && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Values</div>
                      <TokensInput
                        tokens={filter.tokens}
                        setTokens={(arr) => onUpdateFilterTokens(idx, arr)}
                        pendingText={filter.pendingText || ""}
                        setPendingText={(txt) => onUpdateFilterPendingText(idx, txt)}
                        column={filter.column}
                        tableName="usa4_new_v2"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => onRemoveFilterLine(idx)}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </motion.div>
              ))}
              
              <button
                onClick={onAddFilterLine}
                className="w-full py-2 border border-dashed border-[#505050] rounded-lg text-neutral-400 hover:text-white hover:border-[#606060] transition-colors flex items-center justify-center gap-1 mt-4"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add filter</span>
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
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="min-w-full">
              <table className="w-full border-collapse table-fixed">
                <colgroup>
                  {columns.map((col) => (
                    <col key={col} style={{
                      width: 
                        col === "Full name" ? "180px" :
                        col === "Job title" ? "180px" :
                        col === "Emails" ? "220px" :
                        col === "Phone numbers" ? "160px" :
                        col === "LinkedIn URL" ? "220px" :
                        "140px"
                    }} />
                  ))}
                </colgroup>
                <thead className="bg-[#252525] sticky top-0 z-10">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider border-b border-[#404040] whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#404040]">
                  {resultsLoading ? (
                    // Loading state
                    Array.from({ length: 10 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        {columns.map(col => (
                          <td key={col} className="px-4 py-3 whitespace-nowrap">
                            <div className="h-4 bg-[#303030] rounded"></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : searchResults.length > 0 ? (
                    // Results
                    searchResults.map((result, idx) => (
                      <tr key={idx} className="hover:bg-[#252525] transition-colors">
                        {columns.map(col => (
                          <td key={col} className="px-4 py-3 text-sm text-neutral-300 max-w-xs truncate">
                            {result[col] || ""}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    // No results
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-8 text-center text-neutral-400">
                        {searchFilters.length > 0 ? 
                          "No matching results found" : 
                          "Use the filters on the left to search"
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {totalResults > 0 && (
            <div className="px-4 py-3 border-t border-[#404040] flex justify-between items-center">
              <div className="text-sm text-neutral-400">
                Showing {formatNumber(searchPage * searchLimit + 1)} to {formatNumber(Math.min((searchPage + 1) * searchLimit, totalResults))} of {formatNumber(totalResults)} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(Math.max(0, searchPage - 1))}
                  disabled={searchPage === 0}
                  className="px-3 py-1.5 rounded border border-[#404040] text-sm text-neutral-300 hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(searchPage + 1)}
                  disabled={searchPage >= totalPages - 1}
                  className="px-3 py-1.5 rounded border border-[#404040] text-sm text-neutral-300 hover:bg-[#303030] disabled:opacity-50 disabled:cursor-not-allowed"
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

// Replace the old CreditsModal implementation with a stub that will be unused
function CreditsModal({ isOpen, onClose }) {
  return null; // This component is no longer used
}

// Results Display Component
function ResultsDisplay({ 
  onReset,
  searchFilters,
  searchResults,
  resultsLoading,
  searchPage,
  totalResults,
  totalPages,
  onPageChange,
  searchLimit,
  answerType
}) {
  // Available columns for displaying in a simpler format
  const displayColumns = [
    "Full name",
    "Job title", 
    "Company",
    "Emails",
    "Phone numbers"
  ];
  
  // Helper to format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };
  
  return (
    <div className="w-full max-w-[690px] mx-auto">
      {/* Results header */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-white font-medium text-lg">
            Search Results
            {totalResults > 0 && <span className="text-green-400 ml-2 text-base">({formatNumber(totalResults)})</span>}
          </h3>
          <p className="text-neutral-400 text-xs">
            Based on your search criteria • {answerType === "people" ? "People Database" : "Local Business Database"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded bg-[#303030] hover:bg-[#3a3a3a] text-xs text-white transition-colors flex items-center gap-1"
          >
            <Search className="h-3 w-3" />
            <span>New Search</span>
          </button>
        </div>
      </div>
      
      {/* Search criteria pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {searchFilters.map((filter, idx) => {
          const prefix = idx === 0 ? "" : filter.subop;
          return (
            <div 
              key={idx}
              className={`px-2 py-1 rounded-full text-xs 
                ${idx === 0 
                  ? "bg-blue-900/20 text-blue-400 border border-blue-900/30" 
                  : "bg-neutral-800 text-neutral-400 border border-neutral-700"}
              `}
            >
              {prefix && <span className="mr-1 font-medium">{prefix}</span>}
              <span className="font-medium">{filter.column}</span>
              <span className="mx-1">•</span>
              <span>
                {filter.tokens && filter.tokens.length > 0 
                  ? filter.tokens.join(", ") 
                  : filter.condition}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Results table in a rounded container */}
      <div className="rounded-xl bg-[#252525] border border-[#3a3a3a] overflow-hidden mb-4">
        {resultsLoading ? (
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="animate-spin mb-3">
              <Loader className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-neutral-400 text-sm">Finding matches...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="overflow-x-auto table-scrollbar">
              <table className="w-full border-collapse">
                <thead className="bg-[#303030]">
                  <tr>
                    {displayColumns.map(col => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a3a3a]">
                  {searchResults.slice(0, 5).map((result, idx) => (
                    <tr key={idx} className="hover:bg-[#2a2a2a] transition-colors">
                      {displayColumns.map(col => (
                        <td key={col} className="px-4 py-3 text-sm text-neutral-300 max-w-[200px] truncate">
                          {result[col] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Footer with pagination */}
            <div className="px-4 py-3 border-t border-[#3a3a3a] flex justify-between items-center bg-[#303030]">
              <div className="text-xs text-neutral-500">
                Showing {searchPage * searchLimit + 1} to {Math.min((searchPage + 1) * searchLimit, totalResults)} of {formatNumber(totalResults)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(Math.max(0, searchPage - 1))}
                  disabled={searchPage === 0}
                  className="px-2 py-1 rounded text-xs text-neutral-400 hover:bg-[#404040] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => onPageChange(searchPage + 1)}
                  disabled={searchPage >= totalPages - 1}
                  className="px-2 py-1 rounded text-xs text-neutral-400 hover:bg-[#404040] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center">
            <p className="text-neutral-400 text-sm">No matching results found</p>
            <button
              onClick={onReset}
              className="mt-3 px-3 py-1 rounded bg-[#303030] hover:bg-[#3a3a3a] text-xs text-white transition-colors"
            >
              Try Different Criteria
            </button>
          </div>
        )}
      </div>
      
      {/* Optional actions row */}
      {searchResults.length > 0 && (
        <div className="flex justify-end gap-2 mt-2">
          <button className="px-3 py-1 text-xs rounded-md bg-green-900/20 text-green-400 border border-green-800/30 hover:bg-green-900/30 transition-colors flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span>Export Results</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Login() {
  /* ---------- state ---------- */
  const [text, setText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const words = ["people", "local biz"];

  const [currentStep, setCurrentStep] = useState(0); // 0,1,2  → displayed as 1,2,3
  const [answerType, setAnswerType] = useState("");
  const [showExamples, setShowExamples] = useState(true);
  const [exactMatch, setExactMatch] = useState(false);

  // Step 2 (people) selections
  const [selectedExamples, setSelectedExamples] = useState([]);
  const [brainstormExamples, setBrainstormExamples] = useState([]);

  // Step 3 (industry) selections
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [showIndustryExamples, setShowIndustryExamples] = useState(true);

  const [shouldAdjustPadding, setShouldAdjustPadding] = useState(false);

  const [suggestion, setSuggestion] = useState("");
  const [suggestActive, setSuggestActive] = useState(false);

  // Brainstorm toggle state for step 2 job titles
  const [brainstorm, setBrainstorm] = useState(false);

  // Brainstorm mockup states
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [brainstormSuggestions, setBrainstormSuggestions] = useState([]);
  const [brainstormQuery, setBrainstormQuery] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState([]);

  /* ---------- guide dialog ---------- */
  const [guideOpen, setGuideOpen] = useState(currentStep === 0 ? false : true);
  
  /* ---------- drawer state ---------- */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [uploadStep, setUploadStep] = useState(0); // 0: upload, 1: columns, 2: settings
  const [autoDetectedColumn, setAutoDetectedColumn] = useState(null); // Track auto-detected column
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  
  // Exports drawer state
  const [exportsDrawerOpen, setExportsDrawerOpen] = useState(false);
  const [activeExport, setActiveExport] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newExportName, setNewExportName] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  
  // Dummy exports data
  const [exports, setExports] = useState([
    { id: 1, name: "LinkedinContacts_Q2", date: "Jun 12, 2023", size: "2.4 MB", rows: 5239 },
    { id: 2, name: "SalesLeads_May", date: "May 28, 2023", size: "1.1 MB", rows: 2381 },
    { id: 3, name: "TechCompanies", date: "Apr 15, 2023", size: "3.7 MB", rows: 8042 },
    { id: 4, name: "MarketingDirectors", date: "Mar 22, 2023", size: "952 KB", rows: 1840 },
    { id: 5, name: "Enriched_1686512398", date: "Today", size: "450 KB", rows: 842 }
  ]);

  const textareaRef = useRef(null);
  
  // Enrichment states
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [matchingCount, setMatchingCount] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Plus button dropdown state
  const [showPlusOptions, setShowPlusOptions] = useState(false);
  const plusButtonRef = useRef(null);

  // Manual search mode state
  const [manualMode, setManualMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState([]); 
  const [pendingSearchFilters, setPendingSearchFilters] = useState([]);
  const [searchPage, setSearchPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const searchLimit = 20;
  const totalPages = Math.ceil(totalResults / searchLimit) || 1;
  const [columnSearch, setColumnSearch] = useState("");

  // Change creditsModalOpen to creditsScreenOpen
  const [creditsScreenOpen, setCreditsScreenOpen] = useState(false);
  
  // Chrome extension download state
  const [isExtensionLoading, setIsExtensionLoading] = useState(false);
  const [showExtensionToast, setShowExtensionToast] = useState(false);
  
  // Enrichment success toast
  const [showEnrichmentToast, setShowEnrichmentToast] = useState(false);
  
  // User dropdown state
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  
  // User data for display
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

  // Handle billing portal redirect
  const handleBillingPortal = async () => {
    try {
      const res = await fetch("/api/manage-billing", { method: "POST" });
      const { url, error } = await res.json();
      
      if (error) {
        console.error("Billing portal error:", error);
      } else {
        window.location.href = url;
      }
      
      setShowUserDropdown(false);
    } catch (err) {
      console.error("Billing portal error:", err);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (plusButtonRef.current && !plusButtonRef.current.contains(event.target)) {
        setShowPlusOptions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownRef, plusButtonRef]);

  /* ---------- auto-grow ---------- */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [text]);

  /* ---------- auto-focus ---------- */
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  /* ---------- suggestion update ---------- */
  useEffect(() => {
    if (currentStep !== 0) {
      setSuggestion("");
      setSuggestActive(false);
      return;
    }
    const cleaned = text.trim().toLowerCase();
    setSuggestion(cleaned ? closestType(cleaned) : "");
    setSuggestActive(false);
  }, [text, currentStep]);

  /* ---------- typewriter ---------- */
  useEffect(() => {
    if (currentStep !== 0) return;
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
  }, [displayedText, isDeleting, wordIndex, currentStep]);

  // Update hasText to check for badges as well
  const hasText = text.trim().length > 0;
  const hasBadges = (currentStep === 1 && answerType === "people" && ((brainstorm && brainstormExamples.length > 0) || (!brainstorm && selectedExamples.length > 0))) || 
                   (currentStep === 2 && selectedIndustries.length > 0);
  const canProceed = hasText || hasBadges;

  /* ---------- heading ---------- */
  let headingText = "";
  if (currentStep === 0) {
    headingText = "local biz or people?";
  } else if (currentStep === 1) {
    if (answerType === "people") {
      headingText = brainstorm ? "Describe your product / service" : "Job title";
    } else {
      headingText = "Describe the local biz you're looking for";
    }
  } else if (currentStep === 2) {
    headingText = "industry";
  }
  const headingKey = `${headingText}-${answerType}-${currentStep}-${brainstorm}`;

  /* ---------- step helpers ---------- */
  const proceedStep0 = (inputString) => {
    const type = closestType(inputString);
    setAnswerType(type);
    setCurrentStep(1);
    setText("");
    setShowExamples(true);
    setSuggestion("");
    setSuggestActive(false);
    setGuideOpen(true); // keep guide visible on step 2
  };

  const handleBack = (targetStep = 0) => {
    setCurrentStep(targetStep);
    if (targetStep === 0) {
      // reset to step 1 state
      setAnswerType("");
      setText("");
      setShowExamples(false);
      setExactMatch(false);
      setSuggestion("");
      setSuggestActive(false);
      setGuideOpen(true);
      textareaRef.current?.focus();
    } else if (targetStep === 1) {
      // returning from industry to job titles
      setText("");
      setShowExamples(true);
      textareaRef.current?.focus();
    }
  };

  const handleBrainstormToggle = (value) => {
    setBrainstorm(value);
    setShouldAdjustPadding(false);
    setText("");
    setShowSuggestions(false);
    setBrainstormSuggestions([]);
    setSelectedKeywords([]);
    textareaRef.current?.focus();
  };

  /* ---------- handle text input ---------- */
  const handleTextChange = (e) => {
    const newText = e.target.value;

    // Step 2 job titles (people)
    if (currentStep === 1 && answerType === "people") {
      if (newText.endsWith(",")) {
        const keyword = newText.slice(0, -1).trim();
        if (keyword) {
          if (brainstorm) {
            setBrainstormExamples((prev) => [...prev, keyword]);
          } else {
            setSelectedExamples((prev) => [...prev, keyword]);
          }
          setText("");
        }
      } else {
        setText(newText);
      }
      return;
    }

    // Step 3 industries
    if (currentStep === 2) {
      if (newText.endsWith(",")) {
        const industry = newText.slice(0, -1).trim();
        if (industry) {
          setSelectedIndustries((prev) => [...prev, industry]);
          setText("");
        }
      } else {
        setText(newText);
      }
      return;
    }

    // Default
    setText(newText);
  };

  const handleKeyDown = (e) => {
    /* ---- STEP 1 SUGGESTION DROPDOWN ---- */
    if (currentStep === 0 && suggestion) {
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

    /* ---- STEP 2 JOB-TITLE BACKSPACE BADGE DELETE ---- */
    if (
      currentStep === 1 &&
      answerType === "people" &&
      e.key === "Backspace" &&
      text === ""
    ) {
      e.preventDefault();
      const examples = brainstorm ? brainstormExamples : selectedExamples;
      if (examples.length > 0) {
        const lastExample = examples[examples.length - 1];
        if (brainstorm) {
          setBrainstormExamples((prev) => prev.slice(0, -1));
        } else {
          setSelectedExamples((prev) => prev.slice(0, -1));
        }
        setText(lastExample);
      }
    }

    /* ---- STEP 3 INDUSTRY BACKSPACE BADGE DELETE ---- */
    if (currentStep === 2 && e.key === "Backspace" && text === "") {
      e.preventDefault();
      if (selectedIndustries.length > 0) {
        const last = selectedIndustries[selectedIndustries.length - 1];
        setSelectedIndustries((prev) => prev.slice(0, -1));
        setText(last);
      }
    }

    /* ---- SUBMIT ---- */
    if (e.key === "Enter" && !e.shiftKey && !suggestActive) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExampleClick = (example) => {
    if (currentStep === 1) {
      if (brainstorm) {
        setBrainstormExamples((prev) => [...prev, example]);
      } else {
        setSelectedExamples((prev) => [...prev, example]);
      }
    } else if (currentStep === 2) {
      setSelectedIndustries((prev) => [...prev, example]);
    }
    setText("");
  };

  const handleBadgeRemove = (index) => {
    if (currentStep === 1) {
      if (brainstorm) {
        setBrainstormExamples((prev) => prev.filter((_, i) => i !== index));
      } else {
        setSelectedExamples((prev) => prev.filter((_, i) => i !== index));
      }
    } else if (currentStep === 2) {
      setSelectedIndustries((prev) => prev.filter((_, i) => i !== index));
    }
  };

  /* ---------- submit ---------- */
  const handleSubmit = (e) => {
    e.preventDefault();

    // For steps 1 & 2, first convert any pending text to a badge
    if ((currentStep === 1 || currentStep === 2) && text.trim()) {
      const trimmedText = text.trim();
      
      if (currentStep === 1) {
        if (answerType === "people") {
          if (brainstorm) {
            setBrainstormExamples(prev => [...prev, trimmedText]);
          } else {
            setSelectedExamples(prev => [...prev, trimmedText]);
          }
        }
      } else if (currentStep === 2) {
        setSelectedIndustries(prev => [...prev, trimmedText]);
      }
      
      setText("");
    }
    
    // Now check if we can proceed (either had text that's now a badge, or already had badges)
    if (!hasBadges && !hasText) return;

    /* ---- FROM STEP 0 → STEP 1 ---- */
    if (currentStep === 0) {
      proceedStep0(text);
      return;
    }

    /* ---- STEP 1 JOB TITLE FLOW ---- */
    if (currentStep === 1 && answerType === "people" && brainstorm) {
      // Brainstorm processing
      if (hasText) {
        setBrainstormQuery(text);
        setIsProcessing(true);
        setText("");

        setTimeout(() => {
          setIsProcessing(false);
          setTimeout(() => {
            setShowSuggestions(true);
            const query = text.toLowerCase();
            let suggestions = [];

            if (
              query.includes("software") ||
              query.includes("app") ||
              query.includes("tech")
            ) {
              suggestions = [
                "Software Engineer",
                "Product Manager",
                "CTO",
                "Technical Lead",
                "QA Manager",
              ];
            } else if (
              query.includes("marketing") ||
              query.includes("ads") ||
              query.includes("brand")
            ) {
              suggestions = [
                "Marketing Director",
                "Brand Manager",
                "Social Media Specialist",
                "SEO Expert",
                "Content Strategist",
              ];
            } else if (
              query.includes("finance") ||
              query.includes("accounting") ||
              query.includes("money")
            ) {
              suggestions = [
                "CFO",
                "Financial Analyst",
                "Accounting Manager",
                "Controller",
                "Investment Advisor",
              ];
            } else {
              suggestions = [
                "CEO",
                "Operations Manager",
                "Department Head",
                "Director of Sales",
                "HR Manager",
              ];
            }

            setBrainstormSuggestions(suggestions);
          }, 300);
        }, 1000);
        return;
      } else if (brainstormExamples.length > 0) {
        // Allow proceeding with just badges
        setCurrentStep(2);
        setText("");
        setShowIndustryExamples(true);
        textareaRef.current?.focus();
        return;
      }
    }

    // STEP 1 (non-brainstorm) or local biz flow → STEP 2 (industry)
    if (currentStep === 1) {
      setCurrentStep(2);
      setText("");
      setShowIndustryExamples(true);
      textareaRef.current?.focus();
      return;
    }

    // ---- FINAL SUBMIT FROM STEP 3 (industry) ----
    if (currentStep === 2) {
      // Convert user selections to search filters and fetch results
      const finalFilters = buildSearchFilters();
      setSearchFilters(finalFilters);
      setCurrentStep(3); // Move to results display step
      setText("");
      fetchSearchResultsWithFilters(0, finalFilters);
      return;
    }
  };

  // Convert user selections from the multi-step workflow into search filters
  const buildSearchFilters = () => {
    const filters = [];
    
    // Add job title filter for people search
    if (answerType === "people") {
      const jobTitles = brainstorm 
        ? [...brainstormExamples, ...selectedKeywords] 
        : selectedExamples;
      
      // Include any uncommitted text in the input field
      const uncommittedText = text.trim();
      if (uncommittedText) {
        jobTitles.push(uncommittedText);
      }
      
      if (jobTitles.length > 0) {
        filters.push({
          column: "Job title",
          condition: "contains",
          tokens: jobTitles,
          pendingText: "",
          subop: ""
        });
      }
    }
    
    // Add local business type filter for local biz search
    if (answerType === "local biz" && text.trim()) {
      filters.push({
        column: "Company",
        condition: "contains",
        tokens: [text.trim()],
        pendingText: "",
        subop: ""
      });
    }
    
    // Add industry filter
    if (selectedIndustries.length > 0 || text.trim()) {
      const industries = [...selectedIndustries];
      
      // Include any uncommitted text in the input field
      const uncommittedText = text.trim();
      if (uncommittedText && !industries.includes(uncommittedText)) {
        industries.push(uncommittedText);
      }
      
      if (industries.length > 0) {
        filters.push({
          column: "Industry",
          condition: "contains",
          tokens: industries,
          pendingText: "",
          subop: filters.length > 0 ? "AND" : ""
        });
      }
    }
    
    return filters;
  };

  const handleSuggestionSelect = (suggestion) => {
    setSelectedKeywords((prev) => [...prev, suggestion]);
    setBrainstormSuggestions((prev) => prev.filter((s) => s !== suggestion));
  };

  const handleKeywordRemove = (index) => {
    setSelectedKeywords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    setBrainstormExamples((prev) => [...prev, ...selectedKeywords]);
    setSelectedKeywords([]);
    setShowSuggestions(false);
    setBrainstormSuggestions([]);
    setCurrentStep(2);
    setText("");
    setShowIndustryExamples(true);
    textareaRef.current?.focus();
  };

  /* ---------- examples ---------- */
  const localBizExamples = [
    "local coffee shop",
    "family-owned bakery",
    "neighborhood gym",
    "downtown florist",
    "independent bookstore",
    "pet grooming salon",
  ];

  const jobTitleExamples = [
    "owner",
    "president",
    "teacher",
    "manager",
    "chief executive officer",
    "project manager",
    "registered nurse",
    "vice president",
    "office manager",
    "director",
    "administrative assistant",
    "realtor",
    "general manager",
    "partner",
    "principal",
    "sales",
    "consultant",
    "account manager",
    "attorney",
    "software engineer",
    "executive director",
    "operations manager",
    "account executive",
    "sales manager",
    "sales representative",
    "founder",
    "associate",
    "executive assistant",
    "supervisor",
    "chief financial officer",
    "business owner",
    "senior software engineer",
    "sales associate",
    "professor",
    "managing director",
    "president and chief executive officer",
    "customer service representative",
    "accountant",
    "controller",
    "program manager",
    "engineer",
    "director of operations",
    "senior project manager",
    "assistant professor",
    "assistant manager",
    "administrator",
    "secretary",
    "store manager",
    "managing partner",
    "senior consultant",
  ];

  const industryExamples = [
    "software",
    "healthcare",
    "finance",
    "manufacturing",
    "education",
    "retail",
    "construction",
    "hospitality",
    "renewable energy",
    "transportation",
    "agriculture",
  ];

  let examples = [];
  if (currentStep === 1) {
    examples =
      answerType === "local biz" ? localBizExamples : jobTitleExamples;
  } else if (currentStep === 2) {
    examples = industryExamples;
  }

  const badgeColors = [
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
    "zinc",
  ];

  /* ---------- CSV handling ---------- */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setUploadError("");
    
    if (file) {
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

  const handleColumnSelect = (column) => {
    // If user is selecting a different column, clear the autoDetected status
    if (!selectedColumns.includes(column)) {
      setAutoDetectedColumn(null); // Clear auto-detected status once user makes any selection
    }
    // Replace selection with the new column (only one at a time)
    setSelectedColumns([column]);
  };

  const handleContinue = () => {
    if (selectedColumns.length > 0) {
      setUploadStep(2);
    }
  };
  
  // Handle enrichment preview
  const handleEnrichData = async () => {
    if (selectedColumns.length === 0) return;
    
    setEnrichLoading(true);
    setMatchingCount(null);
    setShowConfirmation(false);
    
    try {
      const selectedColumn = selectedColumns[0];
      const urls = csvData
        .map(row => (row[selectedColumn] || "").trim())
        .filter(Boolean);
      
      const response = await fetch("/api/people/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedin_urls: urls,
          confirm: false,
          table_name: "all" // Search across all databases
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to preview enrichment");
      }
      
      const data = await response.json();
      setMatchingCount(data.matchingCount || 0);
      setShowConfirmation(true);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setEnrichLoading(false);
    }
  };
  
  // Handle enrichment confirmation
  const handleConfirmEnrich = async () => {
    if (selectedColumns.length === 0) return;
    
    setEnrichLoading(true);
    
    try {
      const selectedColumn = selectedColumns[0];
      const headers = Object.keys(csvData[0] || {});
      
      // Get original filename for better export naming
      let originalFilename = "";
      if (fileInputRef.current && fileInputRef.current.files.length > 0) {
        const file = fileInputRef.current.files[0];
        originalFilename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      }
      
      const response = await fetch("/api/people/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedin_urls: csvData.map(row => (row[selectedColumn] || "").trim()).filter(Boolean),
          csv_rows: csvData,
          csv_headers: headers,
          linkedinHeader: selectedColumn,
          confirm: true,
          table_name: "all" // Search across all databases
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete enrichment");
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Show success message
        setUploadError("");
        setShowConfirmation(false);
        setMatchingCount(null);
        
        // Reset drawer state to prepare for next use
        handleDrawerClose();
        
        // Show a success toast
        setShowEnrichmentToast(true);
        setTimeout(() => setShowEnrichmentToast(false), 5000);
      } else {
        throw new Error("Enrichment failed");
      }
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setEnrichLoading(false);
    }
  };

  const resetUpload = () => {
    setCsvData(null);
    setCsvColumns([]);
    setSelectedColumns([]);
    setAutoDetectedColumn(null); // Reset auto-detected state
    setUploadStep(0);
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drawer close - reset upload state
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    resetUpload();
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

  const handleDeleteExport = (id) => {
    setPendingDeleteId(id);
    setShowExportOptions(false);
  };
  
  const handleRenameExport = (id) => {
    const exportItem = exports.find(exp => exp.id === id);
    if (exportItem) {
      setNewExportName(exportItem.name);
      setIsRenaming(true);
      setActiveExport(id);
    }
  };
  
  const confirmRename = () => {
    if (newExportName.trim()) {
      setExports(exports.map(exp => 
        exp.id === activeExport 
          ? {...exp, name: newExportName.trim()} 
          : exp
      ));
      setIsRenaming(false);
      setNewExportName("");
    }
  };

  const confirmDelete = () => {
    if (pendingDeleteId) {
      setExports(exports.filter(exp => exp.id !== pendingDeleteId));
      setPendingDeleteId(null);
    }
  };
  
  const cancelDelete = () => {
    setPendingDeleteId(null);
  };

  /* ---------- Manual Search Helpers ---------- */
  // Add a new filter line
  const addFilterLine = () => {
    const isFirst = pendingSearchFilters.length === 0;
    setPendingSearchFilters((prev) => [
      ...prev,
      {
        column: "",
        condition: "contains",
        tokens: [],
        pendingText: "",
        subop: isFirst ? "" : "AND",
      },
    ]);
  };

  // Remove a filter line
  const removeFilterLine = (i) => {
    setPendingSearchFilters((prev) => prev.filter((_, idx) => idx !== i));
  };

  // Update a filter line property
  const updateFilterLine = (i, field, val) => {
    setPendingSearchFilters((prev) => {
      const arr = [...prev];
      arr[i][field] = val;
      return arr;
    });
  };

  // Update tokens for a filter line
  const updateFilterTokens = (i, arr) => {
    setPendingSearchFilters((prev) => {
      const copy = [...prev];
      copy[i].tokens = arr;
      return copy;
    });
  };

  // Update pending text for a filter line
  const updateFilterPendingText = (i, txt) => {
    setPendingSearchFilters((prev) => {
      const copy = [...prev];
      copy[i].pendingText = txt;
      return copy;
    });
  };

  // Apply pending filters
  const applySearchFilters = () => {
    const updated = pendingSearchFilters.map((rule) => {
      if (
        (rule.condition === "contains" || rule.condition === "equals") &&
        rule.pendingText?.trim()
      ) {
        if (!rule.tokens.includes(rule.pendingText.trim())) {
          rule.tokens.push(rule.pendingText.trim());
        }
      }
      return {
        ...rule,
        pendingText: ""
      };
    });
    
    // Set the updated filters first
    setSearchFilters(updated);
    
    // Use the updated filters directly in the fetch call to ensure it has the latest data
    fetchSearchResultsWithFilters(0, updated);
  };

  // A modified version of fetchSearchResults that accepts filters as a parameter
  const fetchSearchResultsWithFilters = async (page = 0, filters = searchFilters) => {
    setResultsLoading(true);
    setSearchPage(page);
    
    try {
      // Calculate the offset
      const offset = page * searchLimit;
      
      // Prepare the API query params
      const params = new URLSearchParams({
        table_name: "usa4_new_v2", // Using the same table name as in open/usa/page.jsx
        limit: searchLimit.toString(),
        offset: offset.toString(),
        filters: JSON.stringify(filters),
      });
      
      // Make the API call to fetch results
      const response = await fetch(`/api/public-people/search?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.results || []);
        
        // Fetch the total count
        const countParams = new URLSearchParams({
          table_name: "usa4_new_v2",
          filters: JSON.stringify(filters),
        });
        
        const countResponse = await fetch(`/api/public-people/search-count?${countParams}`);
        const countData = await countResponse.json();
        
        if (countResponse.ok) {
          setTotalResults(countData.matchingCount || 0);
        }
      } else {
        console.error("Error fetching search results:", data.error);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setResultsLoading(false);
    }
  };

  // The original fetchSearchResults function now just calls the new one
  const fetchSearchResults = (page = 0) => {
    fetchSearchResultsWithFilters(page, searchFilters);
  };

  // Exit manual mode
  const exitManualMode = () => {
    setManualMode(false);
    setSearchResults([]);
    setSearchFilters([]);
    setPendingSearchFilters([]);
    setSearchPage(0);
    setTotalResults(0);
  };

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

  /* ---------- handle reset/new search ---------- */
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

  /*────────────────────────────  RENDER  ─────────────────────────*/

  return (
    <>
      <Navbar 
        onCreditsClick={() => setCreditsScreenOpen(true)} 
        user={user}
        creditsRemaining={creditsRemaining}
        onUserClick={() => setShowUserDropdown(!showUserDropdown)}
        showUserDropdown={showUserDropdown}
        userDropdownRef={userDropdownRef}
        onManageBilling={handleBillingPortal}
        onSignOut={handleSignOut}
      />
      
      <AnimatePresence mode="wait">
        {manualMode ? (
          <ManualSearch 
            onExit={exitManualMode} 
            onApplyFilters={applySearchFilters} 
            pendingFilters={pendingSearchFilters} 
            onUpdateFilterLine={updateFilterLine} 
            onUpdateFilterTokens={updateFilterTokens} 
            onUpdateFilterPendingText={updateFilterPendingText} 
            onAddFilterLine={addFilterLine} 
            onRemoveFilterLine={removeFilterLine} 
            searchFilters={searchFilters} 
            searchResults={searchResults} 
            resultsLoading={resultsLoading} 
            searchPage={searchPage} 
            totalResults={totalResults} 
            totalPages={totalPages} 
            onPageChange={fetchSearchResults}
            searchLimit={searchLimit} 
          />
        ) : (
          <div className="w-full flex flex-col bg-[#212121] text-white">
            {/* Enrich Data Drawer */}
            <AnimatePresence>
              {drawerOpen && (
                <motion.aside
                  key="enrich-drawer"
                  initial={{ x: -350, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -350, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="fixed top-0 left-0 bottom-0 w-96 max-w-[90vw] bg-[#2b2b2b] border-r border-[#404040] shadow-lg text-sm text-neutral-200 z-30 flex flex-col"
                >
                  <div className="flex justify-between items-center border-b border-[#404040] p-4">
                    <h2 className="text-base font-semibold">Enrich Your Data</h2>
                    <button
                      aria-label="close drawer"
                      onClick={handleDrawerClose}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="p-4 space-y-4 flex-1 overflow-y-auto thin-scrollbar pb-24">
                    {!csvData ? (
                      <>
                        <div className="mb-4 space-y-3">
                          <p className="text-xs text-neutral-400">Upload a CSV with LinkedIn URLs and receive email, phone, etc.</p>
                          
                          {/* Process visualization */}
                          <div className="flex items-center justify-between py-3 px-1">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-[#303030] flex items-center justify-center mb-1">
                                <FileUp className="h-5 w-5 text-blue-400" />
                              </div>
                              <span className="text-[10px] text-neutral-400">Upload CSV</span>
                            </div>
                            
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#404040] to-transparent mx-1"></div>
                            
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-[#303030] flex items-center justify-center mb-1">
                                <Search className="h-5 w-5 text-green-400" />
                              </div>
                              <span className="text-[10px] text-neutral-400">Enrich Data</span>
                            </div>
                            
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#404040] to-transparent mx-1"></div>
                            
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-[#303030] flex items-center justify-center mb-1">
                                <Download className="h-5 w-5 text-purple-400" />
                              </div>
                              <span className="text-[10px] text-neutral-400">Download</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border border-dashed border-[#404040] rounded-lg p-6 text-center space-y-3">
                          <div className="flex justify-center">
                            <Upload className="h-7 w-7 text-neutral-400" />
                          </div>
                          <div>
                            <p className="font-medium">Upload CSV File</p>
                            <p className="text-xs text-neutral-400 mt-1">Must contain a column with LinkedIn URLs</p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="csv-file-input"
                          />
                          <button
                            onClick={() => fileInputRef.current.click()}
                            className="px-4 py-2 bg-[#404040] hover:bg-[#4a4a4a] transition-colors rounded-md text-sm"
                          >
                            Choose File
                          </button>
                        </div>
                        
                        {/* Example data format */}
                        <div className="mt-4 p-3 bg-[#252525] rounded-lg border border-[#303030]">
                          <p className="text-xs font-medium mb-2">Example CSV format:</p>
                          <div className="bg-[#1f1f1f] border border-[#404040] rounded overflow-hidden text-[10px]">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-[#404040]">
                                  <th className="px-2 py-1 text-left font-normal text-neutral-400">Name</th>
                                  <th className="px-2 py-1 text-left font-normal text-neutral-400">LinkedIn URL</th>
                                  <th className="px-2 py-1 text-left font-normal text-neutral-400">Email</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-[#404040]">
                                  <td className="px-2 py-1">John Smith</td>
                                  <td className="px-2 py-1 text-blue-400">linkedin.com/in/johnsmith</td>
                                  <td className="px-2 py-1 text-green-400">After enrichment</td>
                                </tr>
                                <tr className="border-b border-[#404040]">
                                  <td className="px-2 py-1">Jane Doe</td>
                                  <td className="px-2 py-1 text-blue-400">linkedin.com/in/janedoe</td>
                                  <td className="px-2 py-1 text-green-400">After enrichment</td>
                                </tr>
                                <tr>
                                  <td className="px-2 py-1">Alex Johnson</td>
                                  <td className="px-2 py-1 text-blue-400">linkedin.com/in/alexjohnson</td>
                                  <td className="px-2 py-1 text-green-400">After enrichment</td>
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
                      </>
                    ) : uploadStep === 1 ? (
                      <div className="space-y-4">
                        {/* Put the header text back at the top */}
                        <h3 className="font-medium">Which column contains LinkedIn URLs?</h3>
                        
                        {/* Loading indicator */}
                        {enrichLoading && (
                          <div className="flex flex-col items-center justify-center py-6 space-y-3">
                            <div className="animate-spin">
                              <Loader className="h-6 w-6 text-neutral-400" />
                            </div>
                            <p className="text-sm text-neutral-400">
                              {showConfirmation ? "Downloading enriched data..." : "Finding matches..."}
                            </p>
                          </div>
                        )}
                        
                        {/* Confirmation dialog */}
                        {showConfirmation && !enrichLoading && (
                          <div className="bg-[#252525] border border-[#404040] rounded-md p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">Enrichment Preview</h3>
                            </div>
                            <p className="text-sm text-neutral-300">
                              Found <span className="text-green-400 font-medium">{matchingCount}</span> matching records across all databases.
                            </p>
                            <div className="bg-[#1f1f1f] border border-[#404040] rounded p-3">
                              <p className="text-xs text-neutral-400 mb-2">
                                <span className="text-green-400">✓</span> Contact data will be enriched with:
                              </p>
                              <ul className="text-xs text-neutral-300 space-y-1 pl-4">
                                <li>• Email addresses</li>
                                <li>• Phone numbers</li>
                                <li>• Company information</li>
                                <li>• Job titles & other details</li>
                              </ul>
                              <div className="mt-3 pt-2 border-t border-[#404040]">
                                <p className="text-xs text-blue-400 flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span>This will cost <strong>{matchingCount}</strong> credits from your account.</span>
                                </p>
                              </div>
                            </div>
                            <div className="bg-[#1f1f1f] border border-[#404040] rounded p-3">
                              <p className="text-xs text-neutral-400">
                                <span className="text-green-400">✓</span> The enriched file will be:
                              </p>
                              <ul className="text-xs text-neutral-300 space-y-1 pl-4 mt-1">
                                <li>• Saved to your exports</li>
                                <li>• Available for download anytime</li>
                                <li>• Processed immediately</li>
                              </ul>
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                              <button 
                                onClick={() => setShowConfirmation(false)}
                                className="px-3 py-1 text-xs text-neutral-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={handleConfirmEnrich}
                                className="px-3 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                <span>Confirm and Process</span>
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {uploadError && (
                          <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-md text-xs">
                            {uploadError}
                          </div>
                        )}
                        
                        {!enrichLoading && !showConfirmation && (
                          <>
                            <div className="space-y-2">
                              {/* Existing column selection code */}
                              {csvColumns.map((column) => {
                                const isSelected = selectedColumns.includes(column.name);
                                const samples = isSelected ? getColumnSamples(column.name) : [];
                                
                                return (
                                  <div key={column.name} className="space-y-1">
                                    <button
                                      onClick={() => handleColumnSelect(column.name)}
                                      className={`p-3 rounded-md border ${
                                        isSelected 
                                          ? 'bg-green-900/20 border-green-800 text-green-400' 
                                          : 'bg-[#333333]/30 border-[#404040]/30 text-white/50'
                                      } w-full flex justify-between items-center relative`}
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
                                      {column.name === autoDetectedColumn && (
                                        <div className="absolute -top-2.5 right-12 text-[9px] text-neutral-200 font-medium px-1.5 bg-[#2b2b2b] rounded-sm">
                                          auto detected
                                        </div>
                                      )}
                                    </button>
                                    
                                    {/* Sample data display */}
                                    {isSelected && samples.length > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="ml-3 overflow-hidden"
                                      >
                                        <div className="border-l border-green-800/30 pl-3 py-1 space-y-1">
                                          {samples.map((sample, idx) => (
                                            <div key={idx} className="text-xs text-neutral-400 truncate max-w-full">
                                              {sample}
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Keep just the reset button below columns as subtext */}
                            <div className="mt-6 flex justify-end items-center">
                              <button 
                                onClick={resetUpload}
                                className="text-xs text-neutral-500 hover:text-neutral-300"
                              >
                                Reset
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Enrichment Settings</h3>
                          <button 
                            onClick={() => setUploadStep(1)}
                            className="text-xs text-neutral-400 hover:text-white"
                          >
                            Back
                          </button>
                        </div>
                        
                        <div className="p-3 rounded-md bg-green-900/20 border border-green-800/50 text-green-400 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">
                            {selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''} selected for enrichment
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="font-medium">Selected Columns:</p>
                          <div className="bg-[#252525] p-3 rounded-md">
                            {selectedColumns.map((column) => (
                              <div key={column} className="py-1 px-2 bg-[#333333] rounded-md mb-1 text-sm">
                                {column}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="font-medium">Available Enrichments</h3>
                          <div className="p-3 rounded-md bg-[#333333] border border-[#404040] flex items-center justify-between">
                            <div>
                              <p className="font-medium">Email Finder</p>
                              <p className="text-xs text-neutral-400">Find work emails for your contacts</p>
                            </div>
                            <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-500 text-xs">✓</span>
                            </div>
                          </div>
                          
                          <div className="p-3 rounded-md bg-[#333333] border border-[#404040] flex items-center justify-between">
                            <div>
                              <p className="font-medium">Phone Finder</p>
                              <p className="text-xs text-neutral-400">Find phone numbers for your contacts</p>
                            </div>
                            <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                              <span className="text-green-500 text-xs">✓</span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          className="w-full py-2 rounded-md bg-white text-black hover:bg-neutral-200 transition-colors"
                        >
                          Start Enrichment
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Fixed button at the bottom */}
                  {csvData && uploadStep === 1 && !enrichLoading && !showConfirmation && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#2b2b2b] border-t border-[#404040] shadow-lg">
                      <button 
                        onClick={handleEnrichData}
                        disabled={selectedColumns.length === 0}
                        className="w-full py-3 text-sm rounded-md bg-[#404040] hover:bg-[#4a4a4a] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Confirm Column & Enrich</span>
                      </button>
                    </div>
                  )}
                </motion.aside>
              )}
            </AnimatePresence>
            
            {/* Exports Drawer */}
            <AnimatePresence>
              {exportsDrawerOpen && (
                <motion.aside
                  key="exports-drawer"
                  initial={{ x: -350, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -350, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="fixed top-0 left-0 bottom-0 w-96 max-w-[90vw] bg-[#2b2b2b] border-r border-[#404040] shadow-lg text-sm text-neutral-200 z-30 flex flex-col"
                >
                  <div className="flex justify-between items-center border-b border-[#404040] p-4">
                    <h2 className="text-base font-semibold">Your Exports</h2>
                    <button
                      aria-label="close drawer"
                      onClick={() => {
                        setExportsDrawerOpen(false);
                        setPendingDeleteId(null);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="p-4 space-y-4 flex-1 overflow-y-auto thin-scrollbar">
                    {/* Exports list */}
                    <div className="space-y-2">
                      {exports.map((exp) => (
                        <div 
                          key={exp.id} 
                          className={`bg-[#333333] rounded-md overflow-hidden ${activeExport === exp.id && showExportOptions ? '' : ''}`}
                        >
                          <div className="p-3 flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Table className="h-4 w-4 text-neutral-400" />
                                <span className="font-medium">{exp.name}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                                <span>{exp.date}</span>
                                <span>•</span>
                                <span>{exp.size}</span>
                                <span>•</span>
                                <span>{exp.rows.toLocaleString()} rows</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <button
                                aria-label="download export"
                                className="p-1.5 rounded-md hover:bg-[#4a4a4a] text-green-500 hover:text-green-400 transition-colors"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                aria-label="export options"
                                onClick={() => {
                                  if (activeExport === exp.id && (showExportOptions || isRenaming)) {
                                    // If already open, close it and reset
                                    setShowExportOptions(false);
                                    setIsRenaming(false);
                                    setNewExportName("");
                                  } else {
                                    // Otherwise open it
                                    setActiveExport(exp.id);
                                    setShowExportOptions(true);
                                  }
                                }}
                                className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-[#3a3a3a]/40 transition-all"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Export options dropdown */}
                          {activeExport === exp.id && showExportOptions && !isRenaming && (
                            <div className="bg-[#252525] border-t border-[#404040] p-1.5">
                              <div className="flex flex-col divide-y divide-[#404040]">
                                <button
                                  onClick={() => handleRenameExport(exp.id)}
                                  className="py-1.5 px-1 flex items-center gap-1.5 text-xs hover:text-white text-neutral-300"
                                >
                                  <Pencil className="h-3 w-3" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteExport(exp.id)}
                                  className="py-1.5 px-1 flex items-center gap-1.5 text-xs hover:text-red-400 text-neutral-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Rename form */}
                          {activeExport === exp.id && isRenaming && (
                            <div className="bg-[#252525] border-t border-[#404040] p-1.5">
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                confirmRename();
                              }}>
                                <input
                                  type="text"
                                  value={newExportName}
                                  onChange={(e) => setNewExportName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setIsRenaming(false);
                                      setNewExportName("");
                                    }
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  autoFocus
                                  className="w-full bg-transparent py-1.5 px-1 text-xs text-neutral-300 focus:outline-none"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsRenaming(false);
                                      setNewExportName("");
                                    }}
                                    className="px-2 py-1 text-xs text-neutral-400 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-2 py-1 text-xs bg-neutral-600 hover:bg-neutral-500 rounded text-white"
                                  >
                                    Save
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {exports.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3 text-neutral-500">
                        <Table className="h-10 w-10 opacity-50" />
                        <p>No exports found</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Delete confirmation panel at bottom of drawer */}
                  {pendingDeleteId && (
                    <div className="border-t border-[#404040] bg-[#252525] p-4 mt-auto">
                      <p className="text-xs text-neutral-300 mb-3">Are you sure you want to delete this export? This action cannot be undone.</p>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={cancelDelete}
                          className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={confirmDelete}
                          className="px-3 py-1.5 text-xs rounded bg-red-900/60 hover:bg-red-900/80 text-white transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.aside>
              )}
            </AnimatePresence>
            
            {/* Credits Screen (replacing the modal) - Added exit animation */}
            <AnimatePresence mode="wait">
              {creditsScreenOpen && <CreditsScreen onClose={() => setCreditsScreenOpen(false)} />}
            </AnimatePresence>
            
            {/* drawer overlay */}
            {(drawerOpen || exportsDrawerOpen) && (
              <div 
                className="fixed inset-0 bg-black/30 z-20"
                onClick={() => {
                  if (drawerOpen) handleDrawerClose();
                  if (exportsDrawerOpen) {
                    if (pendingDeleteId) {
                      cancelDelete();
                    } else {
                      setExportsDrawerOpen(false);
                    }
                  }
                }}
              />
            )}
            
            {/* CSS for Custom Scrollbar and Tooltips */}
            <style jsx global>{`
              .thin-scrollbar::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              
              .thin-scrollbar::-webkit-scrollbar-track {
                background: rgba(26, 26, 26, 0.1);
                border-radius: 4px;
              }
              
              .thin-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(90, 90, 90, 0.5);
                border-radius: 4px;
              }
              
              .thin-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(110, 110, 110, 0.6);
              }
              
              /* For Firefox */
              .thin-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: rgba(90, 90, 90, 0.5) rgba(26, 26, 26, 0.1);
              }
              
              /* Custom darker scrollbars for the table */
              .custom-scrollbar::-webkit-scrollbar {
                width: 5px;
                height: 5px;
              }
              
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(20, 20, 20, 0.1);
                border-radius: 3px;
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(50, 50, 50, 0.6);
                border-radius: 3px;
                border: 1px solid rgba(40, 40, 40, 0.6);
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(60, 60, 60, 0.7);
              }
              
              .custom-scrollbar::-webkit-scrollbar-corner {
                background: rgba(20, 20, 20, 0.1);
              }
              
              /* For Firefox */
              .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: rgba(50, 50, 50, 0.6) rgba(20, 20, 20, 0.1);
              }
              
              ${tooltipStyles}
              
              ${tableScrollbarStyles}
            `}</style>

            {/* step badges */}
            <div className="absolute top-20 left-4 flex flex-col gap-2 z-10">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  onClick={() => step < currentStep + 1 && handleBack(step - 1)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    step < currentStep + 1
                      ? "bg-green-500/20 text-green-700 cursor-pointer hover:bg-green-500/30"
                      : "bg-gray-500/20 text-gray-500"
                  }`}
                >
                  Step {step}
                </button>
              ))}
            </div>

            {/* GUIDE PANEL (steps 1 & 2 & 3) */}
            <AnimatePresence>
              {(currentStep === 0 ||
                currentStep === 1 ||
                currentStep === 2) &&
                (guideOpen ? (
                  <motion.aside
                    key="guide"
                    initial={{ x: 320, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 320, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed top-24 right-4 w-80 max-w-[90vw] bg-[#2b2b2b] border border-[#404040] rounded-2xl shadow-lg text-sm text-neutral-200 z-20"
                  >
                    <button
                      aria-label="minimize guide"
                      onClick={() => setGuideOpen(false)}
                      className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>

                    {/* ---------- GUIDE CONTENT ---------- */}
                    {currentStep === 0 ? (
                      /* STEP 1 GUIDE */
                      <div className="p-4 space-y-3">
                        <h3 className="text-base font-semibold">B2B List Types</h3>

                        <p className="font-medium">1. People.</p>
                        <div className="bg-[#1f1f1f] border border-[#404040] rounded-md overflow-hidden">
                          <table className="w-full border-collapse text-[11px] text-neutral-300">
                            <thead>
                              <tr>
                                <th className="border border-[#404040] px-2 py-1 text-left font-normal">
                                  Name
                                </th>
                                <th className="border border-[#404040] px-2 py-1 text-left font-normal">
                                  Phone
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-[#404040] px-2 py-1">
                                  john doe
                                </td>
                                <td className="border border-[#404040] px-2 py-1">
                                  (555) 111-2222
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-[#404040] px-2 py-1">
                                  obama obama
                                </td>
                                <td className="border border-[#404040] px-2 py-1">
                                  (555) 333-4444
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <p className="text-center text-neutral-400 text-xs my-1">or</p>

                        <p className="font-medium">2. Local Biz.</p>
                        <div className="bg-[#1f1f1f] border border-[#404040] rounded-md overflow-hidden">
                          <table className="w-full border-collapse text-[11px] text-neutral-300">
                            <thead>
                              <tr>
                                <th className="border border-[#404040] px-2 py-1 text-left font-normal">
                                  Local Biz
                                </th>
                                <th className="border border-[#404040] px-2 py-1 text-left font-normal">
                                  Phone
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-[#404040] px-2 py-1">
                                  joe's pizza
                                </td>
                                <td className="border border-[#404040] px-2 py-1">
                                  (555) 555-5555
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-[#404040] px-2 py-1">
                                  main street cleaners
                                </td>
                                <td className="border border-[#404040] px-2 py-1">
                                  (555) 123-4567
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : currentStep === 1 ? (
                      /* STEP 2 GUIDE */
                      <div className="p-4 space-y-3">
                        <h3 className="text-base font-semibold">Guide</h3>

                        {brainstorm ? (
                          <>
                            <div>
                              <p className="font-medium">Brainstorm with AI</p>
                              <ul className="text-xs text-neutral-400 mt-2 space-y-2">
                                <li className="flex gap-2">
                                  <span>1.</span>
                                  <p>Describe your product or service</p>
                                </li>
                                <li className="flex gap-2">
                                  <span>2.</span>
                                  <p>AI will suggest relevant job titles</p>
                                </li>
                                <li className="flex gap-2">
                                  <span>3.</span>
                                  <p>Select titles you want to target</p>
                                </li>
                                <li className="flex gap-2">
                                  <span>4.</span>
                                  <p>Add them to your search with one click</p>
                                </li>
                              </ul>
                            </div>

                            <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-green-400">
                              <p>
                                <span className="font-medium">Pro tip:</span> Be
                                specific about your customers. The more detailed you
                                are, the better the AI suggestions will be.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="font-medium">
                                1. Multiple job titles? use commas
                              </p>
                              <p className="text-neutral-400 text-xs mt-0.5 italic">
                                ceo, owner, founder
                              </p>
                            </div>

                            <div>
                              <p className="font-medium">
                                2. Want an exact match? use quotes
                              </p>

                              <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300">
                                <p>
                                  type{" "}
                                  <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
                                    ceo
                                  </code>{" "}
                                  (no quotes) and you might find a man whose title is{" "}
                                  <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
                                    'best ceo ever'
                                  </code>
                                </p>
                              </div>
                              <div className="mt-2 space-y-1">
                                <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300">
                                  <p>
                                    type{" "}
                                    <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
                                      "ceo"
                                    </code>{" "}
                                    and every person will have the exact title of{" "}
                                    <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
                                      "ceo"
                                    </code>
                                  </p>
                                </div>
                                <p className="text-neutral-400 text-xs mt-2 italic">
                                  "ceo", "owner", "founder" is allowed
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      /* STEP 3 GUIDE */
                      <div className="p-4 space-y-3">
                        <h3 className="text-base font-semibold">Industry Guide</h3>
                        <div>
                          <p className="font-medium">
                            1. Multiple industries? use commas
                          </p>
                          <p className="text-neutral-400 text-xs mt-0.5 italic">
                            software, healthcare, finance
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">
                            2. Think broadly or get specific
                          </p>
                          <p className="text-neutral-400 text-xs mt-0.5">
                            e.g. renewable energy <span className="italic">vs.</span>{" "}
                            solar panel installers
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.aside>
                ) : (
                  <motion.button
                    key="guide-tab"
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    aria-label="open guide"
                    onClick={() => setGuideOpen(true)}
                    className="fixed top-1/2 right-2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </motion.button>
                ))}
            </AnimatePresence>

            <main className="flex-1 flex flex-col items-center justify-center px-4 mt-72">
              <div className="w-full max-w-[690px] relative">
                {/* back arrow */}
                {currentStep > 0 && (
                  <button
                    type="button"
                    aria-label="back"
                    onClick={() => handleBack(currentStep - 1)}
                    className="absolute -left-10 top-1 text-neutral-400 hover:text-white focus:outline-none"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                )}

                {/* heading */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={headingKey}
                    className={`flex flex-col items-center gap-2 mb-4 relative z-0 ${
                      currentStep === 1
                        && answerType === "people"
                        && !brainstorm
                          ? "-mt-28"
                          : ""
                    }`}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onAnimationComplete={() => {
                      if (
                        (brainstorm && !shouldAdjustPadding) ||
                        (!brainstorm && shouldAdjustPadding)
                      ) {
                        setShouldAdjustPadding(brainstorm);
                      }
                    }}
                  >
                    {currentStep === 0 && (
                      <p className="absolute -top-6 left-1/2 -translate-x-1/2 text-center text-sm text-neutral-400">
                        build a list of...
                      </p>
                    )}
                    {currentStep === 1 &&
                      answerType === "people" &&
                      brainstorm && (
                        <p className="absolute -top-6 left-1/2 -translate-x-1/2 text-center text-sm text-neutral-400">
                          Brainstorm job titles
                        </p>
                      )}
                    {currentStep === 2 && (
                      <p className="absolute -top-6 left-1/2 -translate-x-1/2 text-center text-sm text-neutral-400">
                        Add industries
                      </p>
                    )}
                    {currentStep < 3 && (
                      <div className="w-full flex justify-center">
                        <h1 className="text-3xl sm:text-2xl font-medium">
                          {headingText}
                          {currentStep === 1 &&
                            answerType === "people" &&
                            !brainstorm && (
                              <span className="text-neutral-500">(s)</span>
                            )}
                        </h1>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* toggle switch */}
                {currentStep === 1 &&
                  answerType === "people" &&
                  !showSuggestions &&
                  !isProcessing &&
                  !brainstormQuery && (
                    <motion.div
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className={`absolute right-0 bottom-16 ${
                        brainstorm && shouldAdjustPadding ? "pb-0" : "pb-2"
                      } z-10 flex flex-col items-center gap-1`}
                    >
                      <ToggleSwitch
                        value={brainstorm}
                        onChange={handleBrainstormToggle}
                      />
                      <span className="text-[10px] text-neutral-400">brainstorm</span>
                    </motion.div>
                  )}

                {/* form */}
                {currentStep < 3 && (
                  <form
                    onSubmit={handleSubmit}
                    className="rounded-3xl bg-[#303030] shadow-sm relative"
                  >
                    <div className="flex flex-col px-4 py-2">
                      <div className="flex items-center flex-wrap gap-2">
                        {/* STEP 2 badges */}
                        {currentStep === 1 &&
                          answerType === "people" &&
                          !brainstorm &&
                          selectedExamples.map((example, index) => (
                            <Badge
                              key={index}
                              onRemove={() => handleBadgeRemove(index)}
                            >
                              {example}
                            </Badge>
                          ))}

                        {currentStep === 1 &&
                          answerType === "people" &&
                          brainstorm &&
                          !showSuggestions &&
                          brainstormExamples.map((example, index) => (
                            <Badge
                              key={index}
                              onRemove={() => handleBadgeRemove(index)}
                            >
                              {example}
                            </Badge>
                          ))}

                        {/* STEP 3 industry badges */}
                        {currentStep === 2 &&
                          selectedIndustries.map((ind, idx) => (
                            <Badge
                              key={idx}
                              onRemove={() => handleBadgeRemove(idx)}
                            >
                              {ind}
                            </Badge>
                          ))}

                        <textarea
                          ref={textareaRef}
                          rows={2}
                          placeholder={
                            currentStep === 0
                              ? displayedText
                              : currentStep === 1 && brainstorm
                              ? "i sell commercial window cleaning services..."
                              : currentStep === 2
                              ? "software, healthcare..."
                              : ""
                          }
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

                      {/* ChatGPT-style buttons - only show on step 1 */}
                      {currentStep === 0 && (
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
                                        <button className="tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2 whitespace-nowrap"
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
                                          <ListFilter className="h-4 w-4" />
                                          <span>Manual</span>
                                        </button>
                                        <button className={`tooltip px-4 py-2 rounded-full text-xs font-medium text-white bg-transparent border border-neutral-600 hover:bg-neutral-700/40 transition-colors flex items-center gap-2 whitespace-nowrap ${isExtensionLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                      )}

                      {/* dropdown for step 1 suggestions */}
                      <AnimatePresence>
                        {currentStep === 0 && suggestion && (
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
                                  ? "bg-[#3a3a3a]"
                                  : "hover:bg-[#3a3a3a]"
                              }`}
                              onMouseEnter={() => setSuggestActive(true)}
                              onMouseLeave={() => setSuggestActive(false)}
                              onClick={() => proceedStep0(suggestion)}
                            >
                              {suggestion}
                            </li>
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </form>
                )}

                {/* database size indicator - only visible on step 1 */}
                {currentStep === 0 && (
                  <div className="text-right mt-1">
                    <span className="text-xs text-neutral-600">270,394,457 contacts</span>
                  </div>
                )}
                
                {/* Results Display - displayed when we reach step 3 */}
                <AnimatePresence>
                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
                      className="mt-8"
                    >
                      {/* Success message */}
                      <div className="mb-6 text-center">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-900/20 border border-green-800/20 mb-3">
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        </div>
                        <h3 className="text-xl font-medium text-white">Results Found</h3>
                        <p className="text-sm text-neutral-400 mt-1">We've found contacts matching your criteria</p>
                      </div>
                      
                      <ResultsDisplay
                        onReset={handleResetSearch}
                        searchFilters={searchFilters}
                        searchResults={searchResults}
                        resultsLoading={resultsLoading}
                        searchPage={searchPage}
                        totalResults={totalResults}
                        totalPages={totalPages}
                        onPageChange={fetchSearchResults}
                        searchLimit={searchLimit}
                        answerType={answerType}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Brainstorm processing indicator */}
                <AnimatePresence mode="wait">
                  {currentStep === 1 &&
                    brainstorm &&
                    isProcessing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 flex flex-col items-center"
                      >
                        <div className="flex gap-2 items-center">
                          <div className="relative w-5 h-5">
                            <div className="absolute inset-0 rounded-full border-2 border-gray-400 border-t-white animate-spin"></div>
                          </div>
                          <p className="text-sm text-neutral-300">Thinking...</p>
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>

                {/* Container for brainstorm suggestion & selected boxes */}
                <AnimatePresence>
                  {currentStep === 1 &&
                    brainstorm &&
                    !isProcessing &&
                    brainstormQuery && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="mt-4 w-full space-y-3"
                      >
                        {/* Suggestions box */}
                        <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-medium">
                              Suggestions based on your input
                            </h3>
                            <button
                              onClick={() => {
                                setBrainstormSuggestions([]);
                              }}
                              className="text-neutral-400 hover:text-white"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>

                          {brainstormSuggestions.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {brainstormSuggestions.map((suggestion, i) => (
                                <motion.button
                                  key={suggestion}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                    transition: { delay: i * 0.05 },
                                  }}
                                  onClick={() => handleSuggestionSelect(suggestion)}
                                  className="flex items-center justify-between px-2 py-1.5 rounded-md bg-[#333333] hover:bg-[#3a3a3a] text-left transition-colors text-xs"
                                >
                                  <span className="text-sm">{suggestion}</span>
                                  <span className="text-green-400 text-xs">+</span>
                                </motion.button>
                              ))}
                            </div>
                          ) : (
                            <div className="py-2 text-center">
                              <p className="text-xs text-neutral-500 italic">
                                No suggestions found. Try being more specific about
                                your target audience.
                              </p>
                            </div>
                          )}

                          {brainstormSuggestions.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-[#404040] text-center">
                              <p className="text-xs text-neutral-400">
                                Not seeing what you want? Try being more specific.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Selected job titles box */}
                        <div className="bg-[#252525] border border-[#404040] rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-medium text-white">
                              Selected Job Titles
                            </h3>
                          </div>

                          <div className="flex flex-wrap gap-1.5 min-h-[40px] bg-[#2b2b2b] p-2 rounded-md relative">
                            {selectedKeywords.map((keyword, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-900/30 text-xs text-green-400 border border-green-800/50"
                              >
                                {keyword}
                                <button
                                  type="button"
                                  onClick={() => handleKeywordRemove(index)}
                                  className="text-green-400 hover:text-white ml-0.5"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {selectedKeywords.length === 0 && (
                              <p className="text-xs text-neutral-500 italic">
                                No job titles selected yet
                              </p>
                            )}
                            <button
                              onClick={handleNextStep}
                              disabled={selectedKeywords.length === 0}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                                selectedKeywords.length > 0
                                  ? "bg-neutral-600 hover:bg-neutral-600"
                                  : "bg-neutral-700 cursor-not-allowed"
                              }`}
                            >
                              <span>Next Step</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>

                {/* examples list */}
                <AnimatePresence>
                  {(currentStep === 1 || currentStep === 2) &&
                    (currentStep === 1 ? showExamples : showIndustryExamples) &&
                    !brainstorm && (
                      <motion.div
                        className="absolute top-full left-0 mt-2 w-[calc(100%+32px)] -translate-x-4 max-w-[calc(690px+32px)] flex flex-wrap gap-2 z-10"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        {examples
                          .filter((ex) =>
                            currentStep === 1
                              ? !selectedExamples.includes(ex)
                              : !selectedIndustries.includes(ex)
                          )
                          .map((ex, i) => (
                            <div key={ex}>
                              <BadgeButton
                                color={badgeColors[i % badgeColors.length]}
                                onClick={() => handleExampleClick(ex)}
                              >
                                {ex}
                              </BadgeButton>
                            </div>
                          ))}
                        <div className="w-full mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              currentStep === 1
                                ? setShowExamples(false)
                                : setShowIndustryExamples(false)
                            }
                            className="text-xs text-neutral-400 hover:underline"
                          >
                            hide examples
                          </button>
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>

                {/* toggle examples */}
                {currentStep === 1 && !brainstorm && !showExamples && (
                  <motion.div layout className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowExamples(true)}
                      className="text-xs text-neutral-400 hover:underline"
                    >
                      see examples
                    </button>
                  </motion.div>
                )}

                {currentStep === 2 && !showIndustryExamples && (
                  <motion.div layout className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowIndustryExamples(true)}
                      className="text-xs text-neutral-400 hover:underline"
                    >
                      see examples
                    </button>
                  </motion.div>
                )}
              </div>
            </main>
          </div>
        )}
      </AnimatePresence>

      {/* Toast notification for Chrome extension download */}
      <AnimatePresence>
        {showExtensionToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-5 right-5 bg-green-900/80 border border-green-700 text-green-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
          >
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="font-medium">Chrome Extension Download Started</p>
              <p className="text-xs text-green-300 mt-0.5">Unzip the file and follow the installation instructions</p>
            </div>
            <button 
              onClick={() => setShowExtensionToast(false)}
              className="ml-2 text-green-300 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notification for enrichment success */}
      <AnimatePresence>
        {showEnrichmentToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-5 right-5 bg-blue-900/80 border border-blue-700 text-blue-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
          >
            <CheckCircle className="h-5 w-5 text-blue-400" />
            <div>
              <p className="font-medium">Enrichment Completed Successfully</p>
              <p className="text-xs text-blue-300 mt-0.5">Your enriched data has been saved to your exports</p>
            </div>
            <button 
              onClick={() => setShowEnrichmentToast(false)}
              className="ml-2 text-blue-300 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
