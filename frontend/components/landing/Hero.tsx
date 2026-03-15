"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface HeroProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function Hero({ onSubmit, isLoading }: HeroProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-6xl md:text-8xl font-bold tracking-tight mb-4"
      >
        First Bite
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-serif italic text-[#E8E0D0]/60 text-lg md:text-xl mb-12"
      >
        The real story starts where the guidebook ends.
      </motion.p>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onSubmit={handleSubmit}
        className="w-full max-w-xl"
      >
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Name a place. I'll find the food."
            disabled={isLoading}
            className="w-full bg-white/5 border border-[#E8E0D0]/10 rounded-full px-6 py-4 text-[#E8E0D0] placeholder:text-[#E8E0D0]/30 font-sans text-lg focus:outline-none focus:border-[#C4652A]/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#C4652A] text-white rounded-full px-6 py-2 font-sans text-sm font-medium hover:bg-[#C4652A]/80 transition-colors disabled:opacity-30"
          >
            {isLoading ? "Finding..." : "Go"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
