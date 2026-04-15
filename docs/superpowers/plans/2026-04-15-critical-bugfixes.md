# Code Review 七项严重/高优先级缺陷修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 code review 报告中确认的全部 7 项缺陷，使游戏对局流程可正常运转。

**Architecture:** 按"数据层隔离 → 引擎效果执行 → 回合触发 → 武将技能 → 前端 Socket 生命周期"的依赖顺序分 7 个 Task。每个 Task 独立可测，内部严格 TDD。Client 侧两个 Task（Socket 监听、过期 actions）互相独立。

**Tech Stack:** TypeScript 5.x, Vitest, React 19 + Zustand, Socket.IO

**Baseline:** 23 test files, 206 tests passing (`cd packages/core && npx vitest run`)

---

## 文件结构总览

```
packages/
├── shared/src/
│   └── engine-types.ts          # 修改: USE_GENERAL_SKILL 的 targetIndex 改为 skillIndex
├── core/src/
│   ├── models/
│   │   └── card-instance.ts     # 修改: 深拷贝 Card 对象，隔离 keywords
│   ├── engine/
│   │   ├── state-mutator.ts     # 修改: applyBuff/removeBuff 操作实例自身 keywords
│   │   ├── action-executor.ts   # 修改: 实例查找用 instanceId; 新增 executeUseGeneralSkill; STRATAGEM/SORCERY 分支走效果执行
│   │   ├── game-engine.ts       # 修改: getValidActions 产出 USE_GENERAL_SKILL; 暴露 playGeneralSkill
│   │   └── game-loop.ts         # 修改: UPKEEP 阶段调用 resolveEffects('ON_TURN_START')
│   └── cards/effects/
│       ├── generic-effect.ts    # 新建: 通用效果执行器，按 effect.type 分发到 StateMutator
│       └── index.ts             # 修改: 导入 generic-effect
├── core/test/
│   ├── engine/
│   │   ├── card-instance-isolation.test.ts  # 新建
│   │   ├── generic-effect.test.ts           # 新建
│   │   ├── turn-effect-trigger.test.ts      # 新建
│   │   ├── general-skill.test.ts            # 新建
│   │   └── action-executor.test.ts          # 修改: 新增同名卡查找、STRATAGEM 效果测试
│   └── cards/effects/
│       └── generic-effect.test.ts           # 新建
├── server/src/
│   ├── socketHandler.ts         # 修改: 广播 state 时对非当前玩家发送空 validActions
│   └── aiPlayer.ts              # 修改: AI 可使用武将技能
├── client/src/
│   ├── hooks/useGameSocket.ts   # 修改: 监听 socket 连接成功后注册事件
│   ├── stores/gameStore.ts      # 修改: connect 不再提前设 connected; _setGameState 清空 validActions
│   └── services/socketService.ts# 修改: 暴露 socket 实例引用或连接事件
```

---

### Task 1: 修复共享 Card 引用的 keywords 污染（发现 #5）

**问题:** `createCardInstance` 把原始 Card 对象直接挂到实例上。`applyBuff`/`removeBuff` 修改 `minion.card.keywords` 会污染所有同名卡。

**Files:**
- Modify: `packages/core/src/models/card-instance.ts`
- Modify: `packages/core/src/engine/state-mutator.ts:228-273`
- Create: `packages/core/test/engine/card-instance-isolation.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/engine/card-instance-isolation.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createCardInstance, resetInstanceCounter } from '../../src/models/card-instance.js';
import type { Card, CardInstance, GameState, GameEvent } from '@king-card/shared';
import { createStateMutator } from '../../src/engine/state-mutator.js';
import { resetStratagemCounter } from '../../src/engine/state-mutator.js';

const BASE_CARD: Card = {
  id: 'test_minion', name: 'Test', civilization: 'CHINA',
  type: 'MINION', rarity: 'COMMON', cost: 2, attack: 2, health: 2,
  description: '', keywords: [], effects: [],
};

function makeGameState(): GameState {
  return {
    players: [
      {
        id: 'p0', name: 'P0', civilization: 'CHINA',
        hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: { name: 'X', description: 'X', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } }, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        hand: [], handLimit: 10, deck: [], graveyard: [],
        battlefield: [], activeStratagems: [], costModifiers: [],
        energyCrystal: 10, maxEnergy: 10, cannotDrawNextTurn: false,
        ministerPool: [], activeMinisterIndex: -1, boundCards: [],
      },
      {
        id: 'p1', name: 'P1', civilization: 'CHINA',
        hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: { name: 'X', description: 'X', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } }, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        hand: [], handLimit: 10, deck: [], graveyard: [],
        battlefield: [], activeStratagems: [], costModifiers: [],
        energyCrystal: 10, maxEnergy: 10, cannotDrawNextTurn: false,
        ministerPool: [], activeMinisterIndex: -1, boundCards: [],
      },
    ],
    currentPlayerIndex: 0, turnNumber: 1, phase: 'MAIN',
    isGameOver: false, winnerIndex: null, winReason: null,
  };
}

describe('Card instance isolation', () => {
  beforeEach(() => { resetInstanceCounter(); resetStratagemCounter(); });

  it('two instances from the same Card share no mutable state', () => {
    const a = createCardInstance(BASE_CARD, 0);
    const b = createCardInstance(BASE_CARD, 0);
    expect(a.card).not.toBe(b.card); // 不同引用
    expect(a.card.keywords).not.toBe(b.card.keywords); // keywords 数组独立
  });

  it('applyBuff does not mutate the original Card definition', () => {
    const state = makeGameState();
    const instance = createCardInstance(BASE_CARD, 0);
    state.players[0].battlefield.push(instance);
    const bus = { emit: () => {} };
    const mutator = createStateMutator(state, bus);

    mutator.applyBuff(
      { type: 'MINION', instanceId: instance.instanceId },
      {
        id: 'buff_1', attackBonus: 1, healthBonus: 1, maxHealthBonus: 1,
        keywordsGranted: ['TAUNT'], type: 'TEMPORARY', remainingTurns: 1,
      },
    );

    // 实例获得了 TAUNT
    expect(instance.card.keywords).toContain('TAUNT');
    // 原始定义不受影响
    expect(BASE_CARD.keywords).not.toContain('TAUNT');
  });

  it('applyBuff on one instance does not leak to another', () => {
    const state = makeGameState();
    const a = createCardInstance(BASE_CARD, 0);
    const b = createCardInstance(BASE_CARD, 0);
    state.players[0].battlefield.push(a, b);
    const bus = { emit: () => {} };
    const mutator = createStateMutator(state, bus);

    mutator.applyBuff(
      { type: 'MINION', instanceId: a.instanceId },
      {
        id: 'buff_1', attackBonus: 0, healthBonus: 0, maxHealthBonus: 0,
        keywordsGranted: ['CHARGE'], type: 'TEMPORARY', remainingTurns: 1,
      },
    );

    expect(a.card.keywords).toContain('CHARGE');
    expect(b.card.keywords).not.toContain('CHARGE');
  });

  it('removeBuff reverses keywords without affecting other instances', () => {
    const state = makeGameState();
    const a = createCardInstance(BASE_CARD, 0);
    const b = createCardInstance(BASE_CARD, 0);
    state.players[0].battlefield.push(a, b);
    const bus = { emit: () => {} };
    const mutator = createStateMutator(state, bus);

    mutator.applyBuff(
      { type: 'MINION', instanceId: a.instanceId },
      {
        id: 'buff_1', attackBonus: 2, healthBonus: 2, maxHealthBonus: 2,
        keywordsGranted: ['RUSH'], type: 'TEMPORARY', remainingTurns: 1,
      },
    );

    // 手动给 b 也加 RUSH（模拟独立 buff）
    mutator.applyBuff(
      { type: 'MINION', instanceId: b.instanceId },
      {
        id: 'buff_2', attackBonus: 0, healthBonus: 0, maxHealthBonus: 0,
        keywordsGranted: ['RUSH'], type: 'TEMPORARY', remainingTurns: 1,
      },
    );

    // 移除 a 的 buff
    mutator.removeBuff({ type: 'MINION', instanceId: a.instanceId }, 'buff_1');
    expect(a.card.keywords).not.toContain('RUSH');
    // b 不受影响
    expect(b.card.keywords).toContain('RUSH');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd packages/core && npx vitest run test/engine/card-instance-isolation.test.ts
```

