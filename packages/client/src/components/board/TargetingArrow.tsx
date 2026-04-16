import { useId } from 'react';

interface Point {
  x: number;
  y: number;
}

interface TargetingArrowProps {
  start: Point | null;
  end: Point | null;
  visible: boolean;
}

export function TargetingArrow({ start, end, visible }: TargetingArrowProps) {
  const uniqueId = useId().replace(/:/g, '_');
  const gradientId = `${uniqueId}_gradient`;
  const glowId = `${uniqueId}_glow`;

  if (!visible || !start || !end) {
    return null;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 1) return null;

  const angle = Math.atan2(dy, dx);

  // Arrowhead geometry
  const headLen = 20;
  const headHalfWidth = 10;

  const baseX = end.x - headLen * Math.cos(angle);
  const baseY = end.y - headLen * Math.sin(angle);

  const perpX = headHalfWidth * Math.cos(angle + Math.PI / 2);
  const perpY = headHalfWidth * Math.sin(angle + Math.PI / 2);

  // Diamond-shaped arrowhead
  const indentFactor = 0.4;
  const indentX = end.x - headLen * indentFactor * Math.cos(angle);
  const indentY = end.y - headLen * indentFactor * Math.sin(angle);

  return (
    <svg className="pointer-events-none fixed inset-0 z-40 overflow-visible">
      <defs>
        <linearGradient
          id={gradientId}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Line body — stops at arrowhead base */}
      <line
        x1={start.x}
        y1={start.y}
        x2={baseX}
        y2={baseY}
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        filter={`url(#${glowId})`}
      />
      {/* Arrowhead */}
      <path
        d={`M ${end.x} ${end.y} L ${baseX + perpX} ${baseY + perpY} L ${indentX} ${indentY} L ${baseX - perpX} ${baseY - perpY} Z`}
        fill="#ef4444"
        filter={`url(#${glowId})`}
      />
    </svg>
  );
}