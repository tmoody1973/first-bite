"use client";

import { StopCard } from "./StopCard";
import { ProgressDots } from "./ProgressDots";
import type { StopData } from "@/hooks/useJourneyStream";

interface StoryFlowProps {
  stops: StopData[];
  journeyId: string | null;
}

export function StoryFlow({ stops, journeyId }: StoryFlowProps) {
  if (stops.length === 0) return null;

  return (
    <div className="relative">
      <ProgressDots current={stops.length} total={5} />

      {stops.map((stop) => (
        <StopCard key={stop.stopNumber} stop={stop} journeyId={journeyId} />
      ))}

      <div className="max-w-3xl mx-auto px-6 pb-16">
        <p className="font-sans text-[10px] text-[#E8E0D0]/20 text-center">
          All places and restaurants are AI-suggested. Verify details before
          visiting.
        </p>
      </div>
    </div>
  );
}
