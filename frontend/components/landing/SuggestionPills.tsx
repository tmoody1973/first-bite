"use client";

import { motion } from "framer-motion";
import { SUGGESTIONS } from "@/lib/constants";

interface SuggestionPillsProps {
  onSelect: (suggestion: string) => void;
  disabled: boolean;
}

export function SuggestionPills({ onSelect, disabled }: SuggestionPillsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="flex flex-wrap justify-center gap-2 mt-6 max-w-xl mx-auto px-6"
    >
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="text-xs font-sans px-4 py-2 rounded-full border border-[#E8E0D0]/10 text-[#E8E0D0]/50 hover:border-[#C4652A]/30 hover:text-[#C4652A] transition-colors disabled:opacity-30"
        >
          {suggestion}
        </button>
      ))}
    </motion.div>
  );
}
