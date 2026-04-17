# UI Quality & Interaction Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor GameBoard.tsx into focused hooks, fix type safety and performance issues, add drag snap-back animation and board position selection.

**Architecture:** Extract `useTargeting` and `useDerivedActions` hooks from the 717-line GameBoard.tsx. Add React.memo to leaf components. Fix `any[]` types, add ErrorBoundary. Enhance drag-to-play with snap-back animation and battlefield insertion slots.

**Tech Stack:** React 19, Zustand 5, TypeScript, Tailwind CSS, Vitest, @testing-library/react

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `packages/client/src/hooks/useTargeting.ts` | Arrow tracking, pointer handlers, escape key, global pointerup |
| Create | `packages/client/src/hooks/useDerivedActions.ts` | Compute validPlayIndices, validAttackerIds, etc. from validActions |
| Create | `packages/client/src/components/board/ErrorBoundary.tsx` | Catch render errors in game board subtree |
| Create | `packages/client/src/components/board/InsertionSlot.tsx` | Glowing gap indicator for board position selection |
| Create | `packages/client/test/hooks/useTargeting.test.tsx` | Tests for targeting hook |
| Create | `packages/client/test/hooks/useDerivedActions.test.ts` | Tests for derived actions hook |
| Create | `packages/client/test/components/board/ErrorBoundary.test.tsx` | Tests for error boundary |
| Modify | `packages/client/src/components/board/GameBoard.tsx` | Slim down to ~400 lines using extracted hooks |
| Modify | `packages/client/src/components/board/Battlefield.tsx` | Fix `any[]` types, add React.memo, insertion slots |
| Modify | `packages/client/src/components/board/HandZone.tsx` | Fix `any[]` types, add React.memo, snap-back animation, state-driven hover |
| Modify | `packages/client/src/components/board/CardComponent.tsx` | Add React.memo |

---

### Task 1: Extract `useDerivedActions` hook

**Files:**
- Create: `packages/client/src/hooks/useDerivedActions.ts`
- Create: `packages/client/test/hooks/useDerivedActions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/client/test/hooks/useDerivedActions.test.ts
import { describe, it, expect } from 'vitest';
import { deriveSets, type DerivedActionSets } from '../../src/hooks/useDerivedActions.js';
import type { ValidAction } from '@king-card/shared';

describe('deriveSets', () => {
  it('returns empty sets when validActions is empty', () => {
    const result = deriveSets([], null);
    expect(result.validPlayIndices.size).toBe(0);
    expect(result.validAttackerIds.size).toBe(0);
    expect(result.attackTargetIds.size).toBe(0);
    expect(result.canUseHeroSkill).toBe(false);
    expect(result.canUseMinisterSkill).toBe(false);
    expect(result.canAttackHero).toBe(false);
    expect(result.validSwitchMinisters.size).toBe(0);
    expect(result.availableGeneralSkillKeys.size).toBe(0);
  });

  it('collects PLAY_CARD hand indices', () => {
    const actions: ValidAction[] = [
      { type: 'PLAY_CARD', handIndex: 0 },
      { type: 'PLAY_CARD', handIndex: 2 },
    ];
    const result = deriveSets(actions, null);
    expect(result.validPlayIndices).toEqual(new Set([0, 2]));
  });

  it('collects ATTACK attacker IDs and target IDs for selected attacker', () => {
    const actions: ValidAction[] = [
      { type: 'ATTACK', attackerInstanceId: 'a1', targetInstanceId: 'e1' },
      { type: 'ATTACK', attackerInstanceId: 'a1', targetInstanceId: 'HERO' },
      { type: 'ATTACK', attackerInstanceId: 'a2', targetInstanceId: 'e1' },
    ];
    const result = deriveSets(actions, 'a1');
    expect(result.validAttackerIds).toEqual(new Set(['a1', 'a2']));
    expect(result.attackTargetIds).toEqual(new Set(['e1']));
    expect(result.canAttackHero).toBe(true);
  });

  it('detects hero skill, minister skill, general skill keys', () => {
    const actions: ValidAction[] = [
      { type: 'USE_HERO_SKILL' },
      { type: 'USE_MINISTER_SKILL' },
      { type: 'USE_GENERAL_SKILL', instanceId: 'g1', skillIndex: 0 },
      { type: 'USE_GENERAL_SKILL', instanceId: 'g1', skillIndex: 1 },
    ];
    const result = deriveSets(actions, null);
    expect(result.canUseHeroSkill).toBe(true);
    expect(result.canUseMinisterSkill).toBe(true);
    expect(result.availableGeneralSkillKeys).toEqual(new Set(['g1:0', 'g1:1']));
  });

  it('collects SWITCH_MINISTER indices', () => {
    const actions: ValidAction[] = [
      { type: 'SWITCH_MINISTER', ministerIndex: 1 },
      { type: 'SWITCH_MINISTER', ministerIndex: 2 },
    ];
    const result = deriveSets(actions, null);
    expect(result.validSwitchMinisters).toEqual(new Set([1, 2]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @king-card/client test -- --run test/hooks/useDerivedActions.test.ts`
