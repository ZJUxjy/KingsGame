export interface SidePanelProps {
  enemyDeckCount: number;
  playerDeckCount: number;
  energyCrystal: number;
  maxEnergy: number;
  turnNumber: number;
  isMyTurn: boolean;
  onEndTurn: () => void;
}

function DeckWidget({ count, side }: { count: number; side: 'enemy' | 'player' }) {
  return (
    <div
      data-deck-widget={side}
      className="flex flex-col items-center gap-1"
    >
      {/* Stacked card shapes */}
      <div className="relative w-10 h-14">
        <div className="absolute inset-0 translate-x-1 -translate-y-1 rounded bg-white/5 border border-white/10" />
        <div className="absolute inset-0 translate-x-0.5 -translate-y-0.5 rounded bg-white/8 border border-white/10" />
        <div className="absolute inset-0 rounded bg-slate-700 border border-white/15 flex items-center justify-center">
          <span className="text-base font-bold text-white leading-none">{count}</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-400">{side === 'enemy' ? '敌方牌库' : '我方牌库'}</span>
    </div>
  );
}

function ManaCrystals({ filled, max }: { filled: number; max: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex flex-wrap justify-center gap-1 w-full px-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            data-mana={i < filled ? 'filled' : 'empty'}
            className={`w-3.5 h-3.5 rotate-45 rounded-sm border ${
              i < filled
                ? 'bg-blue-500 border-blue-400'
                : 'bg-blue-950 border-blue-800/50'
            }`}
            style={i < filled ? { boxShadow: '0 0 6px rgba(59,130,246,0.7)' } : undefined}
          />
        ))}
      </div>
      <span className="text-[10px] text-slate-400">
        {filled}/{max}
      </span>
    </div>
  );
}

export function SidePanel({
  enemyDeckCount,
  playerDeckCount,
  energyCrystal,
  maxEnergy,
  turnNumber,
  isMyTurn,
  onEndTurn,
}: SidePanelProps) {
  return (
    <div
      className="flex flex-col items-center justify-between py-3 gap-2"
      style={{
        width: 'var(--sidebar-width, 110px)',
        background: 'var(--sidebar-bg, linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(10,15,28,0.92) 100%))',
        borderLeft: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))',
        height: '100%',
      }}
    >
      {/* Enemy deck widget (top) */}
      <DeckWidget count={enemyDeckCount} side="enemy" />

      {/* Turn info */}
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[10px] text-slate-500">第{turnNumber}回合</span>
        <span
          className={`text-[11px] font-bold ${isMyTurn ? 'text-yellow-400' : 'text-slate-400'}`}
        >
          {isMyTurn ? '你的回合' : '对方回合'}
        </span>
      </div>

      {/* Mana crystals */}
      <ManaCrystals filled={energyCrystal} max={maxEnergy} />

      {/* End-turn button */}
      <button
        onClick={onEndTurn}
        disabled={!isMyTurn}
        className={`w-[90px] py-1.5 rounded text-xs font-bold transition-colors duration-150 ${
          isMyTurn
            ? 'bg-red-800 hover:bg-red-600 text-white cursor-pointer'
            : 'cursor-not-allowed text-slate-500'
        }`}
        style={
          isMyTurn
            ? { boxShadow: 'var(--end-turn-glow, 0 0 12px rgba(220,38,38,0.6))', backgroundColor: 'var(--end-turn-bg-active)' }
            : { backgroundColor: 'var(--end-turn-disabled-bg, #374151)', color: 'var(--end-turn-disabled-color, #6b7280)' }
        }
      >
        结束回合
      </button>

      {/* Player deck widget (bottom) */}
      <DeckWidget count={playerDeckCount} side="player" />
    </div>
  );
}
