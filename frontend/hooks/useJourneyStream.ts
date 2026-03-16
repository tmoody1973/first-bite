"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { API_URL } from "@/lib/constants";

export interface StopData {
  stopNumber: number;
  title: string;
  narrative: string;
  sceneImageUrl: string;
  dishImageUrl: string;
  videoUrl: string;
  streetViewUrl: string;
  realPhotoUrl: string;
  recipe: {
    dish_name: string;
    cuisine_type: string;
    prep_time: number;
    servings: number;
    ingredients: { name: string; amount: string }[];
    instructions: string[];
  } | null;
  place: {
    name: string;
    address: string;
    footnote: string;
    rating: number | null;
    lat: number | null;
    lng: number | null;
  } | null;
  ttsAudioUrl: string | null;
}

// "cinematic" = progressive reveal as stops arrive
type StreamStatus = "idle" | "loading" | "cinematic" | "complete" | "error";

function mapStop(s: Record<string, unknown>): StopData {
  const place = s.place as Record<string, unknown> | null;
  return {
    stopNumber: (s.stop_number as number) || 0,
    title: (s.title as string) || "",
    narrative: (s.narrative as string) || "",
    sceneImageUrl: (s.scene_image_url as string) || "",
    dishImageUrl: (s.dish_image_url as string) || "",
    videoUrl: (s.video_url as string) || "",
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

export function useJourneyStream() {
  const [stops, setStops] = useState<StopData[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStopCountRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startJourney = useCallback(async (prompt: string, userId?: string) => {
    setStops([]);
    setStatus("loading");
    setError(null);
    setJourneyId(null);
    setPosterUrl(null);
    prevStopCountRef.current = 0;

    try {
      const res = await fetch(`${API_URL}/api/journey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, userId }),
      });

      if (!res.ok) {
        setStatus("error");
        setError("Failed to start journey");
        return;
      }

      const { journeyId: jid } = await res.json();
      setJourneyId(jid);

      // Poll — switch to "cinematic" as soon as first stop arrives
      pollingRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API_URL}/api/journey/${jid}`);
          if (!pollRes.ok) return;

          const journey = await pollRes.json();
          const journeyStops = (journey.stops || []) as Record<string, unknown>[];

          // As soon as first stop arrives, switch to cinematic mode
          if (journeyStops.length > 0) {
            setStatus("cinematic");
            setStops(journeyStops.map(mapStop));
          }

          if (journey.status === "ready") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            setStops(journeyStops.map(mapStop));
            setPosterUrl((journey.poster_url as string) || null);
            setStatus("complete");
          } else if (journey.status === "error") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            setStatus("error");
            setError("The kitchen's closed. Try another destination.");
          }
        } catch {
          // Ignore poll failures
        }
      }, 3000);
    } catch {
      setStatus("error");
      setError("Connection lost. Please try again.");
    }
  }, []);

  return { stops, status, journeyId, error, posterUrl, startJourney };
}
