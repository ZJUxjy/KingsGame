# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the KingsGame (帝王牌) client UI based on actual Figma design file ep607kXLjfpCwj64NDEK1G.

**Architecture:** Component-by-component refactoring introducing a right sidebar layout. Start with CSS tokens, build new SidePanel, refactor existing components, finally restructure GameBoard layout. All game logic, socket events, and store actions remain untouched — only visual/styling layers change.

**Tech Stack:** React 19, Tailwind CSS v4 (via @tailwindcss/vite), TypeScript 5.5, Vite 6

**Design Reference:** Figma Design file — https://www.figma.com/design/ep607kXLjfpCwj64NDEK1G/cardgame?node-id=0-3

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `packages/client/src/index.css` | Design tokens (CSS custom properties) |
| Create | `packages/client/src/components/board/SidePanel.tsx` | Right sidebar: deck, mana, turn, end-turn |
| Modify | `packages/client/src/components/board/CardComponent.tsx` | Card visual redesign with Figma specs |
| Modify | `packages/client/src/components/board/HeroPanel.tsx` | Hero portrait + health bar redesign |
| Modify | `packages/client/src/components/board/TurnIndicator.tsx` | Simplified (most logic moves to SidePanel) |
| Modify | `packages/client/src/components/board/Battlefield.tsx` | Battlefield spacing and card backs |
| Modify | `packages/client/src/components/board/HandZone.tsx` | Updated card back and hand styling |
| Modify | `packages/client/src/components/board/MinisterPanel.tsx` | Updated visual styling |
| Modify | `packages/client/src/components/board/GeneralSkillsPanel.tsx` | Updated visual styling |
| Modify | `packages/client/src/components/board/GameBoard.tsx` | Layout restructure with sidebar |
| Modify | `packages/client/src/components/board/index.ts` | Export new SidePanel |
| Modify | `packages/client/src/components/lobby/Lobby.tsx` | Background consistency |
| Modify | `packages/client/src/components/lobby/HeroSelect.tsx` | Updated styling |
| Modify | `packages/client/src/App.tsx` | GameOver screen background |

---

### Task 1: CSS Design Tokens

**Files:**
- Modify: `packages/client/src/index.css`

- [ ] **Step 1: Add CSS custom properties after `@import "tailwindcss";`**

Replace the entire file content:

```css
@import "tailwindcss";

/* ── Design Tokens (from Figma) ── */
:root {
  /* Board background */
  --board-bg-center: rgba(13, 27, 62, 1);
  --board-bg-mid: rgba(6, 13, 31, 1);
  --board-bg-edge: rgba(2, 8, 16, 1);

  /* Sidebar */
  --sidebar-bg-from: rgba(8, 14, 32, 0.7);
  --sidebar-bg-to: rgba(5, 10, 24, 0.85);
  --sidebar-border: rgba(148, 163, 184, 0.08);
  --sidebar-label: #45556c;

  /* Card */
  --card-body-from: #1a1a2e;
  --card-body-mid: #16213e;
  --card-body-to: #0f3460;
  --card-radius: 14px;
  --card-border-radius: 14px;

  /* Rarity borders (2px) */
  --rarity-common: #fe9a00;
  --rarity-rare: #fdc700;
  --rarity-epic: #c27aff;
  --rarity-legendary: #ff6b6b;

  /* Card type art gradients */
  --type-soldier-from: #78350f;
  --type-soldier-to: #92400e;
  --type-spell-from: #4c1d95;
  --type-spell-to: #3730a3;
  --type-general-from: #92400e;
  --type-general-to: #b45309;

  /* Card type badges */
  --badge-soldier: #e17100;
  --badge-spell: #9810fa;
  --badge-general: #d08700;

  /* Cost badge */
  --cost-border: #8ec5ff;
  --cost-glow: rgba(96, 165, 250, 0.8);

  /* Attack badge */
  --atk-from: #dc2626;
  --atk-to: #991b1b;
  --atk-border: #f87171;
  --atk-glow: rgba(220, 38, 38, 0.5);

  /* Health badge */
  --hp-from: #16a34a;
  --hp-to: #14532d;
  --hp-border: #4ade80;
  --hp-glow: rgba(22, 163, 74, 0.5);

  /* Health bar */
  --hpbar-from: #00bc7d;
  --hpbar-to: #05df72;
  --hpbar-glow: rgba(74, 222, 128, 0.6);
  --hpbar-bg: rgba(0, 0, 0, 0.5);
  --hpbar-border: rgba(255, 255, 255, 0.1);

  /* Hero portrait */
  --portrait-enemy-border: #a855f7;
  --portrait-enemy-glow: rgba(168, 85, 247, 0.6);
  --portrait-enemy-badge-bg: #4c1d95;
  --portrait-enemy-badge-border: #a855f7;
  --portrait-enemy-badge-text: #d8b4fe;
  --portrait-player-border: #f59e0b;
  --portrait-player-glow: rgba(245, 158, 11, 0.6);
  --portrait-player-badge-bg: #451a03;
  --portrait-player-badge-border: #f59e0b;
  --portrait-player-badge-text: #fcd34d;

  /* Mana crystal */
  --mana-border: #60a5fa;
  --mana-glow: rgba(96, 165, 250, 0.7);
  --mana-label: #51a2ff;
  --mana-count: #8ec5ff;

  /* Turn indicator */
  --turn-label: #fbbf24;
  --turn-number: #ffb900;
  --turn-border: rgba(251, 191, 36, 0.25);
  --turn-bg: rgba(10, 15, 35, 0.92);

  /* End turn button */
  --endturn-from: #dc2626;
  --endturn-mid: #991b1b;
  --endturn-to: #7f1d1d;
  --endturn-border: rgba(248, 113, 113, 0.35);
  --endturn-glow: rgba(220, 38, 38, 0.45);

  /* Skill button */
  --skill-from: #0ea5e9;
  --skill-to: #0369a1;
  --skill-border: rgba(14, 165, 233, 0.5);
  --skill-glow: rgba(14, 165, 233, 0.4);

  /* Midline divider */
  --midline-color: rgba(203, 213, 225, 0.35);
  --midline-glow: rgba(148, 163, 184, 0.15);

  /* Card back */
  --cardback-from: #1e2a4a;
  --cardback-to: #111827;
  --cardback-border: rgba(148, 163, 184, 0.18);
}

/* ── Animation keyframes ── */
@keyframes card-play-in {
  0% { opacity: 0; transform: translateY(-100px) scale(0.5); }
  60% { transform: translateY(10px) scale(1.05); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes attack-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

@keyframes death-fade {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.5) rotate(10deg); }
}

@keyframes damage-flash {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(2) saturate(0); }
}

@keyframes heal-glow {
  0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
  100% { box-shadow: 0 0 20px 10px rgba(74, 222, 128, 0); }
}

@keyframes fade-in-out {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes slide-up {
  0% { opacity: 0; transform: translate(-50%, 20px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes float-particle {
  0%, 100% { opacity: var(--star-opacity); transform: translateY(0); }
  50% { opacity: calc(var(--star-opacity) * 0.5); transform: translateY(-2px); }
}

.animate-fade-in-out { animation: fade-in-out 1.5s ease-in-out forwards; }
.animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
.animate-card-play { animation: card-play-in 0.4s ease-out forwards; }
.animate-attack { animation: attack-shake 0.3s ease-in-out; }
.animate-death { animation: death-fade 0.5s ease-in forwards; }
.animate-damage { animation: damage-flash 0.3s ease-in-out; }
.animate-heal { animation: heal-glow 0.6s ease-out forwards; }

.card-drag-shadow { box-shadow: 0 28px 48px rgba(15, 23, 42, 0.55); }
```

