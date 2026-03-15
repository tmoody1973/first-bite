"use client";

import { useRef } from "react";
import type { StopData } from "@/hooks/useJourneyStream";

interface RecipeCardProps {
  recipe: NonNullable<StopData["recipe"]>;
  dishImageUrl: string;
}

export function RecipeCard({ recipe, dishImageUrl }: RecipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#0A0A0A",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `first-bite-${recipe.dish_name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      ref={cardRef}
      className="bg-white/[0.03] rounded-2xl overflow-hidden border border-[#E8E0D0]/[0.06]"
    >
      {/* Dish image — tall, cinematic */}
      {dishImageUrl && (
        <div className="h-48 md:h-64 relative overflow-hidden">
          <img
            src={dishImageUrl}
            alt={recipe.dish_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        </div>
      )}

      <div className="px-6 pb-6 pt-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-serif text-2xl font-bold leading-tight">
            {recipe.dish_name}
          </h4>
          <button
            onClick={handleDownload}
            className="text-[10px] font-sans uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#E8E0D0]/[0.08] text-[#E8E0D0]/30 hover:border-[#C4652A]/30 hover:text-[#C4652A] transition-colors mt-1 shrink-0"
          >
            Save
          </button>
        </div>
        <p className="font-sans text-[11px] tracking-wider uppercase text-[#E8E0D0]/30 mb-6">
          {recipe.cuisine_type} &middot; {recipe.prep_time} min &middot; Serves{" "}
          {recipe.servings}
        </p>

        {/* Two-column layout like Sonic Sommelier */}
        <div className="md:flex md:gap-8">
          {/* Ingredients column */}
          <div className="mb-6 md:w-2/5 md:flex-shrink-0">
            <h5 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C4652A] mb-3">
              Ingredients
            </h5>
            <ul className="list-none p-0 m-0">
              {recipe.ingredients.map((ing, i) => (
                <li
                  key={i}
                  className="font-sans text-[13px] py-2 flex justify-between gap-3"
                  style={{
                    borderBottom: "1px solid rgba(232, 224, 217, 0.06)",
                  }}
                >
                  <span className="text-[#E8E0D0]/80">{ing.name}</span>
                  <span className="text-[#E8E0D0]/30 text-right shrink-0 font-mono text-[11px]">
                    {ing.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions column */}
          <div className="mb-6 md:flex-1">
            <h5 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C4652A] mb-3">
              Instructions
            </h5>
            <ol className="list-none p-0 m-0">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 mb-4">
                  <span
                    className="font-mono text-[11px] w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: "rgba(196, 101, 42, 0.15)",
                      color: "#C4652A",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-sans text-[13px] leading-[1.7] text-[#E8E0D0]/70">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Branding */}
        <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#E8E0D0]/15 text-center mt-2">
          First Bite
        </p>
      </div>
    </div>
  );
}
