"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDownIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { Gem } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function Navbar({ 
  onCreditsClick = () => {}
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // User and credits state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [creditsRemaining, setCreditsRemaining] = useState(0);

  // Fetch user data from Supabase when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          
          // Fetch user profile from profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
            
            // Calculate credits
            const subscriptionUsed = profileData.tokens_used || 0;
            const subscriptionTotal = profileData.tokens_total || 0;
            const oneTime = profileData.one_time_credits || 0;
            const oneTimeUsed = profileData.one_time_credits_used || 0;
            
            const totalUsed = subscriptionUsed + oneTimeUsed;
            const totalAll = subscriptionTotal + oneTime;
            const remaining = totalAll - totalUsed;
            
            setCreditsRemaining(remaining);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
    // Reset avatar error when user changes
    setAvatarError(false);
  }, []);

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
    <header className="fixed top-0 left-0 right-0 w-full flex items-center justify-between px-4 py-3 text-xs text-white z-20 bg-[#212121]">
      <div className="flex items-center gap-3">
        {/* Email dropdown on the left side */}
        <div className="relative">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
            onClick={handleUserClick}
          >
            {/* Profile Picture */}
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold overflow-hidden">
              {user?.user_metadata?.avatar_url && !avatarError ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // If image fails to load, hide it and show initials
                    setAvatarError(true);
                  }}
                />
              ) : user?.email ? (
                // Show initials from email
                <span className="text-xs font-bold">
                  {(() => {
                    // Try to get name from user metadata or profile
                    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || profile?.full_name;
                    
                    if (fullName) {
                      // Extract initials from full name
                      const names = fullName.trim().split(' ');
                      if (names.length >= 2) {
                        return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
                      } else {
                        return names[0].charAt(0).toUpperCase();
                      }
                    } else {
                      // Fallback to email initial
                      return user.email.charAt(0).toUpperCase();
                    }
                  })()}
                </span>
              ) : (
                // Default user icon fallback
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-white max-w-[200px] truncate">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || profile?.full_name || user?.email || "User"}
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
                    <p className="text-sm font-medium text-white truncate">
                      {user?.user_metadata?.full_name || user?.user_metadata?.name || profile?.full_name || user?.email || "User"}
                    </p>
                    {(user?.user_metadata?.full_name || user?.user_metadata?.name || profile?.full_name) && user?.email && (
                      <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                    )}
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
          className="flex items-center gap-1 px-3.5 py-1.5 bg-[#303030] rounded-full cursor-pointer hover:bg-[#3a3a3a] transition-colors"
          onClick={onCreditsClick}
        >
          <Gem className="h-4 w-4 text-green-400 mr-0.5" />
          <span className="text-white font-medium">{creditsRemaining?.toLocaleString() || "2,482"}</span>
          <span className="text-[10px] text-neutral-400 ml-1">credits</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar; 