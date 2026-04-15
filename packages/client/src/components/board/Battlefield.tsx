import { CardComponent } from './CardComponent.js';

interface BattlefieldProps {
  minions: any[];
  isOpponent?: boolean;
  onMinionClick?: (instanceId: string, isMine: boolean) => void;
  selectedAttackerId?: string | null;
  validTargetIds?: Set<string>;
  onDrop?: (handIndex: number) => void;
}

const MAX_BOARD_SIZE = 7;

export function Battlefield({
  minions,
  isOpponent = false,
  onMinionClick,
  selectedAttackerId,
  validTargetIds,
  onDrop,
}: BattlefieldProps) {
  return (
    <div
      className={`h-[180px] flex items-center justify-center gap-2 px-4 ${isOpponent ? '' : ''}`}
      onDragOver={onDrop ? (e) => e.preventDefault() : undefined}
      onDrop={
        onDrop
          ? (e) => {
              e.preventDefault();
              const handIndex = Number(e.dataTransfer.getData('handIndex'));
              onDrop(handIndex);
            }
          : undefined
      }
    >
      {Array.from({ length: MAX_BOARD_SIZE }, (_, slotIndex) => {
        const minion = minions[slotIndex];
        if (minion) {
          const isSelected = minion.instanceId === selectedAttackerId;
          const isValidTarget = validTargetIds?.has(minion.instanceId) ?? false;
          return (
            <div
              key={minion.instanceId}
              className={`cursor-pointer transition-all duration-150 ${
                isSelected ? 'ring-2 ring-yellow-400 scale-105' : ''
              } ${isValidTarget ? 'ring-2 ring-red-500' : ''} hover:scale-105`}
              onClick={() => onMinionClick?.(minion.instanceId, !isOpponent)}
            >
              <CardComponent
                card={minion.card}
                instance={minion}
                selected={isSelected}
                validTarget={isValidTarget}
                onClick={() => onMinionClick?.(minion.instanceId, !isOpponent)}
              />
            </div>
          );
        }
        return (
          <div
            key={`empty-${slotIndex}`}
            className="w-[120px] h-[170px] border-2 border-dashed border-gray-600 rounded-lg"
          />
        );
      })}
    </div>
  );
}
