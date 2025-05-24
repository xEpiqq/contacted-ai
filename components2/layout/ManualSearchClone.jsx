"use client";
import React, { useState, useEffect, useRef } from "react";
import { Combobox } from "@headlessui/react";
import { ChevronUpDownIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
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
  onResultsCountChange = null
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
  const [showFilterSection, setShowFilterSection] = useState(true);

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
    <div className={`bg-[#1a1a1a] text-white ${className}`}>
      {/* Main Search Interface */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - converted to top section on mobile */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-[#252525] border border-[#333333] rounded-lg overflow-hidden">
            {/* Database Stats */}
            <div className="px-4 py-4 border-b border-[#333333]">
              <div className="text-xs text-neutral-400 mb-3 uppercase tracking-wide">Database Info</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-[#2a2a2a] rounded">
                  <span className="text-sm text-neutral-300">Total Records:</span>
                  <span className="font-semibold text-white">{formatNumber(getTableCount(selectedTable))}</span>
                </div>
                {filters.length > 0 && (
                  <div className="flex justify-between items-center p-2 bg-green-500/10 border border-green-500/20 rounded">
                    <span className="text-sm text-neutral-300">Matching:</span>
                    <span className="font-semibold text-green-400">
                      {countLoading ? (
                        <span className="inline-block w-16 bg-[#303030] h-5 rounded animate-pulse" />
                      ) : (
                        formatNumber(matchingCount)
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-4 border-b border-[#333333] space-y-3">
              <div className="text-xs text-neutral-400 mb-3 uppercase tracking-wide">Actions</div>
              
              <button 
                onClick={toggleColumnSelector}
                className={`w-full px-4 py-3 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${showColumnSelector ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-[#303030] hover:bg-[#404040] border border-[#404040] text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-columns"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="3" y2="21"/></svg>
                <span>Select Columns</span>
              </button>
              
              <button 
                onClick={toggleExportSection}
                className={`w-full px-4 py-3 rounded-md text-sm font-medium flex items-center gap-3 transition-colors ${showExportSection ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-[#303030] hover:bg-[#404040] border border-[#404040] text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                <span>Export Data</span>
              </button>
            </div>
            
            {/* Dynamic Content Section */}
            <div className="max-h-96 overflow-y-auto">
              {/* Column Selection Section */}
              {showColumnSelector && (
                <div className="px-4 py-4 border-b border-[#333333]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm text-white">Column Selection</h3>
                  </div>
                  
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search columns..."
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      className="w-full bg-[#303030] border border-[#404040] rounded-md px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-green-500"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                    {filteredAvailableColumns.map((col) => (
                      <label key={col} className="flex items-center gap-3 cursor-pointer py-2 px-2 hover:bg-[#303030] rounded">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(col)}
                          onChange={() => toggleColumn(col)}
                          className="h-4 w-4 accent-green-500"
                        />
                        <span className="text-sm text-white">{col}</span>
                      </label>
                    ))}
                  </div>
                  
                  <button 
                    onClick={closeColumnSelectorModal}
                    className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold text-sm rounded-md"
                  >
                    Apply Changes
                  </button>
                </div>
              )}
              
              {/* Export Section */}
              {showExportSection && (
                <div className="px-4 py-4 border-b border-[#333333]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm text-white">Export Data</h3>
                  </div>
                  
                  {exporting ? (
                    <div>
                      <div className="w-full bg-[#303030] h-3 rounded-full mb-3 overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>
                      <div className="text-sm text-neutral-400 text-center">
                        {exportProgress}% Complete
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-neutral-400 mb-4">
                        Choose how many rows to export. You'll be charged 1 token per
                        row, but only if the export completes successfully.
                      </p>
                      
                      <div className="mb-4">
                        <div className="text-xs text-neutral-400 mb-2">Rows to Export</div>
                        <input
                          type="number"
                          value={rowsToExport === null ? "" : rowsToExport}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRowsToExport(val === "" ? null : Number(val));
                          }}
                          min="1"
                          className="w-full bg-[#303030] border border-[#404040] rounded-md px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-green-500"
                        />
                      </div>
                      
                      {exportError && (
                        <div className="mb-4 text-sm text-red-500">{exportError}</div>
                      )}
                      
                      <button
                        onClick={startExport}
                        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold text-sm rounded-md"
                      >
                        Start Export
                      </button>
                    </>
                  )}
                  
                  {exportDone && (
                    <p className="mt-3 text-sm text-green-500">
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
          <div className="mb-6 bg-[#252525] border border-[#333333] rounded-lg overflow-hidden">
            <div className="px-4 py-4 border-b border-[#333333]">
              <h3 className="font-semibold text-sm text-white">Filter Settings</h3>
            </div>
            
            <div className="p-4 space-y-4">
              {pendingFilters.map((rule, index) => (
                <div
                  key={index}
                  className="bg-[#303030] border border-[#404040] p-4 rounded-md"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {index > 0 && (
                      <div className="md:col-span-3">
                        <div className="text-xs text-neutral-400 mb-2">Operator</div>
                        <select
                          value={rule.subop}
                          onChange={(e) => updateLineSubop(index, e.target.value)}
                          className="w-full bg-[#252525] border border-[#404040] rounded-md py-2 px-3 text-sm text-white"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-xs text-neutral-400 mb-2">Column</div>
                      <Combobox
                        value={rule.column}
                        onChange={(val) => updateFilterLine(index, "column", val)}
                      >
                        <div className="relative w-full">
                          <Combobox.Button
                            className="relative w-full border border-[#404040] bg-[#252525] text-white text-left rounded-md py-2 px-3 text-sm"
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
                                className="h-5 w-5 text-neutral-400"
                                aria-hidden="true"
                              />
                            </span>
                          </Combobox.Button>
                          <Combobox.Options
                            className="absolute z-10 mt-1 w-full bg-[#252525] border border-[#404040] rounded-md max-h-40 overflow-auto"
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
                                      ? "bg-green-500/20 text-green-400"
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
                      <div className="text-xs text-neutral-400 mb-2">Condition</div>
                      <select
                        value={rule.condition}
                        onChange={(e) =>
                          updateFilterLine(index, "condition", e.target.value)
                        }
                        className="w-full bg-[#252525] border border-[#404040] rounded-md py-2 px-3 text-sm text-white"
                      >
                        <option value="contains">Contains</option>
                        <option value="equals">Equals</option>
                        <option value="is empty">Is Empty</option>
                        <option value="is not empty">Is Not Empty</option>
                      </select>
                    </div>
                    
                    {(rule.condition === "contains" || rule.condition === "equals") && (
                      <div className="md:col-span-3">
                        <div className="text-xs text-neutral-400 mb-2">Search Terms</div>
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
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-md border border-red-500/30"
                      >
                        Remove Rule
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-3">
                <button
                  onClick={addFilterLine}
                  className="px-4 py-2 bg-[#252525] hover:bg-[#303030] text-white text-sm rounded-md border border-[#404040] flex items-center gap-2"
                >
                  <span>+</span> Add Rule
                </button>
                
                <button 
                  onClick={applyFilters}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold text-sm rounded-md ml-auto"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {filters.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
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
                  <div key={i} className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-2 rounded-md">
                    <span>
                      <strong>{prefix}</strong> {f.column} {desc}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading state for user settings */}
          {!userSettingsLoaded && (
            <div className="mt-6 text-sm text-neutral-400">Loading user settings...</div>
          )}

          {/* Results Table */}
          {userSettingsLoaded && (
            <div className="bg-[#252525] border border-[#333333] rounded-lg overflow-hidden">
              <div className="px-4 py-4 border-b border-[#333333] flex items-center justify-between">
                <h3 className="font-semibold text-white">Search Results</h3>
                {filters.length > 0 && (
                  <span className="text-sm text-neutral-400">
                    Page {page + 1} of {totalPages}
                  </span>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#2a2a2a] border-b border-[#333333]">
                      {visibleColumns.map((col) => (
                        <th
                          key={col}
                          className="relative group py-3 px-4 text-sm font-semibold text-neutral-300 text-left"
                          style={{
                            width: columnWidths[col] || "auto",
                            minWidth: "150px",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{col}</span>
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[#404040] opacity-0 group-hover:opacity-100"
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
                          <tr key={i} className="animate-pulse border-b border-[#333333]">
                            {visibleColumns.map((c) => (
                              <td key={c} className="py-3 px-4">
                                <div className="h-4 bg-[#303030] rounded w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : results.map((row, i) => (
                          <tr key={i} className="border-b border-[#333333] hover:bg-[#2a2a2a] transition-colors">
                            {visibleColumns.map((c) => (
                              <td
                                key={c}
                                className="py-3 px-4 text-sm text-white"
                              >
                                <div className="truncate">{row[c]}</div>
                              </td>
                            ))}
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-4 border-t border-[#333333] flex items-center justify-between">
                <div className="text-sm text-neutral-400">
                  {results.length > 0 ? (
                    <>Showing {results.length} of {formatNumber(matchingCount)} results</>
                  ) : (
                    <>No results found</>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={prevPage} 
                    disabled={page === 0}
                    className={`px-4 py-2 text-sm rounded-md border font-medium ${page === 0 ? 'bg-[#252525] text-neutral-500 border-[#333333] cursor-not-allowed' : 'bg-[#252525] hover:bg-[#303030] text-white border-[#404040]'}`}
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
                    className={`px-4 py-2 text-sm rounded-md border font-medium ${
                      page >=
                      Math.min(
                        totalPages - 1,
                        tokensTotal !== null && tokensTotal <= 201 ? 4 : 24
                      )
                        ? 'bg-[#252525] text-neutral-500 border-[#333333] cursor-not-allowed'
                        : 'bg-[#252525] hover:bg-[#303030] text-white border-[#404040]'
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
  );
} 