Expected: FAIL — module `../../src/hooks/useDerivedActions.js` not found.

- [ ] **Step 3: Write implementation**

```ts
// packages/client/src/hooks/useDerivedActions.ts
import { useMemo } from 'react';
import type { ValidAction } from '@king-card/shared';
import type { TargetRef } from '@king-card/shared';

export interface DerivedActionSets {
  validPlayIndices: Set<number>;
  validAttackerIds: Set<string>;
  attackTargetIds: Set<string>;
  canUseHeroSkill: boolean;
  canUseMinisterSkill: boolean;
  validSwitchMinisters: Set<number>;
  canAttackHero: boolean;
  availableGeneralSkillKeys: Set<string>;
}

export function deriveSets(
  validActions: ValidAction[],
  selectedAttacker: string | null,
): DerivedActionSets {
  const playIndices = new Set<number>();
  const attackerIds = new Set<string>();
  const targetIds = new Set<string>();
  let heroSkill = false;
  let ministerSkill = false;
  const switchIndices = new Set<number>();
  let attackHero = false;
  const generalSkillKeys = new Set<string>();

  for (const action of validActions) {
    switch (action.type) {
      case 'PLAY_CARD':
        playIndices.add(action.handIndex as number);
        break;
      case 'ATTACK':
        attackerIds.add(action.attackerInstanceId as string);
        if (
          selectedAttacker &&
          (action.attackerInstanceId as string) === selectedAttacker
        ) {
          const tid = action.targetInstanceId as string;
          if (tid === 'HERO') {
            attackHero = true;
          } else {
            targetIds.add(tid);
          }
        }
        break;
      case 'USE_HERO_SKILL':
        heroSkill = true;
        break;
      case 'USE_MINISTER_SKILL':
        ministerSkill = true;
        break;
      case 'USE_GENERAL_SKILL':
        generalSkillKeys.add(`${action.instanceId}:${action.skillIndex}`);
        break;
      case 'SWITCH_MINISTER':
        switchIndices.add(action.ministerIndex as number);
        break;
    }
  }

  return {
    validPlayIndices: playIndices,
    validAttackerIds: attackerIds,
    attackTargetIds: targetIds,
    canUseHeroSkill: heroSkill,
    canUseMinisterSkill: ministerSkill,
    validSwitchMinisters: switchIndices,
    canAttackHero: attackHero,
    availableGeneralSkillKeys: generalSkillKeys,
  };
}

export function useDerivedActions(
  validActions: ValidAction[],
  selectedAttacker: string | null,
): DerivedActionSets {
  return useMemo(
    () => deriveSets(validActions, selectedAttacker),
    [validActions, selectedAttacker],
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @king-card/client test -- --run test/hooks/useDerivedActions.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/hooks/useDerivedActions.ts packages/client/test/hooks/useDerivedActions.test.ts
git commit -m "feat(client): extract useDerivedActions hook from GameBoard"
```

---

### Task 2: Extract `useTargeting` hook

