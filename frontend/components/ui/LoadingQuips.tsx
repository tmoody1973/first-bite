"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LoadingQuipsProps {
  message: string;
}

export function LoadingQuips({ message }: LoadingQuipsProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-[#C4652A]/30 border-t-[#C4652A] rounded-full mb-8"
      />
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="font-serif italic text-[#E8E0D0]/50 text-lg text-center"
        >
          {message}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