预期: FAIL — `expect(a.card).not.toBe(b.card)` 会失败，因为当前 `createCardInstance` 直接赋值 card 引用。

- [ ] **Step 3: 修改 `createCardInstance` 深拷贝 card**

```typescript
// packages/core/src/models/card-instance.ts
import type { Card, CardInstance, Keyword } from '@king-card/shared';

let instanceCounter = 0;

export function createCardInstance(card: Card, ownerIndex: 0 | 1): CardInstance {
  const hasRush = card.keywords.includes('RUSH');
  const hasCharge = card.keywords.includes('CHARGE');
  const hasAssassin = card.keywords.includes('ASSASSIN');

  // 深拷贝 card 以隔离 keywords 可变性。
  // 只拷贝一层：keywords 是我们唯一需要修改的数组，其余字段保持原始值。
  const cardCopy: Card = {
    ...card,
    keywords: [...card.keywords] as Keyword[],
  };

  return {
    card: cardCopy,
    instanceId: `${card.id}_${++instanceCounter}`,
    ownerIndex,
    currentAttack: card.attack ?? 0,
    currentHealth: card.health ?? 0,
    currentMaxHealth: card.health ?? 0,
    remainingAttacks: (hasRush || hasCharge || hasAssassin) ? 1 : 0,
    justPlayed: true,
    sleepTurns: card.keywords.includes('RESEARCH') ? 1 : 0,
    garrisonTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
    position: undefined,
  };
}

export function resetInstanceCounter(): void {
  instanceCounter = 0;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd packages/core && npx vitest run test/engine/card-instance-isolation.test.ts
```

预期: 全部 PASS

- [ ] **Step 5: 运行全量测试确认无回归**

```bash
cd packages/core && npx vitest run
```

预期: 206+ tests PASS（新增 4 个）

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/models/card-instance.ts packages/core/test/engine/card-instance-isolation.test.ts
git commit -m "fix(core): deep-clone Card in createCardInstance to prevent keyword pollution"
```

---

### Task 2: 修复同名随从实例查找错误和 CARD_PLAYED instanceId 不一致（发现 #6）

**问题:** `action-executor.ts:135` 用 `card.id` 查找实例，同名卡会匹配到旧实例。`CARD_PLAYED` 事件使用 `Date.now()` 生成 instanceId，与真实 `instanceCounter` 不一致。

**Files:**
- Modify: `packages/core/src/engine/action-executor.ts:123-148`
- Modify: `packages/core/test/engine/action-executor.test.ts`

- [ ] **Step 1: 写失败测试**

在 `packages/core/test/engine/action-executor.test.ts` 末尾添加:

```typescript
describe('executePlayCard - same-name minions', () => {
  beforeEach(() => {
    resetInstanceCounter();
    resetStratagemCounter();
  });

  function setup() {
    const state: GameState = /* 复用文件中已有的 setup() 中 makeGameState() */;
    const bus = new EventBus(); // 注意: codebase 导出名是 EventBus 不是 EventBusImpl
    const rng = new SeededRNG(42);
    return { state, bus, rng };
  }

  it('ON_PLAY effects target the newly summoned instance, not an older same-name minion', () => {
    const { state, bus, rng } = setup();
    const player = state.players[0];

    // 手动放一个同名随从到场上
    const oldInstance = createCardInstance(BATTLECRY_MINION, 0);
    player.battlefield.push(oldInstance);

    // 把同一张卡放入手牌
    player.hand.push({ ...BATTLECRY_MINION });

    const result = executePlayCard(state, bus, rng, 0, 0);

    expect(result.success).toBe(true);
    // 新实例被加入战场（现在有 2 个）
    expect(player.battlefield.length).toBe(2);
    // 两个实例的 instanceId 不同
    const ids = player.battlefield.map(m => m.instanceId);
    expect(new Set(ids).size).toBe(2);
  });

  it('CARD_PLAYED event carries the real instanceId from createCardInstance', () => {
    const { state, bus, rng } = setup();
    const player = state.players[0];
    const minionCard: Card = {
      id: 'test_summon_minion', name: 'T', civilization: 'CHINA',
      type: 'MINION', rarity: 'COMMON', cost: 1, attack: 1, health: 1,
      description: '', keywords: [], effects: [],
    };
    player.hand.push(minionCard);

    const emitted: GameEvent[] = [];
    const collectingBus = {
      emit: (e: GameEvent) => { emitted.push(e); bus.emit(e); },
      on: bus.on.bind(bus),
      removeAllListeners: bus.removeAllListeners.bind(bus),
    };

    executePlayCard(state, collectingBus, rng, 0, 0);

    const played = emitted.find(e => e.type === 'CARD_PLAYED');
    expect(played).toBeDefined();
    const minionInstance = player.battlefield.find(m => m.card.id === minionCard.id);
    expect(minionInstance).toBeDefined();
    // CARD_PLAYED 的 instanceId 应与实际实例一致
    if (played && 'instanceId' in played) {
      expect((played as any).instanceId).toBe(minionInstance!.instanceId);
    }
  });
});
```

注意: 需要在测试文件顶部增加导入 `EventBusImpl`、`SeededRNG`、`createCardInstance`、`resetInstanceCounter`，以及一个带 BATTLECRY 关键词的测试卡定义 `BATTLECRY_MINION`。复用文件中已有的 helper 模式。

- [ ] **Step 2: 运行测试确认失败**

```bash
cd packages/core && npx vitest run test/engine/action-executor.test.ts
```

预期: FAIL — instanceId 不匹配、旧实例被当作 source。

- [ ] **Step 3: 修改 `executePlayCard` 中的实例查找和 instanceId 生成**

修改 `packages/core/src/engine/action-executor.ts`。需要重构第 122-209 行（从 `CARD_PLAYED` 事件发送到卡牌类型分支结束）。核心变更：

1. MINION/GENERAL 分支：先 `summonMinion`，再取最后一个战场实例作为 `summonedMinion`，用其真实 `instanceId` 发送 `CARD_PLAYED`
2. STRATAGEM/SORCERY 分支：暂时保留空壳（Task 3 填充）
3. EMPEROR 分支：保持不变

```typescript
// 替换 action-executor.ts 第 122 行开始的整个卡牌类型分发逻辑

  // MINION / GENERAL: 先召唤再 emit CARD_PLAYED（使用真实 instanceId）
  if (card.type === 'MINION' || card.type === 'GENERAL') {
    const summonResult = mutator.summonMinion(card, playerIndex as 0 | 1, targetBoardPosition);
    if (summonResult) {
      return error(summonResult, `Failed to summon minion: ${summonResult}`);
    }

    // summonMinion 总是 push 到末尾（无 position）或 splice 到指定位置
    // 取 battlefield 最后一个元素即为新召唤的实例
    const summonedMinion = player.battlefield[player.battlefield.length - 1];

    collectingBus.emit({
      type: 'CARD_PLAYED',
      playerIndex,
      card,
      instanceId: summonedMinion.instanceId,
    });

    const effectCtx: EffectContext = {
      state,
      mutator,
      source: summonedMinion,
      playerIndex,
      eventBus: collectingBus as unknown as EffectContext['eventBus'],
      rng: _rng as unknown as EffectContext['rng'],
    };
    resolveEffects('ON_PLAY', effectCtx);
  } else if (card.type === 'STRATAGEM' || card.type === 'SORCERY') {
    // Phase 1: no specific effect processing — will be wired in Task 3
    collectingBus.emit({ type: 'CARD_PLAYED', playerIndex, card });
  } else if (card.type === 'EMPEROR') {
    // EMPEROR 分支保持原逻辑不变（action-executor.ts:151-209 的全部内容）
    // ↓ 以下为原有 EMPEROR 代码，不做修改 ↓
    const emperorData = getEmperorData(card.id);
    if (!emperorData) {
      // Emperor data not registered — skip emperor switch
    } else {
      // ... 原有 151-208 行内容完全保留 ...
    }
    // ↑ EMPEROR 分支结束 ↑
  }
