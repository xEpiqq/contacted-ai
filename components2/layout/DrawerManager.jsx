"use client";

import React from "react";
import { useSearchContext } from "../context/SearchContext";
import EnrichmentDrawer from "./EnrichmentDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XMarkIcon, 
  ChevronLeftIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { 
  FileUp, 
  Upload, 
  CheckCircle, 
  CirclePlus, 
  Loader, 
  Download, 
  MoreHorizontal, 
  Pencil, 
  Trash2
} from "lucide-react";

function DrawerManager() {
  const {
    drawerOpen,
    setDrawerOpen,
    exportsDrawerOpen,
    setExportsDrawerOpen,
    uploadStep,
    csvData,
    csvColumns,
    selectedColumns,
    handleColumnSelect,
    autoDetectedColumn,
    uploadError,
    handleFileUpload,
    handleContinue,
    handleEnrichData,
    resetUpload,
    enrichLoading,
    matchingCount,
    showConfirmation,
    setShowConfirmation,
    handleConfirmEnrich,
    enrichmentComplete,
    enrichmentResult,
    enrichButtonProcessing,
    matchingResult,
    resetEnrichment,
    handleDrawerClose,
    getColumnSamples,
    loadingText,
    loadingSteps,
    blinkingEllipsisText,
    currentStepIndex,
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
    handleDeleteExport,
    handleRenameExport,
    confirmRename,
    confirmDelete,
    cancelDelete,
    handleDownloadExport,
    downloadInProgress,
    exportsFetched,
    fetchExports,
    selectedExport,
    setSelectedExport,
    handleEditExport,
  } = useSearchContext();

  const drawerWidth = "w-96";

  return (
    <>
      {/* Overlay for click-outside to close drawer */}
      <AnimatePresence>
        {(drawerOpen || exportsDrawerOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-20"
            onClick={() => {
              if (drawerOpen) handleDrawerClose();
              if (exportsDrawerOpen) {
                if (pendingDeleteId) {
                  cancelDelete();
                } else {
                  setExportsDrawerOpen(false);
                }
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Enrichment Drawer - Coming from left side now */}
      <EnrichmentDrawer />

      {/* Exports Drawer - Keep this as is */}
      <AnimatePresence>
        {exportsDrawerOpen && (
          <motion.aside
            key="exports-drawer"
            initial={{ x: -350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -350, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-0 left-0 bottom-0 ${drawerWidth} max-w-[90vw] bg-[#2b2b2b] border-r border-[#404040] shadow-lg text-sm text-neutral-200 z-30 flex flex-col`}
          >
            {/* Exports drawer content remains the same */}
            {/* ... */}
            <div className="flex justify-between items-center border-b border-[#404040] p-4">
              <h2 className="text-base font-semibold">Saved Exports</h2>
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
            
            {/* Confirmation Dialog */}
            <AnimatePresence>
              {pendingDeleteId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2b2b2b] border border-[#404040] rounded-lg shadow-lg p-4 w-72 z-50"
                >
                  <h3 className="text-base font-semibold mb-3">Delete Export?</h3>
                  <p className="text-sm text-neutral-400 mb-4">
                    Are you sure you want to delete this export? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={cancelDelete}
                      className="px-3 py-1.5 rounded-md bg-transparent border border-[#404040] text-neutral-300 hover:bg-[#333333] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-3 py-1.5 rounded-md bg-red-700 text-white hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Export list */}
            <div className="p-4 h-full overflow-y-auto thin-scrollbar">
              {exports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
                  <p className="text-neutral-400 mb-2">No saved exports yet</p>
                  <p className="text-xs text-neutral-500">
                    Exports from enrichment will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exports.map((exp) => (
                    <div
                      key={exp.id}
                      className={`p-3 rounded-md border ${
                        selectedExport === exp.id
                          ? "border-blue-700 bg-blue-900/10"
                          : "border-[#404040] bg-[#333333]/30"
                      } relative`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium pr-7 line-clamp-1">{exp.name}</h3>
                        
                        {/* Export options menu */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setSelectedExport(exp.id);
                              setShowExportOptions(selectedExport === exp.id ? !showExportOptions : true);
                            }}
                            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-[#404040] transition-colors absolute -top-1 -right-1"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          
                          {/* Options dropdown */}
                          <AnimatePresence>
                            {showExportOptions && selectedExport === exp.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute top-6 right-0 bg-[#2b2b2b] border border-[#404040] rounded-md shadow-lg z-10 w-32 py-1"
                              >
                                <button
                                  onClick={() => handleDownloadExport(exp.id)}
                                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#333333] flex items-center"
                                >
                                  <Download className="h-3.5 w-3.5 mr-2" />
                                  Download
                                </button>
                                <button
                                  onClick={() => handleEditExport(exp.id)}
                                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#333333] flex items-center"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-2" />
                                  Rename
                                </button>
                                <button
                                  onClick={() => handleDeleteExport(exp.id)}
                                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-900/50 text-red-400 flex items-center"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-neutral-400">
                        <span>{exp.rows} contacts</span>
                        <span>{exp.date}</span>
                      </div>
                      
                      <button
                        onClick={() => handleDownloadExport(exp.id)}
                        className="mt-2 w-full py-1.5 rounded-md bg-[#404040] hover:bg-[#4a4a4a] transition-colors text-xs flex items-center justify-center"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default DrawerManager; 