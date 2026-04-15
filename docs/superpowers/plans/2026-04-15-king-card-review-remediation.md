# King Card Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 2026-04-15 code review 暴露的高优先级缺陷，让 PvE 主流程、卡牌效果、回合触发与将领技能在真实联机路径下正确工作。

**Architecture:** 先修复 client 的连接与状态同步，让前端能稳定进入和维持对局；再在 core 中补上“数据驱动 effect 执行器 + 明确生命周期触发点”，把 card definitions 里的 effects 从声明变成真实行为。最后补通 targeted skill / general skill 全链路，并消除 CardInstance 对共享 Card 定义的可变引用，避免状态串扰和同名单位错绑。

**Tech Stack:** TypeScript, React 19, Zustand, Socket.IO, Vitest, Testing Library, pnpm workspace

**Source:** 2026-04-15 code review findings in chat

---

## 文件结构总览

- `packages/client/src/hooks/useGameSocket.ts`: 监听 socket 生命周期，确保“先渲染 App、后连接 socket”的路径也能注册事件。
- `packages/client/src/stores/gameStore.ts`: 避免过期 `validActions` 污染 UI，并为 skill targeting 状态提供 store 支撑。
- `packages/client/src/hooks/useGameSocket.test.tsx`: 回归测试“延迟连接后仍会注册事件监听”。
- `packages/client/src/stores/gameStore.test.ts`: 回归测试“轮到对手时立即清空本地 actions”。
- `packages/core/src/models/card-instance.ts`: 为战场实例克隆可变 card 数据，切断对共享定义对象的引用。
- `packages/shared/src/engine-types.ts`: 收紧 `StateMutator.summonMinion` 返回值，并扩展 targeted skill / general skill 的动作类型。
- `packages/core/src/engine/state-mutator.ts`: 返回实际召唤实例，供后续 ON_PLAY / summon 关联使用。
- `packages/core/src/cards/effects/execute-card-effects.ts`: 新的 card effects 执行器，负责处理当前中国卡池已经声明的 effect types。
- `packages/core/src/cards/effects/index.ts`: 统一导出 effect executor 与 keyword handlers。
- `packages/core/src/engine/action-executor.ts`: 将出牌、帝王技能、文臣技能、将领技能全部接到统一 effect 执行链上。
- `packages/core/src/engine/game-loop.ts`: 在真实回合开始时触发 `TURN_START` 和 `ON_TURN_START` 生命周期。
- `packages/core/src/engine/game-engine.ts`: 枚举 `USE_GENERAL_SKILL` 与 targeted skill 的合法动作。
- `packages/server/src/socketHandler.ts`: 新增 `game:useGeneralSkill`，并把 targeted skill 的 payload 透传给 engine。
- `packages/client/src/components/board/GameBoard.tsx`: 复用攻击选目标的交互，为 hero / minister / general skills 增加目标选择模式。
- `packages/client/src/components/board/GeneralSkillsPanel.tsx`: 新组件，展示当前选中将领的三个技能按钮。
- `packages/core/test/**/*`、`packages/server/test/**/*`、`packages/client/src/**/*.test.tsx`: 为每条回归风险补上自动化测试。
- `docs/superpowers/specs/redo.md`: 记录本轮 review remediation 的完成状态与后续遗留项。

---

### Task 1: 修复前端 socket 监听时机和过期 validActions

**Files:**
- Create: `packages/client/src/hooks/useGameSocket.test.tsx`
- Create: `packages/client/src/stores/gameStore.test.ts`
- Modify: `packages/client/src/hooks/useGameSocket.ts`
- Modify: `packages/client/src/stores/gameStore.ts`

- [ ] **Step 1: 写延迟连接的失败测试**

创建 `packages/client/src/hooks/useGameSocket.test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameSocket } from './useGameSocket.js';
import { useGameStore } from '../stores/gameStore.js';
import { socketService } from '../services/socketService.js';

const socketMock = {
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('../services/socketService.js', () => ({
  socketService: {
    getSocket: vi.fn(() => socketMock),
  },
}));

function Harness() {
  useGameSocket();
  return null;
}

describe('useGameSocket', () => {
  beforeEach(() => {
    useGameStore.setState({
      connected: false,
      gameId: null,
      playerIndex: null,
      gameState: null,
      validActions: [],
      uiPhase: 'lobby',
      selectedAttacker: null,
      error: null,
    });
    socketMock.on.mockClear();
    socketMock.off.mockClear();
    vi.mocked(socketService.getSocket).mockReturnValue(socketMock as never);
  });

  it('registers socket listeners after connect is triggered after mount', async () => {
    render(<Harness />);
    expect(socketMock.on).not.toHaveBeenCalled();

    useGameStore.setState({ connected: true });

    await waitFor(() => {
      expect(socketMock.on).toHaveBeenCalledWith('game:state', expect.any(Function));
      expect(socketMock.on).toHaveBeenCalledWith('game:validActions', expect.any(Function));
      expect(socketMock.on).toHaveBeenCalledWith('game:over', expect.any(Function));
    });
  });
});
```