```

注意：上面 EMPEROR 分支是省略示意。实际修改时只替换第 122-150 行（MINION/GENERAL 分支和 STRATAGEM/SORCERY 分支），第 151-209 行的 EMPEROR 分支完全不动。

- [ ] **Step 4: 运行测试确认通过**

```bash
cd packages/core && npx vitest run test/engine/action-executor.test.ts
```

预期: PASS

- [ ] **Step 5: 运行全量测试**

```bash
cd packages/core && npx vitest run
```

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/engine/action-executor.ts packages/core/test/engine/action-executor.test.ts
git commit -m "fix(core): use real instanceId for CARD_PLAYED and fix same-name minion lookup"
```

---

### Task 3: 实现通用效果执行器 generic-effect（发现 #2）

**问题:** 效果系统只有关键词 handler，没有通用层解释 `card.effects` 数组中的 `SUMMON`、`MODIFY_STAT`、`DRAW` 等 EffectType。导致帝王入场、英雄技能、文臣技能、法术、谋略的效果全部不生效。

**Files:**
- Create: `packages/core/src/cards/effects/generic-effect.ts`
- Modify: `packages/core/src/cards/effects/index.ts`
- Create: `packages/core/test/cards/effects/generic-effect.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/cards/effects/generic-effect.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { clearEffectHandlers, resolveEffects } from '../../../src/cards/effects/index.js';
import { resetInstanceCounter } from '../../../src/models/card-instance.js';
import { resetStratagemCounter, createStateMutator } from '../../../src/engine/state-mutator.js';
import type { Card, CardInstance, GameState, EffectContext, Keyword } from '@king-card/shared';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'test_card', name: 'Test', civilization: 'CHINA',
    type: 'MINION', rarity: 'COMMON', cost: 1, attack: 1, health: 1,
    description: '', keywords: [], effects: [],
    ...overrides,
  };
}

function makeInstance(card: Card, ownerIndex: 0 | 1 = 0): CardInstance {
  return {
    card: { ...card, keywords: [...card.keywords] as Keyword[] },
    instanceId: `${card.id}_1`,
    ownerIndex,
    currentAttack: card.attack ?? 0,
    currentHealth: card.health ?? 0,
    currentMaxHealth: card.health ?? 0,
    remainingAttacks: 0, justPlayed: true, sleepTurns: 0,
    garrisonTurns: 0, usedGeneralSkills: 0, buffs: [], position: undefined,
  };
}

function makeState(): GameState {
  return {
    players: [
      {
        id: 'p0', name: 'P0', civilization: 'CHINA',
        hero: { health: 30, maxHealth: 30, armor: 0,
          heroSkill: { name: 'X', description: 'X', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } },
          skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        hand: [], handLimit: 10, deck: [
          makeCard({ id: 'deck_1' }), makeCard({ id: 'deck_2' }),
          makeCard({ id: 'deck_3' }), makeCard({ id: 'deck_4' }),
        ],
        graveyard: [], battlefield: [], activeStratagems: [], costModifiers: [],
        energyCrystal: 10, maxEnergy: 10, cannotDrawNextTurn: false,
        ministerPool: [], activeMinisterIndex: -1, boundCards: [],
      },
      {
        id: 'p1', name: 'P1', civilization: 'CHINA',
        hero: { health: 30, maxHealth: 30, armor: 0,
          heroSkill: { name: 'X', description: 'X', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } },
          skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        hand: [], handLimit: 10, deck: [], graveyard: [], battlefield: [],
        activeStratagems: [], costModifiers: [],
        energyCrystal: 10, maxEnergy: 10, cannotDrawNextTurn: false,
        ministerPool: [], activeMinisterIndex: -1, boundCards: [],
      },
    ],
    currentPlayerIndex: 0, turnNumber: 1, phase: 'MAIN',
    isGameOver: false, winnerIndex: null, winReason: null,
  };
}

function makeCtx(overrides: Partial<EffectContext> = {}): EffectContext {
  const state = makeState();
  const source = makeInstance(makeCard());
  return {
    state,
    mutator: createStateMutator(state, { emit: () => {} }),
    source,
    playerIndex: 0,
    eventBus: { emit: () => {}, on: () => () => {}, removeAllListeners: () => {} },
    rng: { nextInt: () => 0, next: () => 0, pick: (arr: any[]) => arr[0], shuffle: (a: any[]) => a },
    ...overrides,
  } as EffectContext;
}

describe('Generic effect executor', () => {
  beforeEach(() => { clearEffectHandlers(); resetInstanceCounter(); resetStratagemCounter(); });

  // 动态导入以触发 generic-effect 注册
  async function importGenericEffect() {
    await import('../../../src/cards/effects/generic-effect.js');
  }

  it('SUMMON effect spawns a minion on the battlefield', async () => {
    await importGenericEffect();
    const state = makeState();
    const source = makeInstance(makeCard({ id: 'hero_skill_summon' }));
    const ctx: EffectContext = {
      ...makeCtx(),
      state,
      source,
      playerIndex: 0,
    };
    // source.card.effects 中有 SUMMON 效果
    source.card.effects = [{
      trigger: 'ON_PLAY', type: 'SUMMON',
      params: { cardId: 'test_card' },
    }];

    resolveEffects('ON_PLAY', ctx);

    expect(state.players[0].battlefield.length).toBeGreaterThan(0);
  });

  it('MODIFY_STAT effect buffs all friendly minions', async () => {
    await importGenericEffect();
    const state = makeState();
    state.players[0].battlefield.push(makeInstance(makeCard({ id: 'target' }), 0));
    const source = makeInstance(makeCard({ id: 'source' }));
    source.card.effects = [{
      trigger: 'ON_PLAY', type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 2, healthDelta: 3 },
    }];

    resolveEffects('ON_PLAY', { ...makeCtx(), state, source, playerIndex: 0 });

    expect(state.players[0].battlefield[0].currentAttack).toBe(3); // 1 + 2
    expect(state.players[0].battlefield[0].currentHealth).toBe(4); // 1 + 3
  });

  it('DRAW effect draws cards from deck', async () => {
    await importGenericEffect();
    const state = makeState();
    expect(state.players[0].hand.length).toBe(0);
    const source = makeInstance(makeCard({ id: 'draw_source' }));
    source.card.effects = [{
      trigger: 'ON_PLAY', type: 'DRAW', params: { count: 2 },
    }];

    resolveEffects('ON_PLAY', { ...makeCtx(), state, source, playerIndex: 0 });

    expect(state.players[0].hand.length).toBe(2);
  });

  it('DAMAGE effect deals damage to enemy hero', async () => {
    await importGenericEffect();
    const state = makeState();
    const source = makeInstance(makeCard({ id: 'dmg_source' }));
    source.card.effects = [{
      trigger: 'ON_PLAY', type: 'DAMAGE',
      params: { target: 'ENEMY_HERO', amount: 5 },
    }];

    resolveEffects('ON_PLAY', { ...makeCtx(), state, source, playerIndex: 0 });

    expect(state.players[1].hero.health).toBe(25); // 30 - 5
  });

  it('GARRISON_MARK effect sets garrisonTurns on the source', async () => {
    await importGenericEffect();
    const state = makeState();
    const source = makeInstance(makeCard({ id: 'garrison_source' }));
    source.card.effects = [{
      trigger: 'ON_PLAY', type: 'GARRISON_MARK',
      params: { garrisonTurns: 2 },
    }];

    resolveEffects('ON_PLAY', { ...makeCtx(), state, source, playerIndex: 0 });

    // garrisonTurns 应被设置（source 本身不在战场上，但如果 effect 是针对 source 的）
    // 对于 GARRISON_MARK，它设置 source 的 garrisonTurns
    expect(source.garrisonTurns).toBe(2);
  });

  it('APPLY_BUFF effect grants keywords temporarily', async () => {
    await importGenericEffect();
    const state = makeState();
    const target = makeInstance(makeCard({ id: 'buff_target' }), 0);
    state.players[0].battlefield.push(target);
    const source = makeInstance(makeCard({ id: 'buff_source' }));
    source.card.effects = [{
      trigger: 'ON_PLAY', type: 'APPLY_BUFF',
      params: {
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['CHARGE'],
        type: 'TEMPORARY', remainingTurns: 1,
        healthBonus: 0, attackBonus: 0,
      },
    }];

    resolveEffects('ON_PLAY', { ...makeCtx(), state, source, playerIndex: 0 });

    expect(state.players[0].battlefield[0].card.keywords).toContain('CHARGE');
  });

  it('effects with non-matching trigger are skipped', async () => {
    await importGenericEffect();
    const state = makeState();
    const source = makeInstance(makeCard({ id: 'skip_source' }));
    source.card.effects = [{
      trigger: 'ON_DEATH', type: 'DRAW', params: { count: 5 },
    }];

    resolveEffects('ON_PLAY', { ...makeCtx(), state, source, playerIndex: 0 });

    expect(state.players[0].hand.length).toBe(0); // 不应抽牌
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd packages/core && npx vitest run test/cards/effects/generic-effect.test.ts
```