**Files:**
- Create: `packages/client/src/hooks/useTargeting.ts`
- Create: `packages/client/test/hooks/useTargeting.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// packages/client/test/hooks/useTargeting.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTargeting } from '../../src/hooks/useTargeting.js';

describe('useTargeting', () => {
  const defaultDeps = {
    selectedAttacker: null as string | null,
    pendingSkillAction: null as any,
    playerIndex: 0 as number | null,
    validActions: [] as any[],
    attack: vi.fn(),
    useHeroSkill: vi.fn(),
    useMinisterSkill: vi.fn(),
    useGeneralSkill: vi.fn(),
    clearTargetingSelection: vi.fn(),
  };

  it('initializes with null pointer and hovered target', () => {
    const { result } = renderHook(() => useTargeting(defaultDeps));
    expect(result.current.pointerPosition).toBeNull();
    expect(result.current.hoveredTarget).toBeNull();
    expect(result.current.arrowSourceAnchorId).toBeNull();
  });

  it('computes arrowSourceAnchorId from selectedAttacker', () => {
    const { result } = renderHook(() =>
      useTargeting({ ...defaultDeps, selectedAttacker: 'minion-1' }),
    );
    expect(result.current.arrowSourceAnchorId).toBe('minion:minion-1');
  });

  it('computes arrowSourceAnchorId from pendingSkillAction HERO', () => {
    const { result } = renderHook(() =>
      useTargeting({ ...defaultDeps, pendingSkillAction: { type: 'HERO' } }),
    );
    expect(result.current.arrowSourceAnchorId).toBe('hero-skill:me');
  });

  it('sets hovered target via setHoveredTarget', () => {
    const { result } = renderHook(() =>
      useTargeting({ ...defaultDeps, selectedAttacker: 'a1' }),
    );
    act(() => {
      result.current.setHoveredTarget({ type: 'MINION', instanceId: 'e1' });
    });
    expect(result.current.hoveredTarget).toEqual({ type: 'MINION', instanceId: 'e1' });
  });

  it('clearTargetingUiState resets hovered and pointer', () => {
    const { result } = renderHook(() =>
      useTargeting({ ...defaultDeps, selectedAttacker: 'a1' }),
    );
    act(() => {
      result.current.setHoveredTarget({ type: 'MINION', instanceId: 'e1' });
    });
    act(() => {
      result.current.clearTargetingUiState();
    });
    expect(result.current.hoveredTarget).toBeNull();
    expect(result.current.pointerPosition).toBeNull();
    expect(defaultDeps.clearTargetingSelection).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @king-card/client test -- --run test/hooks/useTargeting.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
// packages/client/src/hooks/useTargeting.ts
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { TargetRef, ValidAction } from '@king-card/shared';

interface ScreenPoint {
  x: number;
  y: number;
}

export type HoveredTarget =
  | { type: 'MINION'; instanceId: string }
  | { type: 'HERO'; playerIndex: number }
  | null;

type PendingSkillAction =
  | { type: 'HERO' }
  | { type: 'MINISTER' }
  | { type: 'GENERAL'; instanceId: string; skillIndex: number }
  | null;

interface UseTargetingDeps {
  selectedAttacker: string | null;
  pendingSkillAction: PendingSkillAction;
  playerIndex: number | null;
  validActions: ValidAction[];
  attack: (attackerId: string, target: TargetRef) => void;
  useHeroSkill: (target?: TargetRef) => void;
  useMinisterSkill: (target?: TargetRef) => void;
  useGeneralSkill: (instanceId: string, skillIndex: number, target?: TargetRef) => void;
  clearTargetingSelection: () => void;
}

export function useTargeting(deps: UseTargetingDeps) {
  const {
    selectedAttacker,
    pendingSkillAction,
    playerIndex,
    validActions,
    attack,
    useHeroSkill,
    useMinisterSkill,
    useGeneralSkill,
    clearTargetingSelection,
  } = deps;

  const [pointerPosition, setPointerPosition] = useState<ScreenPoint | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<HoveredTarget>(null);
  const [anchorCenters, setAnchorCenters] = useState<Record<string, ScreenPoint>>({});

  // Pending skill target computation
  const pendingSkillTargets = useMemo(() => {
    const targetIds = new Set<string>();
    if (!pendingSkillAction) return { targetIds, canTargetEnemyHero: false };

    const matchingActions = validActions.filter((action): action is Extract<ValidAction, { target?: TargetRef }> => {
      if (pendingSkillAction.type === 'HERO') return action.type === 'USE_HERO_SKILL';
      if (pendingSkillAction.type === 'MINISTER') return action.type === 'USE_MINISTER_SKILL';
      return action.type === 'USE_GENERAL_SKILL'
        && action.instanceId === pendingSkillAction.instanceId
        && action.skillIndex === pendingSkillAction.skillIndex;
    });

    let canTargetEnemyHero = false;
    for (const action of matchingActions) {
      if (!action.target) continue;
      if (action.target.type === 'MINION') targetIds.add(action.target.instanceId);
      if (action.target.type === 'HERO' && playerIndex !== null && action.target.playerIndex === 1 - playerIndex) {
        canTargetEnemyHero = true;
      }
    }
    return { targetIds, canTargetEnemyHero };
  }, [pendingSkillAction, playerIndex, validActions]);

  // Arrow source
  const arrowSourceAnchorId = pendingSkillAction
    ? pendingSkillAction.type === 'HERO'
      ? 'hero-skill:me'
      : pendingSkillAction.type === 'MINISTER'
        ? 'minister-skill:me'
        : `general-skill:${pendingSkillAction.instanceId}:${pendingSkillAction.skillIndex}`
    : selectedAttacker
      ? `minion:${selectedAttacker}`
      : null;

  // Arrow endpoints
  const arrowStart = arrowSourceAnchorId ? anchorCenters[arrowSourceAnchorId] ?? null : null;
  const arrowEnd = hoveredTarget
    ? hoveredTarget.type === 'MINION'
      ? anchorCenters[`minion:${hoveredTarget.instanceId}`] ?? null
      : anchorCenters[hoveredTarget.playerIndex === playerIndex ? 'hero:me' : 'hero:enemy'] ?? null
    : pointerPosition;

  // Measure anchors
  const measureAnchors = useCallback(() => {
    const nextCenters: Record<string, ScreenPoint> = {};
    const elements = document.querySelectorAll<HTMLElement>('[data-anchor-id]');
    for (const element of elements) {
      const anchorId = element.dataset.anchorId;
      if (!anchorId) continue;
      const rect = element.getBoundingClientRect();
      nextCenters[anchorId] = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    setAnchorCenters(nextCenters);
  }, []);

  // Clear all targeting UI state
  const clearTargetingUiState = useCallback(() => {
    clearTargetingSelection();
    setHoveredTarget(null);
    setPointerPosition(null);
  }, [clearTargetingSelection]);

  // Pointermove tracking
  useEffect(() => {
    if (!selectedAttacker && !pendingSkillAction) {
      setPointerPosition(null);
      setHoveredTarget(null);
      return;
    }
    const updatePointer = (event: PointerEvent) => {
      setPointerPosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('pointermove', updatePointer);
    return () => window.removeEventListener('pointermove', updatePointer);
  }, [pendingSkillAction, selectedAttacker]);

  // Anchor measurement on game-state / resize
  useEffect(() => {
    const rafId = requestAnimationFrame(measureAnchors);
    const handleViewportChange = () => measureAnchors();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [measureAnchors, selectedAttacker, pendingSkillAction]);

  // Global pointerup — execute action or cancel
  const hoveredTargetRef = useRef<HoveredTarget>(null);
  hoveredTargetRef.current = hoveredTarget;
  const selectedAttackerRef = useRef(selectedAttacker);
  selectedAttackerRef.current = selectedAttacker;
  const pendingSkillActionRef = useRef(pendingSkillAction);
  pendingSkillActionRef.current = pendingSkillAction;

  useEffect(() => {
    const handlePointerUp = () => {
      const attacker = selectedAttackerRef.current;
      const skill = pendingSkillActionRef.current;
      if (!attacker && !skill) return;

      const target = hoveredTargetRef.current;
      if (target) {
        const targetRef: TargetRef = target.type === 'MINION'
          ? { type: 'MINION', instanceId: target.instanceId }
          : { type: 'HERO', playerIndex: target.playerIndex };

        if (skill) {
          if (skill.type === 'HERO') useHeroSkill(targetRef);
          else if (skill.type === 'MINISTER') useMinisterSkill(targetRef);
          else useGeneralSkill(skill.instanceId, skill.skillIndex, targetRef);
        } else {
          attack(attacker!, targetRef);
        }
      }
      clearTargetingUiState();
    };

    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [attack, useHeroSkill, useMinisterSkill, useGeneralSkill, clearTargetingUiState]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (!selectedAttacker && !pendingSkillAction) return;
      clearTargetingUiState();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [clearTargetingUiState, pendingSkillAction, selectedAttacker]);

  return {
    pointerPosition,
    hoveredTarget,
    setHoveredTarget,
    anchorCenters,
    measureAnchors,
    arrowSourceAnchorId,
    arrowStart,
    arrowEnd,
    pendingSkillTargets,
    clearTargetingUiState,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @king-card/client test -- --run test/hooks/useTargeting.test.tsx`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/hooks/useTargeting.ts packages/client/test/hooks/useTargeting.test.tsx