- [ ] **Step 2: 运行 hook 测试，确认当前实现失败**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm --filter @king-card/client exec vitest run --environment jsdom src/hooks/useGameSocket.test.tsx
```

Expected: FAIL，原因是 `socketMock.on` 从未被调用。

- [ ] **Step 3: 写过期 validActions 的失败测试**

创建 `packages/client/src/stores/gameStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './gameStore.js';

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      connected: false,
      gameId: null,
      playerIndex: 0,
      gameState: null,
      validActions: [{ type: 'END_TURN' }],
      uiPhase: 'playing',
      selectedAttacker: 'minion_1',
      error: null,
    });
  });

  it('clears stale validActions when the new state belongs to the opponent turn', () => {
    useGameStore.getState()._setGameState({
      turnNumber: 3,
      currentPlayerIndex: 1,
      phase: 'MAIN',
      isGameOver: false,
      winnerIndex: null,
      winReason: null,
      me: {
        id: 'p1',
        name: 'P1',
        civilization: 'CHINA',
        hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: null, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        hand: [], battlefield: [], energyCrystal: 0, maxEnergy: 0, deckCount: 0,
        activeMinisterIndex: -1, ministerPool: [], activeStratagems: [], cannotDrawNextTurn: false,
        boundCards: [], graveyard: [],
      },
      opponent: {
        id: 'p2',
        name: 'P2',
        civilization: 'CHINA',
        hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: null, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        hand: [], battlefield: [], energyCrystal: 0, maxEnergy: 0, deckCount: 0,
        activeMinisterIndex: -1, ministerPool: [], activeStratagems: [], cannotDrawNextTurn: false,
        boundCards: [], graveyard: [],
      },
    });

    expect(useGameStore.getState().validActions).toEqual([]);
    expect(useGameStore.getState().selectedAttacker).toBeNull();
  });
});
```

- [ ] **Step 4: 运行 store 测试，确认当前实现失败**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm --filter @king-card/client exec vitest run src/stores/gameStore.test.ts
```

Expected: FAIL，原因是 `_setGameState()` 不会清空旧的 `validActions` 和 `selectedAttacker`。

- [ ] **Step 5: 用最小改动修正 hook 和 store**

修改 `packages/client/src/hooks/useGameSocket.ts`:

```tsx
import { useEffect } from 'react';
import { socketService } from '../services/socketService.js';
import { useGameStore } from '../stores/gameStore.js';
import type { SerializedGameState, ValidAction } from '../stores/gameStore.js';
import type { WinReason } from '@king-card/shared';

export function useGameSocket(): void {
  const connected = useGameStore((s) => s.connected);

  useEffect(() => {
    if (!connected) {
      return;
    }

    const socket = socketService.getSocket();

    const onConnect = () => {
      useGameStore.getState()._setConnected(true);
    };

    const onDisconnect = () => {
      const store = useGameStore.getState();
      store._setConnected(false);
      store._setValidActions([]);
      store.setSelectedAttacker(null);
    };

    const onGameJoined = (payload: { gameId: string; playerIndex: 0 | 1 }) => {
      const store = useGameStore.getState();
      store._setGameId(payload.gameId);
      store._setPlayerIndex(payload.playerIndex);
      store.setUiPhase('playing');
    };

    const onGameState = (payload: { state: SerializedGameState }) => {
      useGameStore.getState()._setGameState(payload.state);
    };

    const onValidActions = (payload: { actions: ValidAction[] }) => {
      useGameStore.getState()._setValidActions(payload.actions);
    };

    const onGameOver = (payload: { winnerIndex: number; reason: WinReason }) => {
      useGameStore.getState()._handleGameOver(payload.winnerIndex, payload.reason);
    };

    const onGameError = (payload: { code: string; message: string }) => {
      useGameStore.getState()._setError(payload.code, payload.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game:joined', onGameJoined);
    socket.on('game:state', onGameState);
    socket.on('game:validActions', onValidActions);
    socket.on('game:over', onGameOver);
    socket.on('game:error', onGameError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game:joined', onGameJoined);
      socket.off('game:state', onGameState);
      socket.off('game:validActions', onValidActions);
      socket.off('game:over', onGameOver);
      socket.off('game:error', onGameError);
    };
  }, [connected]);
}
```

修改 `packages/client/src/stores/gameStore.ts` 中 `_setGameState`:

```ts
_setGameState: (v: SerializedGameState) => {
  const { playerIndex } = get();
  const isMyTurn = playerIndex !== null && v.currentPlayerIndex === playerIndex;

  set((state) => ({
    gameState: v,
    validActions: isMyTurn ? state.validActions : [],
    selectedAttacker: isMyTurn ? state.selectedAttacker : null,
  }));
},
```

修改 `_handleGameOver`，顺手清空旧动作:

```ts
_handleGameOver: (winnerIndex: number, reason: WinReason) => {
  set((state) => ({
    gameState: state.gameState
      ? { ...state.gameState, isGameOver: true, winnerIndex, winReason: reason }
      : null,
    validActions: [],
    selectedAttacker: null,
    uiPhase: 'game-over',
  }));
},
```

- [ ] **Step 6: 重新运行 client 回归测试**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm --filter @king-card/client exec vitest run --environment jsdom src/hooks/useGameSocket.test.tsx src/stores/gameStore.test.ts
```

Expected: PASS，两个测试文件全部通过。

- [ ] **Step 7: 提交这一组修复**

```bash
cd /home/xjingyao/code/king_card
git add packages/client/src/hooks/useGameSocket.ts packages/client/src/stores/gameStore.ts packages/client/src/hooks/useGameSocket.test.tsx packages/client/src/stores/gameStore.test.ts
git commit -m "fix: stabilize client socket state sync"
```

---

### Task 2: 切断 CardInstance 对共享 Card 定义的可变引用，并返回真实 summon 实例

**Files:**
- Modify: `packages/shared/src/engine-types.ts`
- Modify: `packages/core/src/models/card-instance.ts`
- Modify: `packages/core/src/engine/state-mutator.ts`
- Modify: `packages/core/src/engine/action-executor.ts`
- Modify: `packages/core/test/models/card-instance.test.ts`
- Modify: `packages/core/test/engine/state-mutator.test.ts`

- [ ] **Step 1: 写实例隔离与 summon 返回值的失败测试**

在 `packages/core/test/models/card-instance.test.ts` 追加:

```ts
it('clones mutable card fields so buff keywords do not leak back to the definition', () => {
  const baseCard = {
    id: 'base',
    name: 'Base',
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 1,
    health: 1,
    description: 'test',
    keywords: [],
    effects: [],
  } as const;

  const instance = createCardInstance(baseCard, 0);
  instance.card.keywords.push('TAUNT');

  expect(baseCard.keywords).toEqual([]);
});
```

在 `packages/core/test/engine/state-mutator.test.ts` 追加:

```ts
it('returns the actual summoned instance', () => {
  const mutator = createStateMutator(state, bus);
  const card = makeMinionCard({ id: 'summon_target' });

  const result = mutator.summonMinion(card, 0);

  expect(result.error).toBeNull();
  expect(result.instance).toBeDefined();
  expect(state.players[0].battlefield[0]).toBe(result.instance);
});
```

- [ ] **Step 2: 运行 core 目标测试，确认当前实现失败**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm --filter @king-card/core exec vitest run test/models/card-instance.test.ts test/engine/state-mutator.test.ts
```

