"use client";

import React from "react";
import { SearchContextProvider } from "../context/SearchContext";
import Navbar from "../layout/Navbar";
import SearchContent from "./SearchContent";
import { AnimatePresence } from "framer-motion";
import { tooltipStyles, tableScrollbarStyles } from "../core/utils";

function SearchProvider() {
  return (
    <SearchContextProvider>
      <div className="w-full flex flex-col bg-[#212121] text-white min-h-screen">
        <Navbar />
        <SearchContent />
        
        {/* Global CSS styles */}
        <style jsx global>{`
          .thin-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          .thin-scrollbar::-webkit-scrollbar-track {
            background: rgba(26, 26, 26, 0.1);
            border-radius: 4px;
          }
          
          .thin-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(90, 90, 90, 0.5);
            border-radius: 4px;
          }
          
          .thin-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(110, 110, 110, 0.6);
          }
          
          /* For Firefox */
          .thin-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(90, 90, 90, 0.5) rgba(26, 26, 26, 0.1);
          }
          
          ${tooltipStyles}
          
          ${tableScrollbarStyles}
        `}</style>
      </div>
    </SearchContextProvider>
  );
}

export default SearchProvider; 