- [ ] **Step 2: Verify dev server compiles**

Run: `cd /home/xu/code/KingsGame && pnpm --filter client dev`
Expected: No CSS errors

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/index.css
git commit -m "refactor: update CSS design tokens based on Figma design"
```

---

### Task 2: SidePanel Component (NEW)

**Files:**
- Create: `packages/client/src/components/board/SidePanel.tsx`
- Modify: `packages/client/src/components/board/index.ts`

This is the biggest structural change — a 110px right sidebar containing: enemy deck, player deck, mana crystals, turn indicator, and end-turn button.

**Plan correction:** the bottom half must render a full player-deck widget with stacked card shapes and the `playerDeckCount` number. The current snippet stops at the `我方牌堆` label; implementation should mirror the enemy deck presentation so both deck counts remain visible in the sidebar.

- [ ] **Step 1: Create SidePanel.tsx**

```tsx
import { TurnIndicator } from './TurnIndicator.js';

interface SidePanelProps {
  enemyDeckCount: number;
  playerDeckCount: number;
  energyCrystal: number;
  maxEnergy: number;
  turnNumber: number;
  isMyTurn: boolean;
  onEndTurn: () => void;
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
      className="flex flex-col border-l shrink-0"
      style={{
        width: 110,
        background: `linear-gradient(to bottom, var(--sidebar-bg-from), var(--sidebar-bg-to))`,
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {/* ── Enemy deck (top half) ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <span
          className="text-[9px] font-normal tracking-[1.08px] whitespace-nowrap"
          style={{ color: 'var(--sidebar-label)' }}
        >
          敌方牌堆
        </span>
        <div
          className="relative rounded-[14px] flex flex-col items-center justify-center"
          style={{
            width: 51,
            height: 85,
            background: 'rgba(15,20,40,0.6)',
            border: '0.667px solid rgba(148,163,184,0.15)',
          }}
        >
          {/* Stacked card shapes */}
          <div className="relative w-5 h-[26px]">
            <div
              className="absolute top-0 left-0 w-5 h-[26px] rounded-[4px]"
              style={{
                background: 'linear-gradient(127deg, #334155, #1e293b)',
                border: '0.667px solid rgba(148,163,184,0.25)',
              }}
            />
            <div
              className="absolute top-0 left-[2px] w-5 h-[26px] rounded-[4px]"
              style={{
                background: 'rgba(30,41,59,0.5)',
                border: '0.667px solid rgba(148,163,184,0.25)',
              }}
            />
            <div
              className="absolute top-0 left-[4px] w-5 h-[26px] rounded-[4px]"
              style={{
                background: 'rgba(30,41,59,0.5)',
                border: '0.667px solid rgba(148,163,184,0.25)',
              }}
            />
          </div>
          <span className="text-white text-xl font-extrabold leading-5 mt-1">
            {enemyDeckCount}
          </span>
        </div>
      </div>

      {/* ── Midline accent ── */}
      <div className="flex flex-col items-center gap-0">
        <div
          className="h-px w-10"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.5), transparent)',
          }}
        />
      </div>

      {/* ── Turn indicator ── */}
      <div className="flex flex-col items-center py-2">
        <TurnIndicator
          turnNumber={turnNumber}
          isMyTurn={isMyTurn}
          onEndTurn={onEndTurn}
        />
      </div>

      {/* ── End turn button ── */}
      <div className="flex justify-center pb-1">
        <button
          onClick={onEndTurn}
          disabled={!isMyTurn}
          className="relative overflow-hidden rounded-[14px] text-white text-xs font-bold tracking-[0.48px] whitespace-nowrap"
          style={{
            width: 79,
            height: 35,
            background: isMyTurn
              ? 'linear-gradient(170deg, var(--endturn-from), var(--endturn-mid), var(--endturn-to))'
              : 'linear-gradient(170deg, #991b1b, #7f1d1d)',
            border: '0.667px solid var(--endturn-border)',
            boxShadow: isMyTurn
              ? '0px 0px 18px 0px var(--endturn-glow)'
              : 'none',
            cursor: isMyTurn ? 'pointer' : 'not-allowed',
            opacity: isMyTurn ? 1 : 0.5,
          }}
        >
          {/* Top shine */}
          <div
            className="absolute top-0 left-0 right-0 h-[15px] rounded-t-[14px]"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.13), transparent)',
            }}
          />
          结束回合
        </button>
      </div>

      {/* ── Midline accent 2 ── */}
      <div className="flex flex-col items-center">
        <div
          className="h-px w-10"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.5), transparent)',
          }}
        />
      </div>

      {/* ── Player side (bottom half) ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {/* Mana crystal widget */}
        <div
          className="rounded-[14px] flex flex-col items-center gap-2 p-3"
          style={{
            width: 84,
            background: 'rgba(15,20,50,0.6)',
            border: '0.667px solid rgba(96,165,250,0.15)',
          }}
        >
          <span
            className="text-[9px] font-normal tracking-[0.9px] whitespace-nowrap"
            style={{ color: 'var(--mana-label)' }}
          >
            法力水晶
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxEnergy }, (_, i) => (
              <div key={i} className="relative" style={{ width: 14, height: 14 }}>
                <div className="flex items-center justify-center">
                  <div
                    className="rounded-[6px]"
                    style={{
                      width: 14,
                      height: 14,
                      transform: 'rotate(45deg)',
                      border: i < energyCrystal
                        ? '0.667px solid var(--mana-border)'
                        : '0.667px solid rgba(96,165,250,0.25)',
                      background: i < energyCrystal
                        ? 'radial-gradient(circle, #93c5fd, #67a4fa, #3b82f6, #2c68e7, #1d4ed8)'
                        : 'rgba(15,20,50,0.4)',
                      boxShadow: i < energyCrystal
                        ? '0px 0px 8px 0px var(--mana-glow)'
                        : 'none',
                    }}
                  >
                    {i < energyCrystal && (
                      <div
                        className="absolute inset-0 rounded-[6px] blur-[1px]"
                        style={{
                          background: 'rgba(255,255,255,0.3)',
                          transform: 'rotate(45deg)',
                          width: 8,
                          height: 8,
                          top: 3,
                          left: 3,
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <span
              className="text-[11px] font-bold leading-4 whitespace-nowrap ml-1"
              style={{ color: 'var(--mana-count)' }}
            >
              {energyCrystal}/{maxEnergy}
            </span>
          </div>
        </div>

        {/* Player deck */}
        <span
          className="text-[9px] font-normal tracking-[1.08px] whitespace-nowrap"
          style={{ color: 'var(--sidebar-label)' }}
        >
          我方牌堆
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export SidePanel from index.ts**

Add to `packages/client/src/components/board/index.ts`:

```ts
export { CardComponent } from './CardComponent.js';
export { HeroPanel } from './HeroPanel.js';
export { EnergyBar } from './EnergyBar.js';
export { MinisterPanel } from './MinisterPanel.js';
export { GeneralSkillsPanel } from './GeneralSkillsPanel.js';
export { TurnIndicator } from './TurnIndicator.js';
export { Battlefield } from './Battlefield.js';
export { HandZone } from './HandZone.js';
export { SidePanel } from './SidePanel.js';
export { default as GameBoard } from './GameBoard.js';
export { default as GameOverlay } from './GameOverlay.js';
export { default as Toast } from './Toast.js';
```

- [ ] **Step 3: Verify compilation**

Run: `cd /home/xu/code/KingsGame && pnpm --filter client exec tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/components/board/SidePanel.tsx packages/client/src/components/board/index.ts
git commit -m "feat: add SidePanel component with deck, mana, turn, end-turn"
```

---

### Task 3: TurnIndicator Simplification

**Files:**
- Modify: `packages/client/src/components/board/TurnIndicator.tsx`

The TurnIndicator now renders inside the SidePanel in a compact format. It no longer has the end-turn button (moved to SidePanel).

**Plan correction:** until Task 8 wires `SidePanel` into `GameBoard`, keep the standalone `TurnIndicator` source-compatible for the live board by allowing it to render the legacy end-turn button when an `onEndTurn` callback is still passed from the old layout. Once Task 8 is complete, remove the standalone button path from `GameBoard`.

- [ ] **Step 1: Rewrite TurnIndicator.tsx**

```tsx
interface TurnIndicatorProps {
  turnNumber: number;
  isMyTurn: boolean;
  onEndTurn: () => void;
}

export function TurnIndicator({ turnNumber, isMyTurn }: Omit<TurnIndicatorProps, 'onEndTurn'>) {
  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{
        width: 69,
        height: 42,
        background: 'var(--turn-bg)',
        border: '0.667px solid var(--turn-border)',
        borderRadius: 14,
        boxShadow: '0px 0px 20px 0px rgba(0,0,0,0.6)',
      }}
    >
      <span
        className="text-[9px] font-normal leading-[13.5px] tracking-[1.08px] whitespace-nowrap opacity-75"
        style={{ color: 'var(--turn-number)' }}
      >
        第 {turnNumber} 回合
      </span>
      <span
        className="text-[10px] font-bold leading-[15px] whitespace-nowrap"
        style={{ color: 'var(--turn-label)' }}
      >
        {isMyTurn ? '你的回合' : '对方回合'}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/board/TurnIndicator.tsx
git commit -m "refactor: simplify TurnIndicator for sidebar embedding"
```

---

### Task 4: CardComponent Redesign

**Files:**
- Modify: `packages/client/src/components/board/CardComponent.tsx`

Complete visual overhaul based on Figma: new card body gradient, cost badge with blue glow, type-specific art area with icons, type badge pills, stat badges with gradients.

- [ ] **Step 1: Rewrite CardComponent.tsx**

```tsx
import type { Card, CardInstance, Rarity } from '@king-card/shared';

const RARITY_BORDER: Record<Rarity, string> = {
  COMMON: 'var(--rarity-common)',
  RARE: 'var(--rarity-rare)',
  EPIC: 'var(--rarity-epic)',
  LEGENDARY: 'var(--rarity-legendary)',
};

const TYPE_CONFIG: Record<string, {
  artFrom: string; artTo: string;
  badge: string; icon: string; label: string;
}> = {
  MINION: {
    artFrom: 'var(--type-soldier-from)', artTo: 'var(--type-soldier-to)',
    badge: 'var(--badge-soldier)', icon: '⚔', label: '兵卒',
  },
  SPELL: {
    artFrom: 'var(--type-spell-from)', artTo: 'var(--type-spell-to)',
    badge: 'var(--badge-spell)', icon: '✦', label: '法术',
  },
  GENERAL: {
    artFrom: 'var(--type-general-from)', artTo: 'var(--type-general-to)',
    badge: 'var(--badge-general)', icon: '♔', label: '武将',
  },
};

interface CardComponentProps {
  card?: Card;
  instance?: CardInstance;
  selected?: boolean;
  actionable?: boolean;
  validTarget?: boolean;
  animationClass?: string;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  className?: string;
  isHidden?: boolean;
}

export function CardComponent({
  card,
  instance,
  selected,
  actionable,
  validTarget,
  animationClass,
  onClick,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  className,
  isHidden,
}: CardComponentProps) {
  if (isHidden || !card) {
    return (
      <div
        className={`relative overflow-hidden select-none ${className ?? ''}`}
        style={{
          width: 90, height: 130,
          borderRadius: 12,
          background: 'linear-gradient(135deg, var(--cardback-from), var(--cardback-to))',
          border: '2px solid var(--cardback-border)',
          boxShadow: '0px 4px 14px 0px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute rounded-[10px]"
          style={{
            top: 8, left: 8, right: 8, bottom: 8,
            border: '0.667px solid rgba(148,163,184,0.12)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-15">
          <span className="text-[22px] text-black">✦</span>
        </div>
      </div>
    );
  }

  const borderColor = RARITY_BORDER[card.rarity] ?? 'var(--rarity-common)';
  const isMinion = card.type === 'MINION' || card.type === 'GENERAL';
  const atk = instance ? instance.currentAttack : card.attack ?? 0;
  const hp = instance ? instance.currentHealth : card.health ?? 0;
  const maxHp = instance ? instance.currentMaxHealth : card.health ?? 0;
  const typeKey = card.type === 'GENERAL' ? 'GENERAL' : card.type === 'SPELL' ? 'SPELL' : 'MINION';
  const typeCfg = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.MINION;

  return (
    <div
      className={`relative overflow-hidden select-none cursor-pointer transition-all duration-150
        hover:-translate-y-2 hover:scale-[1.04]
        ${selected ? 'ring-2 ring-yellow-400 scale-105' : ''}
        ${actionable ? 'shadow-[0_0_22px_rgba(74,222,128,0.55)] ring-1 ring-emerald-400/70' : ''}
        ${validTarget ? 'ring-2 ring-red-400 shadow-[0_0_26px_rgba(248,113,113,0.65)] animate-pulse' : ''}
        ${animationClass ?? ''} ${className ?? ''}`}
      style={{
        width: 90, height: 130,
        borderRadius: 'var(--card-border-radius)',
        background: `linear-gradient(153deg, var(--card-body-from) 8%, var(--card-body-mid) 50%, var(--card-body-to) 92%)`,
        border: `2px solid ${borderColor}`,
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.6)',
      }}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Cost badge (top-left, blue circle with glow) */}
      <div
        className="absolute flex items-center justify-center rounded-full z-10"
        style={{
          top: 6, left: 6,
          width: 24, height: 24,
          background: 'radial-gradient(circle, #60a5fa, #3f7ae9, #2e64e1, #1d4ed8, #1e44b1, #1e3a8a)',
          border: '0.667px solid var(--cost-border)',
          boxShadow: '0px 0px 8px 0px var(--cost-glow)',
        }}
      >
        <span className="text-[11px] font-extrabold text-white leading-none">{card.cost}</span>
      </div>

      {/* Art area (top ~45%) */}
      <div
        className="absolute overflow-hidden rounded-[10px]"
        style={{
          top: 4, left: 4, right: 4,
          height: 52,
          background: `linear-gradient(146deg, ${typeCfg.artFrom}, ${typeCfg.artTo})`,
        }}
      >
        {/* Type icon centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[22px] text-black leading-none">{typeCfg.icon}</span>
        </div>
        {/* Decorative overlay */}
        <div className="absolute inset-0 opacity-20" />
      </div>

      {/* Type badge pill */}
      <div className="absolute flex justify-center" style={{ top: 56, left: 0, right: 0 }}>
        <div
          className="rounded-[4px] flex items-center justify-center"
          style={{
            height: 12,
            width: 24,
            background: typeCfg.badge,
          }}
        >
          <span className="text-[8px] text-white font-normal leading-[12px]">{typeCfg.label}</span>
        </div>
      </div>

      {/* Card name */}
      <div className="absolute flex justify-center px-1" style={{ top: 68, left: 0, right: 0 }}>
        <span className="text-[10px] font-bold text-white leading-[12px] tracking-[0.5px] text-center whitespace-nowrap truncate max-w-full">
          {card.name}
        </span>
      </div>

      {/* Description */}
      {card.description && (
        <div className="absolute flex justify-center px-1" style={{ top: 82, left: 0, right: 0 }}>
          <span
            className="text-[7px] text-center leading-[9px] truncate max-w-full"
            style={{ color: 'rgba(203,213,225,0.7)' }}
          >
            {card.description}
          </span>
        </div>
      )}

      {/* Stat badges (attack/health) */}
      {isMinion && (
        <div
          className="absolute flex items-center justify-between px-1.5"
          style={{
            bottom: 2, left: 2, right: 2,
            height: 28,
            background: 'rgba(0,0,0,0.3)',
            borderTop: '0.667px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Attack badge */}
          <div
            className="flex items-center justify-center rounded-[4px]"
            style={{
              width: 20, height: 20,
              background: 'linear-gradient(135deg, var(--atk-from), var(--atk-to))',
              border: '0.667px solid var(--atk-border)',
              boxShadow: '0px 0px 6px 0px var(--atk-glow)',
            }}
          >
            <span className="text-[10px] font-extrabold text-white leading-none">{atk}</span>
          </div>
          {/* Health badge */}
          <div
            className="flex items-center justify-center rounded-[4px]"
            style={{
              width: 20, height: 20,
              background: `linear-gradient(135deg, ${hp < maxHp ? '#ef4444' : 'var(--hp-from)'}, ${hp < maxHp ? '#b91c1c' : 'var(--hp-to)'})`,
              border: `0.667px solid ${hp < maxHp ? '#fca5a5' : 'var(--hp-border)'}`,
              boxShadow: `0px 0px 6px 0px ${hp < maxHp ? 'rgba(239,68,68,0.5)' : 'var(--hp-glow)'}`,
            }}
          >
            <span className="text-[10px] font-extrabold text-white leading-none">{hp}</span>
          </div>
        </div>
      )}

      {/* Inner shine overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[var(--card-border-radius)]"
        style={{
          background: 'linear-gradient(112deg, rgba(255,255,255,0.07) 8%, transparent 50%)',
        }}
      />
      {/* Inner shadow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[var(--card-border-radius)]"
        style={{ boxShadow: 'inset 0px 0px 6px 0px rgba(255,255,255,0.03)' }}
      />

      {/* Garrison overlay */}
      {instance && instance.garrisonTurns > 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-[var(--card-border-radius)] z-20"
          style={{ background: 'rgba(30,58,138,0.6)' }}
        >
          <span className="text-blue-300 text-xs font-bold">驻守{instance.garrisonTurns}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /home/xu/code/KingsGame && pnpm --filter client exec tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/board/CardComponent.tsx
git commit -m "feat: redesign CardComponent based on Figma design"
```

---

### Task 5: HeroPanel Redesign

**Files:**
- Modify: `packages/client/src/components/board/HeroPanel.tsx`

52px portrait circle with gradient border, armor badge, green health bar with glow, skill button with blue gradient.

- [ ] **Step 1: Rewrite HeroPanel.tsx**

```tsx
interface HeroPanelProps {
  heroName: string;
  health: number;
  maxHealth: number;
  armor: number;
  skillName?: string;
  skillCost?: number;
  canUseSkill?: boolean;
  skillPending?: boolean;
  isOpponent?: boolean;
  targetable?: boolean;
  highlightedTarget?: boolean;
  targetAnchorId?: string;
  skillAnchorId?: string;
  onSkillClick?: () => void;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function HeroPanel({
  heroName,
  health,
  maxHealth,
  armor,
  skillName,
  skillCost,
  canUseSkill,
  skillPending,
  isOpponent,
  targetable,
  highlightedTarget,
  targetAnchorId,
  skillAnchorId,
  onSkillClick,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: HeroPanelProps) {
  const hpPercent = Math.max(0, (health / maxHealth) * 100);
  const isEnemy = isOpponent ?? false;

  const portraitBorder = isEnemy ? 'var(--portrait-enemy-border)' : 'var(--portrait-player-border)';
  const portraitGlow = isEnemy ? 'var(--portrait-enemy-glow)' : 'var(--portrait-player-glow)';
  const badgeBg = isEnemy ? 'var(--portrait-enemy-badge-bg)' : 'var(--portrait-player-badge-bg)';
  const badgeBorder = isEnemy ? 'var(--portrait-enemy-badge-border)' : 'var(--portrait-player-badge-border)';
  const badgeText = isEnemy ? 'var(--portrait-enemy-badge-text)' : 'var(--portrait-player-badge-text)';

  // Portrait gradient stops
  const portraitGradStops = isEnemy
    ? 'rgba(124,58,237,1), rgba(100,44,193,1) 25%, rgba(76,29,149,1) 50%, rgba(46,16,101,1)'
    : 'rgba(217,119,6,1), rgba(182,92,10,1) 25%, rgba(146,64,14,1) 50%, rgba(69,26,3,1)';

  return (
    <div
      data-anchor-id={targetAnchorId}
      className={`flex items-center gap-3 transition-all duration-150 ${targetable ? 'cursor-pointer' : ''} ${highlightedTarget ? 'ring-2 ring-red-400 shadow-[0_0_24px_rgba(248,113,113,0.5)]' : ''}`}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {/* Portrait circle */}
      <div className="relative" style={{ width: 52, height: 52 }}>
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 52, height: 52,
            border: `2px solid ${portraitBorder}`,
            boxShadow: `0px 0px 16px 0px ${portraitGlow}`,
            background: `radial-gradient(circle, ${portraitGradStops})`,
            padding: '15px 2px',
          }}
        >
          <span className="text-xl leading-none">{isEnemy ? '👤' : '👑'}</span>
        </div>
        {/* Inner shadow overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: 'inset 0px 0px 8px 0px rgba(0,0,0,0.4)' }}
        />
        {/* Armor badge */}
        {armor > 0 && (
          <div
            className="absolute flex items-center justify-center rounded-full"
            style={{
              bottom: -2, right: -2,
              width: 20, height: 20,
              background: badgeBg,
              border: `0.667px solid ${badgeBorder}`,
            }}
          >
            <span className="text-[9px] font-extrabold leading-none" style={{ color: badgeText }}>
              {armor <= 3 ? ['Ⅰ', 'Ⅱ', 'Ⅲ'][armor - 1] ?? armor : armor}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {/* Hero name */}
        <span className="text-[13px] font-bold text-white tracking-[0.65px] leading-5">
          {heroName}
        </span>

        {/* Health bar */}
        <div className="relative flex items-center gap-2">
          <div
            className="relative overflow-hidden"
            style={{
              width: 130, height: 10,
              background: 'var(--hpbar-bg)',
              border: '0.667px solid var(--hpbar-border)',
              borderRadius: 100,
            }}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: `${hpPercent}%`,
                height: 8.667,
                background: 'linear-gradient(to right, var(--hpbar-from), var(--hpbar-to))',
                borderRadius: 100,
                boxShadow: '0px 0px 8px 0px var(--hpbar-glow)',
              }}
            />
            <div
              className="absolute left-0 top-0"
              style={{
                width: `${hpPercent}%`,
                height: 8.667,
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent 60%)',
                borderRadius: 100,
              }}
            />
          </div>
          <span className="text-[11px] font-bold text-white leading-4 whitespace-nowrap">
            {health}/{maxHealth}
          </span>
        </div>

        {/* Skill button */}
        {!isOpponent && skillName && (
          <button
            data-anchor-id={skillAnchorId}
            onClick={onSkillClick}
            disabled={!canUseSkill}
            className="relative flex items-center gap-1.5 rounded-[10px] px-2 py-1"
            style={{
              background: canUseSkill
                ? 'linear-gradient(to right, var(--skill-from), var(--skill-to))'
                : 'rgba(30,30,50,0.6)',
              border: `0.667px solid ${canUseSkill ? 'var(--skill-border)' : 'rgba(148,163,184,0.15)'}`,
              boxShadow: canUseSkill ? '0px 0px 12px 0px var(--skill-glow)' : 'none',
              cursor: canUseSkill ? 'pointer' : 'not-allowed',
              opacity: canUseSkill ? 1 : 0.5,
            }}
          >
            <span className="text-[10px] font-semibold text-white leading-[15px]">
              {skillName}
            </span>
            {skillCost !== undefined && (
              <span
                className="text-[9px] font-semibold text-white leading-[13px] rounded-[4px] px-1"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                ({skillCost})
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/board/HeroPanel.tsx
git commit -m "feat: redesign HeroPanel with gradient portrait and glow health bar"
```

---

### Task 5A: MinisterPanel Styling Refresh

**Files:**
- Modify: `packages/client/src/components/board/MinisterPanel.tsx`

Refresh the minister area to match the redesigned board chrome while preserving the existing skill/switch behavior.

- [ ] **Step 1: Restyle MinisterPanel.tsx using the new token palette**

Requirements:
- Keep the same props and interaction flow.
- Replace the current flat gray container with a dark translucent panel that visually matches the lower player info bar.
- Restyle the active minister avatar/name block to align with the new HeroPanel/SidePanel language (rounded corners, subtle borders, layered shadows).
- Restyle the minister skill button to use the shared skill-button treatment (`--skill-from`, `--skill-to`, `--skill-border`, `--skill-glow`).
- Restyle switch buttons so inactive ministers remain clearly secondary but still readable against the new background.
- Preserve `data-anchor-id={skillAnchorId}` and all existing click behavior.

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/board/MinisterPanel.tsx
git commit -m "style: refresh MinisterPanel visuals for redesigned board"
```

---

### Task 5B: GeneralSkillsPanel Styling Refresh

**Files:**
- Modify: `packages/client/src/components/board/GeneralSkillsPanel.tsx`

Bring the general skill strip in line with the redesigned board without changing skill availability logic.

- [ ] **Step 1: Restyle GeneralSkillsPanel.tsx using the new token palette**

Requirements:
- Keep the same props and rendering conditions.
- Replace the current flat gray strip with a slimmer translucent band that sits comfortably between the battlefield and player info bar.
- Restyle each general group card with rounded corners, subtle borders, and readable typography against the dark navy board background.
- Restyle general skill buttons so available, pending, and disabled states remain distinct and accessible.
- Preserve all existing `data-anchor-id` values and click handlers.

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/board/GeneralSkillsPanel.tsx
git commit -m "style: refresh GeneralSkillsPanel visuals for redesigned board"
```

---

### Task 6: Battlefield Updates

**Files:**
- Modify: `packages/client/src/components/board/Battlefield.tsx`

Updated minion card sizes to match new CardComponent (90x130). Improved empty state with dashed border.

- [ ] **Step 1: Update Battlefield.tsx**

```tsx
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
  const gap = minions.length >= 6 ? -18 : minions.length >= 5 ? -10 : minions.length >= 4 ? 0 : 14;

  return (
    <div
      className="h-[180px] flex items-end justify-center px-4 transition-all duration-300"
      style={{ gap: `${gap}px` }}
    >
      {minions.length === 0 ? (
        <div
          className="h-[90px] w-full max-w-[676px] rounded-2xl"
          style={{
            border: '0.667px dashed rgba(148,163,184,0.08)',
            background: 'rgba(15,23,42,0.1)',
          }}
        />
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
                if (isTargetable) onTargetHover?.(minion.instanceId);
              }}
              onPointerLeave={() => {
                if (isHoveredTarget) onTargetHover?.(null);
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
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/board/Battlefield.tsx
git commit -m "refactor: update Battlefield for new card dimensions and empty state"
```

---

### Task 7: HandZone Updates

**Files:**
- Modify: `packages/client/src/components/board/HandZone.tsx`

Update card dimensions from 120x170 to 90x130. Update OpponentCardBack to match Figma card back design.

- [ ] **Step 1: Update dimensions in HandZone.tsx**

In the `HandZone` component, change all `width: 120, height: 170` references to `width: 90, height: 130`, and update margin offsets from `-60/-85` to `-45/-65`. Update hover lift from `-20` to `-15`. Update drag shadow. Update `DEFAULT_CONTAINER_WIDTH` from 800 to 700.

Specific changes in the map function:
- `width: 120,` → `width: 90,`
- `height: 170,` → `height: 130,`
- `marginLeft: isDragging ? 0 : -60,` → `marginLeft: isDragging ? 0 : -45,`
- `marginTop: isDragging ? 0 : -85,` → `marginTop: isDragging ? 0 : -65,`
- `translateY(${t.y - 20}px)` → `translateY(${t.y - 15}px)`
- `CONTAINER_HEIGHT = 180` → `CONTAINER_HEIGHT = 160`
- `shadow-[0_28px_48px_rgba(0,0,0,0.55)]` → `shadow-[0_20px_36px_rgba(0,0,0,0.55)]`

Update `OpponentCardBack`:

```tsx
function OpponentCardBack({ playable }: { playable: boolean }) {
  return (
    <div
      className={`relative overflow-hidden select-none transition-shadow duration-200
        ${playable ? 'shadow-[0_0_12px_2px_rgba(74,222,128,0.4)]' : ''}`}
      style={{
        width: 90, height: 130,
        borderRadius: 14,
        background: 'linear-gradient(135deg, var(--cardback-from), var(--cardback-to))',
        border: '2px solid var(--cardback-border)',
        boxShadow: playable ? undefined : '0px 4px 14px 0px rgba(0,0,0,0.5)',
      }}
    >
      <div
        className="absolute rounded-[10px]"
        style={{
          top: 8, left: 8, right: 8, bottom: 8,
          border: '0.667px solid rgba(148,163,184,0.12)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-15">
        <span className="text-[22px] text-black">✦</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/board/HandZone.tsx
git commit -m "refactor: update HandZone card dimensions and card back design"
```

---

### Task 8: GameBoard Layout Restructure

**Files:**
- Modify: `packages/client/src/components/board/GameBoard.tsx`

This is the biggest layout change — restructure to include the SidePanel on the right, remove inline deck/mana/turn indicators (they move to SidePanel), add star particle background, add glowing midline divider.

**Plan correction:** the replacement JSX must include a decorative star-particle layer behind the gameplay surfaces. Keep it purely visual (`pointer-events: none`) so no game interactions change.

- [ ] **Step 1: Update GameBoard.tsx imports**

Add `SidePanel` to imports:

```tsx
import { SidePanel } from './SidePanel.js';
```

- [ ] **Step 2: Replace the return JSX**

Replace the entire return block (starting from `if (!gameState)`) with:

```tsx
  // --- Early return ---
  if (!gameState) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400 text-xl">
        连接中...
      </div>
    );
  }

  const { me, opponent } = gameState;
  const myTurn = isMyTurn();

  // Merge dying minions back into battlefield for death animation
  const myDying = pendingRemovals.filter((m: any) => m.ownerIndex === playerIndex);
  const oppDying = pendingRemovals.filter((m: any) => m.ownerIndex !== playerIndex);
  const myBattlefield = [...(me.battlefield as any[]), ...myDying];
  const oppBattlefield = [...(opponent.battlefield as any[]), ...oppDying];

  const myHero = me.hero as any;
  const oppHero = opponent.hero as any;

  const myHeroName = myHero?.heroSkill?.name ?? myHero?.name ?? '帝王';
  const myHeroSkillName = myHero?.heroSkill?.name ?? '';
  const myHeroSkillCost = myHero?.heroSkill?.cost;
  const oppHeroName = oppHero?.heroSkill?.name ?? oppHero?.name ?? '帝王';
  const ministers = (me.ministerPool as any[]) ?? [];

  const enemyHeroHighlighted = hoveredTarget?.type === 'HERO'
    && playerIndex !== null
    && hoveredTarget.playerIndex === 1 - playerIndex;

  return (
    <div className="min-w-[1024px]">
    <div
      className="h-screen flex overflow-hidden relative"
      style={{
        background: 'radial-gradient(circle at 50% 0%, var(--board-bg-center), var(--board-bg-mid) 50%, var(--board-bg-edge))',
      }}
    >
      <TargetingArrow
        start={arrowStart}
        end={arrowEnd}
        visible={Boolean(arrowSourceAnchorId && arrowStart && arrowEnd)}
      />

      {/* ── Main game area ── */}
      <div className="flex-1 flex flex-col max-w-[1229px] mx-auto relative overflow-hidden">
        {/* Enemy hero bar */}
        <div className="flex items-center justify-between px-5 shrink-0" style={{ height: 80 }}>
          <HeroPanel
            heroName={oppHeroName}
            health={oppHero?.health ?? 30}
            maxHealth={oppHero?.maxHealth ?? 30}
            armor={oppHero?.armor ?? 0}
            isOpponent
            targetable={selectedAttacker ? canAttackHero : canTargetEnemyHero}
            highlightedTarget={enemyHeroHighlighted}
            targetAnchorId="hero:enemy"
            onClick={handleEnemyHeroClick}
            onPointerEnter={() => {
              if (playerIndex !== null && (selectedAttacker ? canAttackHero : canTargetEnemyHero)) {
                setHoveredTarget({ type: 'HERO', playerIndex: 1 - playerIndex });
              }
            }}
            onPointerLeave={() => {
              if (enemyHeroHighlighted) setHoveredTarget(null);
            }}
          />
        </div>

        {/* Enemy battlefield */}
        <div className="shrink-0" style={{ height: 148 }}>
          <Battlefield
            minions={oppBattlefield}
            isOpponent
            onMinionClick={handleMinionClick}
            selectedAttackerId={selectedAttacker}
            validTargetIds={activeTargetIds}
            hoveredTargetId={hoveredTarget?.type === 'MINION' ? hoveredTarget.instanceId : null}
            animationMap={animationMap}
            onTargetHover={(instanceId) => {
              setHoveredTarget(instanceId ? { type: 'MINION', instanceId } : null);
            }}
          />
        </div>

        {/* ── Glowing midline divider ── */}
        <div
          className="shrink-0 relative"
          style={{ height: 1 }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, var(--midline-glow) 15%, var(--midline-color) 50%, var(--midline-glow) 85%, transparent 100%)',
              boxShadow: '0px 0px 10px 0px var(--midline-glow)',
            }}
          />
        </div>

        {pendingSkillPrompt && (
          <div className="px-4 py-1 text-center text-sm font-bold text-cyan-300">
            {pendingSkillPrompt}
          </div>
        )}

        {/* Player battlefield */}
        <div className="shrink-0" style={{ height: 148 }}>
          <Battlefield
            minions={myBattlefield}
            onMinionClick={handleMinionClick}
            actionableIds={validAttackerIds}
            selectedAttackerId={selectedAttacker}
            validTargetIds={activeTargetIds}
            hoveredTargetId={hoveredTarget?.type === 'MINION' ? hoveredTarget.instanceId : null}
            animationMap={animationMap}
            onTargetHover={(instanceId) => {
              setHoveredTarget(instanceId ? { type: 'MINION', instanceId } : null);
            }}
          />
        </div>

        <GeneralSkillsPanel
          generals={(me.battlefield as any[]).filter((minion) => minion.card?.type === 'GENERAL')}
          availableSkillKeys={availableGeneralSkillKeys}
          pendingSkillKey={pendingGeneralSkillKey}
          onSkillClick={handleGeneralSkillClick}
        />

        {/* Player info bar */}
        <div
          className="shrink-0 px-5"
          style={{
            background: 'linear-gradient(to top, rgba(2,8,16,0.97), rgba(5,12,25,0.6))',
            borderTop: '0.667px solid rgba(148,163,184,0.08)',
          }}
        >
          <div className="flex items-center justify-between" style={{ height: 86 }}>
            <div className="flex items-center gap-4">
              <HeroPanel
                heroName={myHeroName}
                health={myHero?.health ?? 30}
                maxHealth={myHero?.maxHealth ?? 30}
                armor={myHero?.armor ?? 0}
                skillName={myHeroSkillName || undefined}
                skillCost={myHeroSkillCost}
                canUseSkill={canUseHeroSkill}
                skillPending={pendingSkillAction?.type === 'HERO'}
                targetAnchorId="hero:me"
                skillAnchorId="hero-skill:me"
                onSkillClick={handleHeroSkillClick}
              />
              <MinisterPanel
                ministers={ministers}
                activeIndex={me.activeMinisterIndex}
                canUseSkill={canUseMinisterSkill}
                skillPending={pendingSkillAction?.type === 'MINISTER'}
                canSwitch={validSwitchMinisters.size > 0}
                skillAnchorId="minister-skill:me"
                onSkillClick={handleMinisterSkillClick}
                onSwitch={switchMinister}
              />
            </div>
          </div>
        </div>

        {/* Player hand zone */}
        <div className="shrink-0" style={{ height: 160 }}>
          <HandZone
            cards={me.hand as any[]}
            onPlayCard={handlePlayCardFromHand}
            validPlayIndices={validPlayIndices}
          />
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <SidePanel
        enemyDeckCount={opponent.deckCount}
        playerDeckCount={me.deckCount}
        energyCrystal={me.energyCrystal}
        maxEnergy={me.maxEnergy}
        turnNumber={gameState.turnNumber}
        isMyTurn={myTurn}
        onEndTurn={endTurn}
      />

      {/* Turn transition overlay */}
      <GameOverlay text={overlayText ?? ''} visible={overlayText !== null} />
      <Toast />
    </div>
    </div>
  );
```

- [ ] **Step 3: Remove EnergyBar import from GameBoard** (it's now in SidePanel)

Remove this line from imports:
```tsx
import { EnergyBar } from './EnergyBar.js';
```

Also remove the `<EnergyBar ... />` usage and the deck count `<div>` that was inline.

- [ ] **Step 4: Remove old TurnIndicator from GameBoard** (it's now in SidePanel)

Remove this line from imports:
```tsx
import { TurnIndicator } from './TurnIndicator.js';
```

Remove the `<TurnIndicator ... />` JSX block.

- [ ] **Step 5: Verify compilation**

Run: `cd /home/xu/code/KingsGame && pnpm --filter client exec tsc --noEmit`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/components/board/GameBoard.tsx
git commit -m "feat: restructure GameBoard with right sidebar layout"
```

---

### Task 9: Lobby Screen Updates

**Files:**
- Modify: `packages/client/src/components/lobby/Lobby.tsx`

Update background to match the game board's dark navy gradient.

- [ ] **Step 1: Update Lobby.tsx background**

Change the outer div className from:
```
className="h-screen bg-gray-900 flex flex-col items-center justify-center"
```
to:
```
className="h-screen flex flex-col items-center justify-center"
style={{ background: 'radial-gradient(circle at 50% 0%, var(--board-bg-center), var(--board-bg-mid) 50%, var(--board-bg-edge))' }}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/lobby/Lobby.tsx
git commit -m "style: update Lobby background to match game board"
```

---

### Task 10: HeroSelect Updates

**Files:**
- Modify: `packages/client/src/components/lobby/HeroSelect.tsx`

- [ ] **Step 1: Update HeroSelect.tsx background**

Change the outer div className from:
```
className="h-screen bg-gray-900 flex flex-col items-center justify-center"
```
to:
```
className="h-screen flex flex-col items-center justify-center"
style={{ background: 'radial-gradient(circle at 50% 0%, var(--board-bg-center), var(--board-bg-mid) 50%, var(--board-bg-edge))' }}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/lobby/HeroSelect.tsx
git commit -m "style: update HeroSelect background to match game board"
```

---

### Task 11: GameOverScreen Updates

**Files:**
- Modify: `packages/client/src/App.tsx`

- [ ] **Step 1: Update GameOverScreen background**

Change the GameOverScreen div from:
```
className="h-screen bg-gray-900 flex flex-col items-center justify-center"
```
to:
```
className="h-screen flex flex-col items-center justify-center"
style={{ background: 'radial-gradient(circle at 50% 0%, var(--board-bg-center), var(--board-bg-mid) 50%, var(--board-bg-edge))' }}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/App.tsx
git commit -m "style: update GameOverScreen background to match game board"
```

---

### Task 12: Integration Verification

- [ ] **Step 1: Run full type check**

Run: `cd /home/xu/code/KingsGame && pnpm --filter client exec tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Start dev server and visually verify**

Run: `cd /home/xu/code/KingsGame && pnpm --filter client dev`

Check:
- [ ] Right sidebar displays correctly with deck counts, mana crystals, turn info
- [ ] Cards show rarity-colored borders, type icons, cost badges with blue glow
- [ ] Hero portraits have gradient borders (purple for enemy, amber for player)
- [ ] Health bars glow green
- [ ] Midline divider has subtle glow
- [ ] Background is dark navy gradient
- [ ] End turn button has red gradient with glow
- [ ] Card backs show ✦ pattern
- [ ] Hand cards fan correctly with new dimensions
- [ ] All game interactions still work (play card, attack, skills)

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: integration fixes after UI redesign"
```