Expected: FAIL，原因分别是共享 `keywords` 被污染，以及 `summonMinion()` 目前只返回错误码。

- [ ] **Step 3: 收紧 shared 类型，给 summonMinion 一个明确返回结构**

修改 `packages/shared/src/engine-types.ts`:

```ts
export interface SummonMinionResult {
  instance: CardInstance | null;
  error: import('./types.js').EngineErrorCode | null;
}

export interface StateMutator {
  damage(target: import('./types.js').TargetRef, amount: number): import('./types.js').EngineErrorCode | null;
  heal(target: import('./types.js').TargetRef, amount: number): import('./types.js').EngineErrorCode | null;
  drawCards(playerIndex: number, count: number): import('./types.js').EngineErrorCode | null;
  discardCard(playerIndex: number, handIndex: number): import('./types.js').EngineErrorCode | null;
  summonMinion(card: Card, ownerIndex: number, position?: number): SummonMinionResult;
  destroyMinion(instanceId: string): import('./types.js').EngineErrorCode | null;
  modifyStat(target: import('./types.js').TargetRef, stat: 'attack' | 'health', delta: number): import('./types.js').EngineErrorCode | null;
  applyBuff(target: import('./types.js').TargetRef, buff: Buff): import('./types.js').EngineErrorCode | null;
  removeBuff(target: import('./types.js').TargetRef, buffId: string): import('./types.js').EngineErrorCode | null;
  gainArmor(playerIndex: number, amount: number): import('./types.js').EngineErrorCode | null;
  spendEnergy(playerIndex: number, amount: number): import('./types.js').EngineErrorCode | null;
  activateStratagem(card: Card, ownerIndex: number): import('./types.js').EngineErrorCode | null;
  setDrawLock(playerIndex: number, locked: boolean): import('./types.js').EngineErrorCode | null;
  grantExtraAttack(instanceId: string): import('./types.js').EngineErrorCode | null;
}
```

- [ ] **Step 4: 实现 Card clone 和 summon 返回值，并同步 action executor 的调用方式**

修改 `packages/core/src/models/card-instance.ts`:

```ts
import type { Card, CardInstance } from '@king-card/shared';

let instanceCounter = 0;

function cloneCard(card: Card): Card {
  return {
    ...card,
    keywords: [...card.keywords],
    effects: card.effects.map((effect) => ({
      ...effect,
      params: { ...effect.params },
    })),
    heroSkill: card.heroSkill
      ? {
          ...card.heroSkill,
          effect: {
            ...card.heroSkill.effect,
            params: { ...card.heroSkill.effect.params },
          },
        }
      : undefined,
    generalSkills: card.generalSkills?.map((skill) => ({
      ...skill,
      effect: {
        ...skill.effect,
        params: { ...skill.effect.params },
      },
    })),
  };
}

export function createCardInstance(card: Card, ownerIndex: 0 | 1): CardInstance {
  const instanceCard = cloneCard(card);
  const hasRush = instanceCard.keywords.includes('RUSH');
  const hasCharge = instanceCard.keywords.includes('CHARGE');
  const hasAssassin = instanceCard.keywords.includes('ASSASSIN');

  return {
    card: instanceCard,
    instanceId: `${instanceCard.id}_${++instanceCounter}`,
    ownerIndex,
    currentAttack: instanceCard.attack ?? 0,
    currentHealth: instanceCard.health ?? 0,
    currentMaxHealth: instanceCard.health ?? 0,
    remainingAttacks: hasRush || hasCharge || hasAssassin ? 1 : 0,
    justPlayed: true,
    sleepTurns: instanceCard.keywords.includes('RESEARCH') ? 1 : 0,
    garrisonTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
    position: undefined,
  };
}
```

修改 `packages/core/src/engine/state-mutator.ts` 的 `summonMinion`:

```ts
summonMinion(card: Card, ownerIndex: number, position?: number) {
  const player = state.players[ownerIndex];
  if (!player) return { instance: null, error: 'INVALID_TARGET' };

  if (player.battlefield.length >= 7) {
    return { instance: null, error: 'BOARD_FULL' };
  }

  const instance = createCardInstance(card, ownerIndex as 0 | 1);
  instance.position = position ?? player.battlefield.length;

  if (position !== undefined) {
    player.battlefield.splice(position, 0, instance);
  } else {
    player.battlefield.push(instance);
  }

  player.battlefield.forEach((minion, index) => {
    minion.position = index;
  });

  emit(eventBus, { type: 'MINION_SUMMONED', instance });
  return { instance, error: null };
},
```

同步修改 `packages/core/src/engine/action-executor.ts` 中的出牌调用:

