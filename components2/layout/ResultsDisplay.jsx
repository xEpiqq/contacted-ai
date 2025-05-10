"use client";

import React from "react";
import { useSearchContext } from "../context/SearchContext";
import { motion } from "framer-motion";
import { Search, Download, CheckCircle, Loader } from "lucide-react";

function ResultsDisplay({ handleResetSearch }) {
  const {
    searchFilters,
    searchResults,
    resultsLoading,
    searchPage,
    totalResults,
    totalPages,
    fetchExports,
    searchLimit,
    answerType
  } = useSearchContext();

  // Display columns for the simpler format
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
  
  // Handle page change
  const onPageChange = (page) => {
    // This function would call an API to fetch new page results
    console.log("Changing to page:", page);
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
            onClick={handleResetSearch}
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
              onClick={handleResetSearch}
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

export default ResultsDisplay; 