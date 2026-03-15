"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingQuipsProps {
  message: string;
}

const PIPELINE_STEPS = [
  { label: "Reading your request", icon: "01" },
  { label: "Finding the places the guidebooks forgot", icon: "02" },
  { label: "Walking the streets, following the smoke", icon: "03" },
  { label: "Sketching the scene", icon: "04" },
  { label: "Plating the dish", icon: "05" },
  { label: "Writing the recipe", icon: "06" },
  { label: "Assembling your journey", icon: "07" },
];

export function LoadingQuips({ message }: LoadingQuipsProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) =>
        prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

      {/* Pipeline steps */}
      <div className="w-full max-w-sm space-y-3">
        {PIPELINE_STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isComplete = i < activeStep;
          const isPending = i > activeStep;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
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
                {isComplete ? "✓" : step.icon}
              </div>

              {/* Step label */}
              <p
                className={`font-sans text-sm transition-all duration-500 ${
                  isComplete
                    ? "text-[#E8E0D0]/40"
                    : isActive
                      ? "text-[#E8E0D0]"
                      : "text-[#E8E0D0]/15"
                }`}
              >
                {step.label}
              </p>

              {/* Spinner for active step */}
              {isActive && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-4 h-4 border border-[#C4652A]/30 border-t-[#C4652A] rounded-full ml-auto"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Live server message */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="font-serif italic text-xs text-[#C4652A]/60 mt-10 text-center"
          >
            &ldquo;{message}&rdquo;
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
