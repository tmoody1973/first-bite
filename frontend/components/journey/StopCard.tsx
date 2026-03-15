"use client";

import { motion } from "framer-motion";
import { RecipeCard } from "./RecipeCard";
import { PlaceCard } from "./PlaceCard";
import { AudioPlayer } from "./AudioPlayer";
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto px-6 py-16"
    >
      <div className="mb-8">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-[#C4652A] mb-2">
          Stop {stop.stopNumber} &mdash; {theme}
        </p>
        <h2 className="font-serif text-3xl md:text-4xl font-bold">
          {stop.title}
        </h2>
      </div>

      <div className="font-sans text-base md:text-lg leading-relaxed text-[#E8E0D0]/80 whitespace-pre-line mb-8">
        {stop.narrative}
      </div>

      {stop.sceneImageUrl && (
        <motion.img
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          src={stop.sceneImageUrl}
          alt={`Scene at ${stop.title}`}
          className="w-full rounded-xl mb-8 shadow-2xl"
        />
      )}

      {stop.recipe && (
        <div className="mb-8">
          <RecipeCard recipe={stop.recipe} dishImageUrl={stop.dishImageUrl} />
        </div>
      )}

      {stop.place && (
        <div className="mb-8">
          <PlaceCard place={stop.place} />
        </div>
      )}

      <AudioPlayer
        stopNumber={stop.stopNumber}
        narrative={stop.narrative}
        journeyId={journeyId}
        ttsAudioUrl={stop.ttsAudioUrl}
      />
    </motion.section>
  );
}
