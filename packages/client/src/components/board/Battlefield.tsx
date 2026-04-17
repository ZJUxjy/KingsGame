import { Fragment, memo } from 'react';
import type { CardInstance } from '@king-card/shared';
import { CardComponent } from './CardComponent.js';
import { InsertionSlot } from './InsertionSlot.js';

interface BattlefieldProps {
  minions: CardInstance[];
  isOpponent?: boolean;
  onMinionPointerDown?: (instanceId: string, isMine: boolean) => void;
  actionableIds?: Set<string>;
  selectedAttackerId?: string | null;
  validTargetIds?: Set<string>;
  hoveredTargetId?: string | null;
  onTargetHover?: (instanceId: string | null) => void;
  animationMap?: Map<string, string>;
  showInsertionSlots?: boolean;
  hoveredSlotIndex?: number | null;
  onSlotHover?: (index: number | null) => void;
}

function BattlefieldInner({
  minions,
  isOpponent = false,
  onMinionPointerDown,
  actionableIds,
  selectedAttackerId,
  validTargetIds,
  hoveredTargetId,
  onTargetHover,
  animationMap,
  showInsertionSlots,
  hoveredSlotIndex,
  onSlotHover,
}: BattlefieldProps) {
  const gap = minions.length >= 6 ? -12 : minions.length >= 5 ? -6 : minions.length >= 4 ? 2 : 10;

  return (
    <div
      className="h-full min-h-0 flex items-end justify-center px-4 transition-all duration-300"
      style={{ gap: `${gap}px` }}
    >
      {minions.length === 0 ? (
        showInsertionSlots && !isOpponent ? (
          <InsertionSlot
            index={0}
            highlighted={hoveredSlotIndex === 0}
            onHover={onSlotHover ?? (() => {})}
          />
        ) : (
          <div
            className="h-[172px] w-full max-w-[420px] rounded-3xl border border-dashed border-gray-700/80 bg-gray-900/35"
          />
        )
      ) : (
        minions.map((minion: CardInstance, i: number) => {
          const isSelected = minion.instanceId === selectedAttackerId;
          const isHoveredTarget = hoveredTargetId === minion.instanceId;
          const isTargetable = validTargetIds?.has(minion.instanceId) ?? false;
          const canAct = actionableIds?.has(minion.instanceId) ?? false;

          return (
            <Fragment key={minion.instanceId}>
              {showInsertionSlots && !isOpponent && (
                <InsertionSlot
                  index={i}
                  highlighted={hoveredSlotIndex === i}
                  onHover={onSlotHover ?? (() => {})}
                />
              )}
              <div
                data-anchor-id={`minion:${minion.instanceId}`}
                data-card-interactive="true"
                className="cursor-pointer transition-all duration-200 hover:-translate-y-1"
                onPointerDown={(e) => {
                  e.preventDefault();
                  onMinionPointerDown?.(minion.instanceId, !isOpponent);
                }}
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
                  size="battlefield"
                  useResponsiveBattlefieldSize
                  selected={isSelected}
                  actionable={canAct}
                  validTarget={isHoveredTarget}
                  animationClass={animationMap?.get(minion.instanceId)}
                />
              </div>
              {showInsertionSlots && !isOpponent && i === minions.length - 1 && (
                <InsertionSlot
                  index={i + 1}
                  highlighted={hoveredSlotIndex === i + 1}
                  onHover={onSlotHover ?? (() => {})}
                />
              )}
            </Fragment>
          );
        })
      )}
    </div>
  );
}

export const Battlefield = memo(BattlefieldInner);
