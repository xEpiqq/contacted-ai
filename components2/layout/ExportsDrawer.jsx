"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { 
  Table, 
  Download, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Loader
} from "lucide-react";

const ExportsDrawer = ({ 
  exportsDrawerOpen, 
  setExportsDrawerOpen, 
  user 
}) => {
  // Local state - moved from context
  const [exports, setExports] = useState([]);
  const [exportsLoading, setExportsLoading] = useState(false);
  const [exportsError, setExportsError] = useState("");
  const [activeExport, setActiveExport] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newExportName, setNewExportName] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const [downloadingExportId, setDownloadingExportId] = useState(null);
  const [exportsFetched, setExportsFetched] = useState(false);
  
  // Close drawer and reset state
  const handleDrawerClose = () => {
    setExportsDrawerOpen(false);
    setPendingDeleteId(null);
    setShowExportOptions(false);
    setIsRenaming(false);
  };
  
  // Local implementation of functions that were previously in context
  const fetchExports = async () => {
    setExportsLoading(true);
    setExportsError("");
    
    try {
      const response = await fetch("/api/people/saved-exports");
      
      if (!response.ok) {
        throw new Error("Failed to fetch exports");
      }
      
      const data = await response.json();
      
      if (data.exports) {
        // Format the date for display
        const formattedExports = data.exports.map(exp => ({
          ...exp,
          displayDate: formatExportDate(exp.created_at),
          displaySize: formatFileSize(exp.row_count * 200) // Estimate file size based on rows
        }));
        
        setExports(formattedExports);
        setExportsFetched(true);
        return formattedExports;
      } else {
        setExports([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching exports:", error);
      setExportsError("Failed to load your exports. Please try again.");
      return [];
    } finally {
      setExportsLoading(false);
    }
  };
  
  // Helper function to format date for display
  const formatExportDate = (dateString) => {
    if (!dateString) return "Unknown date";
    
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return "Today";
    }
    
    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // Otherwise return MMM DD, YYYY format
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Helper function to format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "Unknown";
    
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${Math.round(kb)} KB`;
    }
    
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };
  
  // Functions for exports management
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
  
  const confirmRename = async () => {
    if (!newExportName.trim()) return;
    
    // Store the original name for rollback if needed
    const originalName = exports.find(e => e.id === activeExport)?.name || '';
    
    // Optimistic update - update the UI immediately
    setExports(exports.map(exp => 
      exp.id === activeExport 
        ? { ...exp, name: newExportName.trim() } 
        : exp
    ));
    
    // Reset the renaming state
    setIsRenaming(false);
    setShowExportOptions(false);
    setNewExportName("");
    
    // Perform the actual API call in the background
    try {
      const response = await fetch(`/api/people/saved-exports/${activeExport}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newExportName.trim() })
      });
      
      if (!response.ok) {
        throw new Error("Failed to rename export");
      }
    } catch (error) {
      console.error("Error renaming export:", error);
      
      // Rollback optimistic update on error
      setExports(exports.map(exp => 
        exp.id === activeExport 
          ? { ...exp, name: originalName } 
          : exp
      ));
      
      alert("Failed to rename export. Please try again.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    
    // Store the export being deleted for rollback if needed
    const deletedExport = exports.find(e => e.id === pendingDeleteId);
    
    // Optimistic update - remove from UI immediately
    setExports(exports.filter(exp => exp.id !== pendingDeleteId));
    setPendingDeleteId(null);
    
    // Perform the actual API call in the background
    try {
      const response = await fetch(`/api/people/saved-exports/${pendingDeleteId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete export");
      }
    } catch (error) {
      console.error("Error deleting export:", error);
      
      // Rollback optimistic update on error
      if (deletedExport) {
        setExports(prev => [...prev, deletedExport].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ));
      }
      
      alert("Failed to delete export. Please try again.");
    }
  };
  
  const cancelDelete = () => {
    setPendingDeleteId(null);
  };
  
  const handleDownloadExport = async (id) => {
    if (downloadInProgress) return;
    
    setDownloadInProgress(true);
    setDownloadingExportId(id);
    
    try {
      // First check if storage_path exists
      const export_item = exports.find(e => e.id === id);
      
      if (export_item?.storage_path) {
        // Use a fetch request to get the file content instead of a redirect
        const response = await fetch(`/api/people/saved-exports/${id}/legit-download`);
        
        if (!response.ok) {
          throw new Error(`Download failed with status: ${response.status}`);
        }
        
        // Get the file content as blob
        const blob = await response.blob();
        
        // Create object URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link element and trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = export_item.name ? `${export_item.name}.csv` : 'export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the object URL
        window.URL.revokeObjectURL(url);
      } else {
        // For items without storage_path, use the same approach but with the regenerating endpoint
        const response = await fetch(`/api/people/saved-exports/${id}/download`);
        
        if (!response.ok) {
          throw new Error(`Download failed with status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = export_item?.name ? `${export_item.name}.csv` : 'export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading export:", error);
      alert("Failed to download export. Please try again.");
    } finally {
      // Add a short delay before resetting to avoid multiple clicks
      setTimeout(() => {
        setDownloadInProgress(false);
        setDownloadingExportId(null);
      }, 1000);
    }
  };
  
  // Prefetch exports data when component mounts
  useEffect(() => {
    // Only fetch if not already fetched and user is authenticated
    if (!exportsFetched && user) {
      fetchExports();
    }
    }, [exportsFetched, user]);

  return (
    <AnimatePresence>
      {exportsDrawerOpen && (
        <>
          {/* Overlay for clicking outside to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-10"
            onClick={() => {
              if (pendingDeleteId) {
                cancelDelete();
              } else {
                handleDrawerClose();
              }
            }}
          />
          
          {/* Drawer component */}
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
              <div className="flex items-center gap-2">
                <button
                  aria-label="refresh exports"
                  onClick={fetchExports}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white"
                  disabled={exportsLoading}
                >
                  {exportsLoading ? (
                    <div className="h-3 w-3 border-2 border-t-white border-white/20 rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2v6h-6"></path>
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                      <path d="M3 22v-6h6"></path>
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                    </svg>
                  )}
                </button>
                <button
                  aria-label="close drawer"
                  onClick={handleDrawerClose}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4 flex-1 overflow-y-auto thin-scrollbar">
              {/* Loading state */}
              {exportsLoading && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="animate-spin">
                    <Loader className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500">Loading your exports...</p>
                </div>
              )}
              
              {/* Error state */}
              {exportsError && !exportsLoading && (
                <div className="bg-red-900/20 border border-red-800/30 rounded-md p-4 text-red-400 flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-red-900/30 flex items-center justify-center text-red-400">!</div>
                  <div>
                    <p>{exportsError}</p>
                    <button 
                      onClick={fetchExports}
                      className="text-xs underline hover:no-underline mt-1"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}
              
              {/* Exports list */}
              {!exportsLoading && !exportsError && (
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
                            <span>{exp.displayDate || exp.date}</span>
                            <span>•</span>
                            <span>{exp.displaySize}</span>
                            <span>•</span>
                            <span>{exp.row_count?.toLocaleString() || exp.rows?.toLocaleString() || 0} rows</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            aria-label="download export"
                            className={`p-1.5 rounded-md hover:bg-[#4a4a4a] text-green-500 hover:text-green-400 transition-colors ${downloadingExportId === exp.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => handleDownloadExport(exp.id)}
                            disabled={downloadingExportId === exp.id}
                          >
                            {downloadingExportId === exp.id ? (
                              <div className="h-4 w-4 border-2 border-t-green-500 border-green-200 rounded-full animate-spin"></div>
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
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
              )}
              
              {!exportsLoading && !exportsError && exports.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3 text-neutral-500">
                  <Table className="h-10 w-10 opacity-50" />
                  <p>No exports found</p>
                </div>
              )}
            </div>
            
            {/* Delete confirmation panel at bottom of drawer */}
            {pendingDeleteId && (
              <div className="border-t border-[#404040] bg-[#2b2b2b] p-4 mt-auto">
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium mb-2">Confirm deletion</h3>
                  <p className="text-xs text-neutral-400 mb-4">Are you sure you want to delete this export? This action cannot be undone.</p>
                  <div className="flex justify-between gap-2">
                    <button 
                      onClick={cancelDelete}
                      className="flex-1 px-3 py-2 text-xs text-center rounded bg-[#3a3a3a] hover:bg-[#464646] text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="flex-1 px-3 py-2 text-xs text-center rounded bg-transparent border border-red-600 text-red-500 hover:bg-red-900/10 hover:text-red-400 font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExportsDrawer; 