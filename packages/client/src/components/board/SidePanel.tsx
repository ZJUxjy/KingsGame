import { TurnIndicator } from './TurnIndicator.js';

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
            className="w-3.5 h-3.5 rotate-45 rounded-sm border"
            style={
              i < filled
                ? {
                    backgroundColor: 'var(--mana-border)',
                    borderColor: 'var(--mana-border)',
                    boxShadow: '0 0 6px var(--mana-glow)',
                  }
                : {
                    backgroundColor: 'rgba(30, 58, 138, 0.4)',
                    borderColor: 'rgba(96, 165, 250, 0.2)',
                  }
            }
          />
        ))}
      </div>
      <span style={{ fontSize: '10px', color: 'var(--mana-count)' }}>
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
        background: 'linear-gradient(180deg, var(--sidebar-bg-from) 0%, var(--sidebar-bg-to) 100%)',
        borderLeft: '1px solid var(--sidebar-border, rgba(255,255,255,0.08))',
        height: '100%',
      }}
    >
      {/* Enemy deck widget (top) */}
      <DeckWidget count={enemyDeckCount} side="enemy" />

      {/* Turn indicator */}
      <TurnIndicator turnNumber={turnNumber} isMyTurn={isMyTurn} />

      {/* Mana crystals */}
      <ManaCrystals filled={energyCrystal} max={maxEnergy} />

      {/* End-turn button */}
      <button
        onClick={onEndTurn}
        disabled={!isMyTurn}
        className="w-[90px] py-1.5 rounded text-xs font-bold btn-endturn"
      >
        结束回合
      </button>

      {/* Player deck widget (bottom) */}
      <DeckWidget count={playerDeckCount} side="player" />
    </div>
  );
}
