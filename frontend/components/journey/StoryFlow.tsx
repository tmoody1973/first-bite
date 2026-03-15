"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StopCard } from "./StopCard";
import { ProgressDots } from "./ProgressDots";
import type { StopData } from "@/hooks/useJourneyStream";

interface StoryFlowProps {
  stops: StopData[];
  journeyId: string | null;
}

export function StoryFlow({ stops, journeyId }: StoryFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (stops.length === 0) return null;

  const currentStop = stops[currentIndex];
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < stops.length - 1;
  const isLastStop = currentIndex === stops.length - 1 && stops.length >= 5;

  const goNext = () => {
    if (canGoForward) setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (canGoBack) setCurrentIndex((i) => i - 1);
  };

  // Keyboard navigation
  if (typeof window !== "undefined") {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    // Using a simple approach for hackathon speed
    window.onkeydown = handler;
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden">
      {/* Progress bar at top */}
      <div className="fixed top-0 left-0 right-0 z-50 flex gap-1 px-3 pt-3">
        {stops.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full bg-[#C4652A]"
              initial={{ width: "0%" }}
              animate={{ width: i <= currentIndex ? "100%" : "0%" }}
              transition={{ duration: 0.4 }}
            />
          </div>
        ))}
      </div>

      {/* Stop counter */}
      <ProgressDots current={currentIndex + 1} total={Math.max(stops.length, 5)} />

      {/* Full-screen stop */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStop.stopNumber}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full"
        >
          <StopCard stop={currentStop} journeyId={journeyId} />
        </motion.div>
      </AnimatePresence>

      {/* Navigation tap zones */}
      <div
        className="fixed top-0 left-0 w-1/3 h-full z-40 cursor-pointer"
        onClick={goPrev}
      />
      <div
        className="fixed top-0 right-0 w-1/3 h-full z-40 cursor-pointer"
        onClick={goNext}
      />

      {/* Navigation arrows (desktop) */}
      {canGoBack && (
        <button
          onClick={goPrev}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors hidden md:flex"
        >
          &#8592;
        </button>
      )}
      {canGoForward && (
        <button
          onClick={goNext}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors hidden md:flex"
        >
          &#8594;
        </button>
      )}

      {/* Last stop disclaimer */}
      {isLastStop && (
        <div className="fixed bottom-4 left-0 right-0 z-50 text-center">
          <p className="font-sans text-[10px] text-[#E8E0D0]/20">
            All places are AI-suggested. Verify before visiting.
          </p>
        </div>
      )}
    </div>
  );
}
