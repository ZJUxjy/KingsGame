import { useId } from 'react';
import type { Card, CardInstance, Rarity } from '@king-card/shared';
import { CardArtwork, CardBackArtwork } from './CardArtwork.js';

const KEYWORD_LABELS: Record<string, string> = {
  BATTLECRY: '战吼',
  DEATHRATTLE: '亡语',
  AURA: '光环',
  TAUNT: '嘲讽',
  RUSH: '突袭',
  CHARGE: '冲锋',
  ASSASSIN: '刺杀',
  COMBO_STRIKE: '连击',
  STEALTH_KILL: '暗杀',
  MOBILIZE: '动员',
  GARRISON: '驻守',
  IRON_FIST: '铁拳',
  RESEARCH: '研究',
  BLOCKADE: '封锁',
  COLONY: '殖民',
  BLITZ: '闪击',
  MOBILIZATION_ORDER: '动员令',
};

const RARITY_BORDER_VAR: Record<Rarity, string> = {
  COMMON: 'var(--rarity-common)',
  RARE: 'var(--rarity-rare)',
  EPIC: 'var(--rarity-epic)',
  LEGENDARY: 'var(--rarity-legendary)',
};

type TypeTokenKey = 'soldier' | 'spell' | 'general';

function typeTokenKey(type: string): TypeTokenKey {
  if (type === 'GENERAL') return 'general';
  if (type === 'SPELL') return 'spell';
  return 'soldier';
}

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
  const { width, height } = SIZE_MAP[size];

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

  const rarityBorder = RARITY_BORDER_VAR[card.rarity] ?? 'var(--rarity-common)';
  const attack = instance?.currentAttack ?? card.attack ?? 0;
  const health = instance?.currentHealth ?? card.health ?? 0;
  const maxHealth = instance?.currentMaxHealth ?? card.health ?? 0;
  const isMinion = card.type === 'MINION' || card.type === 'GENERAL';

  return (
    <div
      data-testid="card"
      className={`relative select-none cursor-pointer overflow-hidden text-white
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
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <CardArtwork card={card} instance={instance} svgIdBase={svgIdBase} size={size} />

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
  );
}
