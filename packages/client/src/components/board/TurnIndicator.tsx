interface TurnIndicatorProps {
  turnNumber: number;
  isMyTurn: boolean;
  /** @deprecated SidePanel owns the end-turn action; this prop is no longer used. */
  onEndTurn?: () => void;
}

export function TurnIndicator({ turnNumber, isMyTurn }: TurnIndicatorProps) {
  return (
    <div className="flex items-center justify-center h-[50px] bg-gray-800/50 border-y border-gray-700">
      <span
        className={`text-lg font-bold ${isMyTurn ? 'text-yellow-400' : 'text-gray-400'}`}
      >
        第{turnNumber}回合 &middot; {isMyTurn ? '你的回合' : '对方回合'}
      </span>
    </div>
  );
}
