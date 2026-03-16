"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { API_URL } from "@/lib/constants";

export interface StopData {
  stopNumber: number;
  title: string;
  narrative: string;
  sceneImageUrl: string;
  dishImageUrl: string;
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
  } | null;
  ttsAudioUrl: string | null;
}

type StreamStatus = "idle" | "loading" | "complete" | "error";

function mapStop(s: Record<string, unknown>): StopData {
  return {
    stopNumber: (s.stop_number as number) || 0,
    title: (s.title as string) || "",
    narrative: (s.narrative as string) || "",
    sceneImageUrl: (s.scene_image_url as string) || "",
    dishImageUrl: (s.dish_image_url as string) || "",
    recipe: s.recipe as StopData["recipe"],
    place: s.place as StopData["place"],
    ttsAudioUrl: (s.tts_audio_url as string) || null,
  };
}

export function useJourneyStream() {
  const [stops, setStops] = useState<StopData[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [stopsGenerated, setStopsGenerated] = useState(0);
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
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
    setStopsGenerated(0);

    try {
      // Create the journey — backend generates in background
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

      // Poll until ALL stops are ready (like Sonic Sommelier waiting for full pipeline)
      pollingRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API_URL}/api/journey/${jid}`);
          if (!pollRes.ok) return;

          const journey = await pollRes.json();
          const journeyStops = (journey.stops || []) as Record<string, unknown>[];

          // Update progress counter (for loading screen)
          setStopsGenerated(journeyStops.length);

          // Only reveal when EVERYTHING is done
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
          // Ignore individual poll failures
        }
      }, 3000);
    } catch {
      setStatus("error");
      setError("Connection lost. Please try again.");
    }
  }, []);

  return { stops, status, stopsGenerated, journeyId, error, posterUrl, startJourney };
}
