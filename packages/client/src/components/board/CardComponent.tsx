import { useId, useRef, useState } from 'react';
import type { Card, CardInstance, Rarity } from '@king-card/shared';
import { CardArtwork, CardBackArtwork } from './CardArtwork.js';
import { getCardDisplayText } from '../../utils/cardText.js';
import { useLocaleStore } from '../../stores/localeStore.js';

const RARITY_BORDER_VAR: Record<Rarity, string> = {
  COMMON: 'var(--rarity-common)',
  RARE: 'var(--rarity-rare)',
  EPIC: 'var(--rarity-epic)',
  LEGENDARY: 'var(--rarity-legendary)',
};

type CardSize = 'hand' | 'battlefield' | 'detail' | 'collection';

const SIZE_MAP: Record<CardSize, { width: number; height: number }> = {
  hand: { width: 90, height: 130 },
  battlefield: { width: 90, height: 130 },
  detail: { width: 288, height: 420 },
  collection: { width: 168, height: 246 },
};

interface CardComponentProps {
  card?: Card;
  instance?: CardInstance;
  selected?: boolean;
  actionable?: boolean;
  validTarget?: boolean;
  animationClass?: string;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  className?: string;
  isHidden?: boolean;
  size?: CardSize;
}

export function CardComponent({
  card,
  instance,
  selected,
  actionable,
  validTarget,
  animationClass,
  onClick,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  className,
  isHidden,
  size = 'battlefield',
}: CardComponentProps) {
  const svgIdBase = useId().replace(/:/g, '_');
  const tooltipId = useId().replace(/:/g, '_');
  const { width, height } = SIZE_MAP[size];
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPlacement, setTooltipPlacement] = useState<'top' | 'bottom'>('top');
  const locale = useLocaleStore((state) => state.locale);
  const rootRef = useRef<HTMLDivElement | null>(null);

  if (isHidden || !card) {
    return (
      <div
        data-testid="card-back"
        className={`relative select-none flex items-center justify-center overflow-hidden ${className ?? ''}`}
        style={{
          width,
          height,
          borderRadius: 'var(--card-border-radius)',
          background: 'linear-gradient(135deg, var(--cardback-from) 0%, var(--cardback-to) 100%)',
          border: '2px solid var(--cardback-border)',
        }}
      >
        <CardBackArtwork svgIdBase={svgIdBase} />
      </div>
    );
  }

  const displayCard = getCardDisplayText(card, locale);
  const rarityBorder = RARITY_BORDER_VAR[card.rarity] ?? 'var(--rarity-common)';
  const attack = instance?.currentAttack ?? card.attack ?? 0;
  const health = instance?.currentHealth ?? card.health ?? 0;
  const maxHealth = instance?.currentMaxHealth ?? card.health ?? 0;
  const isMinion = card.type === 'MINION' || card.type === 'GENERAL';

  const handlePointerEnter = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPlacement(rect.top < 140 ? 'bottom' : 'top');
    }
    setIsHovered(true);
    onPointerEnter?.();
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    onPointerLeave?.();
  };

  return (
    <div
      ref={rootRef}
      data-testid="card"
      className={`relative select-none cursor-pointer text-white
          transition-all duration-150
          hover:-translate-y-4 hover:scale-105
          ${selected ? 'ring-2 ring-yellow-400 scale-105' : ''}
          ${actionable ? 'shadow-[0_0_22px_rgba(74,222,128,0.55)] ring-1 ring-emerald-400/70' : ''}
          ${validTarget ? 'ring-2 ring-red-400 shadow-[0_0_26px_rgba(248,113,113,0.65)] animate-pulse' : ''}
          ${animationClass ?? ''}
          ${className ?? ''}`}
      style={{
        width,
        height,
        borderRadius: 'var(--card-border-radius)',
        background: 'linear-gradient(180deg, var(--card-body-from) 0%, var(--card-body-mid) 50%, var(--card-body-to) 100%)',
        border: `2px solid ${rarityBorder}`,
      }}
      aria-describedby={isHovered && displayCard.description ? tooltipId : undefined}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: 'var(--card-border-radius)' }}
        >
          <CardArtwork card={displayCard} instance={instance} svgIdBase={svgIdBase} size={size} locale={locale} />

          {/* Garrison overlay */}
          {instance && instance.garrisonTurns > 0 && (
            <div
              data-testid="garrison-overlay"
              className="absolute inset-0 bg-blue-900/60 flex items-center justify-center"
              style={{ borderRadius: 'var(--card-border-radius)' }}
            >
              <span className="text-blue-300 text-xs font-bold">
                驻守{instance.garrisonTurns}
              </span>
            </div>
          )}
        </div>

      {isHovered && displayCard.description && (
        <div
          id={tooltipId}
          role="tooltip"
          data-testid="card-description-tooltip"
          className={`pointer-events-none absolute left-1/2 z-30 w-[220px] max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-xs leading-5 text-stone-100 shadow-[0_18px_36px_rgba(0,0,0,0.45)] backdrop-blur-sm ${tooltipPlacement === 'top' ? 'top-0 -translate-y-[calc(100%+10px)]' : 'top-full translate-y-[10px]'}`}
        >
          <div className="mb-1 text-sm font-bold text-amber-200">{displayCard.name}</div>
          <div>{displayCard.description}</div>
        </div>
      )}
    </div>
  );
}