git commit -m "feat(client): extract useTargeting hook from GameBoard"
```

---

### Task 3: Refactor GameBoard.tsx to use extracted hooks

**Files:**
- Modify: `packages/client/src/components/board/GameBoard.tsx`

- [ ] **Step 1: Replace inline action derivation with `useDerivedActions`**

In `GameBoard.tsx`, replace lines 2-21 imports with:

```ts
import {
  useMemo,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useGameStore } from '../../stores/gameStore.js';
import { useShallow } from 'zustand/react/shallow';
import { useAnimations } from '../../hooks/useAnimations.js';
import { useDerivedActions } from '../../hooks/useDerivedActions.js';
import { useTargeting } from '../../hooks/useTargeting.js';
import { audioService } from '../../services/audioService.js';
import { HeroPanel } from './HeroPanel.js';
import { MinisterPanel } from './MinisterPanel.js';
import { GeneralSkillsPanel } from './GeneralSkillsPanel.js';
import { SidePanel } from './SidePanel.js';
import { Battlefield } from './Battlefield.js';
import { HandZone } from './HandZone.js';
import { TargetingArrow } from './TargetingArrow.js';
import GameOverlay from './GameOverlay.js';
import Toast from './Toast.js';
import type { ValidAction } from '@king-card/shared';
import { useLocaleStore } from '../../stores/localeStore.js';
import { getCardDisplayText, getGeneralSkillsDisplayText, getHeroSkillDisplayText } from '../../utils/cardText.js';
```

Replace the 11 individual useGameStore calls (lines 103-121) with a single shallow selector:

```ts
const {
  gameState, validActions, selectedAttacker, pendingSkillAction,
  playerIndex, playCard, attack, endTurn, useHeroSkill,
  useMinisterSkill, useGeneralSkill, switchMinister,
  setSelectedAttacker, setPendingSkillAction, clearTargetingSelection,
} = useGameStore(useShallow((s) => ({
  gameState: s.gameState,
  validActions: s.validActions,
  selectedAttacker: s.selectedAttacker,
  pendingSkillAction: s.pendingSkillAction,
  playerIndex: s.playerIndex,
  playCard: s.playCard,
  attack: s.attack,
  endTurn: s.endTurn,
  useHeroSkill: s.useHeroSkill,
  useMinisterSkill: s.useMinisterSkill,
  useGeneralSkill: s.useGeneralSkill,
  switchMinister: s.switchMinister,
  setSelectedAttacker: s.setSelectedAttacker,
  setPendingSkillAction: s.setPendingSkillAction,
  clearTargetingSelection: s.clearTargetingSelection,
})));
const isMyTurn = useGameStore((s) => s.isMyTurn);
const locale = useLocaleStore((state) => state.locale);
```

Replace the big useMemo block (lines 133-197) with:

```ts
const {
  validPlayIndices, validAttackerIds, attackTargetIds,
  canUseHeroSkill, canUseMinisterSkill, validSwitchMinisters,
  canAttackHero, availableGeneralSkillKeys,
} = useDerivedActions(validActions, selectedAttacker);
```

- [ ] **Step 2: Replace targeting logic with `useTargeting`**

Remove lines 199-409 (pending skill targets, pointer state, anchor measurement, arrow computation, clearTargetingUiState, refs, global pointerup, pointermove effect, anchor measurement effect) and replace with:

```ts
const {
  hoveredTarget, setHoveredTarget, arrowSourceAnchorId, arrowStart, arrowEnd,
  pendingSkillTargets, clearTargetingUiState,
} = useTargeting({
  selectedAttacker,
  pendingSkillAction,
  playerIndex,
  validActions,
  attack,
  useHeroSkill,
  useMinisterSkill,
  useGeneralSkill,
  clearTargetingSelection,
});
```

Keep the derived values that consume targeting output:

```ts
const activeTargetIds = pendingSkillAction ? pendingSkillTargets.targetIds : attackTargetIds;
const canTargetEnemyHero = pendingSkillAction ? pendingSkillTargets.canTargetEnemyHero : canAttackHero;
const pendingGeneralSkillKey = pendingSkillAction?.type === 'GENERAL'
  ? `${pendingSkillAction.instanceId}:${pendingSkillAction.skillIndex}`
  : null;
