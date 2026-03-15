"use client";

import { useState, useCallback, useRef } from "react";
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

export function useJourneyStream() {
  const [stops, setStops] = useState<StopData[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentStopRef = useRef<Partial<StopData>>({});

  const startJourney = useCallback(async (prompt: string) => {
    setStops([]);
    setStatus("loading");
    setError(null);
    setJourneyId(null);
    currentStopRef.current = {};

    try {
      const response = await fetch(`${API_URL}/api/journey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        setStatus("error");
        setError("Failed to start journey");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let currentEventType = "message";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              handleEvent(currentEventType, data);
            } catch {
              // Skip malformed JSON
            }
            currentEventType = "message";
          }
        }
      }
    } catch {
      setStatus("error");
      setError("Connection lost. Please try again.");
    }

    function handleEvent(
      eventType: string,
      data: Record<string, unknown>
    ) {
      switch (eventType) {
        case "status":
          setStatus("loading");
          setStatusMessage(data.message as string);
          break;

        case "stop-start":
          setStatus("streaming");
          currentStopRef.current = {
            stopNumber: data.stopNumber as number,
            title: data.title as string,
            narrative: "",
            sceneImageUrl: "",
            dishImageUrl: "",
            recipe: null,
            place: null,
            ttsAudioUrl: null,
          };
          break;

        case "text":
          currentStopRef.current.narrative =
            (currentStopRef.current.narrative || "") +
            (data.content as string);
          break;

        case "image":
          if (data.type === "scene") {
            currentStopRef.current.sceneImageUrl = data.url as string;
          } else {
            currentStopRef.current.dishImageUrl = data.url as string;
          }
          break;

        case "recipe":
          currentStopRef.current.recipe = data as StopData["recipe"];
          break;

        case "place":
          currentStopRef.current.place = data as StopData["place"];
          break;

        case "stop-end":
          setStops((prev) => [
            ...prev,
            currentStopRef.current as StopData,
          ]);
          currentStopRef.current = {};
          break;

        case "journey-complete":
          setStatus("complete");
          setJourneyId(data.journeyId as string);
          break;

        case "journey-error":
          setStatus("error");
          setError(data.message as string);
          break;
      }
    }
  }, []);

  return { stops, status, statusMessage, journeyId, error, startJourney };
}
