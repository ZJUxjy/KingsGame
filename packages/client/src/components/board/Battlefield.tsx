import { CardComponent } from './CardComponent.js';

interface BattlefieldProps {
  minions: any[];
  isOpponent?: boolean;
  onMinionClick?: (instanceId: string, isMine: boolean) => void;
  actionableIds?: Set<string>;
  selectedAttackerId?: string | null;
  validTargetIds?: Set<string>;
  hoveredTargetId?: string | null;
  onTargetHover?: (instanceId: string | null) => void;
  animationMap?: Map<string, string>;
}

export function Battlefield({
  minions,
  isOpponent = false,
  onMinionClick,
  actionableIds,
  selectedAttackerId,
  validTargetIds,
  hoveredTargetId,
  onTargetHover,
  animationMap,
}: BattlefieldProps) {
  const gap = minions.length >= 6 ? -12 : minions.length >= 5 ? -6 : minions.length >= 4 ? 2 : 10;

  return (
    <div
      className="h-[150px] flex items-end justify-center px-4 transition-all duration-300"
      style={{ gap: `${gap}px` }}
    >
      {minions.length === 0 ? (
        <div className="h-[130px] w-full max-w-[340px] rounded-3xl border border-dashed border-gray-700/80 bg-gray-900/35" />
      ) : (
        minions.map((minion: any) => {
          const isSelected = minion.instanceId === selectedAttackerId;
          const isHoveredTarget = hoveredTargetId === minion.instanceId;
          const isTargetable = validTargetIds?.has(minion.instanceId) ?? false;
          const canAct = actionableIds?.has(minion.instanceId) ?? false;

          return (
            <div
              key={minion.instanceId}
              data-anchor-id={`minion:${minion.instanceId}`}
              className="cursor-pointer transition-all duration-200 hover:-translate-y-1"
              onClick={() => onMinionClick?.(minion.instanceId, !isOpponent)}
              onPointerEnter={() => {
                if (isTargetable) {
                  onTargetHover?.(minion.instanceId);
                }
              }}
              onPointerLeave={() => {
                if (isHoveredTarget) {
                  onTargetHover?.(null);
                }
              }}
            >
              <CardComponent
                card={minion.card}
                instance={minion}
                selected={isSelected}
                actionable={canAct}
                validTarget={isHoveredTarget}
                animationClass={animationMap?.get(minion.instanceId)}
                onClick={() => onMinionClick?.(minion.instanceId, !isOpponent)}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
