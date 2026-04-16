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
  onSkillPointerDown?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  panelTestId?: string;
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
  onSkillPointerDown,
  onPointerEnter,
  onPointerLeave,
  panelTestId,
}: HeroPanelProps) {
  const hpPercent = Math.max(0, (health / maxHealth) * 100);
  const hpState = hpPercent < 25 ? 'danger' : hpPercent < 50 ? 'warn' : 'normal';
  const hpBarFrom =
    hpState === 'danger' ? 'var(--hpbar-danger-from)' :
    hpState === 'warn'   ? 'var(--hpbar-warn-from)' :
    'var(--hpbar-from)';
  const hpBarTo =
    hpState === 'danger' ? 'var(--hpbar-danger-to)' :
    hpState === 'warn'   ? 'var(--hpbar-warn-to)' :
    'var(--hpbar-to)';
  const hpBarGlow =
    hpState === 'danger' ? 'var(--hpbar-danger-glow)' :
    hpState === 'warn'   ? 'var(--hpbar-warn-glow)' :
    'var(--hpbar-glow)';
  const portraitBorder = isOpponent ? 'var(--portrait-enemy-border)' : 'var(--portrait-player-border)';
  const portraitGlow = isOpponent ? 'var(--portrait-enemy-glow)' : 'var(--portrait-player-glow)';
  const portraitBg = isOpponent
    ? 'linear-gradient(135deg, var(--portrait-enemy-badge-bg) 0%, #2d1b69 100%)'
    : 'linear-gradient(135deg, var(--portrait-player-badge-bg) 0%, #7c2d12 100%)';
  const nameColor = isOpponent ? 'var(--portrait-enemy-badge-text)' : 'var(--portrait-player-badge-text)';

  return (
    <div
      data-testid={panelTestId ?? (isOpponent ? 'hero-panel-enemy' : 'hero-panel-player')}
      data-hero-panel={isOpponent ? 'opponent' : 'player'}
      data-targetable={targetable ? 'true' : 'false'}
      data-anchor-id={targetAnchorId}
      data-card-interactive="true"
      className={`h-full flex items-center transition-all duration-150
        ${targetable ? 'cursor-pointer' : ''}
        ${highlightedTarget ? 'ring-2 ring-red-400 shadow-[0_0_24px_rgba(248,113,113,0.5)] rounded-xl' : ''}`}
      style={{
        gap: 'clamp(8px, 1.2vw, 16px)',
        padding: 'clamp(6px, 1.2vh, 14px) clamp(8px, 1.2vw, 16px)',
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Portrait circle */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center"
        style={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: portraitBg,
          border: `2px solid ${portraitBorder}`,
          boxShadow: `0 0 12px ${portraitGlow}`,
        }}
      >
        <span style={{ fontSize: 22 }}>👑</span>
        {/* Armor badge */}
        {armor > 0 && (
          <div
            className="absolute flex items-center justify-center text-[9px] font-bold text-blue-200"
            style={{
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#1e3a8a',
              border: '1.5px solid #60a5fa',
              transform: 'translate(25%, 25%)',
            }}
          >
            {armor}
          </div>
        )}
      </div>

      {/* Info column */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-xs font-bold truncate" style={{ color: nameColor }}>
          {heroName}
        </span>
        {/* Glowing health bar */}
        <div>
          <div
            className="relative w-full rounded-full overflow-hidden"
            style={{
              height: 6,
              background: 'var(--hpbar-bg)',
              border: '1px solid var(--hpbar-border)',
            }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${hpPercent}%`,
                background: `linear-gradient(90deg, ${hpBarFrom} 0%, ${hpBarTo} 100%)`,
                boxShadow: `0 0 6px ${hpBarGlow}`,
              }}
            />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-white font-bold">
              {health}/{maxHealth}
            </span>
            {armor > 0 && (
              <span className="text-[10px] text-blue-300">🛡{armor}</span>
            )}
          </div>
        </div>
      </div>

      {/* Skill button (player only) */}
      {!isOpponent && skillName && (
        <button
          type="button"
          data-anchor-id={skillAnchorId}
          data-card-interactive="true"
          onPointerDown={(e) => { e.preventDefault(); onSkillPointerDown?.(); }}
          disabled={!canUseSkill}
          className={`flex-shrink-0 px-2 py-1 text-[10px] font-bold text-white rounded transition-all duration-150${skillPending && canUseSkill ? ' skill-pending' : ''}`}
          style={
            canUseSkill
              ? {
                  background: 'linear-gradient(135deg, var(--skill-from), var(--skill-to))',
                  border: '1px solid var(--skill-border)',
                  boxShadow: skillPending ? undefined : '0 0 8px var(--skill-glow)',
                  cursor: 'pointer',
                }
              : {
                  background: '#374151',
                  border: '1px solid transparent',
                  color: '#6b7280',
                  cursor: 'not-allowed',
                }
          }
        >
          {skillName}
          <br />
          <span className="text-[8px]">({skillCost})</span>
        </button>
      )}
    </div>
  );
}
