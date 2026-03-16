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
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJourney(journeyId)
      .then((data) => {
        const mappedStops: StopData[] = (data.stops || []).map(
          (s: Record<string, unknown>) => {
            const place = s.place as Record<string, unknown> | null;
            return {
              stopNumber: (s.stop_number as number) || 0,
              title: (s.title as string) || "",
              narrative: (s.narrative as string) || "",
              sceneImageUrl: (s.scene_image_url as string) || "",
              dishImageUrl: (s.dish_image_url as string) || "",
              videoUrl: (s.video_url as string) || "",
              ambientUrl: (s.ambient_url as string) || "",
              streetViewUrl: (s.street_view_url as string) || "",
              realPhotoUrl: (s.real_photo_url as string) || "",
              recipe: s.recipe as StopData["recipe"],
              place: place
                ? {
                    name: (place.name as string) || "",
                    address: (place.address as string) || "",
                    footnote: (place.footnote as string) || "",
                    rating: (place.rating as number) || null,
                    lat: (place.lat as number) || null,
                    lng: (place.lng as number) || null,
                  }
                : null,
              ttsAudioUrl: (s.tts_audio_url as string) || null,
            };
          }
        );
        setStops(mappedStops);
        setPosterUrl((data.poster_url as string) || null);
        setVideoUrl((data.video_url as string) || null);
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

  return (
    <StoryFlow
      stops={stops}
      journeyId={journeyId}
      posterUrl={posterUrl}
      videoUrl={videoUrl}
    />
  );
}
