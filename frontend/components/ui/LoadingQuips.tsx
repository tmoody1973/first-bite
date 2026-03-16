"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingQuipsProps {
  stopsGenerated: number;
}

const PIPELINE_STEPS = [
  { label: "The Arrival — first impression, chaos, the smell", theme: "Stop 1" },
  { label: "The Street — the stall nobody talks about", theme: "Stop 2" },
  { label: "The Kitchen — behind the counter, the technique", theme: "Stop 3" },
  { label: "The Table — strangers sharing food and stories", theme: "Stop 4" },
  { label: "The Last Bite — what this place taught you", theme: "Stop 5" },
];

// Ambient images that float during loading
const FLOATING_IMAGES = [
  "/images/selena-jimenez-rltaNQ1m7XI-unsplash.jpg",
  "/images/tunde-buremo-cnVn4Gg4b00-unsplash.jpg",
  "/images/ben-iwara-KFO2m5Ms1Pc-unsplash.jpg",
  "/images/george-dagerotip-GJU-Oqe8OAc-unsplash.jpg",
  "/images/wkndr-V9YD8obUvUc-unsplash.jpg",
  "/images/anbinh-pho-nrG5JaMvBEo-unsplash.jpg",
  "/images/ato-aikins-xzM6dK7nxME-unsplash.jpg",
  "/images/colin-meg-KHl8mAMpt6Y-unsplash.jpg",
  "/images/fenghua-KTYXROb0NJ4-unsplash.jpg",
  "/images/jon-spectacle-ho24w5XM0sw-unsplash.jpg",
  "/images/le-thanh-huyen-zkQyNGTXBzI-unsplash.jpg",
  "/images/mche-lee-Y4CUNo-HJco-unsplash(1).jpg",
  "/images/monika-borys-reHjqJ-5dPM-unsplash.jpg",
  "/images/seyiram-kweku-I9YlJppV_TQ-unsplash.jpg",
];

// Positions — spread across edges so they don't cover the center content
const POSITIONS = [
  { top: "3%", left: "3%", rotate: -8 },
  { top: "5%", right: "4%", rotate: 6 },
  { bottom: "8%", left: "4%", rotate: -5 },
  { bottom: "5%", right: "3%", rotate: 10 },
  { top: "35%", left: "1%", rotate: -12 },
  { top: "30%", right: "1%", rotate: 7 },
  { bottom: "30%", left: "2%", rotate: 4 },
  { bottom: "35%", right: "2%", rotate: -9 },
];

export function LoadingQuips({ stopsGenerated }: LoadingQuipsProps) {
  const [visibleImages, setVisibleImages] = useState<number[]>([]);

  // Cycle through floating images — show 3 at a time, swap every 2.5 seconds
  useEffect(() => {
    let imageIndex = 0;
    const showNext = () => {
      const indices = [
        imageIndex % FLOATING_IMAGES.length,
        (imageIndex + 3) % FLOATING_IMAGES.length,
        (imageIndex + 7) % FLOATING_IMAGES.length,
      ];
      setVisibleImages(indices);
      imageIndex++;
    };

    showNext();
    const interval = setInterval(showNext, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center px-6 overflow-hidden">

      {/* Visible photo collage spread around the pipeline steps */}
      <AnimatePresence mode="popLayout">
        {visibleImages.map((imgIdx, i) => {
          const pos = POSITIONS[(imgIdx + i * 3) % POSITIONS.length];
          return (
            <motion.div
              key={`float-${imgIdx}-${i}-${Math.floor(Date.now() / 2500)}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.85, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute pointer-events-none"
              style={{
                top: pos.top,
                left: pos.left,
                right: pos.right,
                bottom: pos.bottom,
                width: "clamp(90px, 14vw, 180px)",
                height: "clamp(90px, 14vw, 180px)",
                transform: `rotate(${pos.rotate}deg)`,
              }}
            >
              <img
                src={FLOATING_IMAGES[imgIdx]}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover rounded-lg shadow-lg"
                style={{ filter: "brightness(0.75) saturate(0.85)" }}
              />
              <div
                className="absolute inset-0 rounded-lg"
                style={{ border: "2px solid rgba(232,224,217,0.15)" }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Content — centered on top of floating images */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.img
          src="/logo.png"
          alt="First Bite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-12 w-auto mb-3"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-serif italic text-sm text-[#E8E0D0]/30 mb-10"
        >
          Building your journey...
        </motion.p>

        {/* Pipeline steps */}
        <div className="w-full max-w-sm space-y-3">
          {PIPELINE_STEPS.map((step, i) => {
            const isComplete = i < stopsGenerated;
            const isActive = i === stopsGenerated;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-medium transition-all duration-500 ${
                    isComplete
                      ? "bg-[#C4652A] text-white"
                      : isActive
                        ? "bg-[#C4652A]/20 text-[#C4652A] ring-2 ring-[#C4652A]/40"
                        : "bg-white/5 text-[#E8E0D0]/20"
                  }`}
                >
                  {isComplete ? "\u2713" : `0${i + 1}`}
                </div>

                <div className="flex-1">
                  <p
                    className={`font-sans text-xs font-medium transition-all duration-500 ${
                      isComplete
                        ? "text-[#E8E0D0]/40"
                        : isActive
                          ? "text-[#C4652A]"
                          : "text-[#E8E0D0]/15"
                    }`}
                  >
                    {step.theme}
                  </p>
                  <p
                    className={`font-serif italic text-xs transition-all duration-500 ${
                      isComplete
                        ? "text-[#E8E0D0]/25"
                        : isActive
                          ? "text-[#E8E0D0]/60"
                          : "text-[#E8E0D0]/10"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>

                {isActive && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border border-[#C4652A]/30 border-t-[#C4652A] rounded-full"
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={stopsGenerated}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="font-serif italic text-xs text-[#E8E0D0]/30 mt-10 text-center"
          >
            {stopsGenerated === 0
              ? "Following the smoke to something worth eating..."
              : stopsGenerated < 5
                ? `${stopsGenerated} of 5 stops ready...`
                : "Composing your travel poster..."}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
