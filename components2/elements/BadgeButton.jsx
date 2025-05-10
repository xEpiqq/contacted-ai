"use client";

import React from "react";
import { motion } from "framer-motion";
import { badgeColors } from "../core/utils";

function BadgeButton({ 
  children, 
  onClick, 
  isSelected = false, 
  color, 
  index = 0,
  small = false
}) {
  // Choose a color based on index if not provided
  const badgeColor = color || badgeColors[index % badgeColors.length];
  
  // Tailwind class mapping for different colors
  const colorMapping = {
    // Blues
    blue: isSelected 
      ? "bg-blue-600/20 text-blue-400 border-blue-700/30"
      : "bg-blue-500/10 text-blue-400/60 border-blue-700/20 hover:bg-blue-500/15",
    
    // Greens  
    green: isSelected 
      ? "bg-green-600/20 text-green-400 border-green-700/30"
      : "bg-green-500/10 text-green-400/60 border-green-700/20 hover:bg-green-500/15",
    emerald: isSelected 
      ? "bg-emerald-600/20 text-emerald-400 border-emerald-700/30"
      : "bg-emerald-500/10 text-emerald-400/60 border-emerald-700/20 hover:bg-emerald-500/15",
    teal: isSelected 
      ? "bg-teal-600/20 text-teal-400 border-teal-700/30"
      : "bg-teal-500/10 text-teal-400/60 border-teal-700/20 hover:bg-teal-500/15",
      
    // Reds
    red: isSelected 
      ? "bg-red-600/20 text-red-400 border-red-700/30"
      : "bg-red-500/10 text-red-400/60 border-red-700/20 hover:bg-red-500/15",
    rose: isSelected 
      ? "bg-rose-600/20 text-rose-400 border-rose-700/30"
      : "bg-rose-500/10 text-rose-400/60 border-rose-700/20 hover:bg-rose-500/15",
      
    // Purples
    purple: isSelected 
      ? "bg-purple-600/20 text-purple-400 border-purple-700/30"
      : "bg-purple-500/10 text-purple-400/60 border-purple-700/20 hover:bg-purple-500/15",
    indigo: isSelected 
      ? "bg-indigo-600/20 text-indigo-400 border-indigo-700/30"
      : "bg-indigo-500/10 text-indigo-400/60 border-indigo-700/20 hover:bg-indigo-500/15",
    violet: isSelected 
      ? "bg-violet-600/20 text-violet-400 border-violet-700/30"
      : "bg-violet-500/10 text-violet-400/60 border-violet-700/20 hover:bg-violet-500/15",
      
    // Yellows/Oranges  
    yellow: isSelected 
      ? "bg-yellow-600/20 text-yellow-400 border-yellow-700/30"
      : "bg-yellow-500/10 text-yellow-400/60 border-yellow-700/20 hover:bg-yellow-500/15",
    amber: isSelected 
      ? "bg-amber-600/20 text-amber-400 border-amber-700/30"
      : "bg-amber-500/10 text-amber-400/60 border-amber-700/20 hover:bg-amber-500/15",
    orange: isSelected 
      ? "bg-orange-600/20 text-orange-400 border-orange-700/30"
      : "bg-orange-500/10 text-orange-400/60 border-orange-700/20 hover:bg-orange-500/15",
      
    // Other colors
    sky: isSelected 
      ? "bg-sky-600/20 text-sky-400 border-sky-700/30"
      : "bg-sky-500/10 text-sky-400/60 border-sky-700/20 hover:bg-sky-500/15",
    cyan: isSelected 
      ? "bg-cyan-600/20 text-cyan-400 border-cyan-700/30"
      : "bg-cyan-500/10 text-cyan-400/60 border-cyan-700/20 hover:bg-cyan-500/15",
    lime: isSelected 
      ? "bg-lime-600/20 text-lime-400 border-lime-700/30"
      : "bg-lime-500/10 text-lime-400/60 border-lime-700/20 hover:bg-lime-500/15",
    fuchsia: isSelected 
      ? "bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-700/30"
      : "bg-fuchsia-500/10 text-fuchsia-400/60 border-fuchsia-700/20 hover:bg-fuchsia-500/15",
    pink: isSelected 
      ? "bg-pink-600/20 text-pink-400 border-pink-700/30"
      : "bg-pink-500/10 text-pink-400/60 border-pink-700/20 hover:bg-pink-500/15",
    zinc: isSelected 
      ? "bg-zinc-600/20 text-zinc-400 border-zinc-700/30"
      : "bg-zinc-500/10 text-zinc-400/60 border-zinc-700/20 hover:bg-zinc-500/15",
  };
  
  const colorClasses = colorMapping[badgeColor] || colorMapping.blue;
  
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`
        ${colorClasses}
        ${small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
        inline-flex items-center gap-1.5 rounded-full border transition-colors
      `}
    >
      {children}
    </motion.button>
  );
}

export default BadgeButton; 