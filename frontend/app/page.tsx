"use client";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { Hero } from "@/components/landing/Hero";
import { SuggestionPills } from "@/components/landing/SuggestionPills";
import { StoryFlow } from "@/components/journey/StoryFlow";
import { LoadingQuips } from "@/components/ui/LoadingQuips";
import { useJourneyStream } from "@/hooks/useJourneyStream";

export default function Home() {
  const { user, isSignedIn } = useUser();
  const { stops, status, stopsGenerated, journeyId, error, posterUrl, startJourney } =
    useJourneyStream();

  const handleSubmit = (prompt: string) => {
    startJourney(prompt, user?.id);
  };

  // Show loading screen until ALL stops are ready
  if (status === "loading") {
    return <LoadingQuips stopsGenerated={stopsGenerated} />;
  }

  // Only show the experience when EVERYTHING is complete
  if (status === "complete" && stops.length > 0) {
    return <StoryFlow stops={stops} journeyId={journeyId} posterUrl={posterUrl} />;
  }

  return (
    <main>
      {/* Auth controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {isSignedIn ? (
          <>
            <a
              href="/dashboard"
              className="font-sans text-xs text-[#E8E0D0]/40 hover:text-[#C4652A] transition-colors"
            >
              My Journeys
            </a>
            <UserButton
              appearance={{
                elements: { avatarBox: "w-8 h-8" },
              }}
            />
          </>
        ) : (
          <SignInButton mode="modal">
            <button className="font-sans text-xs px-4 py-2 rounded-full border border-[#E8E0D0]/10 text-[#E8E0D0]/50 hover:border-[#C4652A]/30 hover:text-[#C4652A] transition-colors">
              Sign In
            </button>
          </SignInButton>
        )}
      </div>

      <Hero onSubmit={handleSubmit} isLoading={false} />
      {error && (
        <p className="text-center text-[#C4652A] font-sans text-sm mt-4">
          {error}
        </p>
      )}
      <SuggestionPills onSelect={handleSubmit} disabled={false} />
    </main>
  );
}
