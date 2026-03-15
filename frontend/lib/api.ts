import { API_URL } from "./constants";

export async function fetchJourney(journeyId: string) {
  const res = await fetch(`${API_URL}/api/journey/${journeyId}`);
  if (!res.ok) throw new Error("Failed to fetch journey");
  return res.json();
}

export async function generateTTS(
  journeyId: string,
  stopNumber: number,
  text: string
): Promise<string> {
  const res = await fetch(`${API_URL}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      journey_id: journeyId,
      stop_number: stopNumber,
      text,
    }),
  });
  if (!res.ok) throw new Error("TTS generation failed");
  const data = await res.json();
  return data.audio_url;
}
