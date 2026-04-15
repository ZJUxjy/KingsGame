import { useRef, useEffect, useState, useCallback } from 'react';
import type { Card, CardInstance } from '@king-card/shared';
import { CardComponent } from './CardComponent.js';
import { computeFanLayout } from '../../utils/fanLayout.js';

interface HandZoneProps {
  cards: any[];
  isOpponent?: boolean;
  containerWidth?: number;
  onPlayCard?: (index: number) => void;
  validPlayIndices?: Set<number>;
}

const DEFAULT_CONTAINER_WIDTH = 800;
const CONTAINER_HEIGHT = 180;

export function HandZone({
  cards,
  isOpponent = false,
  containerWidth,
  onPlayCard,
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
  const dragStateRef = useRef<{
    index: number;
    pointerId: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    offsetX: number;
    offsetY: number;
    dragging: boolean;
  } | null>(null);
  const onPlayCardRef = useRef(onPlayCard);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    onPlayCardRef.current = onPlayCard;
  }, [onPlayCard]);

  const isPlayable = useCallback(
    (index: number) => validPlayIndices?.has(index) ?? false,
    [validPlayIndices],
  );

  const handlePointerDown = useCallback(
    (index: number, e: React.PointerEvent<HTMLDivElement>) => {
      if (isOpponent || !isPlayable(index)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const rect = e.currentTarget.getBoundingClientRect();
      dragStateRef.current = {
        index,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        dragging: false,
      };
      setDraggingIndex(index);
      setDragPosition({ x: e.clientX, y: e.clientY });
    },
    [isOpponent, isPlayable],
  );

  useEffect(() => {
    if (draggingIndex === null) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const current = dragStateRef.current;
      if (!current || event.pointerId !== current.pointerId) {
        return;
      }

      const movedEnough = Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 6;
      current.currentX = event.clientX;
      current.currentY = event.clientY;
      current.dragging = current.dragging || movedEnough;
      dragStateRef.current = current;
      setDragPosition({ x: event.clientX, y: event.clientY });
    };

    const finishDrag = (event: PointerEvent) => {
      const current = dragStateRef.current;
      if (!current || event.pointerId !== current.pointerId) {
        return;
      }

      const handRect = containerRef.current?.getBoundingClientRect();
      const releasedAboveHand = handRect ? event.clientY < handRect.top - 16 : false;

      if (current.dragging && releasedAboveHand) {
        onPlayCardRef.current?.(current.index);
      }

      dragStateRef.current = null;
      setDraggingIndex(null);
      setDragPosition(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, [draggingIndex]);

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
        const isDragging = draggingIndex === i && dragPosition !== null;
        const dragState = dragStateRef.current;

        return (
          <div
            key={i}
            className={`absolute transition-all duration-200 ease-out ${isDragging ? 'pointer-events-none z-50 transition-none' : ''}`}
            style={{
              position: isDragging ? 'fixed' : 'absolute',
              left: isDragging && dragState ? dragPosition.x - dragState.offsetX : '50%',
              top: isDragging && dragState ? dragPosition.y - dragState.offsetY : '50%',
              width: 120,
              height: 170,
              touchAction: playable ? 'none' : 'auto',
              marginLeft: isDragging ? 0 : -60,
              marginTop: isDragging ? 0 : -85,
              transform: isDragging
                ? `rotate(${Math.max(-10, Math.min(10, (dragPosition.x - width / 2) / 80))}deg) scale(1.08)`
                : `translateX(${t.x}px) translateY(${t.y}px) rotate(${t.rotation}deg)`,
              zIndex: isDragging ? cards.length + 20 : t.zIndex,
            }}
            onMouseEnter={(e) => {
              if (isDragging) return;
              const el = e.currentTarget;
              el.style.transform = `translateX(${t.x}px) translateY(${t.y - 20}px) rotate(${t.rotation}deg) scale(1.08)`;
              el.style.zIndex = String(cards.length + 1);
            }}
            onMouseLeave={(e) => {
              if (isDragging) return;
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
                actionable={playable}
                onPointerDown={(e) => handlePointerDown(i, e)}
                className={isDragging ? 'shadow-[0_28px_48px_rgba(0,0,0,0.55)]' : ''}
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
