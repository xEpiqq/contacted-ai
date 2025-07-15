"use client";
import React, { useState, useEffect, useRef } from "react";
import { Combobox } from "@headlessui/react";
import { ChevronUpDownIcon, ChevronDownIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { createClient } from "@/utils/supabase/client";

// Database table configurations
const DB_TABLES = [
  {
    id: "usa4_new_v2",
    name: "USA Professionals",
    description: "Individual professionals located in the United States",
    defaultColumns: ['Full name', 'Job title', 'Emails', 'Phone numbers'],
    totalCount: 31177584
  },
  {
    id: "otc1_new_v2", 
    name: "International Professionals",
    description: "Professionals located outside the United States",
    defaultColumns: ['full_name', 'job_title', 'email', 'phone_number'],
    totalCount: 47352973
  },
  {
    id: "eap1_new_v2",
    name: "Global B2B Contacts", 
    description: "Business contacts with emails from around the world",
    defaultColumns: ['person_name', 'person_title', 'person_email', 'person_phone'],
    totalCount: 85000000
  },
  {
    id: "deez_3_v3",
    name: "US Local Businesses",
    description: "Local business establishments in the United States", 
    defaultColumns: ['name', 'search_keyword', 'phone', 'email', 'city'],
    totalCount: 4908756
  }
];

/** Format large numbers with commas */
function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

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
      {/* Display existing tokens */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tokens.map((token, idx) => (
          <div key={idx} className="bg-blue-600/10 border border-blue-500/20 text-blue-500 text-sm px-2 py-1 rounded-md flex items-center gap-2">
            <span>{token}</span>
            <button
              onClick={() => removeToken(token)}
              className="text-blue-500 hover:text-blue-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Input for new token */}
        <input
        type="text"
          value={pendingText}
          onChange={(e) => setPendingText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        placeholder="Search (Enter to add new)"
        className="w-full bg-[#212121] border border-[#404040] rounded-md px-3 py-2 text-white placeholder:text-neutral-600 focus:outline-none focus:border-green-500"
        />

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-[#252525] border border-[#404040] rounded-md shadow-md max-h-48 overflow-auto"
        >
          {isFetching ? (
            <div className="p-3 text-sm text-neutral-400 flex items-center gap-2">
              {/* Simple loading spinner */}
              <svg
                className="h-4 w-4 animate-spin mr-2 text-neutral-500"
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
              <span>Loading suggestions...</span>
            </div>
          ) : filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((item, i) => (
              <div
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent losing focus
                  addToken(item);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-[#333333] text-sm text-white"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-neutral-400">
              No suggestions found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ManualSearchClone({ 
  aiResults = null, 
  recommendedDatabase = null,
  className = "",
  onResultsCountChange = null,
  onBack = null // optional callback to return to search input view
}) {
  // Table selection state
  const [selectedTable, setSelectedTable] = useState(() => {
    // If we have a recommended database, find it in our tables
    if (recommendedDatabase) {
      const found = DB_TABLES.find(t => t.id === recommendedDatabase);
      return found || DB_TABLES[0];
    }
    return DB_TABLES[0];
  });
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false);

  // Data + Pagination
  const [results, setResults] = useState([]);
  const [matchingCount, setMatchingCount] = useState(0);
  const [limit, setLimit] = useState(50);
  const [page, setPage] = useState(0);
  const offset = page * limit;

  // Filters
  const [filters, setFilters] = useState([]);
  const [pendingFilters, setPendingFilters] = useState([]);
  const [editingFilterIndex, setEditingFilterIndex] = useState(null);

  // Columns
  const [availableColumns, setAvailableColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});

  // User Settings Load State (important fix)
  const [userSettingsLoaded, setUserSettingsLoaded] = useState(false);

  // Column & Filter Section visibility
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  // Filters panel visibility (now hidden by default and toggled via top button)
  const [showFilterSection, setShowFilterSection] = useState(false);

  // Searching columns in Column Modal
  const [columnSearch, setColumnSearch] = useState("");

  // SSE Export
  const [showExportSection, setShowExportSection] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [rowsToExport, setRowsToExport] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportDone, setExportDone] = useState(false);

  // Loading states
  const [rowsLoading, setRowsLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);

  // Filter combobox for single line
  const [searchQuery, setSearchQuery] = useState("");

  // Store the user's tokens_total for deciding pagination limit
  const [tokensTotal, setTokensTotal] = useState(null);

  // Database counts (can be updated dynamically)
  const [databaseCounts, setDatabaseCounts] = useState({});
  // Toggle for showing/hiding the Database Info section
  const [showDbInfo, setShowDbInfo] = useState(false);

  // Handle click outside dropdown
  const tableDropdownRef = useRef(null);
  
  // Notify parent of results count changes
  useEffect(() => {
    if (onResultsCountChange) {
      onResultsCountChange(matchingCount);
    }
  }, [matchingCount, onResultsCountChange]);

  // Function to show filter section and initialize with empty filter if needed
  function toggleFilterSection() {
    if (!showFilterSection && pendingFilters.length === 0) {
      // Make a copy so we can discard changes if user cancels
      setPendingFilters(JSON.parse(JSON.stringify(filters.length ? filters : [{
        column: "",
        condition: "contains",
        tokens: [],
        pendingText: "",
        subop: ""
      }])));
    }
    setShowFilterSection(!showFilterSection);
    // Close other sections
    setShowColumnSelector(false);
    setShowExportSection(false);
  }
  
  // Toggle column selector
  function toggleColumnSelector() {
    setColumnSearch("");
    setShowColumnSelector(!showColumnSelector);
    // Close other sections
    setShowFilterSection(false);
    setShowExportSection(false);
  }
  
  // Toggle export section
  function toggleExportSection() {
    setShowExportSection(!showExportSection);
    // Close other sections
    setShowFilterSection(false);
    setShowColumnSelector(false);
  }

  // Handle click outside table dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        tableDropdownRef.current &&
        !tableDropdownRef.current.contains(e.target)
      ) {
        setTableDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [tableDropdownRef]);

  // On mount, fetch user tokens_total
  useEffect(() => {
    const supa = createClient();
    supa.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        const { data: profileData } = await supa
          .from("profiles")
          .select("tokens_total")
          .eq("user_id", data.user.id)
          .single();
        if (profileData) {
          setTokensTotal(profileData.tokens_total);
        }
      }
    });
  }, []);

  // Function to convert AI results to filter format
  function convertAIResultsToFilters(aiData) {
    console.log("=== convertAIResultsToFilters DEBUG ===");
    console.log("selectedTable.id:", selectedTable.id);
    console.log("aiData:", aiData);
    
    const newFilters = [];
    
    // Define column mappings for each database
    const getColumnMappings = (tableId) => {
      switch (tableId) {
        case "usa4_new_v2":
          return {
            jobTitle: "Job title",
            industry: "Industry", 
            location: "Region"
          };
        case "eap1_new_v2":
          return {
            jobTitle: "person_title",
            industry: "person_detailed_function (98% coverage)", 
            location: "person_location_country (98% coverage)",
            dbName: "Global B2B Contacts"
          };
        case "otc1_new_v2": 
          return {
            jobTitle: "job_title",
            industry: "industry",
            location: "location_country",
            dbName: "International Professionals"
          };
        case "deez_3_v3":
          return {
            jobTitle: null, // Local businesses don't have individual job titles
            industry: "search_keyword", // Map business types to search_keyword field
            location: "city" // Map location to city field
          };
        default:
          return {
            jobTitle: "Job title",
            industry: "Industry",
            location: "Region"
          };
      }
    };
    
    const columnMap = getColumnMappings(selectedTable.id);
    console.log("columnMap:", columnMap);
    
    // Job Titles / Business Types
    if (selectedTable.id === "deez_3_v3") {
      console.log("Processing DEEZ business types...");
      console.log("aiData.businessTypes:", aiData.businessTypes);
      console.log("columnMap.industry:", columnMap.industry);
      
      // For local businesses, use businessTypes instead of jobTitles
      if (aiData.businessTypes && aiData.businessTypes.length > 0 && columnMap.industry) {
        console.log("Adding business types filter with tokens:", aiData.businessTypes);
        newFilters.push({
          column: columnMap.industry,
          condition: "contains",
          tokens: aiData.businessTypes,
          pendingText: "",
          subop: newFilters.length === 0 ? "" : "AND"
        });
      } else {
        console.log("Not adding business types filter. Conditions:", {
          hasBusinessTypes: !!(aiData.businessTypes && aiData.businessTypes.length > 0),
          hasIndustryColumn: !!columnMap.industry,
          businessTypesLength: aiData.businessTypes?.length || 0
        });
      }
    } else {
      // For professional databases, use jobTitles
      if (aiData.jobTitles && aiData.jobTitles.length > 0 && columnMap.jobTitle) {
        newFilters.push({
          column: columnMap.jobTitle,
          condition: "contains",
          tokens: aiData.jobTitles,
          pendingText: "",
          subop: newFilters.length === 0 ? "" : "AND"
        });
      }
    }
    
    // Industry Keywords (skip for DEEZ since business types are handled above)
    if (selectedTable.id !== "deez_3_v3" && aiData.industryKeywords && aiData.industryKeywords.length > 0 && columnMap.industry) {
      newFilters.push({
        column: columnMap.industry,
        condition: "contains", 
        tokens: aiData.industryKeywords,
        pendingText: "",
        subop: newFilters.length === 0 ? "" : "AND"
      });
    }
    
    // Location Info
    if (aiData.locationInfo && aiData.locationInfo.hasLocation && columnMap.location) {
      const locationTokens = [];
      const loc = aiData.locationInfo.components;
      
      if (selectedTable.id === "deez_3_v3") {
        // For DEEZ (local businesses), prioritize city since that's what we map to
        if (loc.city) locationTokens.push(loc.city);
        
        // Also add region/state as additional filters if available
        if (loc.state || loc.region) {
          newFilters.push({
            column: "region",
            condition: "contains",
            tokens: [loc.state || loc.region],
            pendingText: "",
            subop: newFilters.length === 0 ? "" : "AND"
          });
        }
        
        // Add ZIP code as additional filter if available
        if (loc.zip) {
          newFilters.push({
            column: "zip",
            condition: "contains",
            tokens: [loc.zip],
            pendingText: "",
            subop: newFilters.length === 0 ? "" : "AND"
          });
        }
      } else if (selectedTable.id === "eap1_new_v2") {
        // For EAP1, prioritize state/country over city
        if (loc.state) locationTokens.push(loc.state);
        if (loc.country) locationTokens.push(loc.country);
        if (loc.city && locationTokens.length === 0) locationTokens.push(loc.city);
      } else {
        // For other databases, use the original logic
        if (loc.city) locationTokens.push(loc.city);
        if (loc.state) locationTokens.push(loc.state);
        if (loc.region) locationTokens.push(loc.region);
      }
      
      if (locationTokens.length > 0) {
        newFilters.push({
          column: columnMap.location,
          condition: "contains",
          tokens: locationTokens,
          pendingText: "",
          subop: newFilters.length === 0 ? "" : "AND"
        });
      }
    }
    
    // Additional Filters
    if (aiData.hasAdditionalFilters && aiData.additionalFilters && aiData.additionalFilters.length > 0) {
      aiData.additionalFilters.forEach(filter => {
        // Only add if the column exists in available columns
        // This will be validated when availableColumns is loaded
        newFilters.push({
          column: filter.column,
          condition: "contains",
          tokens: Array.isArray(filter.values) ? filter.values : [filter.values],
          pendingText: "",
          subop: newFilters.length === 0 ? "" : "AND"
        });
      });
    }
    
    // If no filters were created, add an empty one
    if (newFilters.length === 0) {
      newFilters.push({
        column: "",
        condition: "contains",
        tokens: [],
        pendingText: "",
        subop: ""
      });
    }
    
    return newFilters;
  }

  // Function to fetch database total counts
  async function fetchDatabaseCount(tableId) {
    try {
      const res = await fetch(`/api/people/table-count?table_name=${tableId}`);
      const data = await res.json();
      if (res.ok && data.totalCount) {
        setDatabaseCounts(prev => ({
          ...prev,
          [tableId]: data.totalCount
        }));
      }
    } catch (err) {
      console.error(`Error fetching count for ${tableId}:`, err);
    }
  }

  // Get the display count for a table (dynamic if available, fallback to static)
  function getTableCount(table) {
    return databaseCounts[table.id] || table.totalCount;
  }

  // ------------------------
  //    On mount or table change
  // ------------------------
  useEffect(() => {
    resetStateForNewTable();
    fetchUserSettingsAndColumns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  const resetStateForNewTable = () => {
    setResults([]);
    setMatchingCount(0);
    setPage(0);
    setFilters([]);
    // Initialize with filters from AI results if available
    if (aiResults) {
      const aiFilters = convertAIResultsToFilters(aiResults);
      setPendingFilters(aiFilters);
    } else {
      setPendingFilters([{
        column: "",
        condition: "contains",
        tokens: [],
        pendingText: "",
        subop: ""
      }]);
    }
    setVisibleColumns([]);
    setColumnWidths({});
    setUserSettingsLoaded(false);
  };

  // Initialize filters from AI results when component mounts or aiResults change
  useEffect(() => {
    if (aiResults && userSettingsLoaded && availableColumns.length > 0) {
      console.log("=== FILTER VALIDATION DEBUG ===");
      console.log("availableColumns:", availableColumns);
      
      const aiFilters = convertAIResultsToFilters(aiResults);
      console.log("aiFilters before validation:", aiFilters);
      
      // Validate that all AI-generated filter columns exist in available columns
      const validatedFilters = aiFilters.filter(filter => {
        if (!filter.column) return true; // Keep empty filters
        const columnExists = availableColumns.includes(filter.column);
        if (!columnExists) {
          console.warn(`AI-generated filter column "${filter.column}" not found in available columns for ${selectedTable.id}`);
        } else {
          console.log(`✓ Column "${filter.column}" found in available columns`);
        }
        return columnExists;
      });
      
      console.log("validatedFilters after validation:", validatedFilters);
      
      // If no valid filters remain, add an empty one
      if (validatedFilters.length === 0) {
        validatedFilters.push({
          column: "",
          condition: "contains",
          tokens: [],
          pendingText: "",
          subop: ""
        });
      }
      
      setPendingFilters(validatedFilters);
      setFilters(validatedFilters);
    }
  }, [aiResults, userSettingsLoaded, availableColumns]);

  // On component mount, initialize with one filter rule if none exists
  useEffect(() => {
    // If there are no pending filters, add one empty filter rule
    if (pendingFilters.length === 0) {
      if (aiResults) {
        const aiFilters = convertAIResultsToFilters(aiResults);
        setPendingFilters(aiFilters);
      } else {
        setPendingFilters([{
          column: "",
          condition: "contains",
          tokens: [],
          pendingText: "",
          subop: ""
        }]);
      }
    }
  }, []);

  // Only fetch rows if userSettingsLoaded is true
  // and filters changes => set page=0 => fetch rows & maybe count
  useEffect(() => {
    if (!userSettingsLoaded) return;
    setPage(0);
    if (filters.length > 0) {
      parallelFetchRowsAndCount(0);
    } else {
      // If no filters, just fetch some rows, and reset matchingCount
      fetchRows(0);
      setMatchingCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, userSettingsLoaded]);

  // Whenever page changes => fetch rows, only if userSettingsLoaded
  useEffect(() => {
    if (!userSettingsLoaded) return;
    fetchRows(offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, offset, userSettingsLoaded]);

  // ------------------------
  //    API Calls
  // ------------------------
  async function fetchUserSettingsAndColumns() {
    try {
      const res = await fetch(`/api/people/columns?table_name=${selectedTable.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load columns");

      const cols = data.columns || [];
      const userCols = data.userColumns || [];
      const userFilters = data.userFilters || [];

      setAvailableColumns(cols);

      // If user has saved columns => use them
      if (userCols.length) {
        setVisibleColumns(userCols);
      } else {
        // Otherwise, do default intersection or fallback
        const intersection = selectedTable.defaultColumns.filter((c) => cols.includes(c));
        const newVisible =
          intersection.length > 0
            ? intersection
            : cols.slice(0, Math.min(cols.length, 5));
        setVisibleColumns(newVisible);
      }

      // If user has saved filters AND no AI results => use saved filters
      if (userFilters.length && !aiResults) {
        setFilters(userFilters);
      } else if (aiResults) {
        // Use AI results to populate filters
        const aiFilters = convertAIResultsToFilters(aiResults);
        setFilters(aiFilters);
        setPendingFilters(aiFilters);
      } else {
        setFilters([]);
      }

      // Mark user settings as loaded
      setUserSettingsLoaded(true);
    } catch (err) {
      console.error("Error fetching columns & user settings:", err);
      // Even if it failed, mark loaded so we don't get stuck forever
      setUserSettingsLoaded(true);
    }
  }

  async function fetchRows(currentOffset, isParallel = false) {
    if (!isParallel) setRowsLoading(true);
    try {
      const params = new URLSearchParams({
        table_name: selectedTable.id,
        limit: limit.toString(),
        offset: currentOffset.toString(),
        filters: JSON.stringify(filters),
      });
      const res = await fetch(`/api/people/search?${params}`);
      const data = await res.json();
      if (res.ok) {
        setResults(data.results || []);
        // Initialize columnWidths once if none present
        if (!Object.keys(columnWidths).length && data.results?.length) {
          const widths = {};
          visibleColumns.forEach((c) => (widths[c] = "auto"));
          setColumnWidths(widths);
        }
      }
    } catch (err) {
      console.error("Error fetching rows:", err);
    }
    if (!isParallel) setRowsLoading(false);
  }

  async function fetchMatchingCount(isParallel = false) {
    if (!isParallel) setCountLoading(true);
    try {
      const params = new URLSearchParams({
        table_name: selectedTable.id,
        filters: JSON.stringify(filters),
      });
      const res = await fetch(`/api/people/search-count?${params}`);
      const data = await res.json();
      if (res.ok) setMatchingCount(data.matchingCount || 0);
    } catch (err) {
      console.error("Error fetching matching count:", err);
    }
    if (!isParallel) setCountLoading(false);
  }

  async function parallelFetchRowsAndCount(newOffset) {
    setRowsLoading(true);
    setCountLoading(true);
    try {
      await Promise.all([fetchRows(newOffset, true), fetchMatchingCount(true)]);
    } catch (err) {
      console.error("Parallel fetch error:", err);
    }
    setRowsLoading(false);
    setCountLoading(false);
  }

  async function saveUserSettings(newVisibleColumns, newFilters) {
    try {
      await fetch(`/api/people/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_name: selectedTable.id,
          columns: newVisibleColumns,
          filters: newFilters,
        }),
      });
    } catch (err) {
      console.error("Failed to save user settings:", err);
    }
  }

  // ------------------------
  //    Pagination
  // ------------------------
  const totalPages = matchingCount > 0 ? Math.ceil(matchingCount / limit) : 1;

  function nextPage() {
    // Decide max page index based on tokensTotal (example logic)
    const maxPageIndex =
      tokensTotal !== null
        ? tokensTotal <= 201
          ? 4
          : 24
        : 4; // fallback 5 pages if we never loaded tokensTotal

    setPage((prev) => Math.min(prev + 1, totalPages - 1, maxPageIndex));
  }

  function prevPage() {
    setPage((prev) => Math.max(0, prev - 1));
  }

  // ------------------------
  //    Filter Logic
  // ------------------------
  function openFilterModal() {
    // Make a copy so we can discard changes if user cancels
    setPendingFilters(JSON.parse(JSON.stringify(filters)));
    setShowFilterSection(true);
  }
  function closeFilterModal() {
    setShowFilterSection(false);
  }
  function addFilterLine() {
    const isFirst = pendingFilters.length === 0;
    setPendingFilters((prev) => [
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
    setPendingFilters((prev) => prev.filter((_, i) => i !== index));
  }
  function updateFilterLine(index, field, value) {
    setPendingFilters((prev) => {
      const arr = [...prev];
      arr[index][field] = value;
      return arr;
    });
  }
  function updateLineSubop(index, newOp) {
    setPendingFilters((prev) => {
      const arr = [...prev];
      arr[index].subop = newOp;
      return arr;
    });
  }
  function updateLineTokens(index, newTokens) {
    setPendingFilters((prev) => {
      const arr = [...prev];
      arr[index].tokens = newTokens;
      return arr;
    });
  }
  function updateLinePendingText(index, txt) {
    setPendingFilters((prev) => {
      const arr = [...prev];
      arr[index].pendingText = txt;
      return arr;
    });
  }

  async function applyFilters() {
    const updated = pendingFilters.map((rule) => {
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

    setFilters(updated);
    setShowFilterSection(false);
    await saveUserSettings(visibleColumns, updated);
  }

  // ------------------------
  //   Column Selection
  // ------------------------
  function openColumnSelectorModal() {
    setColumnSearch("");
    setShowColumnSelector(true);
  }
  
  async function closeColumnSelectorModal() {
    setShowColumnSelector(false);
    await saveUserSettings(visibleColumns, filters);
  }
  
  function toggleColumn(col) {
    setVisibleColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  }
  
  const filteredAvailableColumns = columnSearch
    ? availableColumns.filter((col) =>
        col.toLowerCase().includes(columnSearch.toLowerCase())
      )
    : availableColumns;

  // ------------------------
  //     SSE Export
  // ------------------------
  function openExportModal() {
    setRowsToExport(matchingCount || 0);
    setExportProgress(0);
    setExportError("");
    setExportDone(false);
    setShowExportSection(true);
  }
  
  function closeExportModal() {
    setShowExportSection(false);
  }

  async function startExport() {
    if (!rowsToExport || rowsToExport < 1) return;
    setExportError("");
    setExporting(true);
    setExportProgress(0);
    setExportDone(false);

    const params = new URLSearchParams({
      table_name: selectedTable.id,
      filters: JSON.stringify(filters),
      limit: rowsToExport.toString(),
    });
    // pass columns
    params.append("columns", visibleColumns.join(","));

    const es = new EventSource(`/api/people/export?${params}`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data || "{}");
        if (typeof data.progress === "number") {
          setExportProgress(data.progress);
        }
        if (data.error) {
          es.close();
          setExporting(false);
          setExportError(data.error);
        }
        if (data.status === "done") {
          es.close();
          setExporting(false);
          setExportProgress(100);
          setExportDone(true);
        }
      } catch (err) {
        es.close();
        setExporting(false);
        setExportError("Export failed");
      }
    };
    es.onerror = () => {
      es.close();
      setExporting(false);
      setExportError("Export failed");
    };
  }

  // Helper function to get user-friendly column mapping info
  function getColumnMappingInfo(tableId) {
    switch (tableId) {
      case "usa4_new_v2":
        return {
          jobTitle: "Job title",
          industry: "Industry", 
          location: "Region",
          dbName: "USA Professionals"
        };
      case "eap1_new_v2":
        return {
          jobTitle: "person_title",
          industry: "person_detailed_function (98% coverage)", 
          location: "person_location_country (98% coverage)",
          dbName: "Global B2B Contacts"
        };
      case "otc1_new_v2": 
        return {
          jobTitle: "job_title",
          industry: "industry",
          location: "location_country",
          dbName: "International Professionals"
        };
      case "deez_3_v3":
        return {
          jobTitle: "Not applicable (businesses)",
          industry: "search_keyword (100% coverage)",
          location: "city (99.6% coverage)",
          dbName: "US Local Businesses"
        };
      default:
        return {
          jobTitle: "Job title",
          industry: "Industry",
          location: "Region",
          dbName: "Database"
        };
    }
  }

  // ------------------------
  //    Render
  // ------------------------
  return (
    <div className={`bg-[#212121] text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top Control Bar */}
      <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
        {/* Left side: Back button and results count */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2 py-2 bg-[#252525] hover:bg-[#303030] border border-[#404040] rounded-md text-sm flex items-center"
              aria-label="Back to Search"
            >
              <ArrowLeftIcon className="h-4 w-4 text-neutral-300" />
            </button>
          )}
          <span className="text-sm text-neutral-300">
            {countLoading ? (
              <span className="inline-block w-16 bg-[#303030] h-5 rounded animate-pulse" />
            ) : (
              `${formatNumber(matchingCount)} results`
            )}
          </span>
          <span className="text-sm text-neutral-500">| {selectedTable.name}</span>
        </div>
 
        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-3">
           
          {/* Select Columns */}
          <button
            onClick={toggleColumnSelector}
            className="px-4 py-2 bg-[#252525] hover:bg-[#303030] border border-[#404040] rounded-md text-sm"
          >
            Select Columns
          </button>
  
          {/* Export Data */}
          <button
            onClick={toggleExportSection}
            className="px-4 py-2 bg-[#252525] hover:bg-[#303030] border border-[#404040] rounded-md text-sm"
          >
            Export Data
          </button>
  
          {/* Filters */}
          <button
            onClick={toggleFilterSection}
            className="px-4 py-2 bg-[#252525] hover:bg-[#303030] border border-[#404040] rounded-md text-sm flex items-center gap-2"
          >
            <span>Filters</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${showFilterSection ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Active Filter Badges (blue tags) - show only when filters panel open */}
          {showFilterSection && filters.length > 0 && (
            <div className="flex flex-wrap gap-2 ml-2">
              {filters.map((f, i) => {
                const prefix = i === 0 ? "Where" : f.subop || "AND";
                const safeTokens = Array.isArray(f.tokens) ? f.tokens : [];
                let desc = "";
                if (f.condition === "is empty" || f.condition === "is not empty") {
                  desc = f.condition;
                } else {
                  desc = `${f.condition} [${safeTokens.join(", ")}]`;
                }
                return (
                  <div key={i} className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-2 rounded-md whitespace-nowrap">
                    <strong>{prefix}</strong> {f.column} {desc}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
 
      {/* Database Info Panel removed */}
 
      {/* Main Search Interface */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar: only visible when column selector or export panel is open */}
        <div className={`lg:w-80 flex-shrink-0 ${!(showColumnSelector || showExportSection) ? 'hidden' : ''}`}>
          <div className="bg-[#252525] border border-[#333333] rounded-lg overflow-hidden">
             {/* Sidebar no longer shows top-level buttons; contents rendered below if toggled */}

            {/* Dynamic Content Section */}
            <div className="max-h-96 overflow-y-auto">
              {/* Column Selection Section */}
              {showColumnSelector && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-white">Column Selection</h3>
                  </div>
                  
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="Search columns..."
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/30 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-3 mb-6">
                    {filteredAvailableColumns.map((col) => (
                      <label key={col} className="flex items-center gap-3 cursor-pointer py-3 px-3 hover:bg-white/5 rounded-lg transition-all duration-200">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(col)}
                          onChange={() => toggleColumn(col)}
                          className="h-4 w-4 accent-blue-500 rounded"
                        />
                        <span className="text-sm text-white">{col}</span>
                      </label>
                    ))}
                  </div>
                  
                  <button 
                    onClick={closeColumnSelectorModal}
                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm rounded-xl transition-all duration-200"
                  >
                    Apply Changes
                  </button>
                </div>
              )}
              
              {/* Export Section */}
              {showExportSection && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-white">Export Data</h3>
                  </div>
                  
                  {exporting ? (
                    <div>
                      <div className="w-full bg-white/10 h-2 rounded-full mb-4 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                      <div className="text-sm text-white/70 text-center">
                        {exportProgress}% Complete
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-white/70 mb-6">
                        Choose how many rows to export. You'll be charged 1 token per
                        row, but only if the export completes successfully.
                      </p>
                      
                      <div className="mb-6">
                        <div className="text-sm text-white/70 mb-3">Rows to Export</div>
                        <input
                          type="number"
                          value={rowsToExport === null ? "" : rowsToExport}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRowsToExport(val === "" ? null : Number(val));
                          }}
                          min="1"
                          className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/30 transition-all duration-200"
                        />
                      </div>
                      
                      {exportError && (
                        <div className="mb-4 text-sm text-red-400">{exportError}</div>
                      )}
                      
                      <button
                        onClick={startExport}
                        className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm rounded-xl transition-all duration-200"
                      >
                        Start Export
                      </button>
                    </>
                  )}
                  
                  {exportDone && (
                    <p className="mt-4 text-sm text-blue-400">
                      Export completed successfully!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Filter Section */}
          {showFilterSection && (
            <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
              <div className="px-6 py-5 border-b border-white/10">
                <h3 className="font-semibold text-lg text-white">Filter Settings</h3>
              </div>
              
              <div className="p-6 space-y-6">
                {pendingFilters.map((rule, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {index > 0 && (
                        <div className="md:col-span-3">
                          <div className="text-sm text-white/70 mb-3">Operator</div>
                          <select
                            value={rule.subop}
                            onChange={(e) => updateLineSubop(index, e.target.value)}
                            className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all duration-200"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-sm text-white/70 mb-3">Column</div>
                        <Combobox
                          value={rule.column}
                          onChange={(val) => updateFilterLine(index, "column", val)}
                        >
                          <div className="relative w-full">
                            <Combobox.Button
                              className="relative w-full border border-white/10 bg-white/5 backdrop-blur-sm text-white text-left rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-white/30 transition-all duration-200"
                            >
                              <Combobox.Input
                                onChange={(e) => {
                                  setSearchQuery(e.target.value);
                                  updateFilterLine(index, "column", e.target.value);
                                }}
                                displayValue={(val) => val}
                                placeholder="Select column..."
                                className="w-full bg-transparent focus:outline-none"
                              />
                              <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon
                                  className="h-5 w-5 text-white/50"
                                  aria-hidden="true"
                                />
                              </span>
                            </Combobox.Button>
                            <Combobox.Options
                              className="absolute z-10 mt-1 w-full bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl max-h-40 overflow-auto custom-scrollbar"
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
                                    `cursor-pointer select-none px-3 py-2 text-sm ${
                                      active
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "text-white"
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
                        <div className="text-sm text-white/70 mb-3">Condition</div>
                        <select
                          value={rule.condition}
                          onChange={(e) =>
                            updateFilterLine(index, "condition", e.target.value)
                          }
                          className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all duration-200"
                        >
                          <option value="contains">Contains</option>
                          <option value="equals">Equals</option>
                          <option value="is empty">Is Empty</option>
                          <option value="is not empty">Is Not Empty</option>
                        </select>
                      </div>
                      
                      {(rule.condition === "contains" || rule.condition === "equals") && (
                        <div className="md:col-span-3">
                          <div className="text-sm text-white/70 mb-3">Search Terms</div>
                          <TokensInput
                            tokens={rule.tokens}
                            setTokens={(arr) => updateLineTokens(index, arr)}
                            pendingText={rule.pendingText || ""}
                            setPendingText={(txt) => updateLinePendingText(index, txt)}
                            tableName={selectedTable.id}
                            column={rule.column}
                          />
                        </div>
                      )}
                      
                      <div className="md:col-span-3 flex justify-end">
                        <button 
                          onClick={() => removeFilterLine(index)}
                          className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg border border-red-500/20 transition-all duration-200"
                        >
                          Remove Rule
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex gap-4">
                  <button
                    onClick={addFilterLine}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white text-sm rounded-lg border border-white/10 flex items-center gap-2 transition-all duration-200"
                  >
                    <span>+</span> Add Rule
                  </button>
                  
                  <button 
                    onClick={applyFilters}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm rounded-lg ml-auto transition-all duration-200"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state for user settings */}
          {!userSettingsLoaded && (
            <div className="mt-8 text-sm text-white/70">Loading user settings...</div>
          )}

          {/* Results Table */}
          {userSettingsLoaded && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden max-w-6xl mx-auto">
              <div className="px-6 py-5 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-white">Search Results</h3>
                {filters.length > 0 && (
                  <span className="text-sm text-white/70">
                    Page {page + 1} of {totalPages}
                  </span>
                )}
              </div>
              
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent' }}>
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/10 backdrop-blur-sm border-b border-[#333333]">
                      {visibleColumns.map((col) => (
                        <th
                          key={col}
                          className="relative group py-4 px-6 text-sm font-semibold text-white/80 text-left first:pl-6 last:pr-6 border-0"
                          style={{
                            width: columnWidths[col] || "auto",
                            minWidth: "150px",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{col}</span>
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const startX = e.pageX;
                                const startWidth =
                                  e.currentTarget.parentElement.offsetWidth;
                                const onMouseMove = (moveEvt) => {
                                  const newWidth =
                                    startWidth + (moveEvt.pageX - startX);
                                  if (newWidth > 100) {
                                    setColumnWidths((prev) => ({
                                      ...prev,
                                      [col]: `${newWidth}px`,
                                    }));
                                  }
                                };
                                const onMouseUp = () => {
                                  document.removeEventListener(
                                    "mousemove",
                                    onMouseMove
                                  );
                                  document.removeEventListener(
                                    "mouseup",
                                    onMouseUp
                                  );
                                };
                                document.addEventListener("mousemove", onMouseMove);
                                document.addEventListener("mouseup", onMouseUp);
                              }}
                            />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rowsLoading
                      ? Array.from({ length: limit }).map((_, i) => (
                          <tr key={i} className={`animate-pulse ${i % 2 === 0 ? 'bg-[#252525]' : 'bg-[#1e1e1e]'}`}>
                            {visibleColumns.map((c) => (
                              <td key={c} className="py-4 px-6 first:pl-6 last:pr-6 border-0">
                                <div className="h-4 bg-white/10 rounded-lg w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : results.map((row, i) => (
                          <tr key={i} className={`hover:bg-[#333333]/40 transition-all duration-200 ${i % 2 === 0 ? 'bg-[#252525]' : 'bg-[#1e1e1e]'}`}>
                            {visibleColumns.map((c) => (
                              <td
                                key={c}
                                className="py-4 px-6 text-sm text-white/90 first:pl-6 last:pr-6 border-0"
                              >
                                <div className="truncate font-medium">{row[c]}</div>
                              </td>
                            ))}
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-5 flex items-center justify-between">
                <div className="text-sm text-white/70">
                  {results.length > 0 ? (
                    <>Showing {results.length} of {formatNumber(matchingCount)} results</>
                  ) : (
                    <>No results found</>
                  )}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={prevPage} 
                    disabled={page === 0}
                    className={`px-5 py-2.5 text-sm rounded-lg font-medium transition-all duration-200 ${page === 0 ? 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white border-white/10 hover:border-white/20'}`}
                  >
                    Previous
                  </button>
                  <button 
                    onClick={nextPage} 
                    disabled={
                      page >=
                      Math.min(
                        totalPages - 1,
                        tokensTotal !== null && tokensTotal <= 201 ? 4 : 24
                      )
                    }
                    className={`px-5 py-2.5 text-sm rounded-lg font-medium transition-all duration-200 ${
                      page >=
                      Math.min(
                        totalPages - 1,
                        tokensTotal !== null && tokensTotal <= 201 ? 4 : 24
                      )
                        ? 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                        : 'bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white border-white/10 hover:border-white/20'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
} 