import React, { useState, useEffect } from "react";
import { CheckCircle, Download, Search, Loader, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SearchStepFour = ({ 
  onReset,
  searchFilters = [],
  initialSearchResults = [],
  initialTotalResults = 0,
  answerType = "people",
  handleBack
}) => {
  // State management for component
  const [searchResults, setSearchResults] = useState(initialSearchResults);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [countLoading, setCountLoading] = useState(true);
  const [searchPage, setSearchPage] = useState(0);
  const [totalResults, setTotalResults] = useState(initialTotalResults);
  const [isExporting, setIsExporting] = useState(false);
  const [prefetchedPages, setPrefetchedPages] = useState({});
  const [exportRows, setExportRows] = useState("");
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const searchLimit = 20;
  const totalPages = Math.ceil(totalResults / searchLimit) || 1;
  const maxPaginationPage = 5; // Limit pagination to 5 pages

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

  // Fetch search results from API
  const fetchSearchResults = async (page = 0, isPrefetch = false) => {
    if (!isPrefetch) {
      setResultsLoading(true);
      setSearchPage(page);
    }
    
    // If we've already prefetched this page, use the cached results
    if (!isPrefetch && prefetchedPages[page]) {
      setSearchResults(prefetchedPages[page]);
      setResultsLoading(false);
      
      // After using prefetched results, remove them from cache
      const updatedPrefetchedPages = { ...prefetchedPages };
      delete updatedPrefetchedPages[page];
      setPrefetchedPages(updatedPrefetchedPages);
      
      // Prefetch the next page
      prefetchNextPage(page);
      return;
    }
    
    try {
      // Calculate the offset for pagination
      const offset = page * searchLimit;
      
      // Prepare the API query params
      const params = new URLSearchParams({
        table_name: "usa4_new_v2", // Using the database table name
        limit: searchLimit.toString(),
        offset: offset.toString(),
        filters: JSON.stringify(searchFilters),
      });
      
      // Make the API call to fetch results
      const response = await fetch(`/api/public-people/search?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        const results = data.results || [];
        
        if (isPrefetch) {
          // Store prefetched results in state
          setPrefetchedPages(prev => ({
            ...prev,
            [page]: results
          }));
        } else {
          setSearchResults(results);
          
          // If we haven't fetched the total count yet, do it now
          if (totalResults === 0) {
            fetchTotalCount();
          }
          
          // Prefetch the next page
          prefetchNextPage(page);
        }
      } else {
        console.error("Error fetching search results:", data.error);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      if (!isPrefetch) {
        setResultsLoading(false);
      }
    }
  };

  // Prefetch next page for instant pagination
  const prefetchNextPage = (currentPage) => {
    const nextPage = currentPage + 1;
    
    // Only prefetch if we're not on the last page and haven't already prefetched
    if (nextPage < totalPages && !prefetchedPages[nextPage]) {
      fetchSearchResults(nextPage, true);
    }
  };

  // Fetch total count of results
  const fetchTotalCount = async () => {
    setCountLoading(true);
    try {
      const countParams = new URLSearchParams({
        table_name: "usa4_new_v2",
        filters: JSON.stringify(searchFilters),
      });
      
      const countResponse = await fetch(`/api/public-people/search-count?${countParams}`);
      const countData = await countResponse.json();
      
      if (countResponse.ok) {
        setTotalResults(countData.matchingCount || 0);
      }
    } catch (error) {
      console.error("Error fetching result count:", error);
    } finally {
      setCountLoading(false);
    }
  };

  // Handle export results
  const handleExportResults = async () => {
    if (!exportRows || isNaN(parseInt(exportRows))) {
      alert("Please enter a valid number of rows");
      return;
    }
    
    setIsExporting(true);
    try {
      // Prepare params for the export endpoint
      const exportParams = new URLSearchParams({
        table_name: "usa4_new_v2",
        filters: JSON.stringify(searchFilters),
        format: "csv",
        rows: exportRows
      });
      
      // Call the export API endpoint
      const exportResponse = await fetch(`/api/public-people/export?${exportParams}`);
      
      if (!exportResponse.ok) {
        const errorData = await exportResponse.json();
        throw new Error(errorData.error || "Export failed");
      }
      
      // Get the blob from the response
      const blob = await exportResponse.blob();
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-results-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Reset the export input and close the drawer
      setExportRows("");
      setExportDrawerOpen(false);
      
    } catch (error) {
      console.error("Error exporting results:", error);
      alert("Failed to export results. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle export drawer
  const handleShowExportDrawer = () => {
    setExportDrawerOpen(true);
    // Set the initial value to the total results count
    setExportRows(totalResults.toString());
  };
  
  // Close export drawer
  const handleCloseExportDrawer = () => {
    setExportDrawerOpen(false);
  };

  // Handle page change
  const handlePageChange = (page) => {
    // Enforce pagination limit
    if (page >= maxPaginationPage) {
      return;
    }
    
    // If the page data is already prefetched, it will be used automatically
    fetchSearchResults(page);
    
    // Prefetch previous page if we're moving forward (for back navigation)
    if (page > 0 && page > searchPage && !prefetchedPages[page - 1]) {
      fetchSearchResults(page - 1, true);
    }
  };
  
  // Prefetch next page when component mounts or results change
  useEffect(() => {
    if (searchResults.length > 0 && searchPage < totalPages - 1) {
      prefetchNextPage(searchPage);
    }
  }, [searchResults.length, searchPage, totalPages]);

  // Fetch results on component mount or when filters change
  useEffect(() => {
    if (searchFilters.length > 0) {
      fetchSearchResults(0);
    } else if (initialSearchResults.length > 0) {
      // Use initial results if provided and no filters are active
      setSearchResults(initialSearchResults);
      setTotalResults(initialTotalResults);
      setResultsLoading(false);
    } else {
      // Fetch all results if no filters and no initial results
      fetchSearchResults(0);
    }
  }, [JSON.stringify(searchFilters)]);

  return (
    <div className="w-full pt-6">
      {/* Export Modal */}
      <AnimatePresence>
        {exportDrawerOpen && (
          <>
            {/* Dark overlay that covers the entire screen */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black opacity-90 z-20"
              onClick={handleCloseExportDrawer}
            />
            
            {/* Modal container - centered */}
            <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
              {/* Modal (with pointer events enabled) */}
              <motion.div
                key="export-modal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-md bg-[#2b2b2b] border border-[#404040] rounded-lg shadow-2xl overflow-hidden pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b border-[#404040] p-4">
                  <h2 className="text-base font-semibold text-white">Export Results</h2>
                  <button
                    aria-label="close modal"
                    onClick={handleCloseExportDrawer}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="p-5 max-h-[70vh] overflow-y-auto thin-scrollbar">
                  <div className="mb-6">
                    <label className="block text-neutral-400 text-xs mb-1.5">
                      Enter the number of rows to be exported (uses credits!)
                    </label>
                    <div className="flex items-center">
                      <div className="bg-[#1f1f1f] rounded-md shadow-sm flex-1">
                        <input 
                          type="number" 
                          value={exportRows}
                          onChange={(e) => setExportRows(e.target.value)}
                          className="w-full bg-transparent text-sm text-white px-3 py-2 focus:outline-none number-input-visible"
                          autoFocus
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Modal Footer */}
                <div className="border-t border-[#404040] p-4 bg-[#252525] flex justify-end gap-3">
                  <button 
                    onClick={handleCloseExportDrawer}
                    className="px-4 py-1.5 rounded-md bg-[#1f1f1f] text-neutral-300 hover:text-white hover:bg-[#2a2a2a] transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleExportResults}
                    disabled={isExporting}
                    className="px-4 py-1.5 rounded-md bg-[#1f1f1f] text-green-400 hover:text-green-300 hover:bg-[#262626] transition-colors flex items-center gap-2 shadow-sm text-sm"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-t-green-500 border-green-500/30 rounded-full"></div>
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Confirm Export</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      
      {/* Header with back button and export button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => handleBack(2)} 
            className="p-1 rounded-full hover:bg-[#2a2a2a] transition-colors mr-3"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-400" />
          </button>
          <h2 className="text-xl font-medium text-white flex items-center gap-2">
            {countLoading ? (
              <span className="flex items-center gap-1">
                <div className="animate-pulse h-2 w-16 bg-green-900/30 rounded"></div>
                <div className="animate-spin h-3 w-3 border border-green-400/30 border-t-green-400 rounded-full"></div>
              </span>
            ) : (
              <span className="text-green-400">{formatNumber(totalResults)}</span>
            )}
            matches
            <div className="h-5 w-5 rounded-full bg-green-900/20 border border-green-800/30 flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-green-400" />
            </div>
          </h2>
        </div>
        
        {/* Export Button */}
        <button 
          onClick={handleShowExportDrawer}
          className="rounded-md bg-[#1f1f1f] px-3 py-2 flex items-center gap-2 shadow-sm hover:bg-[#262626] transition-colors"
        >
          <Download className="h-4 w-4 text-green-400" />
          <span className="text-sm text-white">Export Results</span>
        </button>
      </div>
      
      {/* Search criteria pills and export button - temporarily hidden */}
      {/* 
      <div className="mb-3 flex justify-between items-center">
        <div className="flex flex-wrap gap-1.5">
          {searchFilters.map((filter, idx) => {
            const prefix = idx === 0 ? "" : filter.subop;
            return (
              <div 
                key={idx}
                className={`px-1.5 py-0.5 rounded-full text-xs 
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
        
        {searchResults.length > 0 && (
          <button 
            onClick={handleExportResults}
            disabled={isExporting}
            className="px-2.5 py-1 text-xs rounded-md bg-green-900/20 text-green-400 border border-green-800/30 hover:bg-green-900/30 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ml-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-t-green-500 border-green-500/30 rounded-full mr-1"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-3 w-3" />
                <span>Export</span>
              </>
            )}
          </button>
        )}
      </div>
      */}
      
      {/* Results table in a rounded container */}
      <div className="rounded-lg bg-[#1f1f1f] overflow-hidden mb-4 w-full p-5 shadow-xl">
        {resultsLoading ? (
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="animate-spin mb-3">
              <Loader className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-neutral-400 text-sm">Finding matches...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="overflow-x-auto table-scrollbar w-full rounded-md">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#262626] rounded-t-md">
                <tr>
                  {displayColumns.map(col => (
                    <th key={col} className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result, idx) => (
                  <tr 
                    key={idx} 
                    className={`hover:bg-[#272727] transition-colors ${idx % 2 === 0 ? 'bg-[#1f1f1f]' : 'bg-[#232323]'}`}
                  >
                    {displayColumns.map(col => (
                      <td key={col} className="px-3 py-2 text-xs text-neutral-300 max-w-[200px] truncate">
                        {result[col] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-neutral-400 text-sm">No matching results found</p>
            <button
              onClick={onReset}
              className="mt-2 px-3 py-1 rounded bg-[#262626] hover:bg-[#333333] text-xs text-white transition-colors"
            >
              Try Different Criteria
            </button>
          </div>
        )}
      </div>
      
      {/* Pagination moved below the table */}
      {searchResults.length > 0 && !resultsLoading && (
        <div className="px-3 py-2 flex justify-end items-center mt-2 mx-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">
              Page {searchPage + 1}/{totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(Math.max(0, searchPage - 1))}
                disabled={searchPage === 0}
                className="px-2 py-1 rounded text-xs text-neutral-400 hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(searchPage + 1)}
                disabled={searchPage >= Math.min(totalPages - 1, maxPaginationPage - 1)}
                className="px-2 py-1 rounded text-xs text-neutral-400 hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample mock data for development */}
      {searchResults.length === 0 && !resultsLoading && searchFilters.length > 0 && (
        <div className="hidden">
          {/* This is just here to help during development */}
          {(() => {
            // Mock data generation function
            const mockData = [
              {
                "Full name": "John Smith",
                "Job title": "Software Engineer",
                "Company": "Tech Solutions Inc",
                "Emails": "john.smith@techsolutions.com",
                "Phone numbers": "(555) 123-4567"
              },
              {
                "Full name": "Sarah Johnson",
                "Job title": "Marketing Director",
                "Company": "Global Marketing",
                "Emails": "sjohnson@globalmarketing.com",
                "Phone numbers": "(555) 987-6543"
              },
              {
                "Full name": "Michael Brown",
                "Job title": "CEO",
                "Company": "Innovative Startups",
                "Emails": "mbrown@innovative.co",
                "Phone numbers": "(555) 456-7890"
              },
              {
                "Full name": "Emily Davis",
                "Job title": "Product Manager",
                "Company": "Product Wizards",
                "Emails": "emily.d@productwizards.io",
                "Phone numbers": "(555) 789-0123"
              },
              {
                "Full name": "Robert Wilson",
                "Job title": "Sales Director",
                "Company": "Enterprise Sales Co",
                "Emails": "rwilson@enterprise-sales.com",
                "Phone numbers": "(555) 234-5678"
              }
            ];
            
            // Inject mock data for development
            if (process.env.NODE_ENV === 'development' && searchResults.length === 0) {
              setTimeout(() => {
                setSearchResults(mockData);
                setTotalResults(125);
                setResultsLoading(false);
              }, 1000);
            }
            
            return null; // This doesn't render anything
          })()}
        </div>
      )}

      {/* CSS for the table scrollbar */}
      <style jsx global>{`
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

        /* Wave animation for loading ellipsis */
        @keyframes waveAnimation {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-3px); }
          75% { transform: translateY(3px); }
        }
        
        .wave-dot {
          display: inline-block;
          animation: waveAnimation 1.5s infinite ease-in-out;
        }
        
        .wave-dot:nth-child(1) { animation-delay: 0s; }
        .wave-dot:nth-child(2) { animation-delay: 0.2s; }
        .wave-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* CSS for animations and styling number input */}
      <style jsx global>{`
        @keyframes slideRight {
          from {
            opacity: 0.7;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideLeft {
          from {
            opacity: 0.7;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slideRight {
          animation: slideRight 0.3s ease forwards;
        }
        
        .animate-slideLeft {
          animation: slideLeft 0.2s ease forwards;
        }
        
        /* Custom styling for number input arrows to match dark gray UI */
        .number-input-visible::-webkit-outer-spin-button,
        .number-input-visible::-webkit-inner-spin-button {
          opacity: 1;
          height: 100%;
          margin-left: 5px;
          margin-right: 3px;
          background-color: #1f1f1f;
          border-left: 1px solid #2a2a2a;
          cursor: pointer;
        }
        
        /* Styling for the container div of the number input itself */
        .number-input-visible {
          background-color: #1f1f1f;
          border-radius: 4px;
        }
        
        /* Ensure the number input has no default styling in Firefox */
        .number-input-visible {
          -moz-appearance: textfield;
          appearance: textfield;
        }
        
        /* Allow Firefox to show the arrows on hover/focus */
        .number-input-visible:hover,
        .number-input-visible:focus {
          -moz-appearance: number-input;
          appearance: number-input;
        }
        
        /* Thin scrollbar for drawers */
        .thin-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .thin-scrollbar::-webkit-scrollbar-track {
          background: #2b2b2b;
        }
        
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 10px;
        }
        
        .thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #505050;
        }
      `}</style>
    </div>
  );
};

export default SearchStepFour;
