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
  const headId = `${uniqueId}_head`;

  if (!visible || !start || !end) {
    return null;
  }

  const deltaX = end.x - start.x;
  const curveOffset = Math.max(48, Math.min(180, Math.abs(deltaX) * 0.35 + 64));
  const controlA = { x: start.x, y: start.y - curveOffset };
  const controlB = { x: end.x, y: end.y - curveOffset * 0.4 };

  return (
    <svg className="pointer-events-none fixed inset-0 z-40 overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
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
        <marker
          id={headId}
          markerWidth="12"
          markerHeight="12"
          refX="9"
          refY="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L12,6 L0,12 L3.5,6 z" fill="#ef4444" />
        </marker>
      </defs>
      <path
        d={`M ${start.x} ${start.y} C ${controlA.x} ${controlA.y}, ${controlB.x} ${controlB.y}, ${end.x} ${end.y}`}
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${glowId})`}
        markerEnd={`url(#${headId})`}
      />
    </svg>
  );
}