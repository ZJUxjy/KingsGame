interface TurnIndicatorProps {
  turnNumber: number;
  isMyTurn: boolean;
  /** @deprecated SidePanel owns the end-turn action; this prop is no longer used. */
  onEndTurn?: () => void;
}

export function TurnIndicator({ turnNumber, isMyTurn }: TurnIndicatorProps) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 text-center rounded px-2 py-1"
      style={{
        background: 'var(--turn-bg)',
        border: '1px solid var(--turn-border)',
      }}
    >
      <span style={{ fontSize: '10px', color: 'var(--turn-label)' }}>
        第{turnNumber}回合
      </span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          color: isMyTurn ? 'var(--turn-number)' : '#94a3b8',
        }}
      >
        {isMyTurn ? '你的回合' : '对方回合'}
      </span>
    </div>
  );
}