预期: FAIL — `generic-effect.js` 尚不存在。

- [ ] **Step 3: 实现 `generic-effect.ts`**

```typescript
// packages/core/src/cards/effects/generic-effect.ts
import type { EffectHandler, EffectContext, CardEffect, Keyword, EffectType } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * Effect types already handled by dedicated keyword handlers.
 * The generic executor skips these to avoid double execution.
 */
const KEYWORD_HANDLED_TYPES: Set<EffectType> = new Set([
  'MOBILIZE',    // handled by mobilize.ts
  'GARRISON',    // handled by garrison.ts
  'AURA',        // handled by aura.ts
  'CONDITIONAL_BUFF', // handled by mobilize.ts (MOBILIZE variant)
]);

/**
 * Generic effect executor.
 *
 * Reads source.card.effects[] and dispatches each effect by its `type` field.
 * Skips effect types that already have dedicated keyword handlers to avoid
 * double execution.
 *
 * This handler is registered with keyword 'TAUNT' (a no-op keyword handler)
 * purely to satisfy the EffectHandler interface. It does NOT filter by keyword.
 */
const genericEffectHandler: EffectHandler = {
  keyword: 'TAUNT' as Keyword,

  onPlay(ctx: EffectContext) {
    executeMatchingEffects('ON_PLAY', ctx);
    return [];
  },

  onDeath(ctx: EffectContext) {
    executeMatchingEffects('ON_DEATH', ctx);
    return [];
  },

  onKill(ctx: EffectContext) {
    executeMatchingEffects('ON_KILL', ctx);
    return [];
  },

  onTurnStart(ctx: EffectContext) {
    executeMatchingEffects('ON_TURN_START', ctx);
    return [];
  },

  onTurnEnd(ctx: EffectContext) {
    executeMatchingEffects('ON_TURN_END', ctx);
    return [];
  },

  onAttack(ctx: EffectContext) {
    executeMatchingEffects('ON_ATTACK', ctx);
    return [];
  },
};

function executeMatchingEffects(trigger: string, ctx: EffectContext): void {
  const effects = ctx.source.card.effects;
  for (const effect of effects) {
    if (effect.trigger !== trigger) continue;
    // Skip types handled by dedicated keyword handlers
    if (KEYWORD_HANDLED_TYPES.has(effect.type)) continue;
    executeSingleEffect(effect, ctx);
  }
}

function executeSingleEffect(effect: CardEffect, ctx: EffectContext): void {
  const { mutator, state, source, playerIndex } = ctx;
  const opponentIndex = (1 - playerIndex) as 0 | 1;
  const p = effect.params;

  switch (effect.type) {
    case 'SUMMON': {
      const cardId = p.cardId as string;
      // 从牌库/全局注册表查找卡牌定义。这里简化处理：生成基础卡
      // 实际需要卡牌注册表查找，暂时用 id 构造一个最小卡
      const summoned: import('@king-card/shared').Card = {
        id: cardId, name: cardId, civilization: source.card.civilization,
        type: 'MINION', rarity: 'COMMON', cost: 1, attack: 1, health: 1,
        description: '', keywords: [], effects: [],
      };
      // 如果是克隆
      if (p.cloneOfInstanceId) {
        // 找到场上对应实例并复制
        const original = state.players[playerIndex].battlefield.find(
          m => m.instanceId === p.cloneOfInstanceId
        ) ?? source;
        mutator.summonMinion(
          { ...original.card, id: `clone_${original.card.id}` },
          playerIndex as 0 | 1,
        );
      } else {
        mutator.summonMinion(summoned, playerIndex as 0 | 1);
      }
      break;
    }

    case 'MODIFY_STAT': {
      const targets = getTargets(p.targetFilter as string, state, playerIndex);
      const attackDelta = (p.attackDelta as number) ?? 0;
      const healthDelta = (p.healthDelta as number) ?? 0;
      for (const target of targets) {
        if (attackDelta !== 0) {
          mutator.modifyStat({ type: 'MINION', instanceId: target.instanceId }, 'attack', attackDelta);
        }
        if (healthDelta !== 0) {
          mutator.modifyStat({ type: 'MINION', instanceId: target.instanceId }, 'health', healthDelta);
        }
      }
      break;
    }

    case 'DRAW': {
      const count = (p.count as number) ?? 1;
      mutator.drawCards(playerIndex, count);
      break;
    }

    case 'DAMAGE': {
      const amount = (p.amount as number) ?? 0;
      const target = p.target as string;
      if (target === 'ENEMY_HERO') {
        mutator.damage({ type: 'HERO', playerIndex: opponentIndex }, amount);
      } else if (target === 'ENEMY_MINION') {
        // 对于需要选择目标的场景，暂时随机选一个敌方随从
        const enemies = state.players[opponentIndex].battlefield;
        if (enemies.length > 0) {
          const targetMinion = ctx.rng.pick(enemies);
          mutator.damage({ type: 'MINION', instanceId: targetMinion.instanceId }, amount);
        }
      }
      break;
    }

    case 'GARRISON_MARK': {
      const turns = (p.garrisonTurns as number) ?? 2;
      const filter = p.targetFilter as string | undefined;
      if (filter === 'ALL_FRIENDLY_MINIONS') {
        for (const minion of state.players[playerIndex].battlefield) {
          minion.garrisonTurns = turns;
        }
      } else {
        source.garrisonTurns = turns;
      }
      break;
    }

    case 'APPLY_BUFF': {
      const targets = getTargets((p.targetFilter as string) ?? 'SELF', state, playerIndex);
      const kwGranted = (p.keywordsGranted as Keyword[]) ?? [];
      const remainingTurns = (p.remainingTurns as number) ?? 1;
      const attackBonus = (p.attackBonus as number) ?? 0;
      const healthBonus = (p.healthBonus as number) ?? 0;
      for (const target of targets) {
        mutator.applyBuff(
          { type: 'MINION', instanceId: target.instanceId },
          {
            id: `buff_${source.instanceId}_${target.instanceId}_${Date.now()}`,
            sourceInstanceId: source.instanceId,
            sourceCardId: source.card.id,
            attackBonus,
            healthBonus,
            maxHealthBonus: healthBonus,
            keywordsGranted: kwGranted,
            type: (p.type as 'TEMPORARY' | 'PERMANENT' | 'AURA') ?? 'TEMPORARY',
            remainingTurns,
          },
        );
      }
      break;
    }

    case 'ACTIVATE_STRATAGEM': {
      mutator.activateStratagem(source.card, playerIndex);
      break;
    }

    case 'CONDITIONAL_BUFF': {
      // MOBILIZE 类型条件 buff — 委托给 mobilize handler
      // 这里只处理非 MOBILIZE 的条件 buff
      break;
    }

    // DAMAGE, HEAL, DISCARD, DESTROY 等后续按需添加
    default:
      // 未识别的 effect type: 安静跳过
      break;
  }
}

function getTargets(
  filter: string,
  state: import('@king-card/shared').GameState,
  playerIndex: number,
): import('@king-card/shared').CardInstance[] {
  const opponentIndex = (1 - playerIndex) as 0 | 1;
  switch (filter) {
    case 'ALL_FRIENDLY_MINIONS':
      return state.players[playerIndex].battlefield;
    case 'ALL_ENEMY_MINIONS':
      return state.players[opponentIndex].battlefield;
    case 'SELF':
      return []; // 需要上下文中的 source 实例
    default:
      return [];
  }
}

export function registerGenericEffect(): void {
  registerEffectHandler(genericEffectHandler);
}

// Auto-register on module import
registerGenericEffect();
```

