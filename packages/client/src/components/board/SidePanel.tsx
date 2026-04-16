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
      {/* Stacked card shapes — ~51×85px shell */}
      <div className="relative" style={{ width: 51, height: 68 }}>
        <div
          className="absolute rounded border border-white/10"
          style={{
            inset: 0,
            transform: 'translate(3px, -3px)',
            background: 'rgba(255,255,255,0.04)',
          }}
        />
        <div
          className="absolute rounded border border-white/10"
          style={{
            inset: 0,
            transform: 'translate(1.5px, -1.5px)',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
        <div
          className="absolute inset-0 rounded border border-white/15 flex items-center justify-center"
          style={{ background: 'var(--cardback-from)' }}
        >
          <span className="text-lg font-bold text-white leading-none">{count}</span>
        </div>
      </div>
      <span className="text-[10px]" style={{ color: 'var(--sidebar-label)' }}>
        {side === 'enemy' ? '敌方牌库' : '我方牌库'}
      </span>
    </div>
  );
}

function MidlineDivider() {
  return (
    <div
      data-midline-divider
      className="w-full px-2"
      aria-hidden="true"
    >
      <div
        style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, var(--midline-color) 50%, transparent 100%)',
          boxShadow: '0 0 6px var(--midline-glow)',
        }}
      />
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
        width: 'var(--sidebar-width)',
        background: 'linear-gradient(180deg, var(--sidebar-bg-from) 0%, var(--sidebar-bg-to) 100%)',
        borderLeft: '1px solid var(--sidebar-border)',
        height: '100%',
      }}
    >
      {/* Enemy deck widget (top) */}
      <DeckWidget count={enemyDeckCount} side="enemy" />

      <MidlineDivider />

      {/* Turn indicator — display-only; no onEndTurn passed */}
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

      <MidlineDivider />

      {/* Player deck widget (bottom) */}
      <DeckWidget count={playerDeckCount} side="player" />
    </div>
  );
}
