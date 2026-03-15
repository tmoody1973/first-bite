"use client";

import { useState, useRef } from "react";
import { generateTTS } from "@/lib/api";

interface AudioPlayerProps {
  stopNumber: number;
  narrative: string;
  journeyId: string | null;
  ttsAudioUrl: string | null;
}

export function AudioPlayer({
  stopNumber,
  narrative,
  journeyId,
  ttsAudioUrl,
}: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState(ttsAudioUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = async () => {
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    if (!journeyId) return;
    setIsLoading(true);

    try {
      const url = await generateTTS(journeyId, stopNumber, narrative);
      setAudioUrl(url);
      setTimeout(() => {
        audioRef.current?.play();
        setIsPlaying(true);
      }, 100);
    } catch {
      // Silent fail — narration is enhancement, not core
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePlay}
        disabled={isLoading}
        className="flex items-center gap-2 text-xs font-sans px-4 py-2 rounded-full border border-[#E8E0D0]/10 text-[#E8E0D0]/50 hover:border-[#C4652A]/30 hover:text-[#C4652A] transition-colors disabled:opacity-30"
      >
        {isLoading ? "Generating..." : isPlaying ? "Pause" : "Listen"}
      </button>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}