const pendingSkillPrompt = pendingSkillAction
  ? pendingSkillTargets.targetIds.size > 0 || pendingSkillTargets.canTargetEnemyHero
    ? locale === 'en-US' ? 'Choose a skill target' : '选择技能目标'
    : null
  : null;
```

- [ ] **Step 3: Fix locale read in turn overlay effect**

Replace the turn overlay effect (currently lines 292-308) — change `useLocaleStore.getState().locale` to use the subscribed `locale`:

```ts
useEffect(() => {
  if (!gameState || playerIndex === null) return;
  const myTurn = gameState.currentPlayerIndex === playerIndex;
  const text = locale === 'en-US'
    ? myTurn ? 'Your Turn' : 'Opponent Turn'
    : myTurn ? '你的回合' : '对方回合';
  setOverlayText(text);
  audioService.play('turn-start');
  const timer = setTimeout(() => setOverlayText(null), 1500);
  return () => clearTimeout(timer);
}, [gameState?.turnNumber, playerIndex, locale]);
```

- [ ] **Step 4: Remove the escape key effect (now in useTargeting)**

Delete the escape key useEffect block (lines 481-496) — it's handled inside `useTargeting`.

- [ ] **Step 5: Run all existing client tests**

Run: `pnpm --filter @king-card/client test -- --run`
Expected: All 25 test files pass (220+ tests).

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/components/board/GameBoard.tsx
git commit -m "refactor(client): slim GameBoard using useDerivedActions and useTargeting hooks"
```

