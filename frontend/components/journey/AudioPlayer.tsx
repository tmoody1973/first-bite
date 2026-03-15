"use client";

import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  stopNumber: number;
  narrative: string;
  journeyId: string | null;
  ttsAudioUrl: string | null;
  autoPlay?: boolean;
}

export function AudioPlayer({
  stopNumber,
  narrative,
  journeyId,
  ttsAudioUrl,
  autoPlay = true,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAutoPlayed = useRef(false);

  // Auto-play when TTS URL arrives (like Sonic Sommelier's ElevenLabs narration)
  useEffect(() => {
    if (ttsAudioUrl && autoPlay && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      // Small delay to let the UI settle
      const timer = setTimeout(() => {
        audioRef.current?.play().catch(() => {
          // Browser may block autoplay — that's ok, user can tap
        });
        setIsPlaying(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ttsAudioUrl, autoPlay]);

  const handleToggle = () => {
    if (!ttsAudioUrl) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  if (!ttsAudioUrl) {
    return null; // Don't show button until narration is ready
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 text-xs font-sans px-4 py-2 rounded-full border border-[#E8E0D0]/10 text-[#E8E0D0]/50 hover:border-[#C4652A]/30 hover:text-[#C4652A] transition-colors"
      >
        {isPlaying ? "Pause" : "Listen"}
      </button>
      <audio
        ref={audioRef}
        src={ttsAudioUrl}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}