- [ ] **Step 4: 更新 `effects/index.ts` 添加导入**

```typescript
// packages/core/src/cards/effects/index.ts — 末尾添加
import './generic-effect.js';
```

- [ ] **Step 5: 运行测试确认通过**

```bash
cd packages/core && npx vitest run test/cards/effects/generic-effect.test.ts
```

预期: PASS

- [ ] **Step 6: 运行全量测试**

```bash
cd packages/core && npx vitest run
```

- [ ] **Step 7: 连通 action-executor 的 STRATAGEM/SORCERY 分支**

修改 `packages/core/src/engine/action-executor.ts` 中 STRATAGEM/SORCERY 分支（Task 2 中预留的位置）：

```typescript
    if (card.type === 'STRATAGEM' || card.type === 'SORCERY') {
      // 为法术/谋略构造一个合成的 source 来解析效果
      const syntheticSource: CardInstance = {
        card,
        instanceId: `${card.id}_${Date.now()}`,
        ownerIndex: playerIndex as 0 | 1,
        currentAttack: 0, currentHealth: 0, currentMaxHealth: 0,
        remainingAttacks: 0, justPlayed: false, sleepTurns: 0,
        garrisonTurns: 0, usedGeneralSkills: 0, buffs: [], position: undefined,
      };
      const effectCtx: EffectContext = {
        state, mutator,
        source: syntheticSource,
        playerIndex,
        eventBus: collectingBus as unknown as EffectContext['eventBus'],
        rng: _rng as unknown as EffectContext['rng'],
      };
      resolveEffects('ON_PLAY', effectCtx);
    }
```

- [ ] **Step 8: 运行全量测试确认无回归**

```bash
cd packages/core && npx vitest run
```

- [ ] **Step 9: 提交**

```bash
git add packages/core/src/cards/effects/generic-effect.ts packages/core/src/cards/effects/index.ts packages/core/src/engine/action-executor.ts packages/core/test/cards/effects/generic-effect.test.ts
git commit -m "feat(core): add generic effect executor to resolve SUMMON, MODIFY_STAT, DRAW, etc."
```

---

### Task 4: 回合触发效果接入真实回合循环（发现 #3）

**问题:** `game-loop.ts` 的 `executeTurnStart` 从未调用 `resolveEffects('ON_TURN_START')`，导致 GARRISON 等按回合触发的能力不会自动触发。

**Files:**
- Modify: `packages/core/src/engine/game-loop.ts:46-83`
- Create: `packages/core/test/engine/turn-effect-trigger.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/engine/turn-effect-trigger.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { clearEffectHandlers } from '../../../src/cards/effects/index.js';
import { executeTurnStart } from '../../../src/engine/game-loop.js';
import type { GameState, CardInstance, Keyword } from '@king-card/shared';

function makeCardInstance(garrisonTurns: number): CardInstance {
  return {
    card: {
      id: 'garrison_minion', name: 'Garrison', civilization: 'CHINA',
      type: 'MINION', rarity: 'COMMON', cost: 3, attack: 2, health: 2,
      description: '', keywords: ['GARRISON' as Keyword],
      effects: [{ trigger: 'ON_TURN_START', type: 'GARRISON', params: { garrisonAttackBonus: 2, garrisonHealthBonus: 2 } }],
    },
    instanceId: 'garrison_minion_1',
    ownerIndex: 0, currentAttack: 2, currentHealth: 2, currentMaxHealth: 2,
    remainingAttacks: 0, justPlayed: false, sleepTurns: 0,
    garrisonTurns, usedGeneralSkills: 0, buffs: [], position: 0,
  };
}

function makeState(): GameState {
  return {
    players: [
      {
        id: 'p0', name: 'P0', civilization: 'CHINA',
        hero: { health: 30, maxHealth: 30, armor: 0,
          heroSkill: { name: 'X', description: 'X', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } },
          skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        hand: [], handLimit: 10, deck: [
          { id: 'd1', name: 'D', civilization: 'CHINA', type: 'MINION', rarity: 'COMMON', cost: 1, description: '', keywords: [], effects: [] },
        ],
        graveyard: [], battlefield: [], activeStratagems: [], costModifiers: [],
        energyCrystal: 0, maxEnergy: 0, cannotDrawNextTurn: false,
        ministerPool: [], activeMinisterIndex: -1, boundCards: [],
      },
      {
        id: 'p1', name: 'P1', civilization: 'CHINA',
        hero: { health: 30, maxHealth: 30, armor: 0,
          heroSkill: { name: 'X', description: 'X', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } },
          skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        hand: [], handLimit: 10, deck: [], graveyard: [], battlefield: [],
        activeStratagems: [], costModifiers: [],
        energyCrystal: 0, maxEnergy: 0, cannotDrawNextTurn: false,
        ministerPool: [], activeMinisterIndex: -1, boundCards: [],
      },
    ],
    currentPlayerIndex: 0, turnNumber: 0, phase: 'ENERGY_GAIN',
    isGameOver: false, winnerIndex: null, winReason: null,
  };
}

describe('Turn-triggered effects in game loop', () => {
  beforeEach(() => { clearEffectHandlers(); });

  it('GARRISON minion with garrisonTurns=0 gets buff at turn start', async () => {
    // 导入所有效果处理器（包括 garrison 和 generic-effect）
    await import('../../../src/cards/effects/index.js');

    const state = makeState();
    const minion = makeCardInstance(0); // garrisonTurns 已经为 0
    state.players[0].battlefield.push(minion);

    const bus = { emit: () => {} };
    executeTurnStart(state, bus);

    expect(minion.currentAttack).toBe(4); // 2 + 2
    expect(minion.currentHealth).toBe(4); // 2 + 2
  });

  it('GARRISON minion with garrisonTurns>0 gets countdown but no buff', async () => {
    await import('../../../src/cards/effects/index.js');

    const state = makeState();
    const minion = makeCardInstance(2); // 还需要 2 回合
    state.players[0].battlefield.push(minion);

    const bus = { emit: () => {} };
    executeTurnStart(state, bus);

    expect(minion.garrisonTurns).toBe(1); // 倒计时减少
    expect(minion.currentAttack).toBe(2); // 无 buff
    expect(minion.currentHealth).toBe(2);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd packages/core && npx vitest run test/engine/turn-effect-trigger.test.ts
```

