interface GeneralSkillsPanelProps {
  generals: Array<{
    instanceId: string;
    card: {
      name: string;
      generalSkills?: Array<{
        name: string;
        cost: number;
      }>;
    };
  }>;
  availableSkillKeys: Set<string>;
  pendingSkillKey: string | null;
  onSkillPointerDown: (instanceId: string, skillIndex: number) => void;
}

export function GeneralSkillsPanel({
  generals,
  availableSkillKeys,
  pendingSkillKey,
  onSkillPointerDown,
}: GeneralSkillsPanelProps) {
  const generalsWithSkills = generals.filter(
    (general) => (general.card.generalSkills?.length ?? 0) > 0,
  );

  if (generalsWithSkills.length === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-3 py-1"
      style={{
        background: 'rgba(8, 12, 28, 0.65)',
        borderTop: '1px solid rgba(148, 163, 184, 0.07)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.07)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {generalsWithSkills.map((general) => (
        <div
          key={general.instanceId}
          className="flex items-center gap-1.5 rounded-lg px-2 py-0.5"
          style={{
            background: 'rgba(15, 20, 45, 0.7)',
            border: '1px solid rgba(244, 63, 94, 0.18)',
          }}
        >
          <span className="text-[10px] font-bold" style={{ color: '#fda4af' }}>
            {general.card.name}
          </span>
          <div className="flex flex-wrap gap-1">
            {general.card.generalSkills!.map((skill, skillIndex) => {
              const skillKey = `${general.instanceId}:${skillIndex}`;
              const canUse = availableSkillKeys.has(skillKey);
              const isPending = pendingSkillKey === skillKey;

              return (
                <button
                  key={skillKey}
                  type="button"
                  data-anchor-id={`general-skill:${general.instanceId}:${skillIndex}`}
                  disabled={!canUse}
                  onPointerDown={(e) => { e.preventDefault(); onSkillPointerDown(general.instanceId, skillIndex); }}
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition-all duration-150${isPending && canUse ? ' general-skill-pending' : ''}`}
                  style={
                    canUse
                      ? {
                          background: isPending
                            ? `linear-gradient(135deg, var(--general-skill-pending-from), var(--general-skill-pending-to))`
                            : `linear-gradient(135deg, var(--general-skill-from), var(--general-skill-to))`,
                          color: isPending ? 'var(--general-skill-pending-text)' : 'var(--general-skill-text)',
                          border: `1px solid var(--general-skill-border)`,
                          boxShadow: isPending ? undefined : `0 0 4px var(--general-skill-glow)`,
                          cursor: 'pointer',
                        }
                      : {
                          background: '#1f2937',
                          color: '#6b7280',
                          border: '1px solid transparent',
                          cursor: 'not-allowed',
                        }
                  }
                >
                  {skill.name}({skill.cost})
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
