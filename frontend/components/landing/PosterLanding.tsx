"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { SUGGESTIONS } from "@/lib/constants";

interface PosterLandingProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

/* Dark mode poster palette */
const C = {
  bg:      "#0A0A0A",
  surface: "#141414",
  border:  "#E8E0D0",       /* cream border on dark */
  gold:    "#D4A843",
  cream:   "#E8E0D0",
  rust:    "#C4652A",
  vermillion: "#C8432B",
  muted:   "rgba(232,224,217,0.5)",
  dim:     "rgba(232,224,217,0.25)",
  faint:   "rgba(232,224,217,0.12)",
};

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
    <div className="min-h-screen flex flex-col items-center relative" style={{ color: C.cream, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>

      {/* Full-screen vintage map background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/images/the-new-york-public-library-axMEtF64OU4-unsplash.jpg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.45) saturate(0.7)" }}
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.75) 85%)" }} />
      </div>

      {/* Auth bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2" style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.faint}` }}>
        <a href="/dashboard" className="text-xs tracking-[0.15em] uppercase hover:opacity-100 transition-opacity" style={{ fontFamily: "'Josefin Sans', sans-serif", color: C.muted }}>
          My Journeys
        </a>
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-xs tracking-[0.15em] uppercase px-4 py-1.5 border transition-colors" style={{ fontFamily: "'Josefin Sans', sans-serif", borderColor: C.dim, color: C.muted }}>
                  Sign In
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="text-xs tracking-[0.15em] uppercase px-4 py-1.5 transition-colors" style={{ fontFamily: "'Josefin Sans', sans-serif", background: C.rust, color: C.cream }}>
                  Get Started
                </button>
              </SignInButton>
            </>
          )}
        </div>
      </div>

      {/* Poster container — elevated above background */}
      <main className="relative z-10 w-full max-w-[780px] mx-auto px-4 py-8 mt-12 md:px-8">
        <div className="relative border-[2px] p-6 md:p-10" style={{ borderColor: C.dim, background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)" }}>
          {/* Inner gold border */}
          <div className="absolute inset-2 border pointer-events-none" style={{ borderColor: `${C.gold}44` }} />

          {/* Top decorative bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: C.faint }} />
            <div className="w-2 h-2 rotate-45" style={{ background: C.gold }} />
            <div className="flex-1 h-px" style={{ background: C.faint }} />
          </div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center mb-1">
            <span className="block text-[clamp(3rem,10vw,5.5rem)] font-black tracking-[0.18em] uppercase leading-[0.9]" style={{ fontFamily: "'Playfair Display', serif", color: C.cream }}>
              First
            </span>
            <span className="block text-[clamp(3.5rem,12vw,6.5rem)] font-black tracking-[0.18em] uppercase leading-[0.9]" style={{ fontFamily: "'Playfair Display', serif", color: C.rust }}>
              Bite
            </span>
          </motion.div>

          {/* Tagline */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-[clamp(1rem,2.5vw,1.3rem)] italic mb-2" style={{ color: C.gold, letterSpacing: "0.05em" }}>
            The real story starts where the guidebook ends.
          </motion.p>

          {/* Sunburst */}
          <div className="text-center my-6 text-lg tracking-[0.5em] opacity-50" style={{ color: C.gold }}>&#x2737;</div>

          {/* Hero photo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="max-w-[600px] mx-auto mb-1">
            <div className="border-[2px] p-1.5 relative" style={{ borderColor: C.dim }}>
              <div className="absolute inset-0 border pointer-events-none z-10" style={{ borderColor: `${C.gold}44` }} />
              <img
                src="/images/selena-jimenez-rltaNQ1m7XI-unsplash.jpg"
                alt="Crowds gather at a vibrant red-and-white street food stall in Sao Paulo, Brazil"
                className="w-full h-[250px] md:h-[350px] object-cover"
                style={{ objectPosition: "center 30%", filter: "brightness(0.9) contrast(1.1) saturate(0.9)" }}
              />
            </div>
            <p className="text-center mt-3 italic tracking-[0.3em] uppercase" style={{ fontFamily: "'Josefin Sans', sans-serif", color: C.gold, fontSize: "0.65rem" }}>
              Sao Paulo, Brasil
            </p>
          </motion.div>

          {/* Subheadline */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center max-w-[520px] mx-auto my-6 leading-[1.7]" style={{ fontSize: "1.05rem", color: C.muted }}>
            Name a place and we'll take you on a 5-stop food journey &mdash;
            AI-generated photography, real restaurant recommendations,
            home-cookable recipes, narrated storytelling, ambient soundscapes,
            and a vintage travel poster. All from one prompt.
          </motion.p>

          {/* Prompt input */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="max-w-[520px] mx-auto my-8">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row border-2 overflow-hidden" style={{ borderColor: C.dim, background: C.surface }}>
              <label htmlFor="poster-prompt" className="sr-only">Enter a destination</label>
              <input
                id="poster-prompt"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Name a place. I'll find the food."
                disabled={isLoading}
                className="flex-1 border-none bg-transparent px-5 py-3.5 text-lg italic outline-none disabled:opacity-50 placeholder:opacity-30"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: C.cream }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase border-t-2 md:border-t-0 md:border-l-2 border-dashed transition-all duration-300 disabled:opacity-30 whitespace-nowrap hover:brightness-110"
                style={{ fontFamily: "'Josefin Sans', sans-serif", borderColor: C.dim, background: C.rust, color: C.cream, fontSize: "0.7rem" }}
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
                  className="px-3 py-1.5 border text-[0.55rem] tracking-[0.15em] uppercase transition-all duration-200 disabled:opacity-30 hover:border-[#C4652A] hover:text-[#C4652A]"
                  style={{ fontFamily: "'Josefin Sans', sans-serif", borderColor: C.faint, color: C.muted }}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: C.faint }} />
            <div className="w-2 h-2 rotate-45" style={{ background: C.gold }} />
            <div className="flex-1 h-px" style={{ background: C.faint }} />
          </div>

          {/* Journey itinerary */}
          <p className="text-center text-xs font-semibold tracking-[0.25em] uppercase mb-6" style={{ fontFamily: "'Josefin Sans', sans-serif", color: C.muted }}>
            What happens when you hit go
          </p>

          <div className="max-w-[480px] mx-auto mb-6">
            {STOPS.map((stop) => (
              <div key={stop.num} className="flex gap-5 mb-4 items-baseline">
                <span className="text-right w-10 shrink-0 font-black text-xl" style={{ fontFamily: "'Playfair Display', serif", color: C.rust }}>
                  {stop.num}
                </span>
                <div>
                  <div className="text-[0.7rem] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: "'Josefin Sans', sans-serif", color: C.cream }}>
                    {stop.title}
                  </div>
                  <div className="italic text-[0.95rem]" style={{ color: C.muted }}>
                    {stop.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sunburst */}
          <div className="text-center my-6 text-lg tracking-[0.5em] opacity-50" style={{ color: C.gold }}>&#x2737;</div>

          {/* Gallery */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
            {GALLERY_IMAGES.map((img) => (
              <div key={img.caption} className="border overflow-hidden group" style={{ borderColor: C.faint }}>
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full aspect-square object-cover transition-all duration-400 group-hover:scale-[1.03] group-hover:brightness-110"
                  style={{ filter: "brightness(0.85) contrast(1.1) saturate(0.85)" }}
                />
                <div className="text-center py-1.5 text-[0.5rem] tracking-[0.3em] uppercase" style={{ fontFamily: "'Josefin Sans', sans-serif", color: C.gold, background: C.surface }}>
                  {img.caption}
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <p className="text-center text-xs font-semibold tracking-[0.25em] uppercase mb-4" style={{ fontFamily: "'Josefin Sans', sans-serif", color: C.muted }}>
            Each stop includes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 max-w-[520px] mx-auto mb-6">
            {FEATURES.map((f) => (
              <div key={f} className="text-[0.9rem] pl-5 relative" style={{ color: C.muted }}>
                <span className="absolute left-0 top-[0.35rem] text-[0.6rem]" style={{ color: C.gold }}>&#x25C6;</span>
                {f}
              </div>
            ))}
          </div>

          {/* Finale */}
          <div className="border my-6 p-5 md:p-6 text-center italic leading-[1.7]" style={{ borderColor: `${C.gold}33`, background: `${C.gold}0a`, color: C.cream }}>
            At the end of your journey: a vintage travel poster featuring all five dishes,
            a cinematic summary video, and a shareable link to relive it all.
          </div>

          {/* Powered by */}
          <p className="text-center text-[0.5rem] tracking-[0.2em] uppercase opacity-35 my-4" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            Gemini 3.1 &middot; Veo &middot; Google Places &middot; ElevenLabs &middot; Google Cloud
          </p>

          {/* Credits */}
          <div className="text-center pt-4 mt-4" style={{ borderTop: `1px solid ${C.faint}` }}>
            <p className="text-[0.5rem] tracking-[0.2em] uppercase opacity-30 mb-1" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
              MMXXVI &middot; Gemini Live Agent Challenge
            </p>
            <p className="text-[0.5rem] tracking-[0.2em] uppercase opacity-30 mb-1" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
              Built by Tarik Moody
            </p>
            <p className="text-[0.4rem] tracking-[0.15em] uppercase opacity-20" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
              Photos: Unsplash &mdash; S. Jimenez, T. Buremo, B. Iwara, G. Dagerotip, Wkndr
            </p>
          </div>

        </div>
      </main>

      <p className="relative z-10 text-center italic text-[0.75rem] opacity-25 pb-8" style={{ color: C.cream }}>
        All places and restaurants are AI-suggested. Verify details before visiting.
      </p>
    </div>
  );
}