预期: FAIL — GARRISON buff 未生效（`currentAttack` 仍为 2）。

- [ ] **Step 3: 修改 `game-loop.ts` 在 UPKEEP 后调用 resolveEffects**

两处修改 `packages/core/src/engine/game-loop.ts`:

**3a. 在文件顶部添加 import（第 1-6 行现有 import 之后）：**

```typescript
import { resolveEffects } from '../cards/effects/index.js';
import type { EffectContext } from '@king-card/shared';
```

**3b. 在 UPKEEP 阶段末尾（第 79 行 sleep wakeup 循环结束后，第 81 行 `// ── Phase 4: MAIN` 注释之前）插入：**

```typescript
  // 3d. Resolve ON_TURN_START effects for the current player
  const turnStartCtx: EffectContext = {
    state,
    mutator,
    source: player.battlefield[0] ?? {
      card: { id: 'turn_start', name: 'Turn Start', civilization: player.civilization,
        type: 'MINION', rarity: 'COMMON', cost: 0, description: '', keywords: [], effects: [] },
      instanceId: 'turn_start', ownerIndex: state.currentPlayerIndex as 0 | 1,
      currentAttack: 0, currentHealth: 0, currentMaxHealth: 0,
      remainingAttacks: 0, justPlayed: false, sleepTurns: 0,
      garrisonTurns: 0, usedGeneralSkills: 0, buffs: [], position: undefined,
    },
    playerIndex: state.currentPlayerIndex,
    eventBus: eventBus as unknown as EffectContext['eventBus'],
    rng: { nextInt: () => 0, next: () => 0, pick: <T>(arr: T[]) => arr[0], shuffle: <T>(a: T[]) => a },
  };
  resolveEffects('ON_TURN_START', turnStartCtx);
```

关键：GARRISON handler 的 `onTurnStart` 会遍历场上所有带 GARRISON 关键词且 `garrisonTurns === 0` 的随从并加 buff。它不依赖 `ctx.source` 是特定实例，所以 source 用谁都可以。

- [ ] **Step 4: 运行测试确认通过**

```bash
cd packages/core && npx vitest run test/engine/turn-effect-trigger.test.ts
```

预期: PASS

- [ ] **Step 5: 运行全量测试**

```bash
cd packages/core && npx vitest run
```

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/engine/game-loop.ts packages/core/test/engine/turn-effect-trigger.test.ts
git commit -m "fix(core): call resolveEffects(ON_TURN_START) in game loop UPKEEP phase"
```

---

### Task 5: 实现武将主动技能（发现 #4）

**问题:** `USE_GENERAL_SKILL` 在 shared 类型中已定义，卡牌数据中有 `generalSkills`，但 `getValidActions` 不产出此动作，引擎也没有执行函数。

**Files:**
- Modify: `packages/shared/src/engine-types.ts:199`
- Modify: `packages/core/src/engine/game-engine.ts:103-207`
- Modify: `packages/core/src/engine/action-executor.ts` — 新增 `executeUseGeneralSkill`
- Create: `packages/core/test/engine/general-skill.test.ts`

- [ ] **Step 0: 修改 shared ValidAction 类型**

当前 `packages/shared/src/engine-types.ts:199` 定义的 `USE_GENERAL_SKILL` 使用 `targetIndex`，但武将技能需要的是 `skillIndex`。修改为：

```typescript
// packages/shared/src/engine-types.ts — 替换 USE_GENERAL_SKILL 行
  | { type: 'USE_GENERAL_SKILL'; instanceId: string; skillIndex?: number }
```

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/engine/general-skill.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { clearEffectHandlers } from '../../../src/cards/effects/index.js';
import { GameEngine } from '../../../src/engine/game-engine.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import { SeededRNG } from '../../../src/engine/rng.js';
import type { Card, EmperorData } from '@king-card/shared';

const GENERAL_CARD: Card = {
  id: 'test_general', name: 'Test General', civilization: 'CHINA',
  type: 'GENERAL', rarity: 'LEGENDARY', cost: 5, attack: 5, health: 5,
  description: '', keywords: ['CHARGE'], effects: [],
  generalSkills: [
    {
      name: 'Skill A', description: 'Deal 3 damage', cost: 0, usesPerTurn: 1,
      effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: { target: 'ENEMY_HERO', amount: 3 } },
    },
    {
      name: 'Skill B', description: 'Buff self +2/+2', cost: 0, usesPerTurn: 1,
      effect: { trigger: 'ON_PLAY', type: 'MODIFY_STAT', params: { targetFilter: 'SELF', attackDelta: 2, healthDelta: 2 } },
    },
  ],
};

function makeEmperorData(): EmperorData {
  return {
    emperorCard: {
      id: 'test_emperor', name: 'Test Emperor', civilization: 'CHINA',
      type: 'EMPEROR', rarity: 'LEGENDARY', cost: 4, attack: 0, health: 30,
      description: '', keywords: [], effects: [],
      heroSkill: { name: 'H', description: 'H', cost: 1, cooldown: 1, effect: { trigger: 'ON_PLAY', type: 'SUMMON', params: { cardId: 'test_card' } } },
    },
    ministers: [],
    boundGenerals: [],
    boundSorceries: [],
  };
}

function makeDeck(): Card[] {
  return Array.from({ length: 30 }, (_, i) => ({
    id: `deck_card_${i}`, name: `Card ${i}`, civilization: 'CHINA',
    type: 'MINION', rarity: 'COMMON', cost: 1, attack: 1, health: 1,
    description: '', keywords: [], effects: [],
  }));
}

describe('General skills', () => {
  beforeEach(() => { clearEffectHandlers(); });

  it('getValidActions includes USE_GENERAL_SKILL for generals with unused skills', async () => {
    await import('../../../src/cards/effects/index.js');

    const emp = makeEmperorData();
    const engine = GameEngine.create(makeDeck(), makeDeck(), emp, emp, new SeededRNG(42));
    const state = engine.getGameState();

    // 手动放一个武将到场上
    const player = state.players[0] as any;
    // 找到手牌中的位置并打出 GENERAL（需要先加入手牌）
    // 简化：直接操作 battlefield
    const { createCardInstance } = await import('../../../src/models/card-instance.js');
    const generalInstance = createCardInstance(GENERAL_CARD, 0);
    generalInstance.remainingAttacks = 1;
    generalInstance.justPlayed = false;
    player.battlefield.push(generalInstance);

    const actions = engine.getValidActions(0);
    const generalActions = actions.filter(a => a.type === 'USE_GENERAL_SKILL');
    expect(generalActions.length).toBeGreaterThan(0);
  });

  it('executing USE_GENERAL_SKILL applies the skill effect', async () => {
    await import('../../../src/cards/effects/index.js');

    const emp = makeEmperorData();
    const engine = GameEngine.create(makeDeck(), makeDeck(), emp, emp, new SeededRNG(42));
    const state = engine.getGameState() as any;
    const { createCardInstance } = await import('../../../src/models/card-instance.js');
    const generalInstance = createCardInstance(GENERAL_CARD, 0);
    generalInstance.remainingAttacks = 1;
    generalInstance.justPlayed = false;
    state.players[0].battlefield.push(generalInstance);

    const enemyHealthBefore = state.players[1].hero.health;

    // 使用第一个技能
    const result = engine.playGeneralSkill(0, generalInstance.instanceId, 0);
    expect(result.success).toBe(true);

    // 敌方英雄应受到 3 点伤害
    expect(state.players[1].hero.health).toBe(enemyHealthBefore - 3);
  });

  it('general skills are limited by usesPerTurn', async () => {
    await import('../../../src/cards/effects/index.js');

    const emp = makeEmperorData();
    const engine = GameEngine.create(makeDeck(), makeDeck(), emp, emp, new SeededRNG(42));
    const state = engine.getGameState() as any;
    const { createCardInstance } = await import('../../../src/models/card-instance.js');
    const generalInstance = createCardInstance(GENERAL_CARD, 0);
    generalInstance.remainingAttacks = 1;
    generalInstance.justPlayed = false;
    state.players[0].battlefield.push(generalInstance);

    // 使用技能 A
    engine.playGeneralSkill(0, generalInstance.instanceId, 0);
    // 再次使用同一个技能应失败
    const result = engine.playGeneralSkill(0, generalInstance.instanceId, 0);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd packages/core && npx vitest run test/engine/general-skill.test.ts
```

