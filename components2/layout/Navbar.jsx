"use client";

import React from "react";
import { useSearchContext } from "../context/SearchContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDownIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { Gem } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function Navbar() {
  const { 
    creditsRemaining,
    showUserDropdown,
    setShowUserDropdown,
    user,
    setCreditsScreenOpen
  } = useSearchContext();

  // Handler functions to be passed as props
  const handleUserClick = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch("/api/manage-billing", { method: "POST" });
      const { url, error } = await res.json();
      
      if (error) {
        console.error("Billing portal error:", error);
      } else {
        window.location.href = url;
      }
      
      setShowUserDropdown(false);
    } catch (err) {
      console.error("Billing portal error:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 text-xs text-white relative z-50 bg-[#212121]">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-neutral-500" />
        {/* Email dropdown on the left side */}
        <div className="relative">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
            onClick={handleUserClick}
          >
            <span className="text-white max-w-[200px] truncate">
              {user?.email || "User"}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-neutral-400" />
          </div>
          
          {/* Dropdown menu */}
          <AnimatePresence>
            {showUserDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 w-48 bg-[#252525] border border-[#404040] rounded-lg shadow-lg overflow-hidden z-50"
              >
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-[#404040]">
                    <p className="text-sm font-medium text-white truncate">{user?.email || "User"}</p>
                  </div>
                  
                  <button
                    onClick={handleManageBilling}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-[#303030] flex items-center"
                  >
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    <span>Manage Billing</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-300 hover:bg-[#303030] flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-r from-green-900/40 to-green-700/40 px-2 py-0.5 rounded text-[10px] text-green-400 border border-green-800/30">
          Unlimited
        </div>
        <div 
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#303030] rounded-full cursor-pointer hover:bg-[#3a3a3a] transition-colors"
          onClick={() => setCreditsScreenOpen(true)}
        >
          <Gem className="h-4 w-4 text-green-400" />
          <span className="text-white font-medium">{creditsRemaining?.toLocaleString() || "2,482"}</span>
          <span className="text-[10px] text-neutral-400 ml-1">credits</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar; 