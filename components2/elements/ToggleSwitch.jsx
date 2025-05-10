"use client";

import React from "react";

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      aria-label="toggle brainstorm mode"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        value ? "bg-green-500" : "bg-gray-500/50"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          value ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default ToggleSwitch; 