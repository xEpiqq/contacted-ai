'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

export default function DatabaseSelectorTest() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [followUpOptions, setFollowUpOptions] = useState([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [originalQuery, setOriginalQuery] = useState('');
  const processStartTimeRef = useRef(null);
  const textareaRef = useRef(null);
  const followUpInputRef = useRef(null);

  const handleSubmit = async (e, additionalResponse = null) => {
    if (e) e.preventDefault();
    if ((!query.trim() || isLoading) && !additionalResponse) return;
    
    // If this is a fresh query (not a follow-up)
    if (!additionalResponse) {
      // Close any existing follow-up dialog
      setShowFollowUpDialog(false);
      // Store original query for potential follow-ups
      setOriginalQuery(query);
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProcessingTime(null);
    
    // Start the timer
    processStartTimeRef.current = Date.now();
    
    try {
      // Construct request data
      const requestData = {
        userQuery: additionalResponse ? originalQuery : query
      };
      
      // If this is a follow-up response, include it
      if (additionalResponse) {
        requestData.followUpResponse = additionalResponse;
      }
      
      const response = await fetch('/api/ai/select-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process query');
      }
      
      const data = await response.json();
      
      // Calculate and set the processing time
      if (processStartTimeRef.current) {
        const endTime = Date.now();
        const timeInSeconds = ((endTime - processStartTimeRef.current) / 1000).toFixed(2);
        setProcessingTime(timeInSeconds);
      }
      
      // Handle case where backend requests a follow-up
      if (data.requiresFollowUp) {
        setFollowUpMessage(data.message);
        setFollowUpOptions(data.options || []);
        setShowFollowUpDialog(true);
      } else {
        // Normal database result
        setResult(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a follow-up option
  const handleFollowUpOptionSelect = (option) => {
    if (option.database) {
      // If we already know the database, use it directly
      setShowFollowUpDialog(false);
      setResult({
        databaseName: option.database,
        processingTime: 50 // Simulate processing time
      });
      setProcessingTime("0.05");
      
      // Also update the query to show what was selected
      setQuery(option.value);
    } else {
      // Otherwise submit the follow-up to the backend
      setFollowUpInput('');
      setShowFollowUpDialog(false);
      handleSubmit(null, option.value);
    }
  };

  // Handle custom follow-up input
  const handleFollowUpInputSubmit = (e) => {
    e.preventDefault();
    if (!followUpInput.trim()) return;
    
    const userResponse = followUpInput.trim();
    setFollowUpInput('');
    setShowFollowUpDialog(false);
    
    // Submit the follow-up response to the backend
    handleSubmit(null, userResponse);
  };

  // Database color mapping
  const getDatabaseColor = (dbName) => {
    switch(dbName) {
      case 'usa4_new_v2': return 'bg-blue-600/20 border-blue-500/30 text-blue-300';
      case 'otc1_new_v2': return 'bg-green-600/20 border-green-500/30 text-green-300';
      case 'eap1_new_v2': return 'bg-purple-600/20 border-purple-500/30 text-purple-300';
      case 'deez_3_v3': return 'bg-orange-600/20 border-orange-500/30 text-orange-300';
      default: return 'bg-neutral-600/20 border-neutral-500/30 text-neutral-300';
    }
  };

  // Database display name mapping
  const getDatabaseDisplayName = (dbName) => {
    switch(dbName) {
      case 'usa4_new_v2': return 'USA Professionals';
      case 'otc1_new_v2': return 'International Professionals';
      case 'eap1_new_v2': return 'Global B2B Contacts';
      case 'deez_3_v3': return 'US Local Businesses';
      default: return 'No Suitable Database';
    }
  };

  // Database emoji mapping
  const getDatabaseEmoji = (dbName) => {
    switch(dbName) {
      case 'usa4_new_v2': return '👤🇺🇸';
      case 'otc1_new_v2': return '👤🌍';
      case 'eap1_new_v2': return '📧🌐';
      case 'deez_3_v3': return '🏢🇺🇸';
      default: return '❓';
    }
  };

  // Example queries for placeholder
  const getRandomPlaceholder = () => {
    const examples = [
      "software engineers in California",
      "marketing managers at tech companies",
      "plumbers in Chicago",
      "architects in London",
      "email contacts for HR directors worldwide",
      "restaurants in Miami"
    ];
    return examples[Math.floor(Math.random() * examples.length)];
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (query.trim().length > 0) {
        handleSubmit(e);
      }
    }
  };

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [query]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Focus on follow-up input when dialog shows
  useEffect(() => {
    if (showFollowUpDialog && followUpInputRef.current) {
      setTimeout(() => {
        followUpInputRef.current.focus();
      }, 100);
    }
  }, [showFollowUpDialog]);

  return (
    <div className="min-h-screen bg-[#181818] flex items-center justify-center p-4">
      <motion.div
        key="database-selector"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-[690px] text-white"
      >
        <div className="flex flex-col items-center gap-2 mb-4">
          <p className="text-neutral-400 text-sm text-center">
            AI-Powered Database Selector
          </p>
          <div className="w-full flex justify-center">
            <h1 className="text-3xl sm:text-2xl font-medium text-white">
              Describe what you're looking for
            </h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-[#303030] shadow-sm relative"
        >
          <div className="flex flex-col px-4 py-2">
            <div className="flex items-center flex-wrap gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={`e.g., ${getRandomPlaceholder()}`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 ml-2 resize-none overflow-hidden bg-transparent placeholder:text-neutral-500 text-sm leading-6 outline-none text-white"
                disabled={isLoading || showFollowUpDialog}
              />
              
              <button
                type="submit"
                disabled={!query.trim() || isLoading || showFollowUpDialog}
                className={`ml-2 h-9 w-9 flex items-center justify-center rounded-full transition-all ${
                  isLoading 
                    ? "bg-neutral-600 text-white cursor-wait opacity-80"
                    : query.trim() && !showFollowUpDialog
                    ? "bg-white text-black hover:opacity-90"
                    : "bg-neutral-600 text-white cursor-not-allowed opacity-60"
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <ArrowUpIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-start gap-2 mt-2 px-2 pt-2 border-t border-neutral-600/30">
              <p className="text-xs text-neutral-500">Type a query to find the best database</p>
            </div>
          </div>
        </form>

        {/* Follow-up Dialog */}
        {showFollowUpDialog && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-[#2a2a2a] border border-[#404040] rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-neutral-700 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-neutral-200 mb-3">
                  {followUpMessage}
                </p>
                
                {followUpOptions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {followUpOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleFollowUpOptionSelect(option)}
                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-md text-sm text-neutral-200 text-left transition-colors"
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleFollowUpInputSubmit} className="mt-2">
                  <div className="flex gap-2">
                    <input
                      ref={followUpInputRef}
                      type="text"
                      value={followUpInput}
                      onChange={(e) => setFollowUpInput(e.target.value)}
                      placeholder="Or tell me more about what you're looking for..."
                      className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!followUpInput.trim()}
                      className={`px-4 py-2 rounded-md text-sm 
                        ${followUpInput.trim() 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-neutral-700 text-neutral-400 cursor-not-allowed"}`}
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {isLoading && !showFollowUpDialog && (
          <div className="mt-6 text-center text-neutral-400">
            <div className="inline-flex items-center">
              <div className="w-4 h-4 border-2 border-t-transparent border-blue-400 rounded-full animate-spin mr-2"></div>
              <span>Analyzing your query...</span>
            </div>
          </div>
        )}

        {error && !showFollowUpDialog && (
          <div className="mt-6 p-3 bg-red-500/10 border border-red-400 text-red-700 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && !showFollowUpDialog && (
          <div className="mt-6 p-4 bg-[#2b2b2b] border border-[#404040] rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-green-400">Database Selection Results:</h3>
              {processingTime && (
                <span className="text-xs text-teal-500 bg-teal-900/20 px-2 py-1 rounded flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Process: {processingTime}s
                </span>
              )}
            </div>
            
            <div className="mb-6 p-4 border border-neutral-700 rounded-md">
              <h4 className="text-md font-medium text-neutral-300 mb-3">Recommended Database:</h4>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-2 border ${getDatabaseColor(result.databaseName)} text-md rounded-md flex items-center gap-2`}>
                  <span className="mr-1">{getDatabaseEmoji(result.databaseName)}</span>
                  {getDatabaseDisplayName(result.databaseName)}
                  <span className="text-xs opacity-70">({result.databaseName})</span>
                </span>
                <span className="text-xs text-neutral-500">
                  Processing Time: {result.processingTime}ms
                </span>
              </div>
            </div>
            
            <div className="mb-2">
              <h4 className="text-md font-medium text-neutral-300 mb-3">Available Databases:</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 border border-blue-500/30 bg-blue-600/10 rounded-md">
                  <h4 className="font-medium text-blue-300 flex items-center gap-2">
                    <span>👤🇺🇸</span> USA Professionals <span className="text-xs opacity-70">(usa4_new_v2)</span>
                  </h4>
                  <p className="text-sm mt-1 text-neutral-400">Professionals located within the USA. Contains job titles, contact details, LinkedIn profiles, and US location specifics.</p>
                </div>
                
                <div className="p-3 border border-green-500/30 bg-green-600/10 rounded-md">
                  <h4 className="font-medium text-green-300 flex items-center gap-2">
                    <span>👤🌍</span> International Professionals <span className="text-xs opacity-70">(otc1_new_v2)</span>
                  </h4>
                  <p className="text-sm mt-1 text-neutral-400">Professionals located exclusively outside of the USA. Contains job titles, contact details, LinkedIn profiles, and international location specifics.</p>
                </div>
                
                <div className="p-3 border border-purple-500/30 bg-purple-600/10 rounded-md">
                  <h4 className="font-medium text-purple-300 flex items-center gap-2">
                    <span>📧🌐</span> Global B2B Contacts <span className="text-xs opacity-70">(eap1_new_v2)</span>
                  </h4>
                  <p className="text-sm mt-1 text-neutral-400">Global B2B database of business contacts with emails. Includes person's name, title, email, company info, and global location.</p>
                </div>
                
                <div className="p-3 border border-orange-500/30 bg-orange-600/10 rounded-md">
                  <h4 className="font-medium text-orange-300 flex items-center gap-2">
                    <span>🏢🇺🇸</span> US Local Businesses <span className="text-xs opacity-70">(deez_3_v3)</span>
                  </h4>
                  <p className="text-sm mt-1 text-neutral-400">Information on local businesses primarily within the US. Contains business names, addresses, phone numbers, and online presence details.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-right mt-1">
          <span className="text-xs text-neutral-600">Powered by OpenAI</span>
        </div>
      </motion.div>
    </div>
  );
} 