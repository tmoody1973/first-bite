"use client";

import { Hero } from "@/components/landing/Hero";
import { SuggestionPills } from "@/components/landing/SuggestionPills";
import { StoryFlow } from "@/components/journey/StoryFlow";
import { LoadingQuips } from "@/components/ui/LoadingQuips";
import { useJourneyStream } from "@/hooks/useJourneyStream";

export default function Home() {
  const { stops, status, statusMessage, journeyId, error, startJourney } =
    useJourneyStream();

  const isLoading = status === "loading";
  const isStreaming = status === "streaming" || status === "complete";

  if (isLoading) {
    return (
      <LoadingQuips message={statusMessage || "Starting your journey..."} />
    );
  }

  if (error) {
    return (
      <main>
        <Hero onSubmit={startJourney} isLoading={false} />
        <p className="text-center text-[#C4652A] font-sans text-sm mt-4">
          {error}
        </p>
        <SuggestionPills onSelect={startJourney} disabled={false} />
      </main>
    );
  }

  if (isStreaming) {
    return <StoryFlow stops={stops} journeyId={journeyId} />;
  }

  return (
    <main>
      <Hero onSubmit={startJourney} isLoading={false} />
      <SuggestionPills onSelect={startJourney} disabled={false} />
    </main>
  );
}
