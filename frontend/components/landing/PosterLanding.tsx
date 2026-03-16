"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { SUGGESTIONS } from "@/lib/constants";

interface PosterLandingProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const GALLERY_IMAGES = [
  { src: "/images/tunde-buremo-cnVn4Gg4b00-unsplash.jpg", alt: "A vendor arranges fresh tomatoes and peppers at an open-air market in Lagos, Nigeria", caption: "Lagos" },
  { src: "/images/ben-iwara-KFO2m5Ms1Pc-unsplash.jpg", alt: "A woman selects grilled plantains at a roadside food stand in Cameroon", caption: "Cameroun" },
  { src: "/images/george-dagerotip-GJU-Oqe8OAc-unsplash.jpg", alt: "Fried snacks and dipping sauces served from a street food cart in Southeast Asia", caption: "Bangkok" },
  { src: "/images/wkndr-V9YD8obUvUc-unsplash.jpg", alt: "Patrons crowd a glowing ramen yatai stall on a nighttime street in Fukuoka, Japan", caption: "Fukuoka" },
];

const STOPS = [
  { num: "I", title: "The Arrival", desc: "First impression, chaos, the smell" },
  { num: "II", title: "The Street", desc: "The stall nobody talks about" },
  { num: "III", title: "The Kitchen", desc: "Behind the counter, the technique" },
  { num: "IV", title: "The Table", desc: "Strangers sharing food and stories" },
  { num: "V", title: "The Last Bite", desc: "What this place taught you" },
];

const FEATURES = [
  "AI-generated scene photography",
  "Home-cookable recipe cards",
  "AI-generated dish photography",
  "Narrated storytelling",
  "Real restaurant data via Google Places",
  "Ambient soundscapes",
  "Street View imagery",
  "Map integration",
];

