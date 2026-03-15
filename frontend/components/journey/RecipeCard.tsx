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
      className="bg-white/5 rounded-2xl overflow-hidden border border-[#E8E0D0]/10"
    >
      {dishImageUrl && (
        <img
          src={dishImageUrl}
          alt={recipe.dish_name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-serif text-xl font-bold">
              {recipe.dish_name}
            </h4>
            <p className="font-sans text-xs text-[#E8E0D0]/40 mt-1">
              {recipe.cuisine_type} &middot; {recipe.prep_time} min &middot;
              Serves {recipe.servings}
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="text-xs font-sans px-3 py-1.5 rounded-full border border-[#E8E0D0]/10 text-[#E8E0D0]/50 hover:border-[#C4652A]/30 hover:text-[#C4652A] transition-colors"
          >
            Download
          </button>
        </div>

        <div className="mb-4">
          <h5 className="font-sans text-xs uppercase tracking-wider text-[#C4652A] mb-2">
            Ingredients
          </h5>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="font-sans text-sm text-[#E8E0D0]/70">
                {ing.amount}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="font-sans text-xs uppercase tracking-wider text-[#C4652A] mb-2">
            Instructions
          </h5>
          <ol className="space-y-2">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="font-sans text-sm text-[#E8E0D0]/70">
                <span className="text-[#C4652A] font-medium mr-2">
                  {i + 1}.
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-4 font-sans text-[10px] text-[#E8E0D0]/20 text-center">
          First Bite
        </p>
      </div>
    </div>
  );
}
