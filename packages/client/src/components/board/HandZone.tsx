import { useRef, useEffect, useState, useCallback } from 'react';
import type { Card, CardInstance } from '@king-card/shared';
import { CardComponent } from './CardComponent.js';
import { computeFanLayout } from '../../utils/fanLayout.js';

interface HandZoneProps {
  cards: any[];
  isOpponent?: boolean;
  containerWidth?: number;
  onCardClick?: (index: number) => void;
  onCardDragStart?: (index: number, e: React.DragEvent) => void;
  validPlayIndices?: Set<number>;
}

const DEFAULT_CONTAINER_WIDTH = 800;
const CONTAINER_HEIGHT = 180;

export function HandZone({
  cards,
  isOpponent = false,
  containerWidth,
  onCardClick,
  onCardDragStart,
  validPlayIndices,
}: HandZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(
    containerWidth ?? DEFAULT_CONTAINER_WIDTH,
  );

  useEffect(() => {
    if (containerWidth !== undefined) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMeasuredWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerWidth]);

  const width = containerWidth ?? measuredWidth;
  const transforms = computeFanLayout(cards.length, width);

  const handleDragStart = useCallback(
    (index: number, e: React.DragEvent) => {
      onCardDragStart?.(index, e);
    },
    [onCardDragStart],
  );

  const isPlayable = useCallback(
    (index: number) => validPlayIndices?.has(index) ?? false,
    [validPlayIndices],
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full mx-auto"
      style={{ height: CONTAINER_HEIGHT }}
    >
      {cards.map((card, i) => {
        const t = transforms[i];
        if (!t) return null;

        const playable = isPlayable(i);

        return (
          <div
            key={i}
            className="absolute transition-all duration-200 ease-out"
            style={{
              left: '50%',
              top: '50%',
              width: 120,
              height: 170,
              marginLeft: -60,
              marginTop: -85,
              transform: `translateX(${t.x}px) translateY(${t.y}px) rotate(${t.rotation}deg)`,
              zIndex: t.zIndex,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = `translateX(${t.x}px) translateY(${t.y - 20}px) rotate(${t.rotation}deg) scale(1.08)`;
              el.style.zIndex = String(cards.length + 1);
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = `translateX(${t.x}px) translateY(${t.y}px) rotate(${t.rotation}deg)`;
              el.style.zIndex = String(t.zIndex);
            }}
          >
            {isOpponent ? (
              <OpponentCardBack playable={playable} />
            ) : (
              <CardComponent
                card={card as Card}
                instance={card as CardInstance}
                selected={playable}
                onClick={() => onCardClick?.(i)}
                draggable={playable}
                onDragStart={(e) => handleDragStart(i, e)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OpponentCardBack({ playable }: { playable: boolean }) {
  return (
    <div
      className={`w-[120px] h-[170px] rounded-lg bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-600 flex items-center justify-center select-none transition-shadow duration-200
        ${playable ? 'shadow-[0_0_12px_2px_rgba(234,179,8,0.4)]' : ''}`}
    >
      <div className="w-16 h-16 border-2 border-yellow-600/50 rounded-full flex items-center justify-center">
        <span className="text-yellow-600/50 text-xl">帝</span>
      </div>
    </div>
  );
}
