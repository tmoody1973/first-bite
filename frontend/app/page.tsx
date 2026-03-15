"use client";

import { Hero } from "@/components/landing/Hero";
import { SuggestionPills } from "@/components/landing/SuggestionPills";
import { StoryFlow } from "@/components/journey/StoryFlow";
import { LoadingQuips } from "@/components/ui/LoadingQuips";
import { useJourneyStream } from "@/hooks/useJourneyStream";

export default function Home() {
  const { stops, status, stopsGenerated, journeyId, error, startJourney } =
    useJourneyStream();

  // Show loading screen until ALL stops are ready (like Sonic Sommelier)
  if (status === "loading") {
    return <LoadingQuips stopsGenerated={stopsGenerated} />;
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

  // Only show the experience when EVERYTHING is complete
  if (status === "complete" && stops.length > 0) {
    return <StoryFlow stops={stops} journeyId={journeyId} />;
  }

  return (
    <main>
      <Hero onSubmit={startJourney} isLoading={false} />
      <SuggestionPills onSelect={startJourney} disabled={false} />
    </main>
  );
}
