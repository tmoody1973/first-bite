"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StopCard } from "./StopCard";
import { ProgressDots } from "./ProgressDots";
import type { StopData } from "@/hooks/useJourneyStream";

interface StoryFlowProps {
  stops: StopData[];
  journeyId: string | null;
  posterUrl?: string | null;
  videoUrl?: string | null;
  isGenerating?: boolean;
}

export function StoryFlow({
  stops,
  journeyId,
  posterUrl,
  videoUrl,
  isGenerating = false,
}: StoryFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance to latest stop as they arrive during generation
  useEffect(() => {
    if (isGenerating && stops.length > 0) {
      setCurrentIndex(stops.length - 1);
    }
  }, [stops.length, isGenerating]);

  // Auto-advance to poster slide when it becomes available
  useEffect(() => {
    if (!isGenerating && posterUrl && stops.length > 0) {
      // Small delay so user sees the last stop first
      const timer = setTimeout(() => {
        setCurrentIndex(stops.length); // poster is at index stops.length
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, posterUrl, stops.length]);

  if (stops.length === 0) return null;

  const showPoster = !isGenerating && posterUrl;
  const totalSlides = stops.length + (showPoster ? 1 : 0);
  const isPosterSlide = showPoster && currentIndex === stops.length;
  const currentStop = isPosterSlide ? null : stops[currentIndex];
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < totalSlides - 1;

  const goNext = () => {
    if (canGoForward) setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (canGoBack) setCurrentIndex((i) => i - 1);
  };

  if (typeof window !== "undefined") {
    window.onkeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] overflow-hidden">
      {/* Progress bar at top */}
      <div className="fixed top-0 left-0 right-0 z-50 flex gap-1 px-3 pt-3">
        {Array.from({ length: totalSlides }, (_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/10"
          >
            <motion.div
              className="h-full bg-[#C4652A]"
              initial={{ width: "0%" }}
              animate={{ width: i <= currentIndex ? "100%" : "0%" }}
              transition={{ duration: 0.4 }}
            />
          </div>
        ))}
      </div>

      {/* Back to gallery button */}
      <a
        href="/dashboard"
        className="fixed top-5 left-4 z-50 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm font-sans text-xs text-[#E8E0D0]/60 hover:text-white hover:bg-black/60 transition-colors"
      >
        &larr; Gallery
      </a>

      {/* Generating indicator */}
      {isGenerating && (
        <div className="fixed top-5 left-4 z-50 flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-3 h-3 border border-[#C4652A]/40 border-t-[#C4652A] rounded-full"
          />
          <span className="font-sans text-[10px] text-[#E8E0D0]/30 uppercase tracking-wider">
            Creating stop {stops.length + 1} of 5...
          </span>
        </div>
      )}

      {/* Stop counter */}
      <ProgressDots current={currentIndex + 1} total={totalSlides} />

      {/* Full-screen content */}
      <AnimatePresence mode="wait">
        {isPosterSlide ? (
          <motion.div
            key="poster"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full flex flex-col items-center justify-center px-6"
          >
            {/* Journey video (if available) */}
            {videoUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 w-full max-w-lg"
              >
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full rounded-2xl shadow-2xl"
                />
              </motion.div>
            )}

            {/* Travel poster */}
            <img
              src={posterUrl!}
              alt="Travel poster"
              className="max-h-[50vh] max-w-full rounded-2xl shadow-2xl"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-center"
            >
              <p className="font-serif italic text-lg text-[#E8E0D0]/60 mb-4">
                Your journey, captured.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {/* Download poster */}
                <a
                  href={posterUrl!}
                  download="first-bite-poster.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-xs px-5 py-2.5 rounded-full bg-[#C4652A] text-white hover:bg-[#C4652A]/80 transition-colors"
                >
                  Download Poster
                </a>
                {/* Share */}
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/journey/${journeyId}`;
                    navigator.clipboard.writeText(shareUrl);
                    alert("Share link copied!");
                  }}
                  className="font-sans text-xs px-5 py-2.5 rounded-full border border-[#E8E0D0]/10 text-[#E8E0D0]/50 hover:border-[#C4652A]/30 hover:text-[#C4652A] transition-colors"
                >
                  Share Journey
                </button>
                <a
                  href="/"
                  className="font-sans text-xs px-5 py-2.5 rounded-full border border-[#E8E0D0]/10 text-[#E8E0D0]/50 hover:border-[#C4652A]/30 hover:text-[#C4652A] transition-colors"
                >
                  New Journey
                </a>
                <a
                  href="/dashboard"
                  className="font-sans text-xs px-5 py-2.5 rounded-full border border-[#E8E0D0]/10 text-[#E8E0D0]/50 hover:border-[#C4652A]/30 hover:text-[#C4652A] transition-colors"
                >
                  My Journeys
                </a>
              </div>
              <p className="font-sans text-[10px] text-[#E8E0D0]/20 mt-6">
                All places are AI-suggested. Verify before visiting.
              </p>
            </motion.div>
          </motion.div>
        ) : currentStop ? (
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
        ) : null}
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
    </div>
  );
}
