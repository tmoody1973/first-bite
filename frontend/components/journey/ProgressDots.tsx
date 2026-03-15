interface ProgressDotsProps {
  current: number;
  total: number;
}

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="fixed top-5 right-4 z-50">
      <span className="font-sans text-[11px] text-[#E8E0D0]/30 tracking-wider">
        {current} / {total}
      </span>
    </div>
  );
}
