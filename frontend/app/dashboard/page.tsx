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
  lat: number | null;
  lng: number | null;
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

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const journeysWithCoords = journeys.filter((j) => j.lat && j.lng);

  // Maps Static API — warm tones that complement the site's palette
  // Land: warm charcoal (#1E1E1E), Water: deep teal (#0F2B3C), Labels: gold (#D4A843)
  // Roads: subtle warm (#2A2420), Borders: muted rust (#3D2E24)
  const mapStyles = [
    "style=feature:all%7Celement:geometry%7Ccolor:0x1E1E1E",
    "style=feature:water%7Ccolor:0x0F2B3C",
    "style=feature:water%7Celement:labels.text.fill%7Ccolor:0x6BA3BE",
    "style=feature:all%7Celement:labels.text.fill%7Ccolor:0xD4A843",
    "style=feature:all%7Celement:labels.text.stroke%7Ccolor:0x0A0A0A%7Cweight:3",
    "style=feature:road%7Celement:geometry%7Ccolor:0x2A2420",
    "style=feature:administrative.country%7Celement:geometry.stroke%7Ccolor:0x3D2E24",
    "style=feature:administrative.country%7Celement:labels.text.fill%7Ccolor:0x8B7355",
    "style=feature:poi%7Cvisibility:off",
    "style=feature:transit%7Cvisibility:off",
  ].join("&");

  let mapUrl: string | null = null;
  if (mapsKey && journeysWithCoords.length > 0) {
    const markers = journeysWithCoords
      .map((j, i) => `&markers=color:0xC4652A%7Clabel:${i + 1}%7C${j.lat},${j.lng}`)
      .join("");
    // Auto-fit to show all markers, or world view if spread globally
    mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=1200x350&maptype=roadmap&${mapStyles}&scale=2${markers}&key=${mapsKey}`;
  } else if (mapsKey && journeys.length > 0) {
    mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=1200x350&center=20,10&zoom=2&maptype=roadmap&${mapStyles}&scale=2&key=${mapsKey}`;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-5">
          <a href="/" className="shrink-0">
            <img
              src="/logo.png"
              alt="First Bite"
              className="h-10 w-auto"
            />
          </a>
          <div>
            <h1 className="font-serif text-2xl font-bold leading-tight">My Journeys</h1>
            <p className="font-sans text-xs text-[#E8E0D0]/40">
              Every place tells a story through its food.
            </p>
          </div>
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

      {/* World map with journey pins */}
      {mapUrl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-8 rounded-2xl overflow-hidden border border-[#E8E0D0]/[0.06]"
        >
          <img
            src={mapUrl}
            alt="Your food journeys around the world"
            className="w-full h-auto"
            loading="lazy"
          />
          <div className="bg-white/[0.02] px-4 py-2 flex items-center justify-between">
            <span className="font-sans text-[11px] text-[#E8E0D0]/30">
              {journeysWithCoords.length > 0
                ? `${journeysWithCoords.length} destination${journeysWithCoords.length !== 1 ? "s" : ""} explored`
                : `${journeys.length} journey${journeys.length !== 1 ? "s" : ""} — map pins appear on new journeys`}
            </span>
            <span className="font-sans text-[10px] text-[#C4652A]/50">
              Your food map
            </span>
          </div>
        </motion.div>
      )}

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
