"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StoryFlow } from "@/components/journey/StoryFlow";
import { LoadingQuips } from "@/components/ui/LoadingQuips";
import { fetchJourney } from "@/lib/api";
import type { StopData } from "@/hooks/useJourneyStream";

export default function JourneyPage() {
  const params = useParams();
  const journeyId = params.id as string;
  const [stops, setStops] = useState<StopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJourney(journeyId)
      .then((data) => {
        const mappedStops: StopData[] = (data.stops || []).map(
          (s: Record<string, unknown>) => ({
            stopNumber: s.stop_number as number,
            title: s.title as string,
            narrative: s.narrative as string,
            sceneImageUrl: (s.scene_image_url as string) || "",
            dishImageUrl: (s.dish_image_url as string) || "",
            recipe: s.recipe as StopData["recipe"],
            place: s.place as StopData["place"],
            ttsAudioUrl: (s.tts_audio_url as string) || null,
          })
        );
        setStops(mappedStops);
      })
      .catch(() => setError("Journey not found"))
      .finally(() => setLoading(false));
  }, [journeyId]);

  if (loading) {
    return <LoadingQuips stopsGenerated={0} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-sans text-[#E8E0D0]/50">{error}</p>
      </div>
    );
  }

  return <StoryFlow stops={stops} journeyId={journeyId} />;
}