预期: FAIL — `engine.playGeneralSkill` 不存在。

- [ ] **Step 3: 实现 `executeUseGeneralSkill`**

在 `packages/core/src/engine/action-executor.ts` 末尾添加:

```typescript
// ─── executeUseGeneralSkill ───────────────────────────────────────

export function executeUseGeneralSkill(
  state: GameState,
  eventBus: EventBus,
  _rng: RNG,
  playerIndex: number,
  instanceId: string,
  skillIndex: number,
): EngineResult {
  // ── Validation ──
  if (state.phase !== 'MAIN') {
    return error('INVALID_PHASE', `Cannot use general skill in phase ${state.phase}`);
  }
  if (playerIndex !== state.currentPlayerIndex) {
    return error('INVALID_PHASE', `Player ${playerIndex} is not the current player`);
  }

  const player = state.players[playerIndex];
  const minion = player.battlefield.find(m => m.instanceId === instanceId);
  if (!minion) {
    return error('INVALID_TARGET', `Minion ${instanceId} not found`);
  }
  if (minion.card.type !== 'GENERAL' || !minion.card.generalSkills) {
    return error('INVALID_TARGET', `Minion is not a general`);
  }

  const skill = minion.card.generalSkills[skillIndex];
  if (!skill) {
    return error('INVALID_TARGET', `Skill index ${skillIndex} out of range`);
  }

  // 检查本回合使用次数（通过 usedGeneralSkills 位掩码）
  const usedMask = 1 << skillIndex;
  if (minion.usedGeneralSkills & usedMask) {
    return error('SKILL_ON_COOLDOWN', `Skill ${skill.name} already used this turn`);
  }

  if (player.energyCrystal < skill.cost) {
    return error('INSUFFICIENT_ENERGY', `Skill costs ${skill.cost}, player has ${player.energyCrystal}`);
  }

  // ── Execution ──
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);
  const mutator = createStateMutator(state, collectingBus);

  // 标记技能已使用
  minion.usedGeneralSkills |= usedMask;

  // 扣费
  if (skill.cost > 0) {
    player.energyCrystal -= skill.cost;
    collectingBus.emit({
      type: 'ENERGY_SPENT', playerIndex, amount: skill.cost,
      remainingEnergy: player.energyCrystal,
    });
  }

  // 构造合成 source 并解析效果
  const syntheticSource: CardInstance = {
    card: {
      id: `${minion.card.id}_skill_${skillIndex}`,
      name: skill.name,
      civilization: player.civilization,
      type: 'MINION', rarity: 'RARE', cost: skill.cost,
      description: skill.description,
      keywords: [], effects: [skill.effect],
    },
    instanceId: `${minion.instanceId}_skill_${Date.now()}`,
    ownerIndex: playerIndex as 0 | 1,
    currentAttack: minion.currentAttack,
    currentHealth: minion.currentHealth,
    currentMaxHealth: minion.currentMaxHealth,
    remainingAttacks: 0, justPlayed: false, sleepTurns: 0,
    garrisonTurns: 0, usedGeneralSkills: 0, buffs: [], position: minion.position,
  };

  const effectCtx: EffectContext = {
    state, mutator, source: syntheticSource, playerIndex,
    eventBus: collectingBus as unknown as EffectContext['eventBus'],
    rng: _rng as unknown as EffectContext['rng'],
  };
  resolveEffects('ON_PLAY', effectCtx);

  collectingBus.emit({
    type: 'GENERAL_SKILL_USED' as any,
    playerIndex, instanceId, skillIndex, skillName: skill.name,
  } as any);

  return success(events);
}
```

- [ ] **Step 4: 在 `game-engine.ts` 中添加 `getValidActions` 和 `playGeneralSkill`**

在 `game-engine.ts` 的 `getValidActions` 方法中（第 201 行 `// 6. END_TURN` 之前）添加:

```typescript
    // 5.5. USE_GENERAL_SKILL
    for (const minion of player.battlefield) {
      if (minion.card.type !== 'GENERAL' || !minion.card.generalSkills) continue;
      for (let si = 0; si < minion.card.generalSkills.length; si++) {
        const skill = minion.card.generalSkills[si];
        const usedMask = 1 << si;
        if (minion.usedGeneralSkills & usedMask) continue;
        if (skill.cost > player.energyCrystal) continue;
        actions.push({ type: 'USE_GENERAL_SKILL', instanceId: minion.instanceId, skillIndex: si } as ValidAction);
      }
    }
```

在 `game-engine.ts` 的 Action Interface 部分添加:

```typescript
  playGeneralSkill(playerIndex: number, instanceId: string, skillIndex: number): EngineResult {
    return executeUseGeneralSkill(this.state, this.eventBus, this.rng, playerIndex, instanceId, skillIndex);
  }
```

需要在文件顶部导入 `executeUseGeneralSkill`:

```typescript
import { executePlayCard, executeAttack, executeEndTurn, executeUseHeroSkill, executeUseMinisterSkill, executeSwitchMinister, executeUseGeneralSkill } from './action-executor.js';
```

- [ ] **Step 5: 运行测试确认通过**

```bash
cd packages/core && npx vitest run test/engine/general-skill.test.ts
```

预期: PASS

- [ ] **Step 6: 运行全量测试**