---

### Task 4: Fix type safety — replace `any[]` with proper types

**Files:**
- Modify: `packages/client/src/components/board/Battlefield.tsx`
- Modify: `packages/client/src/components/board/HandZone.tsx`

- [ ] **Step 1: Fix Battlefield.tsx types**

Replace lines 1-13:

```tsx
import { memo } from 'react';
import type { CardInstance } from '@king-card/shared';
import { CardComponent } from './CardComponent.js';

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
}
```

Replace `function Battlefield(` (line 15) with `const BattlefieldInner = (` and replace the `(minion: any)` on line 38 with `(minion: CardInstance)`.

At the bottom, add:

```tsx
export const Battlefield = memo(BattlefieldInner);
```

- [ ] **Step 2: Fix HandZone.tsx types**

Replace line 7 `cards: any[]` with:

```ts
cards: Card[];
```

Ensure import `Card` is already imported from `@king-card/shared` (line 2 already has it).

Replace `key={i}` on line 160 with:

```tsx
key={(card as any).instanceId ?? `hand-${i}`}
```

Note: Hand cards are `Card` objects (not `CardInstance`), so they don't have `instanceId`. We use a composite key with index as fallback. Since cards in hand are stable within a turn, this is acceptable.

Wrap the component export with memo:

```tsx
import { useRef, useEffect, useState, useCallback, memo } from 'react';
// ... (existing code)
const HandZoneInner = function HandZone({ ... }) { ... };
export const HandZone = memo(HandZoneInner);
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @king-card/client test -- --run`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/components/board/Battlefield.tsx packages/client/src/components/board/HandZone.tsx
git commit -m "fix(client): replace any[] with CardInstance/Card types, add React.memo"
```

---

### Task 5: Add React.memo to CardComponent

**Files:**
- Modify: `packages/client/src/components/board/CardComponent.tsx`

- [ ] **Step 1: Wrap CardComponent with memo**

At the top of the file, add `memo` to the React import:

```ts
import { useId, useRef, useState, useEffect, memo } from 'react';
```

Find the `export function CardComponent(` declaration and rename the inner function, then export the memo-wrapped version:

```ts
// Change:
export function CardComponent({
// To:
const CardComponentInner = function CardComponent({
```

At the bottom of the file, after the closing brace of the function, add:

```ts
export const CardComponent = memo(CardComponentInner);
```

- [ ] **Step 2: Run tests**

Run: `pnpm --filter @king-card/client test -- --run`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/board/CardComponent.tsx
git commit -m "perf(client): wrap CardComponent in React.memo"
```

---

### Task 6: Add ErrorBoundary

**Files:**
- Create: `packages/client/src/components/board/ErrorBoundary.tsx`
- Create: `packages/client/test/components/board/ErrorBoundary.test.tsx`
- Modify: `packages/client/src/components/board/GameBoard.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// packages/client/test/components/board/ErrorBoundary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../../src/components/board/ErrorBoundary.js';

function Bomb(): JSX.Element {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Safe content')).toBeTruthy();
  });

  it('catches render errors and shows fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @king-card/client test -- --run test/components/board/ErrorBoundary.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```tsx
// packages/client/src/components/board/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-gray-300 gap-4">
          <p className="text-xl">Something went wrong</p>
          <button
            className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-500"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @king-card/client test -- --run test/components/board/ErrorBoundary.test.tsx`
Expected: 2 tests PASS.

- [ ] **Step 5: Wrap GameBoard in ErrorBoundary**

In the file that renders `<GameBoard />` (likely `App.tsx` or the route component), wrap it:

```tsx
import { ErrorBoundary } from './components/board/ErrorBoundary.js';

// In the render:
<ErrorBoundary>
  <GameBoard />
</ErrorBoundary>
```

If `GameBoard` is rendered directly in a route, find that location and wrap it there.

- [ ] **Step 6: Run all client tests**

Run: `pnpm --filter @king-card/client test -- --run`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/components/board/ErrorBoundary.tsx packages/client/test/components/board/ErrorBoundary.test.tsx
git add -u
git commit -m "feat(client): add ErrorBoundary around game board"
```

---

### Task 7: Fix dying minion ordering bug

**Files:**
- Modify: `packages/client/src/components/board/GameBoard.tsx`

- [ ] **Step 1: Fix the dying minion merge logic**

Replace lines 510-514 in GameBoard.tsx:

```ts
// OLD:
const myDying = pendingRemovals.filter((m) => m.ownerIndex === playerIndex);
const oppDying = pendingRemovals.filter((m) => m.ownerIndex !== playerIndex);
const myBattlefield = [...me.battlefield, ...myDying];
const oppBattlefield = [...opponent.battlefield, ...oppDying];
```

With:

```ts
const myDying = pendingRemovals.filter((m) => m.ownerIndex === playerIndex);
const oppDying = pendingRemovals.filter((m) => m.ownerIndex !== playerIndex);

// Merge dying minions back at their original position (by position field if available)
function mergeWithDying(alive: typeof me.battlefield, dying: typeof myDying): typeof me.battlefield {
  if (dying.length === 0) return alive;
  const merged = [...alive];
  for (const d of dying) {
    const pos = d.position ?? merged.length;
    merged.splice(Math.min(pos, merged.length), 0, d);
  }
  return merged;
}

const myBattlefield = mergeWithDying(me.battlefield, myDying);
const oppBattlefield = mergeWithDying(opponent.battlefield, oppDying);
```

- [ ] **Step 2: Run all client tests**

Run: `pnpm --filter @king-card/client test -- --run`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/board/GameBoard.tsx
git commit -m "fix(client): preserve dying minion battlefield position during death animation"
```

---

### Task 8: Fix HandZone state-driven hover (replace inline style manipulation)

**Files:**
- Modify: `packages/client/src/components/board/HandZone.tsx`

- [ ] **Step 1: Replace inline style hover with state**

Add a `hoveredIndex` state in HandZone:

```ts
const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
```

Replace the `onMouseEnter`/`onMouseLeave` handlers (lines 176-187) with:

```tsx
onMouseEnter={() => {
  if (draggingIndex === null) setHoveredIndex(i);
}}
onMouseLeave={() => {
  if (hoveredIndex === i) setHoveredIndex(null);
}}
```

Update the transform in the style to use `hoveredIndex`:

```ts
const isHovered = hoveredIndex === i && draggingIndex === null;
// In the style:
transform: isDragging
  ? `rotate(${Math.max(-10, Math.min(10, (dragPosition.x - width / 2) / 80))}deg) scale(1.08)`
  : isHovered
    ? `translateX(${t.x}px) translateY(${t.y - 15}px) rotate(${t.rotation}deg) scale(1.08)`
    : `translateX(${t.x}px) translateY(${t.y}px) rotate(${t.rotation}deg)`,
zIndex: isDragging ? cards.length + 20 : isHovered ? cards.length + 1 : t.zIndex,
```

- [ ] **Step 2: Add snap-back animation on drag cancel**

Add a `snapBackIndex` state:

```ts
const [snapBackIndex, setSnapBackIndex] = useState<number | null>(null);
```

In the `finishDrag` function, when the card is NOT played (drag cancel), instead of instantly clearing:

```ts
if (current.dragging && releasedAboveHand) {
  onPlayCardRef.current?.(current.index);
  dragStateRef.current = null;
  setDraggingIndex(null);
  setDragPosition(null);
} else {
  // Snap-back animation: switch from fixed to absolute with transition
  const cancelIndex = current.index;
  dragStateRef.current = null;
  setDraggingIndex(null);
  setDragPosition(null);
  setSnapBackIndex(cancelIndex);
  setTimeout(() => setSnapBackIndex(null), 300);
}
```

In the card wrapper's className, add a snap-back transition class:

```ts
className={`absolute ${
  isDragging ? 'pointer-events-none z-50 transition-none' :
  snapBackIndex === i ? 'transition-all duration-300 ease-out opacity-60' :
  'transition-all duration-200 ease-out'
}`}
```

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @king-card/client test -- --run`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/components/board/HandZone.tsx
git commit -m "fix(client): state-driven hover and snap-back animation in HandZone"
```

---

### Task 9: Board position selection with insertion slots

**Files:**
- Create: `packages/client/src/components/board/InsertionSlot.tsx`
- Modify: `packages/client/src/components/board/Battlefield.tsx`
- Modify: `packages/client/src/components/board/GameBoard.tsx`
- Modify: `packages/client/src/components/board/HandZone.tsx`

- [ ] **Step 1: Create InsertionSlot component**

```tsx
// packages/client/src/components/board/InsertionSlot.tsx
import { memo } from 'react';

interface InsertionSlotProps {
  index: number;
  highlighted: boolean;
  onHover: (index: number | null) => void;
}

export const InsertionSlot = memo(function InsertionSlot({
  index,
  highlighted,
  onHover,
}: InsertionSlotProps) {
  return (
    <div
      className={`w-6 h-[140px] rounded-lg transition-all duration-200 ${
        highlighted
          ? 'bg-emerald-400/30 shadow-[0_0_12px_rgba(74,222,128,0.4)]'
          : 'bg-white/5'
      }`}
      onPointerEnter={() => onHover(index)}
      onPointerLeave={() => onHover(null)}
    />
  );
});
```

- [ ] **Step 2: Add insertion slots to Battlefield**

Add a `showInsertionSlots` prop and `hoveredSlot`/`onSlotHover` to `BattlefieldProps`:

```ts
interface BattlefieldProps {
  minions: CardInstance[];
  isOpponent?: boolean;
  showInsertionSlots?: boolean;
  hoveredSlotIndex?: number | null;
  onSlotHover?: (index: number | null) => void;
  // ... existing props
}
```

In the render, interleave `InsertionSlot` between minions when `showInsertionSlots` is true:

```tsx
{showInsertionSlots && !isOpponent ? (
  <div className="h-full min-h-0 flex items-end justify-center px-4 transition-all duration-300" style={{ gap: `${gap}px` }}>
    <InsertionSlot index={0} highlighted={hoveredSlotIndex === 0} onHover={onSlotHover!} />
    {minions.map((minion, idx) => (
      <Fragment key={minion.instanceId}>
        {/* minion card */}
        <div data-anchor-id={`minion:${minion.instanceId}`} /* ... existing card render ... */ />
        <InsertionSlot index={idx + 1} highlighted={hoveredSlotIndex === idx + 1} onHover={onSlotHover!} />
      </Fragment>
    ))}
  </div>
) : (
  /* existing render */
)}
```

- [ ] **Step 3: Wire up in GameBoard and HandZone**

In GameBoard, add state for drag-active and hovered slot:

```ts
const [isDraggingCard, setIsDraggingCard] = useState(false);
const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);
```

Pass to Battlefield:

```tsx
<Battlefield
  showInsertionSlots={isDraggingCard}
  hoveredSlotIndex={hoveredSlotIndex}
  onSlotHover={setHoveredSlotIndex}
  // ... existing props
/>
```

Pass `boardPosition` when playing a card. Update `handlePlayCardFromHand`:

```ts
const handlePlayCardFromHand = useCallback((handIndex: number) => {
  if (validPlayIndices.has(handIndex)) {
    playCard(handIndex, hoveredSlotIndex ?? undefined);
    setHoveredSlotIndex(null);
  }
}, [playCard, validPlayIndices, hoveredSlotIndex]);
```

In HandZone, call `onDragStart`/`onDragEnd` callbacks:

```ts
// Add to HandZoneProps:
onDragStart?: () => void;
onDragEnd?: () => void;
```

Call `onDragStart?.()` in handlePointerDown and `onDragEnd?.()` in finishDrag.

In GameBoard, pass:

```tsx
<HandZone
  onDragStart={() => setIsDraggingCard(true)}
  onDragEnd={() => { setIsDraggingCard(false); setHoveredSlotIndex(null); }}
  // ... existing props
/>
```

- [ ] **Step 4: Run all tests**

Run: `pnpm --filter @king-card/client test -- --run`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/components/board/InsertionSlot.tsx
git add -u
git commit -m "feat(client): board position selection with insertion slot indicators"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests across shared, core, server, client pass.

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: Clean build, no TypeScript errors.

- [ ] **Step 3: Verify GameBoard.tsx line count**

Run: `wc -l packages/client/src/components/board/GameBoard.tsx`
Expected: ~400-450 lines (down from 717).

- [ ] **Step 4: Commit any remaining fixes**

```bash
git add -u
git commit -m "chore(client): final cleanup after UI quality refactor"
```
