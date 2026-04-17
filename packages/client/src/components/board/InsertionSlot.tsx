import { memo } from 'react';

interface InsertionSlotProps {
  index: number;
  highlighted: boolean;
  onHover: (index: number | null) => void;
}

export const InsertionSlot = memo(function InsertionSlot({
  index,
  highlighted,
  onHover,
}: InsertionSlotProps) {
  return (
    <div
      className={`w-6 h-[140px] rounded-lg transition-all duration-200 ${
        highlighted
          ? 'bg-emerald-400/30 shadow-[0_0_12px_rgba(74,222,128,0.4)]'
          : 'bg-white/5'
      }`}
      onPointerEnter={() => onHover(index)}
      onPointerLeave={() => onHover(null)}
    />
  );
});