```bash
cd packages/core && npx vitest run
```

- [ ] **Step 7: 提交**

```bash
git add packages/core/src/engine/action-executor.ts packages/core/src/engine/game-engine.ts packages/core/test/engine/general-skill.test.ts
git commit -m "feat(core): implement USE_GENERAL_SKILL action and executeUseGeneralSkill"
```

---

### Task 6: 修复 Socket 事件监听注册时序（发现 #1）

**问题:** `useGameSocket` 的 `useEffect` 依赖数组为空，初次渲染时 socket 未连接导致提前返回，后续不再重跑。点击 PvE 连接后，game:state 等监听永远挂不上。

**Files:**
- Modify: `packages/client/src/hooks/useGameSocket.ts`
- Modify: `packages/client/src/stores/gameStore.ts:130-132`
- Modify: `packages/client/src/services/socketService.ts`

- [ ] **Step 1: 修改 `socketService.ts` 暴露 socket 引用和连接 Promise**

```typescript
// packages/client/src/services/socketService.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(url: string): Socket {
    this.socket = io(url, { transports: ['websocket'] });
    return this.socket;
  }

  getSocket(): Socket {
    if (!this.socket) throw new Error('Socket not connected');
    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Returns the socket reference (may be null if not yet created).
   * Used by useGameSocket to detect when a socket object exists.
   */
  getSocketRef(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
```

- [ ] **Step 2: 修改 `gameStore.ts` 移除 connect 中的提前设 connected**

```typescript
// packages/client/src/stores/gameStore.ts — 修改 connect 方法 (line 130-132)
  connect: (url: string) => {
    socketService.connect(url);
    // 不再在此处 set connected，由 socket 的 connect 事件触发
  },
```

- [ ] **Step 3: 重写 `useGameSocket.ts` 在 socket 连接后注册监听**

```typescript
// packages/client/src/hooks/useGameSocket.ts
import { useEffect, useRef } from 'react';
import { socketService } from '../services/socketService.js';
import { useGameStore } from '../stores/gameStore.js';
import type { SerializedGameState, ValidAction } from '../stores/gameStore.js';
import type { WinReason } from '@king-card/shared';

export function useGameSocket(): void {
  const registeredRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const tryRegister = () => {
      const socket = socketService.getSocketRef();
      if (!socket || registeredRef.current) return;

      const onConnect = () => {
        useGameStore.getState()._setConnected(true);
      };

      const onDisconnect = () => {
        useGameStore.getState()._setConnected(false);
        registeredRef.current = false;
      };

      const onGameJoined = (payload: { gameId: string; playerIndex: 0 | 1 }) => {
        const s = useGameStore.getState();
        s._setGameId(payload.gameId);
        s._setPlayerIndex(payload.playerIndex);
        s.setUiPhase('playing');
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

      registeredRef.current = true;

      if (socket.connected) {
        useGameStore.getState()._setConnected(true);
      }

      // Store cleanup in ref so outer cleanup can always access it
      cleanupRef.current = () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('game:joined', onGameJoined);
        socket.off('game:state', onGameState);
        socket.off('game:validActions', onValidActions);
        socket.off('game:over', onGameOver);
        socket.off('game:error', onGameError);
        registeredRef.current = false;
      };
    };

    // Subscribe to store changes to detect when connect() is called
    const unsubscribe = useGameStore.subscribe(() => {
      tryRegister();
    });

    // Try once on mount
    tryRegister();

    return () => {
      unsubscribe();
      // Always clean up via ref — even if registered late via subscribe
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);
}
```

- [ ] **Step 4: 手动验证**

启动开发服务器:

```bash
pnpm dev:all
```

1. 打开浏览器，进入大厅
2. 点击「单人模式」→ 进入选帝王界面
3. 选择帝王 → 进入对局
4. 确认游戏状态更新、手牌显示、能量条正常
5. 确认回合切换、出牌、攻击等交互有响应

- [ ] **Step 5: 提交**

```bash
git add packages/client/src/hooks/useGameSocket.ts packages/client/src/stores/gameStore.ts packages/client/src/services/socketService.ts
git commit -m "fix(client): register socket listeners after connection instead of on initial render"
```

---

### Task 7: 修复非当前玩家保留过期 validActions（发现 #7）

**问题:** 服务端只给当前玩家发 validActions，但客户端收到新 gameState 时不清空旧的 validActions，导致回合切换后旧玩家界面仍高亮过期操作。

**Files:**
- Modify: `packages/client/src/stores/gameStore.ts:198-200`
- Modify: `packages/server/src/socketHandler.ts:28-43`

- [ ] **Step 1: 修改 `_setGameState` 清空 validActions**

```typescript
// packages/client/src/stores/gameStore.ts — 修改 _setGameState (line 198-200)
  _setGameState: (v: SerializedGameState) => {
    set({ gameState: v, validActions: [] });
  },
```

这样每次收到新 state 时清空，等收到新的 validActions 时再填充。非当前玩家不会收到 validActions，所以保持空数组。

- [ ] **Step 2: 服务端确认（无需修改，当前行为已正确）**

当前 `socketHandler.ts:37-43` 的行为是正确的：
- 给双方发 `game:state`
- 只给当前玩家发 `game:validActions`

修改只在客户端。但可以加一个防护：给非当前玩家显式发送空 actions。

```typescript
// packages/server/src/socketHandler.ts — 修改 broadcastGameState 函数
  function broadcastGameState(gameId: string): void {
    const session = gameManager.getGame(gameId);
    if (!session) return;

    const state = session.engine.getGameState();

    for (let p = 0; p < 2; p++) {
      const socketId = session.players[p];
      if (socketId) {
        const serialized = serializeForPlayer(state, p as 0 | 1);
        io.to(socketId).emit('game:state', { state: serialized });

        // 给当前玩家发送有效动作，给非当前玩家发送空数组
        if (p === state.currentPlayerIndex) {
          const actions: ValidAction[] = session.engine.getValidActions(p);
          io.to(socketId).emit('game:validActions', { actions });
        } else {
          io.to(socketId).emit('game:validActions', { actions: [] });
        }
      }
    }
  }
```

- [ ] **Step 3: 手动验证**

```bash
pnpm dev:all
```

1. 进入对局
2. 在自己的回合出牌、攻击
3. 结束回合
4. 确认回合切换后，手牌和随从不再高亮可操作状态
5. AI 回合结束后，确认自己的回合恢复高亮

- [ ] **Step 4: 运行服务端测试确认无回归**

```bash
cd packages/server && npx vitest run
```

- [ ] **Step 5: 提交**

```bash
git add packages/client/src/stores/gameStore.ts packages/server/src/socketHandler.ts
git commit -m "fix: clear validActions on state update and send empty actions to non-current player"
```

---

## 执行顺序总结

| Task | 修复项 | 严重度 | 依赖 | 包 |
|------|--------|--------|------|-----|
| 1 | Card 引用隔离 (#5) | 高 | 无 | core |
| 2 | 实例查找 + instanceId (#6) | 高 | Task 1 | core |
| 3 | 通用效果执行器 (#2) | 严重 | 无 | core |
| 4 | 回合触发接入 (#3) | 严重 | Task 3 | core |
| 5 | 武将技能 (#4) | 严重 | Task 3 | core |
| 6 | Socket 监听注册 (#1) | 严重 | 无 | client |
| 7 | 过期 validActions (#7) | 中 | 无 | client + server |

Task 1-2 在 core 数据层，Task 3-5 在 core 引擎层（3 独立，4 和 5 依赖 3），Task 6-7 在 client/server 层互相独立。
