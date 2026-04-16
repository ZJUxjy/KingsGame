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
  skillPending?: boolean;
  canSwitch?: boolean;
  skillAnchorId?: string;
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
  skillPending,
  canSwitch,
  skillAnchorId,
  onSkillClick,
  onSwitch,
}: MinisterPanelProps) {
  const active = ministers[activeIndex];
  if (!active) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Active minister block */}
      <div
        className="flex items-center gap-2 rounded-lg px-2 py-1"
        style={{
          background: 'rgba(10, 15, 35, 0.75)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          backdropFilter: 'blur(4px)',
        }}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--portrait-player-badge-bg), #7c2d12)',
            border: '1.5px solid var(--portrait-player-border)',
            boxShadow: '0 0 6px var(--portrait-player-glow)',
          }}
        >
          📜
        </div>
        {/* Name / type */}
        <div className="flex flex-col min-w-0">
          <span
            className="text-[11px] font-bold truncate"
            style={{ color: 'var(--portrait-player-badge-text)' }}
          >
            {active.name}
          </span>
          <span className="text-[9px] text-gray-400">
            {TYPE_LABELS[active.type] ?? active.type}
          </span>
        </div>
        {/* Skill button */}
        <button
          data-anchor-id={skillAnchorId}
          onClick={onSkillClick}
          disabled={!canUseSkill}
          className={`px-2 py-0.5 rounded text-[10px] font-bold text-white transition-all duration-150${skillPending ? ' skill-pending' : ''}`}
          style={
            canUseSkill
              ? {
                  background: 'linear-gradient(135deg, var(--skill-from), var(--skill-to))',
                  border: '1px solid var(--skill-border)',
                  boxShadow: skillPending ? undefined : '0 0 6px var(--skill-glow)',
                  cursor: 'pointer',
                }
              : {
                  background: '#374151',
                  color: '#9ca3af',
                  border: '1px solid transparent',
                  cursor: 'not-allowed',
                }
          }
        >
          {active.activeSkill.name}({active.activeSkill.cost})
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
                  className="px-2 py-0.5 rounded text-[10px] text-gray-400 cursor-pointer transition-colors duration-150 hover:text-gray-200"
                  style={{
                    background: 'rgba(10, 15, 35, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                  }}
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