```ts
const summonResult = mutator.summonMinion(card, playerIndex as 0 | 1, targetBoardPosition);
if (summonResult.error) {
  return error(summonResult.error, `Failed to summon minion: ${summonResult.error}`);
}

const summonedMinion = summonResult.instance;
```

- [ ] **Step 5: 重新运行 core 目标测试**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm --filter @king-card/core exec vitest run test/models/card-instance.test.ts test/engine/state-mutator.test.ts
```

Expected: PASS。

- [ ] **Step 6: 提交实例隔离修复**

```bash
cd /home/xjingyao/code/king_card
git add packages/shared/src/engine-types.ts packages/core/src/models/card-instance.ts packages/core/src/engine/state-mutator.ts packages/core/src/engine/action-executor.ts packages/core/test/models/card-instance.test.ts packages/core/test/engine/state-mutator.test.ts
git commit -m "fix: isolate card instance state and summon identity"
```

---

### Task 3: 引入通用 effect 执行器，并把出牌/技能/回合开始接到真实生命周期上

**Files:**
- Create: `packages/core/src/cards/effects/execute-card-effects.ts`
- Modify: `packages/core/src/cards/effects/index.ts`
- Modify: `packages/core/src/engine/action-executor.ts`
- Modify: `packages/core/src/engine/game-loop.ts`
- Modify: `packages/core/test/engine/action-executor.test.ts`
- Modify: `packages/core/test/engine/minister.test.ts`
- Modify: `packages/core/test/engine/game-loop.test.ts`

- [ ] **Step 1: 写 effect executor 的失败测试**

在 `packages/core/test/engine/action-executor.test.ts` 追加:

```ts
it('plays a STRATAGEM and applies its declared DRAW effect', () => {
  const { state, bus, rng } = setup();
  const drawCard = makeStratagemCard('draw_2', 1);
  drawCard.effects = [{ trigger: 'ON_PLAY', type: 'DRAW', params: { count: 2 } }];
  state.players[0].deck.push(makeMinionCard({ id: 'deck_a' }), makeMinionCard({ id: 'deck_b' }));
  state.players[0].hand.push(drawCard);

  const result = executePlayCard(state, bus, rng, 0, 0);

  expect(result.success).toBe(true);
  expect(state.players[0].hand.map((card) => card.id)).toContain('deck_a');
  expect(state.players[0].hand.map((card) => card.id)).toContain('deck_b');
});

it('uses a minister skill and applies its declared DRAW effect', () => {
  const { state, bus, rng } = setup();
  state.players[0].deck.push(makeMinionCard({ id: 'drawn_by_minister' }));
  state.players[0].ministerPool = [{
    id: 'lisi',
    emperorId: 'qin',
    name: '李斯',
    type: 'STRATEGIST',
    activeSkill: {
      name: '上书',
      description: '抽一张牌',
      cost: 1,
      effect: { trigger: 'ON_PLAY', type: 'DRAW', params: { count: 1 } },
    },
    skillUsedThisTurn: false,
    cooldown: 0,
  }];
  state.players[0].activeMinisterIndex = 0;

  const result = executeUseMinisterSkill(state, bus, rng, 0);

  expect(result.success).toBe(true);
  expect(state.players[0].hand.some((card) => card.id === 'drawn_by_minister')).toBe(true);
});
```

在 `packages/core/test/engine/game-loop.test.ts` 追加:

```ts
it('applies ON_TURN_START garrison effects during the real turn loop', () => {
  const { state, bus } = setup();
  const minion = createCardInstance(makeMinionCard('garrison_minion', ['GARRISON']), 0);
  minion.garrisonTurns = 0;
  minion.card.effects = [{
    trigger: 'ON_TURN_START',
    type: 'GARRISON',
    params: { garrisonAttackBonus: 2, garrisonHealthBonus: 2 },
  }];
  state.players[0].battlefield.push(minion);

  executeTurnStart(state, bus);

  expect(minion.currentAttack).toBe(3);
  expect(minion.currentHealth).toBe(5);
});
```

- [ ] **Step 2: 运行 core 测试，确认当前实现失败**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm --filter @king-card/core exec vitest run test/engine/action-executor.test.ts test/engine/game-loop.test.ts test/engine/minister.test.ts
```

Expected: FAIL，法术/文臣技能的 `card.effects` 不生效，真实回合流程里也不会触发 `ON_TURN_START`。

- [ ] **Step 3: 新建通用 effect 执行器，只覆盖当前卡池真实使用的 effect types**

创建 `packages/core/src/cards/effects/execute-card-effects.ts`:

