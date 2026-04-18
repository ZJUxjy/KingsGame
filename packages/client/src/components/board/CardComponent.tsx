import { useId, useRef, useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import type { Card, CardInstance, Rarity } from '@king-card/shared';
import { CardArtwork, CardBackArtwork } from './CardArtwork.js';
import { CardTextLayer } from './CardTextLayer.js';
import type { CardSize } from './cardSize.js';
import { getCardDisplayText } from '../../utils/cardText.js';
import { useLocaleStore } from '../../stores/localeStore.js';

const RARITY_BORDER_VAR: Record<Rarity, string> = {
  COMMON: 'var(--rarity-common)',
  RARE: 'var(--rarity-rare)',
  EPIC: 'var(--rarity-epic)',
  LEGENDARY: 'var(--rarity-legendary)',
};

type TooltipSize = 'regular' | 'wide' | 'large';
type TooltipPlacement = 'above' | 'below';

const TOOLTIP_HEIGHT_MAP: Record<TooltipSize, number> = {
  regular: 120,
  wide: 148,
  large: 190,
};

function getTooltipSize(card: Card): TooltipSize {
  if (card.type === 'GENERAL' || card.type === 'EMPEROR') return 'large';
  if (card.type === 'STRATAGEM' || card.type === 'SORCERY') return 'wide';
  return 'regular';
}

function getTooltipWidthClass(size: TooltipSize): string {
  if (size === 'large') return 'w-[320px]';
  if (size === 'wide') return 'w-[280px]';
  return 'w-[220px]';
}

function formatSkillUses(usesPerTurn: number, locale: 'zh-CN' | 'en-US'): string {
  if (locale === 'en-US') {
    return `${usesPerTurn} use${usesPerTurn === 1 ? '' : 's'}/turn`;
  }

  return `每回合 ${usesPerTurn} 次`;
}

function formatHeroCooldown(cooldown: number, locale: 'zh-CN' | 'en-US'): string {
  if (locale === 'en-US') {
    return `Cooldown ${cooldown} turn${cooldown === 1 ? '' : 's'}`;
  }

  return `冷却 ${cooldown} 回合`;
}

const SIZE_MAP: Record<CardSize, { width: number; height: number }> = {
  hand: { width: 120, height: 172 },
  battlefield: { width: 120, height: 172 },
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
  useResponsiveBattlefieldSize?: boolean;
}

const CardComponentInner = function CardComponent({
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
  useResponsiveBattlefieldSize = false,
}: CardComponentProps) {
  const svgIdBase = useId().replace(/:/g, '_');
  const tooltipId = useId().replace(/:/g, '_');
  const { width, height } = SIZE_MAP[size];
  const resolvedWidth = size === 'battlefield' && useResponsiveBattlefieldSize
    ? 'var(--battlefield-card-width)'
    : width;
  const resolvedHeight = size === 'battlefield' && useResponsiveBattlefieldSize
    ? 'var(--battlefield-card-height)'
    : height;
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPlacement, setTooltipPlacement] = useState<TooltipPlacement>('above');
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const locale = useLocaleStore((state) => state.locale);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isHovered) { setCardRect(null); return; }
    const el = rootRef.current;
    if (!el) return;
    setCardRect(el.getBoundingClientRect());
  }, [isHovered]);

  if (isHidden || !card) {
    return (
      <div
        data-testid="card-back"
        className={`relative select-none flex items-center justify-center overflow-hidden ${className ?? ''}`}
        style={{
          width: resolvedWidth,
          height: resolvedHeight,
          borderRadius: 'var(--card-border-radius)',
          background: 'linear-gradient(135deg, var(--cardback-from) 0%, var(--cardback-to) 100%)',
          border: '2px solid var(--cardback-border)',
        }}
      >
        <CardBackArtwork svgIdBase={svgIdBase} locale={locale} />
      </div>
    );
  }

  const displayCard = getCardDisplayText(card, locale);
  const rarityBorder = RARITY_BORDER_VAR[card.rarity] ?? 'var(--rarity-common)';
  const tooltipSize = getTooltipSize(displayCard);
  const hasTooltipContent = Boolean(
    displayCard.description || displayCard.generalSkills?.length || displayCard.heroSkill,
  );
  const heroSkillLabel = locale === 'en-US' ? 'Hero Skill' : '帝王技能';
  const generalSkillsLabel = locale === 'en-US' ? 'General Skills' : '将领技能';
  const costLabel = locale === 'en-US' ? 'Cost' : '费用';
  const garrisonLabel = instance && instance.garrisonTurns > 0
    ? locale === 'en-US'
      ? `Garrison ${instance.garrisonTurns}`
      : `驻守${instance.garrisonTurns}`
    : '';

  const handlePointerEnter = () => {
    const estimatedTooltipHeight = TOOLTIP_HEIGHT_MAP[tooltipSize];
    const rootTop = rootRef.current?.getBoundingClientRect().top ?? estimatedTooltipHeight + 16;
    setTooltipPlacement(rootTop <= estimatedTooltipHeight + 16 ? 'below' : 'above');
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
        width: resolvedWidth,
        height: resolvedHeight,
        borderRadius: 'var(--card-border-radius)',
        background: 'linear-gradient(180deg, var(--card-body-from) 0%, var(--card-body-mid) 50%, var(--card-body-to) 100%)',
        border: `2px solid ${rarityBorder}`,
      }}
      aria-describedby={isHovered && hasTooltipContent ? tooltipId : undefined}
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
          <CardTextLayer card={displayCard} size={size} locale={locale} />

          {/* Garrison overlay */}
          {instance && instance.garrisonTurns > 0 && (
            <div
              data-testid="garrison-overlay"
              className="absolute inset-0 bg-blue-900/60 flex items-center justify-center"
              style={{ borderRadius: 'var(--card-border-radius)' }}
            >
              <span className="text-blue-300 text-xs font-bold">
                {garrisonLabel}
              </span>
            </div>
          )}
        </div>

      {isHovered && hasTooltipContent && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          data-testid="card-description-tooltip"
          data-tooltip-size={tooltipSize}
          data-tooltip-placement={tooltipPlacement}
          className={`pointer-events-none fixed ${getTooltipWidthClass(tooltipSize)} max-w-[calc(100vw-24px)] rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-xs leading-5 text-stone-100 shadow-[0_18px_36px_rgba(0,0,0,0.45)] backdrop-blur-sm`}
          style={{
            left: cardRect ? cardRect.left + cardRect.width / 2 : 0,
            zIndex: 9999,
            ...(tooltipPlacement === 'below'
              ? { top: cardRect ? cardRect.bottom + 8 : 0 }
              : { bottom: cardRect ? window.innerHeight - cardRect.top + 8 : 0 }),
            transform: 'translateX(-50%)',
          }}
        >
          <div className="mb-1 text-sm font-bold text-amber-200">{displayCard.name}</div>
          {displayCard.description && <div>{displayCard.description}</div>}
          {displayCard.heroSkill && (
            <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-300/85">
                {heroSkillLabel}
              </div>
              <div data-testid="card-tooltip-hero-skill" className="rounded-lg border border-white/8 bg-white/5 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-amber-100">{displayCard.heroSkill.name}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-300/90">
                    <span className="rounded-full border border-amber-300/20 bg-amber-200/10 px-1.5 py-0.5">{costLabel} {displayCard.heroSkill.cost}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5">{formatHeroCooldown(displayCard.heroSkill.cooldown, locale)}</span>
                  </div>
                </div>
                <div className="text-[11px] leading-4 text-stone-200/95">{displayCard.heroSkill.description}</div>
              </div>
            </div>
          )}
          {displayCard.generalSkills && displayCard.generalSkills.length > 0 && (
            <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-300/85">
                {generalSkillsLabel}
              </div>
              {displayCard.generalSkills.map((skill, index) => (
                <div key={skill.name} data-testid="card-tooltip-skill" className="rounded-lg border border-white/8 bg-white/5 px-2 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold text-amber-100">
                      {index + 1}. {skill.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-300/90">
                      <span className="rounded-full border border-amber-300/20 bg-amber-200/10 px-1.5 py-0.5">{costLabel} {skill.cost}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5">{formatSkillUses(skill.usesPerTurn, locale)}</span>
                    </div>
                  </div>
                  <div className="text-[11px] leading-4 text-stone-200/95">{skill.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

export const CardComponent = memo(CardComponentInner);
