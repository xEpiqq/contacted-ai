"use client";
import React, { useState, useEffect, useRef } from "react";
import { Combobox } from "@headlessui/react";
import { ChevronUpDownIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import { createClient } from "@/utils/supabase/client";

// Database table configurations
const DB_TABLES = [
  {
    id: "usa4_new_v2",
    name: "USA Job DB",
    defaultColumns: ['Full name', 'Job title', 'Emails', 'Phone numbers'],
    totalCount: 31177584
  },
  {
    id: "deez_3_v3",
    name: "USA Local Biz DB",
    defaultColumns: ['search_keyword', 'name', 'phone', 'email', 'website'],
    totalCount: 4908756
  },
  {
    id: "pdl4_new_v2",
    name: "People DB",
    defaultColumns: ['name', 'linkedin_url', 'email', 'phone_number'],
    totalCount: 129528353
  },
  {
    id: "otc1_new_v2",
    name: "World Job DB",
    defaultColumns: ['full_name', 'job_title', 'email', 'phone_number'],
    totalCount: 47352973
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

export default function ManualSearch() {
  // Table selection state
  const [selectedTable, setSelectedTable] = useState(DB_TABLES[0]);
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

  // Handle click outside dropdown
  const tableDropdownRef = useRef(null);
  
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
    // Initialize with one empty filter rule
    setPendingFilters([{
      column: "",
      condition: "contains",
      tokens: [],
      pendingText: "",
      subop: ""
    }]);
    setVisibleColumns([]);
    setColumnWidths({});
    setUserSettingsLoaded(false);
  };

  // On component mount, initialize with one filter rule if none exists
  useEffect(() => {
    // If there are no pending filters, add one empty filter rule
    if (pendingFilters.length === 0) {
      setPendingFilters([{
        column: "",
        condition: "contains",
        tokens: [],
        pendingText: "",
        subop: ""
      }]);
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

      // If user has saved filters => set them
      if (userFilters.length) {
        setFilters(userFilters);
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

  // ------------------------
  //    Render
  // ------------------------
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex">
      {/* Left Sidebar */}
      <div className="w-72 min-w-[18rem] border-r border-[#333333] flex flex-col bg-[#252525]">
        {/* Database Selector */}
        <div className="px-4 py-3 border-b border-[#333333]">
          <div 
            className="flex items-center justify-between cursor-pointer select-none hover:bg-[#303030] p-2 rounded-md"
            onClick={() => setTableDropdownOpen(!tableDropdownOpen)}
            ref={tableDropdownRef}
          >
            <span className="font-medium">{selectedTable.name}</span>
            <ChevronDownIcon className="h-5 w-5 text-neutral-400" />
          </div>
          
          {tableDropdownOpen && (
            <div className="mt-1 bg-[#303030] border border-[#404040] rounded-md shadow-lg">
              {DB_TABLES.map((table) => (
                <div
                  key={table.id}
                  className="px-3 py-2 hover:bg-[#404040] cursor-pointer"
                  onClick={() => {
                    setSelectedTable(table);
                    setTableDropdownOpen(false);
                  }}
                >
                  {table.name}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Database Stats */}
        <div className="px-4 py-3 border-b border-[#333333]">
          <div className="text-xs text-neutral-400 mb-2">Database Info</div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Total Records:</span>
              <span className="font-medium">{formatNumber(selectedTable.totalCount)}</span>
            </div>
          {filters.length > 0 && (
              <div className="flex justify-between text-sm">
                <span>Matching:</span>
                <span className="font-medium">
              {countLoading ? (
                <span className="inline-block w-10 bg-[#303030] h-4 rounded animate-pulse" />
              ) : (
                formatNumber(matchingCount)
              )}
            </span>
      </div>
      )}
                    </div>
                        </div>

        {/* Filter Section - Always visible */}
        <div className="px-4 py-3 border-b border-[#333333]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm">Filter Settings</h3>
                  </div>
          
              <div className="space-y-4">
                {pendingFilters.map((rule, index) => (
                  <div
                    key={index}
                className="bg-[#303030] border border-[#404040] p-3 rounded-md"
                  >
                <div className="space-y-3">
                      {index > 0 && (
                        <div>
                      <div className="text-xs text-neutral-400 mb-1">Operator</div>
                          <select
                            value={rule.subop}
                            onChange={(e) => updateLineSubop(index, e.target.value)}
                        className="w-full bg-[#252525] border border-[#404040] rounded-md py-1.5 px-2 text-sm text-white"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-xs text-neutral-400 mb-1">Column</div>
                    <Combobox
                          value={rule.column}
                          onChange={(val) => updateFilterLine(index, "column", val)}
                        >
                      <div className="relative w-full">
                            <Combobox.Button
                          className="relative w-full border border-[#404040] bg-[#252525] text-white text-left rounded-md py-1.5 px-3 text-sm"
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
                        <div className="text-xs text-neutral-400 mb-1">Condition</div>
                        <select
                          value={rule.condition}
                          onChange={(e) =>
                            updateFilterLine(index, "condition", e.target.value)
                          }
                      className="w-full bg-[#252525] border border-[#404040] rounded-md py-1.5 px-2 text-sm text-white"
                        >
                          <option value="contains">Contains</option>
                          <option value="equals">Equals</option>
                          <option value="is empty">Is Empty</option>
                          <option value="is not empty">Is Not Empty</option>
                        </select>
                    </div>
                    
                    {(rule.condition === "contains" || rule.condition === "equals") && (
                    <div>
                      <div className="text-xs text-neutral-400 mb-1">Search Terms</div>
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
                    
                    <div>
                      <button 
                        onClick={() => removeFilterLine(index)}
                      className="px-3 py-1.5 bg-[#252525] hover:bg-[#303030] text-white text-xs rounded-md border border-[#404040] mt-2"
                      >
                        Remove Rule
                      </button>
                  </div>
                    </div>
                </div>
              ))}
              
            <div className="flex gap-2">
              <button
                onClick={addFilterLine}
                className="px-3 py-1.5 bg-[#252525] hover:bg-[#303030] text-white text-xs rounded-md border border-[#404040] flex items-center gap-1"
              >
                  <span>+</span> Add Rule
              </button>
              
              <button 
                onClick={applyFilters}
                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-black font-medium text-xs rounded-md ml-auto"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-b border-[#333333] space-y-2">
          <div className="text-xs text-neutral-400 mb-1">Actions</div>
          
              <button 
            onClick={toggleColumnSelector}
            className={`w-full px-3 py-2 rounded-md text-sm flex items-center gap-2 ${showColumnSelector ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'bg-[#303030] hover:bg-[#404040] border border-[#404040]'}`}
              >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-columns"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="3" y2="21"/></svg>
            <span>Columns</span>
              </button>
          
              <button 
            onClick={toggleExportSection}
            className={`w-full px-3 py-2 rounded-md text-sm flex items-center gap-2 ${showExportSection ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'bg-[#303030] hover:bg-[#404040] border border-[#404040]'}`}
              >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>Export</span>
              </button>
                    </div>
        
        {/* Dynamic Content Section */}
        <div className="flex-1 overflow-y-auto">
          {/* Column Selection Section */}
          {showColumnSelector && (
            <div className="px-4 py-3 border-b border-[#333333]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">Column Selection</h3>
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
              
              <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
                {filteredAvailableColumns.map((col) => (
                  <label key={col} className="flex items-center gap-2 cursor-pointer py-1">
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
                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-black font-medium text-xs rounded-md"
              >
                Apply Changes
              </button>
              </div>
          )}
          
          {/* Export Section */}
          {showExportSection && (
            <div className="px-4 py-3 border-b border-[#333333]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">Export Data</h3>
              </div>
              
              {exporting ? (
                <div>
                  <div className="w-full bg-[#303030] h-2 rounded-full mb-2 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${exportProgress}%` }}
                    />
              </div>
                  <div className="text-sm text-neutral-400 text-center">
                    {exportProgress}%
            </div>
                  </div>
              ) : (
                <>
                  <p className="text-xs text-neutral-400 mb-4">
                    Choose how many rows to export. You'll be charged 1 token per
                    row, but only if the export completes successfully.
                  </p>
                  
                  <div className="mb-4">
                    <div className="text-xs text-neutral-400 mb-1">Rows to Export</div>
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
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-black font-medium text-xs rounded-md"
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
      
      {/* Main Content */}
      <div className="flex-1 min-w-0 p-4">
        {/* Active Filter Badges */}
        {filters.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
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
                <div key={i} className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-md">
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

        {/* Table */}
        {userSettingsLoaded && (
          <div className="overflow-x-auto w-full border border-[#333333] rounded-md">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-[#252525] border-b border-[#333333]">
                  {visibleColumns.map((col) => (
                    <th
                      key={col}
                      className="relative group py-2 px-4 text-sm font-medium text-neutral-300 text-left"
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
                          <td key={c} className="py-2 px-4">
                            <div className="h-4 bg-[#303030] rounded w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : results.map((row, i) => (
                      <tr key={i} className="border-b border-[#333333] hover:bg-[#252525]">
                        {visibleColumns.map((c) => (
                          <td
                            key={c}
                            className="py-2 px-4 text-sm text-white whitespace-nowrap"
                          >
                            {row[c]}
                          </td>
                        ))}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {userSettingsLoaded && (
          <div className="mt-4 flex items-center justify-end">
            {filters.length > 0 && (
              <span className="text-xs text-neutral-400 mr-auto">
                Page {page + 1} of {totalPages}
              </span>
            )}
            <div className="flex gap-2">
                <button 
                onClick={prevPage} 
                disabled={page === 0}
                className={`px-3 py-1.5 text-xs rounded-md border ${page === 0 ? 'bg-[#252525] text-neutral-500 border-[#333333] cursor-not-allowed' : 'bg-[#252525] hover:bg-[#303030] text-white border-[#404040]'}`}
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
                className={`px-3 py-1.5 text-xs rounded-md border ${
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
          )}
      </div>
      </div>
  );
}