```ts
import type { Card, CardEffect, EffectContext, EffectTrigger, TargetRef, Buff } from '@king-card/shared';
import { CHINA_ALL_CARDS } from '../definitions/index.js';

function getCardById(cardId: string): Card {
  const card = CHINA_ALL_CARDS.find((item) => item.id === cardId);
  if (!card) {
    throw new Error(`Unknown card id: ${cardId}`);
  }
  return card;
}

function friendlyMinions(ctx: EffectContext) {
  return ctx.state.players[ctx.playerIndex].battlefield;
}

function enemyMinions(ctx: EffectContext) {
  return ctx.state.players[1 - ctx.playerIndex].battlefield;
}

function applyStatDelta(ctx: EffectContext, effect: CardEffect): void {
  const attackDelta = Number(effect.params.attackDelta ?? 0);
  const healthDelta = Number(effect.params.healthDelta ?? 0);
  const targetFilter = String(effect.params.targetFilter ?? 'SELF');

  const targets =
    targetFilter === 'ALL_FRIENDLY_MINIONS' ? friendlyMinions(ctx)
      : targetFilter === 'ALL_ENEMY_MINIONS' ? enemyMinions(ctx)
      : [ctx.source];

  for (const target of targets) {
    if (attackDelta !== 0) {
      ctx.mutator.modifyStat({ type: 'MINION', instanceId: target.instanceId }, 'attack', attackDelta);
    }
    if (healthDelta !== 0) {
      ctx.mutator.modifyStat({ type: 'MINION', instanceId: target.instanceId }, 'health', healthDelta);
    }
  }
}

function applyBuff(ctx: EffectContext, effect: CardEffect): void {
  const targetFilter = String(effect.params.targetFilter ?? 'SELF');
  const targets =
    targetFilter === 'ALL_FRIENDLY_MINIONS' ? friendlyMinions(ctx)
      : targetFilter === 'ALL_ENEMY_MINIONS' ? enemyMinions(ctx)
      : [ctx.source];

  for (const target of targets) {
    const buff: Buff = {
      id: `buff_${ctx.source.instanceId}_${target.instanceId}_${Date.now()}`,
      sourceInstanceId: ctx.source.instanceId,
      sourceCardId: ctx.source.card.id,
      attackBonus: Number(effect.params.attackBonus ?? effect.params.attackDelta ?? 0),
      healthBonus: Number(effect.params.healthBonus ?? 0),
      maxHealthBonus: Number(effect.params.healthBonus ?? 0),
      remainingTurns: effect.params.remainingTurns as number | undefined,
      keywordsGranted: (effect.params.keywordsGranted as Buff['keywordsGranted']) ?? [],
      type: (effect.params.type as Buff['type']) ?? 'TEMPORARY',
    };
    ctx.mutator.applyBuff({ type: 'MINION', instanceId: target.instanceId }, buff);
  }
}

export function executeCardEffects(trigger: EffectTrigger, ctx: EffectContext): void {
  const effects = ctx.source.card.effects.filter((effect) => effect.trigger === trigger);

  for (const effect of effects) {
    switch (effect.type) {
      case 'DRAW':
        ctx.mutator.drawCards(ctx.playerIndex, Number(effect.params.count ?? 1));
        break;
      case 'HEAL':
        ctx.mutator.heal({ type: 'HERO', playerIndex: ctx.playerIndex as 0 | 1 }, Number(effect.params.amount ?? 0));
        break;
      case 'SUMMON': {
        const count = Number(effect.params.count ?? 1);
        const summonedCard = getCardById(String(effect.params.cardId));
        for (let index = 0; index < count; index += 1) {
          ctx.mutator.summonMinion(summonedCard, ctx.playerIndex as 0 | 1);
        }
        break;
      }
      case 'MODIFY_STAT':
        applyStatDelta(ctx, effect);
        break;
      case 'APPLY_BUFF':
        applyBuff(ctx, effect);
        break;
      case 'RANDOM_DESTROY': {
        const pool = String(effect.params.targetFilter).includes('ENEMY') ? enemyMinions(ctx) : friendlyMinions(ctx);
        if (pool.length > 0) {
          const picked = ctx.rng.pick(pool);
          ctx.mutator.destroyMinion(picked.instanceId);
        }
        break;
      }
      case 'RANDOM_DISCARD': {
        const targetPlayer = effect.params.targetPlayer === 'OPPONENT' ? (1 - ctx.playerIndex) : ctx.playerIndex;
        const hand = ctx.state.players[targetPlayer].hand;
        if (hand.length > 0) {
          const discardIndex = ctx.rng.nextInt(0, hand.length - 1);
          ctx.mutator.discardCard(targetPlayer, discardIndex);
        }
        break;
      }
      case 'SET_DRAW_LOCK':
        ctx.mutator.setDrawLock(ctx.playerIndex, Boolean(effect.params.locked));
        break;
      case 'ACTIVATE_STRATAGEM':
        ctx.mutator.activateStratagem(ctx.source.card, ctx.playerIndex);
        break;
      case 'GARRISON_MARK':
        ctx.source.garrisonTurns = Number(effect.params.garrisonTurns ?? 2);
        break;
      default:
        break;
    }
  }
}
```

- [ ] **Step 4: 在 action executor 和 game loop 中接入 effect executor 与真实 turn-start 生命周期**

修改 `packages/core/src/cards/effects/index.ts`:

```ts
export {
  registerEffectHandler,
  resolveEffects,
  getRegisteredHandlers,
  clearEffectHandlers,
} from './registry.js';
export { executeCardEffects } from './execute-card-effects.js';
```

修改 `packages/core/src/engine/action-executor.ts` 的关键分支:

```ts
import { executeCardEffects, resolveEffects } from '../cards/effects/index.js';

if (card.type === 'MINION' || card.type === 'GENERAL') {
  const summonResult = mutator.summonMinion(card, playerIndex as 0 | 1, targetBoardPosition);
  if (summonResult.error || !summonResult.instance) {
    return error(summonResult.error ?? 'INVALID_TARGET', 'Failed to summon minion');
  }

  const effectCtx: EffectContext = {
    state,
    mutator,
    source: summonResult.instance,
    playerIndex,
    eventBus: collectingBus as unknown as EffectContext['eventBus'],
    rng: _rng as unknown as EffectContext['rng'],
  };

  executeCardEffects('ON_PLAY', effectCtx);
  resolveEffects('ON_PLAY', effectCtx);
} else if (card.type === 'STRATAGEM' || card.type === 'SORCERY') {
  const spellSource = {
    card,
    instanceId: `spell_${card.id}_${Date.now()}`,
    ownerIndex: playerIndex as 0 | 1,
    currentAttack: 0,
    currentHealth: 0,
    currentMaxHealth: 0,
    remainingAttacks: 0,
    justPlayed: false,
    sleepTurns: 0,
    garrisonTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
  };

  const effectCtx: EffectContext = {
    state,
    mutator,
    source: spellSource,
    playerIndex,
    eventBus: collectingBus as unknown as EffectContext['eventBus'],
    rng: _rng as unknown as EffectContext['rng'],
  };

  executeCardEffects('ON_PLAY', effectCtx);
}
```

