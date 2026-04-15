interface HeroPanelProps {
  heroName: string;
  health: number;
  maxHealth: number;
  armor: number;
  skillName?: string;
  skillCost?: number;
  canUseSkill?: boolean;
  skillPending?: boolean;
  isOpponent?: boolean;
  targetable?: boolean;
  highlightedTarget?: boolean;
  targetAnchorId?: string;
  skillAnchorId?: string;
  onSkillClick?: () => void;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function HeroPanel({
  heroName,
  health,
  maxHealth,
  armor,
  skillName,
  skillCost,
  canUseSkill,
  skillPending,
  isOpponent,
  targetable,
  highlightedTarget,
  targetAnchorId,
  skillAnchorId,
  onSkillClick,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: HeroPanelProps) {
  const hpPercent = Math.max(0, (health / maxHealth) * 100);
  const hpColor =
    health <= 10 ? 'bg-red-600' : health <= 20 ? 'bg-orange-500' : 'bg-green-600';

  return (
    <div
      data-anchor-id={targetAnchorId}
      className={`flex items-center gap-3 h-[70px] px-2 rounded-2xl transition-all duration-150 ${targetable ? 'cursor-pointer' : ''} ${highlightedTarget ? 'ring-2 ring-red-400 shadow-[0_0_24px_rgba(248,113,113,0.5)]' : ''}`}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Hero portrait placeholder */}
      <div className="w-[56px] h-[56px] rounded-full bg-gray-700 border-2 border-yellow-600 flex items-center justify-center text-2xl">
        &#x1F451;
      </div>
      <div className="flex flex-col">
        <span className="text-yellow-400 text-sm font-bold">{heroName}</span>
        <div className="flex items-center gap-2">
          <div className="w-[80px] h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${hpColor} transition-all duration-300`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <span className="text-xs text-white font-bold">
            {health}/{maxHealth}
          </span>
          {armor > 0 && (
            <span className="text-xs text-blue-300">&#x1F6E1;{armor}</span>
          )}
        </div>
      </div>
      {/* Skill button */}
      {!isOpponent && skillName && (
        <button
          data-anchor-id={skillAnchorId}
          onClick={onSkillClick}
          disabled={!canUseSkill}
          className={`px-3 py-1 rounded text-xs font-bold
            ${canUseSkill
              ? skillPending
                ? 'bg-blue-300 text-slate-900 cursor-pointer'
                : 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
        >
          {skillName} ({skillCost})
        </button>
      )}
    </div>
  );
}