export function PosterLanding({ onSubmit, isLoading }: PosterLandingProps) {
  const [input, setInput] = useState("");
  const { isSignedIn } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) onSubmit(input.trim());
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{
        background: "#F5ECD7",
        color: "#1B2A4A",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}
    >
      {/* Auth bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2" style={{ background: "rgba(245,236,215,0.9)", backdropFilter: "blur(8px)" }}>
        <a href="/dashboard" className="text-xs tracking-[0.15em] uppercase opacity-40 hover:opacity-80 transition-opacity" style={{ fontFamily: "'Josefin Sans', sans-serif", color: "#1B2A4A" }}>
          My Journeys
        </a>
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          ) : (
            <SignInButton mode="modal">
              <button
                className="text-xs tracking-[0.15em] uppercase px-4 py-1.5 border transition-colors"
                style={{ fontFamily: "'Josefin Sans', sans-serif", borderColor: "#1B2A4A", color: "#1B2A4A" }}
              >
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>

      {/* Poster container */}
      <main className="w-full max-w-[780px] mx-auto px-4 py-8 mt-10 md:px-8">
        <div className="relative border-[3px] p-6 md:p-10" style={{ borderColor: "#1B2A4A" }}>
          {/* Inner gold border */}
          <div className="absolute inset-2 border pointer-events-none" style={{ borderColor: "#D4A843" }} />

          {/* Top decorative bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: "rgba(27,42,74,0.3)" }} />
            <div className="w-2 h-2 rotate-45" style={{ background: "#D4A843" }} />
            <div className="flex-1 h-px" style={{ background: "rgba(27,42,74,0.3)" }} />
          </div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center mb-1">
            <span className="block text-[clamp(3rem,10vw,5.5rem)] font-black tracking-[0.18em] uppercase leading-[0.9]" style={{ fontFamily: "'Playfair Display', serif" }}>
              First
            </span>
            <span className="block text-[clamp(3.5rem,12vw,6.5rem)] font-black tracking-[0.18em] uppercase leading-[0.9]" style={{ fontFamily: "'Playfair Display', serif", color: "#C8432B" }}>
              Bite
            </span>
          </motion.div>

          {/* Tagline */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-[clamp(1rem,2.5vw,1.3rem)] italic mb-2" style={{ color: "#A0522D", letterSpacing: "0.05em" }}>
            The real story starts where the guidebook ends.
          </motion.p>

          {/* Sunburst */}
          <div className="text-center my-6 text-lg tracking-[0.5em] opacity-60" style={{ color: "#D4A843" }}>&#x2737;</div>

          {/* Hero photo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="max-w-[600px] mx-auto mb-1">
            <div className="border-[3px] p-1.5 relative" style={{ borderColor: "#1B2A4A" }}>
              <div className="absolute inset-0 border pointer-events-none z-10" style={{ borderColor: "#D4A843" }} />
              <img
                src="/images/selena-jimenez-rltaNQ1m7XI-unsplash.jpg"
                alt="Crowds gather at a vibrant red-and-white street food stall in Sao Paulo, Brazil"
                className="w-full h-[250px] md:h-[350px] object-cover"
                style={{ objectPosition: "center 30%", filter: "sepia(15%) saturate(0.85) contrast(1.1) brightness(0.95)", mixBlendMode: "multiply" }}
              />
            </div>
            <p className="text-center mt-3 text-xs italic tracking-[0.3em] uppercase" style={{ fontFamily: "'Josefin Sans', sans-serif", color: "#A0522D", fontSize: "0.65rem" }}>
              Sao Paulo, Brasil
            </p>
          </motion.div>

          {/* Subheadline */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center max-w-[520px] mx-auto my-6 leading-[1.7]" style={{ fontSize: "1.05rem", color: "#2C2C2C" }}>
            Name a place and we'll take you on a 5-stop food journey &mdash;
            AI-generated photography, real restaurant recommendations,
            home-cookable recipes, narrated storytelling, ambient soundscapes,
            and a vintage travel poster. All from one prompt.
          </motion.p>

          {/* Prompt input */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="max-w-[520px] mx-auto my-8">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row border-2 overflow-hidden" style={{ borderColor: "#1B2A4A", background: "#F5ECD7" }}>
              <label htmlFor="poster-prompt" className="sr-only">Enter a destination</label>
              <input
                id="poster-prompt"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Name a place. I'll find the food."
                disabled={isLoading}
                className="flex-1 border-none bg-transparent px-5 py-3.5 text-lg italic outline-none disabled:opacity-50"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1B2A4A" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase border-t-2 md:border-t-0 md:border-l-2 border-dashed transition-colors disabled:opacity-30 whitespace-nowrap"
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  borderColor: "#1B2A4A",
                  background: "#D4A843",
                  color: "#1B2A4A",
                  fontSize: "0.7rem",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1B2A4A"; e.currentTarget.style.color = "#D4A843"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#D4A843"; e.currentTarget.style.color = "#1B2A4A"; }}
              >
                {isLoading ? "Finding..." : "Bon Voyage \u2192"}
              </button>
            </form>

            {/* Pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); onSubmit(s); }}
                  disabled={isLoading}
                  className="px-3 py-1 border text-[0.55rem] tracking-[0.15em] uppercase transition-colors disabled:opacity-30"
                  style={{ fontFamily: "'Josefin Sans', sans-serif", borderColor: "#1B2A4A", background: "#F5ECD7", color: "#1B2A4A" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#D4A843"; e.currentTarget.style.borderColor = "#D4A843"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#F5ECD7"; e.currentTarget.style.borderColor = "#1B2A4A"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(27,42,74,0.3)" }} />
            <div className="w-2 h-2 rotate-45" style={{ background: "#D4A843" }} />
            <div className="flex-1 h-px" style={{ background: "rgba(27,42,74,0.3)" }} />
          </div>

          {/* Journey itinerary */}
          <p className="text-center text-xs font-semibold tracking-[0.25em] uppercase mb-6" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            What happens when you hit go
          </p>

          <div className="max-w-[480px] mx-auto mb-6">
            {STOPS.map((stop) => (
              <div key={stop.num} className="flex gap-5 mb-4 items-baseline">
                <span className="text-right w-10 shrink-0 font-black text-xl" style={{ fontFamily: "'Playfair Display', serif", color: "#C8432B" }}>
                  {stop.num}
                </span>
                <div>
                  <div className="text-[0.7rem] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
                    {stop.title}
                  </div>
                  <div className="italic text-[0.95rem] opacity-80" style={{ color: "#2C2C2C" }}>
                    {stop.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sunburst */}
          <div className="text-center my-6 text-lg tracking-[0.5em] opacity-60" style={{ color: "#D4A843" }}>&#x2737;</div>

          {/* Gallery */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
            {GALLERY_IMAGES.map((img) => (
              <div key={img.caption} className="border-2 overflow-hidden group" style={{ borderColor: "#1B2A4A" }}>
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full aspect-square object-cover transition-all duration-400 group-hover:scale-[1.03]"
                  style={{ filter: "sepia(15%) saturate(0.85) contrast(1.1) brightness(0.95)", mixBlendMode: "multiply" }}
                  onMouseEnter={(e) => { (e.target as HTMLImageElement).style.filter = "sepia(0%) saturate(1) contrast(1.05) brightness(1)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLImageElement).style.filter = "sepia(15%) saturate(0.85) contrast(1.1) brightness(0.95)"; }}
                />
                <div className="text-center py-1.5 text-[0.5rem] tracking-[0.3em] uppercase" style={{ fontFamily: "'Josefin Sans', sans-serif", color: "#A0522D", background: "#F5ECD7" }}>
                  {img.caption}
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <p className="text-center text-xs font-semibold tracking-[0.25em] uppercase mb-4" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            Each stop includes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 max-w-[520px] mx-auto mb-6">
            {FEATURES.map((f) => (
              <div key={f} className="text-[0.9rem] pl-5 relative" style={{ color: "#2C2C2C" }}>
                <span className="absolute left-0 top-[0.35rem] text-[0.6rem]" style={{ color: "#D4A843" }}>&#x25C6;</span>
                {f}
              </div>
            ))}
          </div>

          {/* Finale */}
          <div className="border my-6 p-5 md:p-6 text-center italic leading-[1.7]" style={{ borderColor: "#D4A843", background: "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.15))", color: "#2C2C2C" }}>
            At the end of your journey: a vintage travel poster featuring all five dishes,
            a cinematic summary video, and a shareable link to relive it all.
          </div>

          {/* Powered by */}
          <p className="text-center text-[0.5rem] tracking-[0.2em] uppercase opacity-50 my-4" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            Gemini 3.1 &middot; Veo &middot; Google Places &middot; ElevenLabs &middot; Google Cloud
          </p>

          {/* Credits */}
          <div className="text-center pt-4 mt-4" style={{ borderTop: "1px solid rgba(27,42,74,0.2)" }}>
            <p className="text-[0.5rem] tracking-[0.2em] uppercase opacity-40 mb-1" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
              MMXXVI &middot; Gemini Live Agent Challenge
            </p>
            <p className="text-[0.5rem] tracking-[0.2em] uppercase opacity-40 mb-1" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
              Built by Tarik Moody
            </p>
            <p className="text-[0.4rem] tracking-[0.15em] uppercase opacity-30" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
              Photos: Unsplash &mdash; S. Jimenez, T. Buremo, B. Iwara, G. Dagerotip, Wkndr
            </p>
          </div>

        </div>
      </main>

      <p className="text-center italic text-[0.75rem] opacity-40 pb-8" style={{ color: "#2C2C2C" }}>
        All places and restaurants are AI-suggested. Verify details before visiting.
      </p>
    </div>
  );
}