修改 hero / minister skill 执行函数里的统一调用:

```ts
executeCardEffects('ON_PLAY', effectCtx);
resolveEffects('ON_PLAY', effectCtx);
```

修改 `packages/core/src/engine/game-loop.ts`:

```ts
import { resolveEffects } from '../cards/effects/index.js';

eventBus.emit({
  type: 'TURN_START',
  playerIndex: state.currentPlayerIndex,
  turnNumber: state.turnNumber + 1,
});

for (const minion of player.battlefield) {
  resolveEffects('ON_TURN_START', {
    state,
    mutator,
    source: minion,
    playerIndex: state.currentPlayerIndex,
    eventBus: eventBus as unknown as import('@king-card/shared').EffectContext['eventBus'],
    rng: { nextInt: () => 0, next: () => 0, pick: (items) => items[0], shuffle: (items) => items },
  });
}
```

- [ ] **Step 5: 重新运行 core 回归测试**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm --filter @king-card/core exec vitest run test/engine/action-executor.test.ts test/engine/minister.test.ts test/engine/game-loop.test.ts
```

Expected: PASS，法术/文臣技能/card effects 与真实 turn-start 路径全部生效。

- [ ] **Step 6: 提交 effect/lifecycle 修复**

```bash
cd /home/xjingyao/code/king_card
git add packages/core/src/cards/effects/execute-card-effects.ts packages/core/src/cards/effects/index.ts packages/core/src/engine/action-executor.ts packages/core/src/engine/game-loop.ts packages/core/test/engine/action-executor.test.ts packages/core/test/engine/minister.test.ts packages/core/test/engine/game-loop.test.ts
git commit -m "fix: execute declared card effects in real gameplay"
```

---

### Task 4: 打通 targeted skill / general skill 的 shared → core → server → client 全链路

**Files:**
- Create: `packages/client/src/components/board/GeneralSkillsPanel.tsx`
- Modify: `packages/shared/src/engine-types.ts`
- Modify: `packages/core/src/cards/definitions/china-generals.ts`
- Modify: `packages/core/src/cards/definitions/china-ministers.ts`
- Modify: `packages/core/src/cards/definitions/china-emperors.ts`
- Modify: `packages/core/src/engine/game-engine.ts`
- Modify: `packages/core/src/engine/action-executor.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/server/src/socketHandler.ts`
- Modify: `packages/client/src/stores/gameStore.ts`
- Modify: `packages/client/src/components/board/GameBoard.tsx`
- Modify: `packages/client/src/components/board/index.ts`
- Modify: `packages/core/test/engine/game-engine.test.ts`
- Create: `packages/server/test/socketHandler.test.ts`

- [ ] **Step 1: 写 general skill / targeted skill 的失败测试**

在 `packages/core/test/engine/game-engine.test.ts` 追加:

```ts
it('exposes USE_GENERAL_SKILL actions for generals on the battlefield', () => {
  const engine = createEngineWithGeneralOnBoard();

  const actions = engine.getValidActions(0);

  expect(actions).toContainEqual({
    type: 'USE_GENERAL_SKILL',
    instanceId: expect.any(String),
    skillIndex: 0,
  });
});
```

创建 `packages/server/test/socketHandler.test.ts`:

```ts
import { createServer } from 'node:http';
import { io as createClient } from 'socket.io-client';
import { afterEach, describe, expect, it } from 'vitest';
import { Server } from 'socket.io';
import { GameManager } from '../src/gameManager.js';
import { registerSocketHandlers } from '../src/socketHandler.js';

describe('socketHandler general skill', () => {
  let io: Server | null = null;
  let httpServer: ReturnType<typeof createServer> | null = null;

  afterEach(async () => {
    io?.close();
    httpServer?.close();
  });

  it('accepts game:useGeneralSkill and returns updated game state', async () => {
    httpServer = createServer();
    io = new Server(httpServer);
    registerSocketHandlers(io, new GameManager());
    await new Promise<void>((resolve) => httpServer!.listen(4010, resolve));

    const client = createClient('http://localhost:4010', { transports: ['websocket'] });
    const statePromise = new Promise((resolve) => client.on('game:state', resolve));

    client.emit('game:join', { emperorIndex: 0 });
    client.emit('game:useGeneralSkill', {
      instanceId: 'general_instance',
      skillIndex: 1,
      target: { type: 'MINION', instanceId: 'enemy_target' },
    });

    await expect(statePromise).resolves.toBeDefined();
    client.close();
  });
});
```

- [ ] **Step 2: 运行 targeted/general skill 测试，确认当前实现失败**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm --filter @king-card/core exec vitest run test/engine/game-engine.test.ts
corepack pnpm --filter @king-card/server exec vitest run test/socketHandler.test.ts
```

Expected: FAIL，`USE_GENERAL_SKILL` 尚未生成，server 也没有 `game:useGeneralSkill`。

- [ ] **Step 3: 扩展 shared 动作类型和 card definitions，让 targeted skills 有明确目标语义**

修改 `packages/shared/src/engine-types.ts` 的 `ValidAction`:

