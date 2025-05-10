"use client";

import React from "react";
import { motion } from "framer-motion";

function Badge({ children, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#2b2b2b] text-sm text-neutral-400"
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="text-neutral-500 hover:text-neutral-300"
      >
        ×
      </button>
    </motion.div>
  );
}

export default Badge; 