import React, { useState, useEffect } from "react";
import { CheckCircle, Download, Search, Loader, ArrowLeft } from "lucide-react";

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
  const [searchPage, setSearchPage] = useState(0);
  const [totalResults, setTotalResults] = useState(initialTotalResults);
  const [isExporting, setIsExporting] = useState(false);
  const [prefetchedPages, setPrefetchedPages] = useState({});
  const searchLimit = 20;
  const totalPages = Math.ceil(totalResults / searchLimit) || 1;

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
    }
  };

  // Handle exporting results
  const handleExportResults = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      // Prepare params for the export endpoint
      const exportParams = new URLSearchParams({
        table_name: "usa4_new_v2",
        filters: JSON.stringify(searchFilters),
        format: "csv"
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
      
    } catch (error) {
      console.error("Error exporting results:", error);
      alert("Failed to export results. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
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
      {/* Header with back button */}
      <div className="mb-4 flex items-center">
        <button 
          onClick={() => handleBack(2)} 
          className="p-1 rounded-full hover:bg-[#2a2a2a] transition-colors mr-3"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-400" />
        </button>
        <h2 className="text-xl font-medium text-white flex items-center gap-2">
          <span className="text-green-400">{formatNumber(totalResults)}</span> matches
          <div className="h-5 w-5 rounded-full bg-green-900/20 border border-green-800/30 flex items-center justify-center">
            <CheckCircle className="h-3 w-3 text-green-400" />
          </div>
        </h2>
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
      <div className="rounded-lg bg-[#1f1f1f] overflow-hidden mb-4 w-full">
        {resultsLoading ? (
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="animate-spin mb-3">
              <Loader className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-neutral-400 text-sm">Finding matches...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="overflow-x-auto table-scrollbar w-full">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#262626]">
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
        <div className="px-3 py-2 flex justify-end items-center mt-2">
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
                disabled={searchPage >= totalPages - 1}
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
    </div>
  );
};

export default SearchStepFour;
