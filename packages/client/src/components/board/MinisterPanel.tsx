interface MinisterPanelProps {
  ministers: {
    id: string;
    name: string;
    type: string;
    activeSkill: { name: string; cost: number; description: string };
    skillUsedThisTurn: boolean;
    cooldown: number;
  }[];
  activeIndex: number;
  canUseSkill?: boolean;
  canSwitch?: boolean;
  onSkillClick?: () => void;
  onSwitch?: (ministerIndex: number) => void;
}

const TYPE_LABELS: Record<string, string> = {
  STRATEGIST: '谋士',
  WARRIOR: '武将',
  ADMINISTRATOR: '行政',
  ENVOY: '使节',
};

export function MinisterPanel({
  ministers,
  activeIndex,
  canUseSkill,
  canSwitch,
  onSkillClick,
  onSwitch,
}: MinisterPanelProps) {
  const active = ministers[activeIndex];
  if (!active) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Active minister */}
      <div className="flex items-center gap-2 bg-gray-800 rounded px-2 py-1">
        <div className="w-8 h-8 rounded-full bg-amber-900 border border-amber-700 flex items-center justify-center text-xs">
          &#x1F4DC;
        </div>
        <div className="flex flex-col">
          <span className="text-amber-300 text-xs font-bold">{active.name}</span>
          <span className="text-[10px] text-gray-400">
            {TYPE_LABELS[active.type] ?? active.type}
          </span>
        </div>
        <button
          onClick={onSkillClick}
          disabled={!canUseSkill}
          className={`px-2 py-0.5 rounded text-[10px] font-bold
            ${canUseSkill
              ? 'bg-amber-700 hover:bg-amber-600 cursor-pointer'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
        >
          {active.activeSkill.name} ({active.activeSkill.cost})
        </button>
      </div>
      {/* Switch buttons */}
      {ministers.length > 1 && canSwitch && (
        <div className="flex gap-1">
          {ministers.map(
            (m, i) =>
              i !== activeIndex && (
                <button
                  key={m.id}
                  onClick={() => onSwitch?.(i)}
                  className="px-2 py-0.5 rounded text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer"
                >
                  {m.name}
                </button>
              ),
          )}
        </div>
      )}
    </div>
  );
}