```ts
export type ValidAction =
  | { type: 'PLAY_CARD'; handIndex: number; targetIndex?: number }
  | { type: 'ATTACK'; attackerInstanceId: string; targetInstanceId: string | 'HERO' }
  | { type: 'USE_HERO_SKILL'; target?: import('./types.js').TargetRef }
  | { type: 'USE_MINISTER_SKILL'; target?: import('./types.js').TargetRef }
  | { type: 'USE_GENERAL_SKILL'; instanceId: string; skillIndex: number; target?: import('./types.js').TargetRef }
  | { type: 'SWITCH_MINISTER'; ministerIndex: number }
  | { type: 'END_TURN' };

export interface EffectContext {
  state: Readonly<GameState>;
  mutator: StateMutator;
  source: CardInstance;
  target?: CardInstance;
  selectedTarget?: import('./types.js').TargetRef;
  playerIndex: number;
  eventBus: {
    emit: (event: unknown) => void;
    on: (type: string, handler: (event: unknown) => void) => () => void;
    removeAllListeners: () => void;
  };
  rng: {
    nextInt: (min: number, max: number) => number;
    next: () => number;
    pick: <T>(arr: T[]) => T;
    shuffle: <T>(arr: T[]) => T[];
  };
}
```

把 targeted skills 的参数显式化。

修改 `packages/core/src/cards/definitions/china-ministers.ts`:

```ts
effect: {
  trigger: 'ON_PLAY',
  type: 'APPLY_BUFF',
  params: {
    targetFilter: 'FRIENDLY_MINION',
    attackBonus: 2,
    healthBonus: 1,
    keywordsGranted: ['RUSH'],
    type: 'TEMPORARY',
    remainingTurns: 1,
  },
}
```

```ts
effect: {
  trigger: 'ON_PLAY',
  type: 'APPLY_BUFF',
  params: {
    targetFilter: 'ENEMY_MINION',
    attackDelta: -100,
    type: 'TEMPORARY',
    remainingTurns: 1,
  },
}
```

修改 `packages/core/src/cards/definitions/china-generals.ts`:

```ts
effect: {
  trigger: 'ON_PLAY',
  type: 'DAMAGE',
  params: { targetFilter: 'ENEMY_MINION', amount: 6 },
}
```

```ts
effect: {
  trigger: 'ON_PLAY',
  type: 'MODIFY_STAT',
  params: { targetFilter: 'SELF', attackDelta: 3, healthDelta: 3 },
}
```

修改 `packages/core/src/cards/definitions/china-emperors.ts`:

```ts
effect: {
  trigger: 'ON_PLAY',
  type: 'SUMMON',
  params: { targetFilter: 'FRIENDLY_MINION', cloneOfSelectedTarget: true },
}
```

- [ ] **Step 4: 在 core / server / client 中实现 targeted skill 与 general skill 全链路**

修改 `packages/core/src/engine/action-executor.ts`，新增 general skill 执行入口:

```ts
export function executeUseGeneralSkill(
  state: GameState,
  eventBus: EventBus,
  rng: RNG,
  playerIndex: number,
  instanceId: string,
  skillIndex: number,
  target?: TargetRef,
): EngineResult {
  const general = findMinion(state, instanceId);
  if (!general || general.ownerIndex !== playerIndex || general.card.type !== 'GENERAL') {
    return error('INVALID_TARGET', 'General not found');
  }

  const skill = general.card.generalSkills?.[skillIndex];
  if (!skill) {
    return error('INVALID_TARGET', 'General skill not found');
  }

  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);
  const mutator = createStateMutator(state, collectingBus);

  const effectCtx: EffectContext = {
    state,
    mutator,
    source: general,
    target: target?.type === 'MINION' ? findMinion(state, target.instanceId) : undefined,
    selectedTarget: target,
    playerIndex,
    eventBus: collectingBus as unknown as EffectContext['eventBus'],
    rng: rng as unknown as EffectContext['rng'],
  };

  executeCardEffects(skill.effect.trigger, {
    ...effectCtx,
    source: {
      ...general,
      card: {
        ...general.card,
        effects: [skill.effect],
      },
    },
  });

  collectingBus.emit({ type: 'GENERAL_SKILL_USED', instance: general });
  general.usedGeneralSkills += 1;
  return success(events);
}
```

修改 `packages/core/src/engine/game-engine.ts`：

```ts
for (const minion of player.battlefield) {
  if (minion.card.type !== 'GENERAL' || !minion.card.generalSkills) continue;

  for (let skillIndex = 0; skillIndex < minion.card.generalSkills.length; skillIndex += 1) {
    actions.push({
      type: 'USE_GENERAL_SKILL',
      instanceId: minion.instanceId,
      skillIndex,
    });
  }
}
```

```ts
useGeneralSkill(playerIndex: number, instanceId: string, skillIndex: number, target?: TargetRef): EngineResult {
  return executeUseGeneralSkill(this.state, this.eventBus, this.rng, playerIndex, instanceId, skillIndex, target);
}
```

修改 `packages/server/src/socketHandler.ts`:

```ts
socket.on('game:useGeneralSkill', (payload: {
  instanceId: string;
  skillIndex: number;
  target?: TargetRef;
}) => {
  const ctx = lookupPlayer(socket.id);
  if (!ctx) {
    socket.emit('game:error', { code: 'NO_GAME', message: 'Not in a game' });
    return;
  }

  const { session, playerIndex } = ctx;
  const result = session.engine.useGeneralSkill(playerIndex, payload.instanceId, payload.skillIndex, payload.target);
  handleEngineResult(socket, session, result);
});
```

创建 `packages/client/src/components/board/GeneralSkillsPanel.tsx`:

