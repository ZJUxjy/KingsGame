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
  onSkillClick: (instanceId: string, skillIndex: number) => void;
}

export function GeneralSkillsPanel({
  generals,
  availableSkillKeys,
  pendingSkillKey,
  onSkillClick,
}: GeneralSkillsPanelProps) {
  const generalsWithSkills = generals.filter(
    (general) => (general.card.generalSkills?.length ?? 0) > 0,
  );

  if (generalsWithSkills.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-gray-900/70 border-y border-gray-800">
      {generalsWithSkills.map((general) => (
        <div key={general.instanceId} className="flex items-center gap-2 rounded bg-gray-800 px-2 py-1">
          <span className="text-xs font-bold text-rose-300">{general.card.name}</span>
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
                  onClick={() => onSkillClick(general.instanceId, skillIndex)}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${canUse
                    ? isPending
                      ? 'bg-rose-300 text-slate-900'
                      : 'bg-rose-700 text-rose-100 hover:bg-rose-600'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                >
                  {skill.name} ({skill.cost})
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}