"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { RecipeCard } from "./RecipeCard";
import { PlaceCard } from "./PlaceCard";
import { AudioPlayer } from "./AudioPlayer";
import { PhotoCarousel } from "./PhotoCarousel";
import type { StopData } from "@/hooks/useJourneyStream";

const STOP_THEMES = [
  "The Arrival",
  "The Street",
  "The Kitchen",
  "The Table",
  "The Last Bite",
];

interface StopCardProps {
  stop: StopData;
  journeyId: string | null;
}

export function StopCard({ stop, journeyId }: StopCardProps) {
  const theme = STOP_THEMES[stop.stopNumber - 1] || "";
  const [showRecipe, setShowRecipe] = useState(false);
  const [textRevealed, setTextRevealed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Typewriter reveal effect
  useEffect(() => {
    setTextRevealed(false);
    const timer = setTimeout(() => setTextRevealed(true), 300);
    return () => clearTimeout(timer);
  }, [stop.stopNumber]);

  // Auto-play video if present
  useEffect(() => {
    if (stop.videoUrl && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [stop.videoUrl]);

  // Auto-play ambient sound at low volume (under narration)
  const ambientRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (stop.ambientUrl && ambientRef.current) {
      ambientRef.current.volume = 0.15; // Low volume — under narration
      ambientRef.current.play().catch(() => {});
    }
    return () => {
      if (ambientRef.current) {
        ambientRef.current.pause();
      }
    };
  }, [stop.ambientUrl, stop.stopNumber]);

  return (
    <div className="relative h-screen w-screen overflow-y-auto">
      {/* Background: video if available, else scene image */}
      {stop.videoUrl ? (
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            src={stop.videoUrl}
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-[#0A0A0A]/20" />
        </div>
      ) : stop.sceneImageUrl ? (
        <div className="absolute inset-0">
          <img
            src={stop.sceneImageUrl}
            alt={`Scene at ${stop.title}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-[#0A0A0A]/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[#0A0A0A]" />
      )}

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col justify-end min-h-screen px-6 pb-8 pt-20 max-w-2xl mx-auto">
        {/* Stop label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-[#C4652A] mb-2">
            Stop {stop.stopNumber} &mdash; {theme}
          </p>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-6"
        >
          {stop.title}
        </motion.h2>

        {/* Narrative with typewriter reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: textRevealed ? 1 : 0.3, y: textRevealed ? 0 : 10 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="font-sans text-sm md:text-base leading-relaxed text-[#E8E0D0]/80 mb-6 max-h-[30vh] overflow-y-auto pr-2 whitespace-pre-line"
        >
          {stop.narrative}
        </motion.div>

        {/* Photo carousel — Street View + real photos */}
        <PhotoCarousel
          streetViewUrl={stop.streetViewUrl}
          realPhotoUrl={stop.realPhotoUrl}
          dishImageUrl={stop.dishImageUrl}
          placeName={stop.place?.name}
        />

        {/* Action row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {/* Dish image + recipe toggle */}
          {(stop.dishImageUrl || stop.recipe) && (
            <div className="flex items-center gap-4">
              {stop.dishImageUrl && (
                <img
                  src={stop.dishImageUrl}
                  alt={stop.recipe?.dish_name || "Dish"}
                  className="w-16 h-16 rounded-xl object-cover border border-white/10 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setShowRecipe(!showRecipe)}
                />
              )}
              <div className="flex-1">
                {stop.recipe && (
                  <button
                    onClick={() => setShowRecipe(!showRecipe)}
                    className="font-serif text-lg font-bold hover:text-[#C4652A] transition-colors text-left"
                  >
                    {stop.recipe.dish_name}
                  </button>
                )}
                {stop.recipe && (
                  <p className="font-sans text-xs text-[#E8E0D0]/40">
                    {stop.recipe.cuisine_type} &middot; {stop.recipe.prep_time}{" "}
                    min &middot; Tap for recipe
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Place info */}
          {stop.place && <PlaceCard place={stop.place} />}

          {/* Audio player */}
          <AudioPlayer
            stopNumber={stop.stopNumber}
            narrative={stop.narrative}
            journeyId={journeyId}
            ttsAudioUrl={stop.ttsAudioUrl}
          />
        </motion.div>
      </div>

      {/* Ambient sound — plays at low volume under narration */}
      {stop.ambientUrl && (
        <audio ref={ambientRef} src={stop.ambientUrl} loop />
      )}

      {/* Recipe modal */}
      {showRecipe && stop.recipe && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[80] flex items-end"
          onClick={() => setShowRecipe(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#0A0A0A] pt-3 pb-2 flex justify-center rounded-t-3xl z-10">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-4 pb-8 bg-[#0A0A0A]">
              <RecipeCard
                recipe={stop.recipe}
                dishImageUrl={stop.dishImageUrl}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
