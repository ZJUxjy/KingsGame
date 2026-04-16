import type { Card, CardInstance, Rarity } from '@king-card/shared';

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

const TYPE_BADGE_LABEL: Record<string, string> = {
  MINION: '步兵',
  SPELL: '法术',
  GENERAL: '将领',
};

const TYPE_ICON: Record<string, string> = {
  MINION: '兵',
  SPELL: '法',
  GENERAL: '将',
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
}: CardComponentProps) {
  if (isHidden || !card) {
    return (
      <div
        className={`relative select-none flex items-center justify-center overflow-hidden ${className ?? ''}`}
        style={{
          width: 90,
          height: 130,
          borderRadius: 'var(--card-border-radius)',
          background: 'linear-gradient(135deg, var(--cardback-from) 0%, var(--cardback-to) 100%)',
          border: '2px solid var(--cardback-border)',
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            border: '1.5px solid rgba(148,163,184,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: 'rgba(148,163,184,0.4)', fontSize: 18 }}>帝</span>
        </div>
      </div>
    );
  }

  const typeKey = typeTokenKey(card.type);
  const rarityBorder = RARITY_BORDER_VAR[card.rarity] ?? 'var(--rarity-common)';
  const isMinion = card.type === 'MINION' || card.type === 'GENERAL';
  const atk = instance ? instance.currentAttack : (card.attack ?? 0);
  const hp = instance ? instance.currentHealth : (card.health ?? 0);
  const maxHp = instance ? instance.currentMaxHealth : (card.health ?? 0);

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
        width: 90,
        height: 130,
        borderRadius: 'var(--card-border-radius)',
        background: 'linear-gradient(180deg, var(--card-body-from) 0%, var(--card-body-mid) 50%, var(--card-body-to) 100%)',
        border: `2px solid ${rarityBorder}`,
      }}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Art area with type gradient */}
      <div
        data-testid="card-art"
        className="absolute top-0 left-0 right-0 flex items-center justify-center"
        style={{
          height: 42,
          background: `linear-gradient(135deg, var(--type-${typeKey}-from) 0%, var(--type-${typeKey}-to) 100%)`,
        }}
      >
        <span style={{ fontSize: 18, opacity: 0.55, color: 'white', fontWeight: 700 }}>
          {TYPE_ICON[card.type] ?? '?'}
        </span>
      </div>

      {/* Cost badge (top-left, blue glow) */}
      <div
        data-testid="card-cost"
        className="absolute z-10 flex items-center justify-center text-[11px] font-bold text-white"
        style={{
          top: 4,
          left: 4,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#1d4ed8',
          border: '1.5px solid var(--cost-border)',
          boxShadow: '0 0 6px var(--cost-glow)',
        }}
      >
        {card.cost}
      </div>

      {/* Type badge pill (bottom-right of art area) */}
      <div
        data-testid="card-type-badge"
        className="absolute z-10 flex items-center justify-center text-[8px] font-bold text-white"
        style={{
          top: 30,
          right: 4,
          padding: '1px 5px',
          borderRadius: 8,
          background: `var(--badge-${typeKey})`,
        }}
      >
        {TYPE_BADGE_LABEL[card.type] ?? card.type}
      </div>

      {/* Name */}
      <div className="absolute left-0 right-0 text-center px-1" style={{ top: 44 }}>
        <span className="text-[10px] font-bold leading-tight">
          {card.name.length > 7 ? card.name.substring(0, 7) + '…' : card.name}
        </span>
      </div>

      {/* Keywords */}
      {card.keywords.length > 0 && (
        <div className="absolute left-0 right-0 text-center px-1" style={{ top: 57 }}>
          <span className="text-[7px] text-yellow-400 font-bold leading-none">
            {card.keywords.map((k) => KEYWORD_LABELS[k] ?? k).join(' ')}
          </span>
        </div>
      )}

      {/* Description */}
      <div
        className="absolute left-1 right-1 text-center overflow-hidden"
        style={{ top: 66, bottom: 24 }}
      >
        <span className="text-[7px] text-gray-400 leading-tight line-clamp-2">
          {card.description}
        </span>
      </div>

      {/* ATK badge */}
      {isMinion && (
        <div
          data-testid="card-atk"
          className="absolute bottom-1 left-1 flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            width: 24,
            height: 18,
            borderRadius: 5,
            background: `linear-gradient(135deg, var(--atk-from), var(--atk-to))`,
            border: '1px solid var(--atk-border)',
            boxShadow: '0 0 4px var(--atk-glow)',
          }}
        >
          {atk}
        </div>
      )}

      {/* HP badge */}
      {isMinion && (
        <div
          data-testid="card-hp"
          className="absolute bottom-1 right-1 flex items-center justify-center text-[10px] font-bold"
          style={{
            width: 24,
            height: 18,
            borderRadius: 5,
            background: `linear-gradient(135deg, var(--hp-from), var(--hp-to))`,
            border: '1px solid var(--hp-border)',
            boxShadow: '0 0 4px var(--hp-glow)',
            color: hp < maxHp ? 'var(--hp-text-damaged)' : 'var(--hp-text-full)',
          }}
        >
          {hp}
        </div>
      )}

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
