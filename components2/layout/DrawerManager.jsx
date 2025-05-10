"use client";

import React from "react";
import { useSearchContext } from "../context/SearchContext";
import EnrichmentDrawer from "./EnrichmentDrawer";
import ExportsDrawer from "./ExportsDrawer";
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

      {/* Exports Drawer */}
      <ExportsDrawer />
    </>
  );
}

export default DrawerManager; 