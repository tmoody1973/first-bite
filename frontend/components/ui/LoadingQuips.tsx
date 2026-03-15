"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LoadingQuipsProps {
  stopsGenerated: number;
}

const PIPELINE_STEPS = [
  { label: "The Arrival — first impression, chaos, the smell", theme: "Stop 1" },
  { label: "The Street — the stall nobody talks about", theme: "Stop 2" },
  { label: "The Kitchen — behind the counter, the technique", theme: "Stop 3" },
  { label: "The Table — strangers sharing food and stories", theme: "Stop 4" },
  { label: "The Last Bite — what this place taught you", theme: "Stop 5" },
];

export function LoadingQuips({ stopsGenerated }: LoadingQuipsProps) {
  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-serif text-3xl font-bold mb-2 text-[#E8E0D0]/80"
      >
        First Bite
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="font-serif italic text-sm text-[#E8E0D0]/30 mb-12"
      >
        Building your journey...
      </motion.p>

      {/* Pipeline steps — real progress from backend */}
      <div className="w-full max-w-sm space-y-3">
        {PIPELINE_STEPS.map((step, i) => {
          const isComplete = i < stopsGenerated;
          const isActive = i === stopsGenerated;
          const isPending = i > stopsGenerated;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4"
            >
              {/* Step indicator */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-medium transition-all duration-500 ${
                  isComplete
                    ? "bg-[#C4652A] text-white"
                    : isActive
                      ? "bg-[#C4652A]/20 text-[#C4652A] ring-2 ring-[#C4652A]/40"
                      : "bg-white/5 text-[#E8E0D0]/20"
                }`}
              >
                {isComplete ? "\u2713" : `0${i + 1}`}
              </div>

              {/* Step label */}
              <div className="flex-1">
                <p
                  className={`font-sans text-xs font-medium transition-all duration-500 ${
                    isComplete
                      ? "text-[#E8E0D0]/40"
                      : isActive
                        ? "text-[#C4652A]"
                        : "text-[#E8E0D0]/15"
                  }`}
                >
                  {step.theme}
                </p>
                <p
                  className={`font-serif italic text-xs transition-all duration-500 ${
                    isComplete
                      ? "text-[#E8E0D0]/25"
                      : isActive
                        ? "text-[#E8E0D0]/60"
                        : "text-[#E8E0D0]/10"
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {/* Spinner for active step */}
              {isActive && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-4 h-4 border border-[#C4652A]/30 border-t-[#C4652A] rounded-full"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stopsGenerated}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="font-serif italic text-xs text-[#E8E0D0]/30 mt-10 text-center"
        >
          {stopsGenerated === 0
            ? "Following the smoke to something worth eating..."
            : stopsGenerated < 5
              ? `${stopsGenerated} of 5 stops ready...`
              : "Assembling your journey..."}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
