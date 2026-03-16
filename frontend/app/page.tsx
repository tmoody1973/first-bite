"use client";

import { useUser } from "@clerk/nextjs";
import { PosterLanding } from "@/components/landing/PosterLanding";
import { StoryFlow } from "@/components/journey/StoryFlow";
import { LoadingQuips } from "@/components/ui/LoadingQuips";
import { useJourneyStream } from "@/hooks/useJourneyStream";

export default function Home() {
  const { user } = useUser();
  const { stops, status, stopsGenerated, journeyId, error, posterUrl, videoUrl, startJourney } =
    useJourneyStream();

  const handleSubmit = (prompt: string) => {
    startJourney(prompt, user?.id);
  };

  // Loading screen with progress
  if (status === "loading") {
    return <LoadingQuips stopsGenerated={stopsGenerated} />;
  }

  // Cinematic mode or complete — show the journey
  if (status === "cinematic" || status === "complete") {
    return (
      <StoryFlow
        stops={stops}
        journeyId={journeyId}
        posterUrl={posterUrl}
        videoUrl={videoUrl}
        isGenerating={status === "cinematic"}
        status={status}
      />
    );
  }

  // Landing page — vintage poster design
  return (
    <>
      <PosterLanding onSubmit={handleSubmit} isLoading={false} />
      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg" style={{ background: "#C8432B", color: "#F5ECD7" }}>
          {error}
        </div>
      )}
    </>
  );
}
