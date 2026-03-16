"use client";

import { useState } from "react";
import type { StopData } from "@/hooks/useJourneyStream";

interface PlaceCardProps {
  place: NonNullable<StopData["place"]>;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const [showMap, setShowMap] = useState(false);

  const mapsQuery = place.lat && place.lng
    ? `${place.lat},${place.lng}`
    : encodeURIComponent(place.address);

  const mapsEmbedUrl = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${mapsQuery}&maptype=roadmap`
    : null;

  return (
    <>
      <div className="flex items-center gap-3 py-3">
        <div className="text-[#C4652A] text-lg">&#x1F4CD;</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-sans text-sm font-medium">{place.name}</p>
            {place.rating && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#C4652A]/15 text-[#C4652A]">
                {place.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="font-sans text-xs text-[#E8E0D0]/40">
            {place.address}
          </p>
          <p className="font-serif italic text-xs text-[#E8E0D0]/30 mt-1">
            {place.footnote}
          </p>
        </div>
        <button
          onClick={() => setShowMap(true)}
          className="text-xs font-sans px-3 py-1.5 rounded-full border border-[#E8E0D0]/10 text-[#E8E0D0]/50 hover:border-[#C4652A]/30 hover:text-[#C4652A] transition-colors"
        >
          View on Map
        </button>
      </div>

      {showMap && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowMap(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#0A0A0A] rounded-2xl overflow-hidden border border-[#E8E0D0]/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#E8E0D0]/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-sans text-sm font-medium">
                    {place.name}
                  </h3>
                  {place.rating && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#C4652A]/15 text-[#C4652A]">
                      {place.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-[#E8E0D0]/40">
                  {place.address}
                </p>
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="text-[#E8E0D0]/40 hover:text-[#E8E0D0] transition-colors text-xl"
              >
                &times;
              </button>
            </div>
            {mapsEmbedUrl ? (
              <iframe
                src={mapsEmbedUrl}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center">
                <a
                  href={`https://maps.google.com/?q=${mapsQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C4652A] hover:underline font-sans text-sm"
                >
                  Open in Google Maps &rarr;
                </a>
              </div>
            )}
            <p className="p-3 font-sans text-[10px] text-[#E8E0D0]/20 text-center">
              Place is AI-suggested and verified via Google Search grounding.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
