// /components/PublicSearchTablePage.jsx
"use client";
/*
  PublicSearchTablePage.jsx – rewritten to embed the complete Filter modal logic
  from SearchTablePage.jsx (tokens input, AND/OR chaining, four operators, etc.)
  without any Supabase‑dependent code. It continues to hit the public‑people API
  routes ( /api/public-people/* ) just like the previous lightweight version.
*/

import React, { useState, useEffect, useRef } from "react";
import { Combobox } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/button";
import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/dialog";
import { Input } from "@/components/input";
import { Fieldset, Field } from "@/components/fieldset";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/table";
import { Badge } from "@/components/badge";

/* Utility: human‑format large numbers */
const fmt = (n) => new Intl.NumberFormat().format(n);

/* -------------------------------------------------------------------------- */
/*                        TOKENS INPUT (Auto‑Suggest)                         */
/* -------------------------------------------------------------------------- */
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

  const filtered = suggestions.filter((s) =>
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
      const res = await fetch(`/api/public-people/distinct-values?${params}`);
      const json = await res.json();
      if (res.ok && json.distinctValues) setSuggestions(json.distinctValues);
    } catch (err) {
      console.error("[Suggestions]", err);
    } finally {
      setIsFetching(false);
    }
  }

  /* Handlers */
  function handleFocus() {
    setShowSuggestions(true);
    if (!suggestions.length) fetchSuggestions();
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

  /* Render */
  return (
    <div className="relative">
      {/* tokens */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tokens.map((t, i) => (
          <Badge key={i} color="blue" className="flex items-center space-x-1">
            <span>{t}</span>
            <button
              onClick={() => removeToken(t)}
              className="text-red-500 hover:text-red-700 leading-none"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={pendingText}
        onChange={(e) => setPendingText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search (Enter to add)"
      />
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-auto"
        >
          {isFetching ? (
            <div className="p-3 text-sm text-gray-500">Loading…</div>
          ) : filtered.length ? (
            filtered.map((item, i) => (
              <div
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addToken(item);
                }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-gray-500">No suggestions</div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          MAIN SEARCH TABLE PAGE                            */
/* -------------------------------------------------------------------------- */
export default function PublicSearchTablePage({
  tableName,
  defaultColumns,
  pageTitle,
  totalCount = 0,
}) {
  /* ------------------------------- State --------------------------------- */
  const [results, setResults] = useState([]);

  /* pagination */
  const limit = 50;
  const [page, setPage] = useState(0);
  const offset = page * limit;

  /* columns (fixed for demo) */
  const [columns] = useState(defaultColumns);

  /* filters */
  const [filters, setFilters] = useState([]); // [{column, condition, tokens, subop, pendingText}]
  const [matchingCount, setMatchingCount] = useState(0);

  /* UI */
  const [rowsLoading, setRowsLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [pendingFilters, setPendingFilters] = useState([]);
  const [columnSearch, setColumnSearch] = useState("");

  const totalPages = Math.max(1, Math.ceil(matchingCount / limit));

  /* ---------------------------- API Helpers ----------------------------- */
  async function fetchRows(currentOffset) {
    setRowsLoading(true);
    try {
      const params = new URLSearchParams({
        table_name: tableName,
        limit: limit.toString(),
        offset: currentOffset.toString(),
        filters: JSON.stringify(filters),
      });
      const r = await fetch(`/api/public-people/search?${params}`);
      const j = await r.json();
      if (r.ok) setResults(j.results || []);
      else console.error(j.error);
    } catch (e) {
      console.error(e);
    } finally {
      setRowsLoading(false);
    }
  }
  async function fetchCount() {
    setCountLoading(true);
    try {
      const params = new URLSearchParams({
        table_name: tableName,
        filters: JSON.stringify(filters),
      });
      const r = await fetch(`/api/public-people/search-count?${params}`);
      const j = await r.json();
      if (r.ok) setMatchingCount(j.matchingCount || 0);
      else console.error(j.error);
    } catch (e) {
      console.error(e);
    } finally {
      setCountLoading(false);
    }
  }

  /* ----------------------------- Effects -------------------------------- */
  /* initial */
  useEffect(() => {
    fetchRows(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* filters changed */
  useEffect(() => {
    setPage(0);
    fetchCount();
    fetchRows(0);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  /* page changed */
  useEffect(() => {
    fetchRows(offset);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------- Filter Modal Logic ------------------------- */
  function openFilterModal() {
    setPendingFilters(JSON.parse(JSON.stringify(filters)));
    setShowFilterModal(true);
  }
  function closeFilterModal() {
    setShowFilterModal(false);
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
  function removeFilterLine(i) {
    setPendingFilters((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateLine(i, field, val) {
    setPendingFilters((prev) => {
      const arr = [...prev];
      arr[i][field] = val;
      return arr;
    });
  }
  function updateLineTokens(i, arr) {
    setPendingFilters((prev) => {
      const copy = [...prev];
      copy[i].tokens = arr;
      return copy;
    });
  }
  function updateLinePendingText(i, txt) {
    setPendingFilters((prev) => {
      const copy = [...prev];
      copy[i].pendingText = txt;
      return copy;
    });
  }
  function applyFilters() {
    const updated = pendingFilters.map((rule) => {
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
    closeFilterModal();
  }

  /* ------------------------------ Render -------------------------------- */
  return (
    <div className="px-4 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <h1 className="text-2xl font-semibold dark:text-white">{pageTitle}</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-700 dark:text-gray-300">
            Total&nbsp;rows: {fmt(totalCount)}
          </span>
          {filters.length > 0 && (
            <span className="text-gray-700 dark:text-gray-300">
              Matching:&nbsp;
              {countLoading ? "…" : fmt(matchingCount)}
            </span>
          )}
          <Button onClick={openFilterModal}>Filters</Button>
        </div>
      </header>

      {/* Active filter badges */}
      {filters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
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
              <Badge key={i} color="blue">
                <strong>{prefix}</strong> {f.column} {desc}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <Table bleed striped className="min-w-full">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableHeader key={c}>{c}</TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rowsLoading
              ? Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    {columns.map((c) => (
                      <TableCell key={c}>
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : results.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map((c) => (
                      <TableCell key={c}>{row[c]}</TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        {filters.length > 0 && (
          <span className="text-gray-700 dark:text-gray-300">
            Page {page + 1} of {totalPages}
          </span>
        )}
        <div className="flex gap-2">
          <Button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </Button>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Filter Modal – full logic embedded */}
      {showFilterModal && (
        <Dialog open={showFilterModal} onClose={closeFilterModal} className="max-w-5xl">
          <DialogTitle>Filter rows</DialogTitle>
          <DialogBody>
            <Fieldset>
              {pendingFilters.map((rule, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-800 p-4 mb-4 rounded space-y-3"
                >
                  <div className="flex flex-wrap items-end gap-3">
                    {idx > 0 && (
                      <Field>
                        <div>&nbsp;</div>
                        <select
                          value={rule.subop}
                          onChange={(e) => updateLine(idx, "subop", e.target.value)}
                          className="border rounded px-2 py-1 w-24"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </Field>
                    )}
                    <Field>
                      <div>Column</div>
                      <Combobox
                        value={rule.column}
                        onChange={(val) => updateLine(idx, "column", val)}
                      >
                        <div className="relative w-48">
                          <Combobox.Button className="relative w-full border rounded px-3 py-2 text-left bg-white dark:bg-gray-800">
                            <Combobox.Input
                              onChange={(e) => {
                                setColumnSearch(e.target.value);
                                updateLine(idx, "column", e.target.value);
                              }}
                              displayValue={(val) => val}
                              placeholder="Select column…"
                              className="w-full bg-transparent focus:outline-none"
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                            </span>
                          </Combobox.Button>
                          <Combobox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border rounded max-h-60 overflow-auto">
                            {(columnSearch
                              ? columns.filter((c) =>
                                  c.toLowerCase().includes(columnSearch.toLowerCase())
                                )
                              : columns
                            ).map((c) => (
                              <Combobox.Option
                                key={c}
                                value={c}
                                className={({ active }) =>
                                  `cursor-pointer select-none px-3 py-2 ${
                                    active ? "bg-indigo-600 text-white" : ""
                                  }`
                                }
                              >
                                {c}
                              </Combobox.Option>
                            ))}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                    </Field>
                    <Field>
                      <div>Condition</div>
                      <select
                        value={rule.condition}
                        onChange={(e) => updateLine(idx, "condition", e.target.value)}
                        className="border rounded px-2 py-1 w-32"
                      >
                        <option value="contains">Contains</option>
                        <option value="equals">Equals</option>
                        <option value="is empty">Is Empty</option>
                        <option value="is not empty">Is Not Empty</option>
                      </select>
                    </Field>
                  </div>

                  {(rule.condition === "contains" || rule.condition === "equals") && (
                    <Field>
                      <div>Value(s) – press Enter to add</div>
                      <TokensInput
                        tokens={rule.tokens}
                        setTokens={(arr) => updateLineTokens(idx, arr)}
                        pendingText={rule.pendingText || ""}
                        setPendingText={(txt) => updateLinePendingText(idx, txt)}
                        column={rule.column}
                        tableName={tableName}
                      />
                    </Field>
                  )}

                  <Button variant="secondary" onClick={() => removeFilterLine(idx)}>
                    Remove rule
                  </Button>
                </div>
              ))}

              <Button variant="outline" onClick={addFilterLine}>
                + Add rule
              </Button>
            </Fieldset>
          </DialogBody>
          <DialogActions>
            <Button variant="secondary" onClick={closeFilterModal}>
              Cancel
            </Button>
            <Button onClick={applyFilters}>Apply</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
