import { useLocaleStore } from '../../stores/localeStore.js';

interface TurnIndicatorProps {
  turnNumber: number;
  isMyTurn: boolean;
}

export function TurnIndicator({ turnNumber, isMyTurn }: TurnIndicatorProps) {
  const locale = useLocaleStore((state) => state.locale);
  const turnLabel = locale === 'en-US' ? `Turn ${turnNumber}` : `第${turnNumber}回合`;
  const phaseLabel = isMyTurn
    ? locale === 'en-US' ? 'Your Turn' : '你的回合'
    : locale === 'en-US' ? 'Opponent Turn' : '对方回合';

  return (
    <div
      className="flex flex-col items-center gap-0.5 text-center rounded px-2 py-1"
      style={{
        background: 'var(--turn-bg)',
        border: '1px solid var(--turn-border)',
      }}
    >
      <span style={{ fontSize: '10px', color: 'var(--turn-label)' }}>
        {turnLabel}
      </span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          color: isMyTurn ? 'var(--turn-number)' : '#94a3b8',
        }}
      >
        {phaseLabel}
      </span>
    </div>
  );
}
