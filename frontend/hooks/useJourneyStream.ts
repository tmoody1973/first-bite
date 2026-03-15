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

type StreamStatus = "idle" | "loading" | "streaming" | "complete" | "error";

const STATUS_MESSAGES = [
  "Finding the places the guidebooks forgot...",
  "Walking the streets, following the smoke...",
  "Sketching the scene...",
  "Plating the dish...",
  "Writing the recipe...",
  "Assembling your journey...",
];

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
  const [statusMessage, setStatusMessage] = useState("");
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageIndexRef = useRef(0);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startJourney = useCallback(async (prompt: string) => {
    setStops([]);
    setStatus("loading");
    setError(null);
    setJourneyId(null);
    messageIndexRef.current = 0;
    setStatusMessage(STATUS_MESSAGES[0]);

    try {
      // Step 1: Create the journey (backend generates in background)
      const res = await fetch(`${API_URL}/api/journey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        setStatus("error");
        setError("Failed to start journey");
        return;
      }

      const { journeyId: jid } = await res.json();
      setJourneyId(jid);

      // Step 2: Poll for progress (like Convex subscriptions but simpler)
      pollingRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API_URL}/api/journey/${jid}`);
          if (!pollRes.ok) return;

          const journey = await pollRes.json();
          const journeyStops = (journey.stops || []) as Record<string, unknown>[];

          if (journeyStops.length > 0) {
            setStatus("streaming");
            setStops(journeyStops.map(mapStop));
          }

          // Cycle through status messages
          messageIndexRef.current =
            (messageIndexRef.current + 1) % STATUS_MESSAGES.length;
          setStatusMessage(STATUS_MESSAGES[messageIndexRef.current]);

          // Check if complete
          if (journey.status === "ready") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            setStops(journeyStops.map(mapStop));
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
      }, 3000); // Poll every 3 seconds
    } catch {
      setStatus("error");
      setError("Connection lost. Please try again.");
    }
  }, []);

  return { stops, status, statusMessage, journeyId, error, startJourney };
}
