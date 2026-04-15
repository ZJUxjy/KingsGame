import type { Card, CardInstance, Rarity } from '@king-card/shared';

const RARITY_BORDER: Record<Rarity, string> = {
  COMMON: 'border-gray-400',
  RARE: 'border-blue-500',
  EPIC: 'border-purple-500',
  LEGENDARY: 'border-yellow-500',
};

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

interface CardComponentProps {
  card?: Card;
  instance?: CardInstance;
  selected?: boolean;
  validTarget?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
  isHidden?: boolean;
}

export function CardComponent({
  card,
  instance,
  selected,
  validTarget,
  onClick,
  draggable,
  onDragStart,
  className,
  isHidden,
}: CardComponentProps) {
  if (isHidden || !card) {
    return (
      <div
        className={`w-[120px] h-[170px] rounded-lg bg-gray-800 border-2 border-gray-600 flex items-center justify-center select-none ${className ?? ''}`}
      >
        <span className="text-gray-500 text-2xl">&#x1F0A0;</span>
      </div>
    );
  }

  const borderClass = RARITY_BORDER[card.rarity] ?? 'border-gray-400';
  const isMinion = card.type === 'MINION' || card.type === 'GENERAL';
  const atk = instance ? instance.currentAttack : card.attack ?? 0;
  const hp = instance ? instance.currentHealth : card.health ?? 0;
  const maxHp = instance ? instance.currentMaxHealth : card.health ?? 0;

  return (
    <div
      className={`w-[120px] h-[170px] rounded-lg bg-gray-800 border-2 ${borderClass} text-white relative select-none cursor-pointer
        transition-all duration-150
        hover:-translate-y-5 hover:scale-105
        ${selected ? 'ring-2 ring-yellow-400 scale-105' : ''}
        ${validTarget ? 'ring-2 ring-red-400 animate-pulse' : ''}
        ${className ?? ''}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {/* Cost circle */}
      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
        {card.cost}
      </div>

      {/* Keywords */}
      {card.keywords.length > 0 && (
        <div className="absolute top-8 left-0 right-0 text-center">
          <span className="text-[8px] text-yellow-400 font-bold">
            {card.keywords.map((k) => KEYWORD_LABELS[k] ?? k).join(' ')}
          </span>
        </div>
      )}

      {/* Name */}
      <div className="absolute top-16 left-0 right-0 text-center px-1">
        <span className="text-[11px] font-bold leading-tight">
          {card.name.length > 6 ? card.name.substring(0, 6) + '..' : card.name}
        </span>
      </div>

      {/* Description */}
      <div className="absolute top-[72px] left-0 right-0 text-center px-1">
        <span className="text-[8px] text-gray-400 leading-tight">
          {card.description?.length > 10
            ? card.description.substring(0, 10) + '..'
            : card.description}
        </span>
      </div>

      {/* Attack/Health */}
      {isMinion && (
        <>
          <div className="absolute bottom-1 left-1 text-sm font-bold text-yellow-400">
            &#x2694; {atk}
          </div>
          <div
            className={`absolute bottom-1 right-1 text-sm font-bold ${hp < maxHp ? 'text-red-400' : 'text-green-400'}`}
          >
            &#x2764; {hp}
          </div>
        </>
      )}

      {/* Garrison overlay */}
      {instance && instance.garrisonTurns > 0 && (
        <div className="absolute inset-0 bg-blue-900/60 rounded-lg flex items-center justify-center">
          <span className="text-blue-300 text-sm font-bold">
            驻守{instance.garrisonTurns}
          </span>
        </div>
      )}
    </div>
  );
}
