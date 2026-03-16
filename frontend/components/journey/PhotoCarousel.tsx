"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PhotoCarouselProps {
  streetViewUrl: string;
  realPhotoUrl: string;
  dishImageUrl: string;
  placeName?: string;
}

interface CarouselImage {
  url: string;
  label: string;
}

export function PhotoCarousel({
  streetViewUrl,
  realPhotoUrl,
  dishImageUrl,
  placeName,
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build list of available images
  const images: CarouselImage[] = [];
  if (realPhotoUrl) images.push({ url: realPhotoUrl, label: placeName || "Real photo" });
  if (streetViewUrl) images.push({ url: streetViewUrl, label: "Street View" });
  if (dishImageUrl) images.push({ url: dishImageUrl, label: "The dish" });

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [images.length]);

  if (images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mb-5"
    >
      {/* Image container */}
      <div className="relative w-full h-40 md:h-52 rounded-xl overflow-hidden border border-white/[0.08]">
        <AnimatePresence mode="wait">
          <motion.img
            key={current.url}
            src={current.url}
            alt={current.label}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Label overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
          <span className="font-sans text-[11px] text-white/70">
            {current.label}
          </span>
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentIndex
                    ? "bg-white w-4"
                    : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
