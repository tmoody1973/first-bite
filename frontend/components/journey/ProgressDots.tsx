interface ProgressDotsProps {
  current: number;
  total: number;
}

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
      <span className="font-sans text-xs text-[#E8E0D0]/40">
        Stop {current} of {total}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < current ? "bg-[#C4652A]" : "bg-[#E8E0D0]/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
