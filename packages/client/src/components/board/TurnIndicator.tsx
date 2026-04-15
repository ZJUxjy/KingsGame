interface TurnIndicatorProps {
  turnNumber: number;
  isMyTurn: boolean;
  onEndTurn: () => void;
}

export function TurnIndicator({ turnNumber, isMyTurn, onEndTurn }: TurnIndicatorProps) {
  return (
    <div className="flex items-center justify-center h-[50px] bg-gray-800/50 border-y border-gray-700">
      <span
        className={`text-lg font-bold ${isMyTurn ? 'text-yellow-400' : 'text-gray-400'}`}
      >
        第{turnNumber}回合 &middot; {isMyTurn ? '你的回合' : '对方回合'}
      </span>
      <button
        onClick={onEndTurn}
        disabled={!isMyTurn}
        className={`ml-6 px-6 py-1 rounded-lg text-sm font-bold
          ${isMyTurn
            ? 'bg-red-700 hover:bg-red-600 cursor-pointer'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
          transition-colors duration-150`}
      >
        结束回合
      </button>
    </div>
  );
}
