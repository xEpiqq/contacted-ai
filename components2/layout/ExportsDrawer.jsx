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
import { useSearchContext } from "../context/SearchContext";

const ExportsDrawer = () => {
  // State from context
  const {
    exportsDrawerOpen,
    setExportsDrawerOpen,
    exports,
    exportsLoading,
    exportsError,
    activeExport,
    setActiveExport,
    showExportOptions,
    setShowExportOptions,
    isRenaming,
    setIsRenaming,
    newExportName,
    setNewExportName,
    pendingDeleteId,
    setPendingDeleteId,
    downloadInProgress,
    fetchExports,
    handleDeleteExport,
    confirmRename,
    confirmDelete,
    cancelDelete,
    handleDownloadExport,
    handleRenameExport,
    exportsFetched,
    user
  } = useSearchContext();
  
  // Prefetch exports data when component mounts
  useEffect(() => {
    // Only fetch if not already fetched and user is authenticated
    if (!exportsFetched && user) {
      fetchExports();
    }
  }, [exportsFetched, user, fetchExports]);

  return (
    <AnimatePresence>
      {exportsDrawerOpen && (
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
                onClick={() => {
                  setExportsDrawerOpen(false);
                  setPendingDeleteId(null);
                  setShowExportOptions(false);
                  setIsRenaming(false);
                }}
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
                          className={`p-1.5 rounded-md hover:bg-[#4a4a4a] text-green-500 hover:text-green-400 transition-colors ${downloadInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => handleDownloadExport(exp.id)}
                          disabled={downloadInProgress}
                        >
                          {downloadInProgress ? (
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
            <div className="border-t border-[#404040] bg-[#252525] p-4 mt-auto">
              <p className="text-xs text-neutral-300 mb-3">Are you sure you want to delete this export? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={cancelDelete}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-3 py-1.5 text-xs rounded bg-red-900/60 hover:bg-red-900/80 text-white transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default ExportsDrawer; 