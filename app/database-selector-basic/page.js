'use client';

import { useState, useRef } from 'react';
import NavMenu from '@/app/components/NavMenu';

// Utility function to conditionally join class names
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Simple Card component
const Card = ({ className = '', children, ...props }) => {
  return (
    <div 
      className={`bg-[#2b2b2b] border border-[#404040] rounded-lg shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card content component
const CardContent = ({ className = '', children, ...props }) => {
  return (
    <div 
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Input component
const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full px-4 py-2 bg-[#303030] border border-[#505050] focus:border-[#707070] focus:outline-none rounded-md text-white text-sm ${className}`}
      {...props}
    />
  );
};

// Button component
const Button = ({ className = '', children, disabled = false, ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
        disabled 
          ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default function DatabaseSelectorBasicPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [jobTitles, setJobTitles] = useState([]);
  const [isExtractingTitles, setIsExtractingTitles] = useState(false);
  const [isVerifyingTitles, setIsVerifyingTitles] = useState(false);
  const [titleMatches, setTitleMatches] = useState({});
  const [usedTitles, setUsedTitles] = useState([]);
  const [processingTime, setProcessingTime] = useState(null);
  const processStartTimeRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Reset everything
    setLoading(true);
    setError(null);
    setResult(null);
    setJobTitles([]);
    setTitleMatches({});
    setUsedTitles([]);
    setProcessingTime(null);
    
    // Start the timer
    processStartTimeRef.current = Date.now();

    try {
      // Step 1: Determine the appropriate database
      const response = await fetch('/api/ai/select-database-basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userQuery: query }),
      });

      if (!response.ok) {
        throw new Error('Failed to process query');
      }

      const data = await response.json();
      setResult(data);
      
      // Only extract titles if USA4 is selected (professionals database)
      if (data.database === "usa4_new_v2") {
        await extractJobTitles(query, data.database);
      }
    } catch (err) {
      console.error('Error submitting query:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      
      // Calculate total processing time
      if (processStartTimeRef.current) {
        const endTime = Date.now();
        const timeInSeconds = ((endTime - processStartTimeRef.current) / 1000).toFixed(2);
        setProcessingTime(timeInSeconds);
      }
    }
  };
  
  const extractJobTitles = async (userQuery, database) => {
    setIsExtractingTitles(true);
    
    try {
      // Step 2: Extract job titles from the query
      const titlesResponse = await fetch('/api/ai/extract-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userQuery }),
      });

      if (!titlesResponse.ok) {
        throw new Error('Failed to extract job titles');
      }

      const titlesData = await titlesResponse.json();
      setJobTitles(titlesData.titles || []);
      
      // Step 3: If we have titles, verify them against the database
      if (titlesData.titles && titlesData.titles.length > 0) {
        await verifyJobTitles(titlesData.titles, database);
      }
    } catch (err) {
      console.error('Error extracting job titles:', err);
    } finally {
      setIsExtractingTitles(false);
    }
  };
  
  const verifyJobTitles = async (titles, database) => {
    setIsVerifyingTitles(true);
    
    try {
      const response = await fetch('/api/ai/verify-titles-basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          titles, 
          database 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Verification failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Build a map of original title -> matches data
      const matchesMap = {};
      data.matches.forEach(match => {
        matchesMap[match.title] = match;
      });
      
      setTitleMatches(matchesMap);
      setUsedTitles(data.usedTitles || []);
    } catch (error) {
      console.error("Title verification failed:", error);
    } finally {
      setIsVerifyingTitles(false);
    }
  };
  
  // Helper function to format large numbers
  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count;
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <NavMenu />
      
      <h1 className="text-2xl font-bold mb-6 text-white">Basic Database Selector</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter your search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" disabled={loading || isExtractingTitles || isVerifyingTitles}>
            {loading ? 'Processing...' : 'Submit'}
          </Button>
        </div>
      </form>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {(loading || isExtractingTitles || isVerifyingTitles) && (
        <div className="mt-6 flex justify-center items-center gap-3">
          <div className="w-5 h-5 border-2 border-t-transparent border-blue-400 rounded-full animate-spin"></div>
          <p className="text-neutral-300">
            {loading ? 'Selecting database...' : 
             isExtractingTitles ? 'Extracting job titles...' :
             isVerifyingTitles ? 'Verifying against database...' : 'Processing...'}
          </p>
        </div>
      )}

      {result && (
        <Card className="mb-6">
          <CardContent>
            <h2 className="text-xl font-semibold mb-4 text-white">Recommended Database</h2>
            
            <div className="grid gap-6">
              <div
                className={cn(
                  "p-4 rounded-lg border",
                  result.database === "usa4_new_v2" 
                    ? "bg-blue-800/20 border-blue-700/30 text-blue-300" 
                    : "bg-green-800/20 border-green-700/30 text-green-300"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">
                    {result.database === "usa4_new_v2" ? "USA Professionals" : "US Local Businesses"}
                  </h3>
                  <span className="text-sm px-2 py-1 rounded-full bg-[#303030] border border-[#505050]">
                    {result.database}
                  </span>
                </div>
                <p className="text-sm">{result.explanation}</p>
              </div>
            </div>

            {processingTime && (
              <div className="mt-4 text-xs text-teal-500 bg-teal-900/20 px-3 py-1.5 rounded inline-flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Total processing time: {processingTime}s
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Job Titles Section - Only shown for USA4 database */}
      {result && result.database === "usa4_new_v2" && jobTitles.length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Job Titles</h2>
              <span className="text-xs text-neutral-500">{jobTitles.length} titles extracted</span>
            </div>
            
            <div className="space-y-5">
              {jobTitles.map((title, index) => (
                <div key={index} className="mb-3 pb-3 border-b border-neutral-700 last:border-b-0 last:pb-0 last:mb-0">
                  {/* AI-generated title */}
                  <div className="flex flex-wrap gap-2 mb-1.5">
                    <span 
                      className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                        titleMatches[title]?.winner?.isControl 
                          ? "bg-red-600/20 border border-red-500/30 text-red-300" 
                          : "bg-blue-600/20 border border-blue-500/30 text-blue-300"
                      }`}
                    >
                      {title}
                      {titleMatches[title]?.winner?.isControl && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {titleMatches[title]?.winner?.count > 0 && (
                        <span className="text-[9px] font-medium bg-black/30 px-1.5 py-0.5 rounded">
                          {formatCount(titleMatches[title]?.winner?.count)}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-neutral-500 self-center">AI suggestion</span>
                  </div>
                  
                  {/* Database matches */}
                  {titleMatches[title]?.alternates && titleMatches[title].alternates.length > 0 && (
                    <div>
                      <div className="text-xs text-neutral-500 mb-1 ml-1">Database alternatives:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {titleMatches[title].alternates.map((alt, altIndex) => (
                          <span 
                            key={altIndex}
                            className="px-2 py-0.5 text-xs rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center gap-1"
                          >
                            {alt.title}
                            {alt.count > 0 && (
                              <span className="text-[9px] font-medium bg-black/30 px-1.5 py-0.5 rounded">
                                {formatCount(alt.count)}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-sm text-neutral-400">
        <h3 className="font-semibold mb-2">Database Information</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-blue-300">USA Professionals:</strong> Individual professionals in the United States (usa4_new_v2)</li>
          <li><strong className="text-green-300">US Local Businesses:</strong> Local business establishments in the United States (deez_3_v3)</li>
        </ul>
      </div>
    </div>
  );
} 