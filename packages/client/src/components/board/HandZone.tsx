import { useRef, useEffect, useState, useCallback, memo } from 'react';
import type { Card } from '@king-card/shared';
import { CardComponent } from './CardComponent.js';
import { computeFanLayout } from '../../utils/fanLayout.js';

interface HandZoneProps {
  cards: Card[];
  isOpponent?: boolean;
  containerWidth?: number;
  onPlayCard?: (index: number) => void;
  validPlayIndices?: Set<number>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const DEFAULT_CONTAINER_WIDTH = 800;
const CONTAINER_HEIGHT = 185;

function HandZoneInner({
  cards,
  isOpponent = false,
  containerWidth,
  onPlayCard,
  validPlayIndices,
  onDragStart,
  onDragEnd,
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
  const onDragEndRef = useRef(onDragEnd);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [snapBackIndex, setSnapBackIndex] = useState<number | null>(null);

  useEffect(() => {
    onPlayCardRef.current = onPlayCard;
  }, [onPlayCard]);

  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

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
      onDragStart?.();
    },
    [isOpponent, isPlayable, onDragStart],
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
        dragStateRef.current = null;
        setDraggingIndex(null);
        setDragPosition(null);
        onDragEndRef.current?.();
      } else {
        // Snap-back animation
        const cancelIndex = current.index;
        dragStateRef.current = null;
        setDraggingIndex(null);
        setDragPosition(null);
        setSnapBackIndex(cancelIndex);
        setTimeout(() => setSnapBackIndex(null), 300);
        onDragEndRef.current?.();
      }
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
        const isHovered = hoveredIndex === i && draggingIndex === null;

        return (
          <div
            key={i}
            className={`absolute ${
              isDragging ? 'pointer-events-none z-50 transition-none' :
              snapBackIndex === i ? 'transition-all duration-300 ease-out opacity-60' :
              'transition-all duration-200 ease-out'
            }`}
            style={{
              position: isDragging ? 'fixed' : 'absolute',
              left: isDragging && dragState ? dragPosition.x - dragState.offsetX : '50%',
              top: isDragging && dragState ? dragPosition.y - dragState.offsetY : '50%',
              width: 120,
              height: 172,
              touchAction: playable ? 'none' : 'auto',
              marginLeft: isDragging ? 0 : -60,
              marginTop: isDragging ? 0 : -86,
              transform: isDragging
                ? `rotate(${Math.max(-10, Math.min(10, (dragPosition.x - width / 2) / 80))}deg) scale(1.08)`
                : isHovered
                  ? `translateX(${t.x}px) translateY(${t.y - 15}px) rotate(${t.rotation}deg) scale(1.08)`
                  : `translateX(${t.x}px) translateY(${t.y}px) rotate(${t.rotation}deg)`,
              zIndex: isDragging ? cards.length + 20 : isHovered ? cards.length + 1 : t.zIndex,
            }}
            onMouseEnter={() => {
              if (draggingIndex === null) setHoveredIndex(i);
            }}
            onMouseLeave={() => {
              if (hoveredIndex === i) setHoveredIndex(null);
            }}
          >
            {isOpponent ? (
              <CardComponent isHidden size="hand" />
            ) : (
              <CardComponent
                card={card as Card}
                actionable={playable}
                size="hand"
                onPointerDown={(e) => handlePointerDown(i, e)}
                className={isDragging ? 'card-drag-shadow' : ''}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export const HandZone = memo(HandZoneInner);
