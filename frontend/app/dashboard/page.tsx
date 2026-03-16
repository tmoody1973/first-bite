"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/constants";

interface JourneySummary {
  id: string;
  prompt: string;
  status: string;
  created_at: string;
  poster_url: string;
  stop_count: number;
}

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [journeys, setJourneys] = useState<JourneySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/journeys/${user.id}`)
      .then((res) => res.json())
      .then(setJourneys)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-12">
        <div>
          <h1 className="font-serif text-3xl font-bold">My Journeys</h1>
          <p className="font-sans text-sm text-[#E8E0D0]/40 mt-1">
            Every place tells a story through its food.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="font-sans text-xs px-4 py-2 rounded-full bg-[#C4652A] text-white hover:bg-[#C4652A]/80 transition-colors"
          >
            New Journey
          </button>
          <UserButton
            appearance={{ elements: { avatarBox: "w-8 h-8" } }}
          />
        </div>
      </div>

      {/* Journey grid */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <p className="font-serif italic text-[#E8E0D0]/30">
              Loading your journeys...
            </p>
          </div>
        ) : journeys.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif italic text-[#E8E0D0]/30 mb-4">
              No journeys yet. Every adventure starts with a first bite.
            </p>
            <button
              onClick={() => router.push("/")}
              className="font-sans text-sm px-6 py-3 rounded-full border border-[#C4652A]/30 text-[#C4652A] hover:bg-[#C4652A]/10 transition-colors"
            >
              Start Your First Journey
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {journeys.map((journey, i) => (
              <motion.div
                key={journey.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => router.push(`/journey/${journey.id}`)}
                className="group cursor-pointer rounded-2xl overflow-hidden border border-[#E8E0D0]/[0.06] bg-white/[0.02] hover:border-[#C4652A]/20 transition-colors"
              >
                {/* Poster image or placeholder */}
                <div className="h-48 relative overflow-hidden">
                  {journey.poster_url ? (
                    <img
                      src={journey.poster_url}
                      alt={journey.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#C4652A]/20 to-[#6B7F5E]/20 flex items-center justify-center">
                      <span className="font-serif text-4xl text-[#E8E0D0]/10">
                        FB
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                </div>

                {/* Card content */}
                <div className="p-4">
                  <h3 className="font-serif text-lg font-bold leading-tight mb-1 group-hover:text-[#C4652A] transition-colors">
                    {journey.prompt}
                  </h3>
                  <p className="font-sans text-[11px] text-[#E8E0D0]/30">
                    {journey.stop_count} stops &middot;{" "}
                    {new Date(journey.created_at).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