```tsx
interface GeneralSkillsPanelProps {
  general: {
    instanceId: string;
    card: { generalSkills?: { name: string; cost: number }[] };
  };
  onUseSkill: (instanceId: string, skillIndex: number) => void;
}

export function GeneralSkillsPanel({ general, onUseSkill }: GeneralSkillsPanelProps) {
  if (!general.card.generalSkills?.length) return null;

  return (
    <div className="flex gap-2 rounded bg-gray-900/80 px-3 py-2">
      {general.card.generalSkills.map((skill, skillIndex) => (
        <button
          key={`${general.instanceId}-${skillIndex}`}
          onClick={() => onUseSkill(general.instanceId, skillIndex)}
          className="rounded bg-yellow-700 px-2 py-1 text-xs font-bold text-black hover:bg-yellow-600"
        >
          {skill.name}
        </button>
      ))}
    </div>
  );
}
```

修改 `packages/client/src/stores/gameStore.ts`，新增 skill targeting 状态和 action:

```ts
pendingSkill: null as null | { kind: 'hero' | 'minister' | 'general'; instanceId?: string; skillIndex?: number },

useGeneralSkill: (instanceId: string, skillIndex: number, target?: TargetRef) => {
  socketService.getSocket().emit('game:useGeneralSkill', { instanceId, skillIndex, target });
},

setPendingSkill: (pendingSkill) => {
  set({ pendingSkill });
},
```

修改 `packages/client/src/components/board/GameBoard.tsx`，复用攻击目标选择模式:

```tsx
const pendingSkill = useGameStore((s) => s.pendingSkill);
const useGeneralSkill = useGameStore((s) => s.useGeneralSkill);
const setPendingSkill = useGameStore((s) => s.setPendingSkill);

const handleGeneralSkillClick = (instanceId: string, skillIndex: number) => {
  const matchingActions = validActions.filter(
    (action) => action.type === 'USE_GENERAL_SKILL'
      && action.instanceId === instanceId
      && action.skillIndex === skillIndex,
  );

  const targetedAction = matchingActions.find((action) => action.target);
  if (!targetedAction) {
    useGeneralSkill(instanceId, skillIndex);
    return;
  }

  setPendingSkill({ kind: 'general', instanceId, skillIndex });
};
```

- [ ] **Step 5: 运行 core/server 测试，并做一次前端手动冒烟**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm --filter @king-card/core exec vitest run test/engine/game-engine.test.ts
corepack pnpm --filter @king-card/server exec vitest run test/socketHandler.test.ts
corepack pnpm --filter @king-card/client build
```

Manual smoke:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm --filter @king-card/server dev
corepack pnpm --filter @king-card/client dev
```

Expected: PASS；手动进入 PvE 对局后，选中将领可以看到技能按钮，点击后能直接释放非目标技能，目标技能进入目标选择态。

- [ ] **Step 6: 提交 skill 全链路修复**

```bash
cd /home/xjingyao/code/king_card
git add packages/shared/src/engine-types.ts packages/core/src/cards/definitions/china-generals.ts packages/core/src/cards/definitions/china-ministers.ts packages/core/src/cards/definitions/china-emperors.ts packages/core/src/engine/game-engine.ts packages/core/src/engine/action-executor.ts packages/core/src/index.ts packages/server/src/socketHandler.ts packages/client/src/stores/gameStore.ts packages/client/src/components/board/GameBoard.tsx packages/client/src/components/board/GeneralSkillsPanel.tsx packages/client/src/components/board/index.ts packages/core/test/engine/game-engine.test.ts packages/server/test/socketHandler.test.ts
git commit -m "feat: add targeted and general skill gameplay flow"
```

---

### Task 5: 跑完整回归并更新整改记录

**Files:**
- Modify: `docs/superpowers/specs/redo.md`

- [ ] **Step 1: 在 redo 文档里记录本轮 review remediation 的完成项**

修改 `docs/superpowers/specs/redo.md`，追加:

```md
## 2026-04-15 Code Review Remediation

- [x] Fix client socket listener registration after delayed connect
- [x] Clear stale validActions when turn ownership changes
- [x] Execute declared card effects for spell, emperor, minister and general flows
- [x] Trigger ON_TURN_START effects during the real turn loop
- [x] Add general skill end-to-end gameplay path
- [x] Clone mutable card definition data per CardInstance
```

- [ ] **Step 2: 运行完整测试回归**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm -r run test
```

Expected: PASS，`packages/shared`、`packages/client`、`packages/core`、`packages/server` 全部通过。

- [ ] **Step 3: 运行构建回归**

Run:

```bash
cd /home/xjingyao/code/king_card
corepack pnpm -r run build
```

Expected: PASS，四个包全部构建成功。

- [ ] **Step 4: 提交最终回归和文档更新**

```bash
cd /home/xjingyao/code/king_card
git add docs/superpowers/specs/redo.md
git commit -m "docs: record review remediation completion"
```

---

## Self-Review

**1. Review coverage**

- Finding 1（socket 监听时机错误）由 Task 1 覆盖。
- Finding 7（过期 `validActions` 污染 UI）由 Task 1 覆盖。
- Findings 5/6（共享 Card 可变引用、同名实例错绑）由 Task 2 覆盖。
- Findings 2/3（通用 effect 未执行、真实回合不触发 turn lifecycle）由 Task 3 覆盖。
- Finding 4（general skill 无法到达）由 Task 4 覆盖。

**2. Placeholder scan**

- 本计划没有使用 `TODO`、`TBD`、`implement later` 一类占位语。
- 每个测试、命令和代码步骤都给出了实际内容。

**3. Type consistency**

- `SummonMinionResult` 在 shared、state-mutator、action-executor 中统一命名。
- `USE_GENERAL_SKILL` 的字段统一为 `instanceId`、`skillIndex`、`target`。
- targeted skill 一律通过 `TargetRef` 表达，避免 hero / minion 两套字段并存。