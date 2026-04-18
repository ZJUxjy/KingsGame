# 2026-04-18 代码审核问题修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 2026-04-18 代码审核报告中列出的全部已确认缺陷（核心引擎触发遗漏、ID 冲突、关键字行为错误、AI 行为错误、Server 资源泄漏、Client 文案 bug 与 ESLint 配置缺失）。

**Architecture:** 按"基础设施 → 引擎触发 → 关键字效果 → 服务端会话生命周期 → 客户端体验 → 工具链"的依赖顺序拆 13 个 Task。每个 Task 独立可测，内部严格 TDD（先写失败用例，再写最小实现，最后提交）。Task 1（counter 注入）是其它 core 任务的前置条件；Task 14（ESLint）独立于其它。

**Tech Stack:** TypeScript 5.x, Vitest, React 19 + Zustand, Socket.IO, ESLint 9 (flat config)

**Baseline:**
- `pnpm run build` 当前通过。
- `cd packages/core && npx vitest run` 当前通过（参见 `2026-04-15-critical-bugfixes.md` 中的 206 用例 baseline，已上调到当前数）。
- `pnpm lint` **当前失败**（缺少 ESLint 9 flat config，本计划 Task 14 修复）。

---

## 文件结构总览

```
packages/
├── shared/src/
│   └── events.ts                     # Task 4: 调整 TURN_END 事件含义注释（无字段变更）
├── core/src/
│   ├── engine/
│   │   ├── id-counter.ts             # Task 1: 新建—封装实例 / buff / stratagem 计数器
│   │   ├── game-engine.ts            # Task 1: 持有 IdCounter；注入 createPlayer/createGameState/state-mutator
│   │   ├── state-mutator.ts          # Task 1: stratagem id 来自注入；Task 5: 新增 addCardToHand 方法
│   │   ├── action-executor.ts        # Task 3: 攻击解析时触发 ON_ATTACK；Task 1: synthetic id 来自注入
│   │   └── game-loop.ts              # Task 2: END 阶段触发 ON_TURN_END；Task 4: TURN_END 事件移到自增前
│   ├── models/
│   │   ├── card-instance.ts          # Task 1: createCardInstance 接收 counter；移除模块级 instanceCounter
│   │   ├── player.ts                 # Task 1: 不再 resetInstanceCounter；Task 12: deck 类型不再 cast
│   │   └── game.ts                   # Task 1: createGameState 接收 counter
│   └── cards/effects/
│       ├── research.ts               # Task 5: 走 mutator.addCardToHand；尊重 handLimit
│       ├── blockade.ts               # Task 6: 收敛为空 handler；逻辑挪到 game-loop.ts ENERGY_GAIN
│       ├── mobilization-order.ts     # Task 7: 改用 1 回合临时 buff
│       └── execute-card-effects.ts   # Task 1: buff id 来自注入
├── core/test/
│   └── engine/
│       ├── id-counter.test.ts                    # Task 1
│       ├── on-turn-end-trigger.test.ts           # Task 2
│       ├── on-attack-trigger.test.ts             # Task 3
│       ├── turn-end-event.test.ts                # Task 4
│       ├── research-hand-limit.test.ts           # Task 5
│       ├── blockade-timing.test.ts               # Task 6
│       └── mobilization-order-temporary.test.ts  # Task 7
├── server/src/
│   ├── aiPlayer.ts                   # Task 8: 每个 attack 后 getValidActions 重新过滤
│   ├── gameManager.ts                # Task 9: findWaitingPvpGame 排除自己 socketId
│   ├── socketHandler.ts              # Task 9 / Task 10: 调用方传 socketId；concede/disconnect 清对手映射
│   └── serialization.ts              # Task 11: 共享 cost 计算函数
├── server/test/
│   ├── aiPlayer.test.ts              # Task 8
│   ├── gameManager.test.ts           # Task 9（已有则修改，否则新建）
│   ├── socketHandler.test.ts         # Task 10
│   └── serialization.test.ts         # Task 11
├── shared/src/
│   └── cost.ts                       # Task 11: 新建—共享 effective cost 计算
├── client/src/
│   └── App.tsx                       # Task 13: PlayAgain 重启 PvE；Back 真正回主菜单
├── client/src/__tests__/
│   └── App.test.tsx                  # Task 13（仅新增/修改 GameOverScreen 相关用例）
├── eslint.config.js                  # Task 14: 新建—ESLint 9 flat config
└── package.json                      # Task 14: 确认 lint 脚本
```

---

## Task 1: 修复全局 counter 导致的 ID 冲突（关键缺陷）

**问题:**
- `packages/core/src/models/card-instance.ts:3` 模块级 `instanceCounter`
- `packages/core/src/engine/state-mutator.ts:22` 模块级 `stratagemCounter`
- `packages/core/src/cards/effects/execute-card-effects.ts:12` 模块级 `buffCounter`

  这三个 counter 是模块级单例。`packages/core/src/models/player.ts:27` 在 `createPlayer` 内调用 `resetInstanceCounter()`，而 `createGameState` 会为两个玩家各调一次 `createPlayer`——结果第二个玩家的实例 ID 从 1 重新开始，与第一个玩家完全冲突。`findMinion` 是按 `instanceId` 在双方战场遍历的（`action-executor.ts:31`），返回的可能是错误一方的随从。同时多场并发对局共享同一计数器，会造成跨局污染。

**与 Task 12 的依赖关系:**
当前 `GameEngine.create`（`game-engine.ts:139-141`）在 `createGameState` 后立刻把 `state.players[*].deck` 覆写回 `[...deck1]`/`[...deck2]`（plain `Card[]`），所以 `deck[*].instanceId` 在线上根本不存在。**本 Task 的失败测试只针对 `createCardInstance` 与 `mutator.summonMinion` 路径**，不依赖 deck 上的 instanceId。"`Player.deck: CardInstance[]`"语义统一留给 Task 12（它会同时移除 deck 覆写）。

**Files:**
- Create: `packages/core/src/engine/id-counter.ts`
- Create: `packages/core/test/engine/id-counter.test.ts`
- Modify: `packages/core/src/models/card-instance.ts:3-65`
- Modify: `packages/core/src/models/player.ts:9-30`
- Modify: `packages/core/src/models/game.ts`
- Modify: `packages/core/src/engine/state-mutator.ts:22-50`
- Modify: `packages/core/src/cards/effects/execute-card-effects.ts:12-16,165-175`
- Modify: `packages/core/src/engine/game-engine.ts`（在 `GameEngine.create` 创建 `IdCounter` 并注入）
- Modify: `packages/core/src/engine/action-executor.ts:640`（synthetic skill source id 改用 counter）

- [ ] **Step 1: 写失败测试 — IdCounter 与 createCardInstance 直接 API**

```typescript
// packages/core/test/engine/id-counter.test.ts
import { describe, it, expect } from 'vitest';
import { IdCounter } from '../../src/engine/id-counter.js';
import { createCardInstance } from '../../src/models/card-instance.js';
import type { Card } from '@king-card/shared';

const baseCard: Card = {
  id: 'shared_minion', name: 'Shared', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 1, health: 1,
  description: '', keywords: [], effects: [],
};

describe('IdCounter / createCardInstance', () => {
  it('produces unique instanceIds when shared by both players in one engine', () => {
    const counter = new IdCounter();
    const a = createCardInstance(baseCard, 0, counter);
    const b = createCardInstance(baseCard, 1, counter);
    const c = createCardInstance(baseCard, 0, counter);
    const ids = new Set([a.instanceId, b.instanceId, c.instanceId]);
    expect(ids.size).toBe(3);
  });

  it('two separate IdCounter instances are independent', () => {
    const c1 = new IdCounter();
    const c2 = new IdCounter();
    const a1 = createCardInstance(baseCard, 0, c1);
    const a2 = createCardInstance(baseCard, 0, c2);
    expect(a1.instanceId).toBe(a2.instanceId);
  });

  it('IdCounter.nextBuffId / nextStratagemId are monotonic per instance', () => {
    const c = new IdCounter();
    expect(c.nextBuffId()).toBe('buff_1');
    expect(c.nextBuffId()).toBe('buff_2');
    expect(c.nextStratagemId()).toBe('stratagem_1');
    const c2 = new IdCounter();
    expect(c2.nextBuffId()).toBe('buff_1');
  });
});
```

注：用例不依赖 `state.players[*].deck`，因为在 Task 12 之前 `GameEngine.create` 仍会在 `game-engine.ts:139-141` 把 deck 覆写为 plain `Card[]`。这里直接验证新 API 契约即可证明 ID 隔离。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/core && npx vitest run test/engine/id-counter.test.ts`
Expected: 全部 FAIL（compile error: `IdCounter` 不存在 / `createCardInstance` 第三参数不接受）。这是 TDD 中可接受的"红"——签名缺失即是失败。

- [ ] **Step 3: 新建 IdCounter 类**

```typescript
// packages/core/src/engine/id-counter.ts
export class IdCounter {
  private instance = 0;
  private buff = 0;
  private stratagem = 0;
  private synthetic = 0;

  nextInstanceId(cardId: string): string {
    return `${cardId}_${++this.instance}`;
  }

  nextBuffId(): string {
    return `buff_${++this.buff}`;
  }

  nextStratagemId(): string {
    return `stratagem_${++this.stratagem}`;
  }

  nextSyntheticSourceId(prefix: string): string {
    return `${prefix}_${++this.synthetic}`;
  }
}
```

- [ ] **Step 4: 修改 createCardInstance 接收 counter**

```typescript
// packages/core/src/models/card-instance.ts
import type { Card, CardEffect, CardInstance, GeneralSkill, HeroSkill } from '@king-card/shared';
import type { IdCounter } from '../engine/id-counter.js';

function cloneCardEffect(effect: CardEffect): CardEffect {
  return { ...effect, params: { ...effect.params } };
}

function cloneHeroSkill(skill: HeroSkill | undefined): HeroSkill | undefined {
  if (!skill) return undefined;
  return { ...skill, effect: cloneCardEffect(skill.effect) };
}

function cloneGeneralSkill(skill: GeneralSkill): GeneralSkill {
  return { ...skill, effect: cloneCardEffect(skill.effect) };
}

function cloneCard(card: Card): Card {
  return {
    ...card,
    keywords: [...card.keywords],
    effects: card.effects.map(cloneCardEffect),
    heroSkill: cloneHeroSkill(card.heroSkill),
    generalSkills: card.generalSkills?.map(cloneGeneralSkill),
  };
}

export function createCardInstance(
  card: Card,
  ownerIndex: 0 | 1,
  counter: IdCounter,
): CardInstance {
  const instanceCard = cloneCard(card);
  const hasRush = instanceCard.keywords.includes('RUSH');
  const hasCharge = instanceCard.keywords.includes('CHARGE');
  const hasAssassin = instanceCard.keywords.includes('ASSASSIN');

  return {
    card: instanceCard,
    instanceId: counter.nextInstanceId(card.id),
    ownerIndex,
    baseKeywords: [...instanceCard.keywords],
    currentAttack: card.attack ?? 0,
    currentHealth: card.health ?? 0,
    currentMaxHealth: card.health ?? 0,
    remainingAttacks: (hasRush || hasCharge || hasAssassin) ? 1 : 0,
    justPlayed: true,
    sleepTurns: instanceCard.keywords.includes('RESEARCH') ? 1 : 0,
    garrisonTurns: 0,
    frozenTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
    position: undefined,
  };
}
```

注意：删除 `let instanceCounter` 与 `resetInstanceCounter`，破坏的引用在后续步骤里逐个修复。

- [ ] **Step 5: 修改 createPlayer 与 createGameState 接收 counter**

```typescript
// packages/core/src/models/player.ts
import type { Card, Player, Civilization, EmperorData, HeroSkill } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';
import { createCardInstance } from './card-instance.js';
import type { IdCounter } from '../engine/id-counter.js';

const DEFAULT_HERO_SKILL: HeroSkill = {
  name: 'Default Hero Skill',
  description: 'A default hero skill.',
  cost: 0,
  cooldown: 0,
  effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: { amount: 0 } },
};

export function createPlayer(
  ownerIndex: 0 | 1,
  id: string,
  name: string,
  civilization: Civilization,
  deck: Card[],
  startingEmperor: EmperorData,
  counter: IdCounter,
): Player {
  const deckInstances = deck.map((card) => createCardInstance(card, ownerIndex, counter));
  const emperorCard = startingEmperor.emperorCard;

  return {
    id,
    name,
    hero: {
      health: GAME_CONSTANTS.INITIAL_HEALTH,
      maxHealth: GAME_CONSTANTS.INITIAL_HEALTH,
      armor: 0,
      heroSkill: emperorCard.heroSkill ?? DEFAULT_HERO_SKILL,
      skillUsedThisTurn: false,
      skillCooldownRemaining: 0,
    },
    civilization,
    hand: [],
    handLimit: GAME_CONSTANTS.MAX_HAND_SIZE,
    deck: deckInstances as unknown as Card[],
    graveyard: [],
    battlefield: [],
    activeStratagems: [],
    costModifiers: [],
    energyCrystal: 0,
    maxEnergy: 0,
    cardsPlayedThisTurn: 0,
    cannotDrawNextTurn: false,
    costReduction: 0,
    ministerPool: startingEmperor.ministers.map((m) => ({
      ...m,
      skillUsedThisTurn: false,
      cooldown: 0,
    })),
    activeMinisterIndex: startingEmperor.ministers.length > 0 ? 0 : -1,
    boundCards: [...startingEmperor.boundGenerals, ...startingEmperor.boundSorceries],
  };
}
```

```typescript
// packages/core/src/models/game.ts —— 修改 createGameState 签名
// 在文件中找到 createGameState，然后改为：
import type { Card, EmperorData, GameState } from '@king-card/shared';
import { createPlayer } from './player.js';
import type { IdCounter } from '../engine/id-counter.js';

export function createGameState(
  deck1: Card[],
  deck2: Card[],
  emperor1: EmperorData,
  emperor2: EmperorData,
  counter: IdCounter,
): GameState {
  return {
    players: [
      createPlayer(0, 'p1', 'Player 1', emperor1.emperorCard.civilization, deck1, emperor1, counter),
      createPlayer(1, 'p2', 'Player 2', emperor2.emperorCard.civilization, deck2, emperor2, counter),
    ],
    turnNumber: 0,
    currentPlayerIndex: 0,
    phase: 'ENERGY_GAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
  };
}
```

（如果当前 `createGameState` 还接受其它参数，按原签名保留，仅追加 `counter`。）

- [ ] **Step 6: state-mutator 的 stratagem id 改用 counter**

```typescript
// packages/core/src/engine/state-mutator.ts —— 替换文件顶部
import { GAME_CONSTANTS } from '@king-card/shared';
import type {
  GameState, Card, CardInstance, Buff, ActiveStratagem,
  TargetRef, GameEvent, EngineErrorCode, StateMutator,
  SummonMinionResult, Keyword, EffectContext,
} from '@king-card/shared';
import { createCardInstance } from '../models/card-instance.js';
import { DefaultRNG } from './rng.js';
import { resolveEffects } from '../cards/effects/index.js';
import type { IdCounter } from './id-counter.js';

function findMinion(state: GameState, instanceId: string): CardInstance | undefined {
  for (const player of state.players) {
    const minion = player.battlefield.find((m) => m.instanceId === instanceId);
    if (minion) return minion;
  }
  return undefined;
}

function emit(eventBus: { emit: (event: GameEvent) => void }, event: GameEvent): void {
  eventBus.emit(event);
}

export function createStateMutator(
  state: GameState,
  eventBus: { emit: (event: GameEvent) => void },
  rng: EffectContext['rng'] = new DefaultRNG(),
  counter?: IdCounter,
): StateMutator {
  const generateStratagemId = () =>
    counter ? counter.nextStratagemId() : `stratagem_legacy_${Math.random().toString(36).slice(2)}`;
  // ...原有 mutator 主体保持不变，把所有 `${++stratagemCounter}` 调用替换成 generateStratagemId()
```

注意：本步只删除模块级 `let stratagemCounter` 与 `resetStratagemCounter`；其他业务逻辑保持原样。`counter?` 设为可选并提供 fallback，避免一次性破坏所有调用方（仍把现有调用方在引擎内部一次性改为传入）。

- [ ] **Step 7: execute-card-effects 的 buff id 改用 counter（不修改 StateMutator 接口）**

为避免对 `StateMutator.applyBuff` 接口做大改动（现签名为 `applyBuff(target, buff: Buff)`，调用方较多），采取**最小侵入**方案：把 `IdCounter` 作为 `EffectContext` 的字段下发，由调用方在构造 `Buff` 时直接 `id: ctx.counter.nextBuffId()`。

```typescript
// packages/shared/src/engine-types.ts —— 在 EffectContext 接口追加：
counter: {
  nextBuffId(): string;
  nextStratagemId(): string;
  nextInstanceId(cardId: string): string;
  nextSyntheticSourceId(prefix: string): string;
};
```

注：用结构化签名（不直接 import `IdCounter` 类）避免 `shared` 反向依赖 `core`。`IdCounter` 在 `core` 实现，正好满足该结构。

```typescript
// packages/core/src/cards/effects/execute-card-effects.ts —— 删除文件顶部：
//   let buffCounter = 0;
//   export function resetBuffCounter() { buffCounter = 0; }
//
// 在所有构造 Buff 的位置（约 165-175 行的 applyBuffEffect / applyAuraEffect 等），
// 把 `id: \`buff_${++buffCounter}\`` 替换成 `id: ctx.counter.nextBuffId()`。
// Buff 字段保持现有 schema（attackBonus/healthBonus/maxHealthBonus/keywordsGranted）：

const buff: Buff = {
  id: ctx.counter.nextBuffId(),
  type: 'PERMANENT',
  attackBonus: getNumericParam(params, 'attack'),
  healthBonus: getNumericParam(params, 'health'),
  maxHealthBonus: getNumericParam(params, 'health'),
  keywordsGranted: [],
  sourceInstanceId: source.instanceId,
};
ctx.mutator.applyBuff(target, buff);
```

并把所有 `state-mutator.ts` 内部 / `action-executor.ts` 内部构造 `EffectContext` 的位置补上 `counter: this.counter`（`GameEngine` 持有的实例）或 `counter` 闭包变量。

- [ ] **Step 8: GameEngine.create 创建并注入 IdCounter**

```typescript
// packages/core/src/engine/game-engine.ts —— 在 GameEngine.create 内
import { IdCounter } from './id-counter.js';

static create(
  deck1: Card[],
  deck2: Card[],
  emperor1: EmperorData,
  emperor2: EmperorData,
): GameEngine {
  registerEmperorData(emperor1);
  registerEmperorData(emperor2);

  const counter = new IdCounter();
  const state = createGameState(deck1, deck2, emperor1, emperor2, counter);
  const eventBus = new EventBusImpl();
  const rng = new DefaultRNG();

  const engine = new GameEngine(state, eventBus, rng, counter);
  engine.startGame();
  return engine;
}
```

构造函数同步保留 `counter` 字段，并在创建 mutator 时传入：

```typescript
// 类成员
private readonly counter: IdCounter;

private constructor(
  state: GameState,
  eventBus: EventBus,
  rng: RNG,
  counter: IdCounter,
) {
  this.state = state;
  this.eventBus = eventBus;
  this.rng = rng;
  this.counter = counter;
}

// 用到 createStateMutator 的地方都加上第四个参数 this.counter
```

`packages/core/src/engine/action-executor.ts:640` 把 `\`hero_skill_${player.id}_${Date.now()}\`` 改为 `counter.nextSyntheticSourceId(\`hero_skill_${player.id}\`)`，并把 `executeUseHeroSkill` / `executeUseMinisterSkill` / `executeUseGeneralSkill` 等签名追加 `counter: IdCounter`，由 `GameEngine` 传入。

- [ ] **Step 9: 删除残余 reset* 导出与无效引用**

执行：

```bash
cd packages/core
rg -n "resetInstanceCounter|resetStratagemCounter|resetBuffCounter" src test
```

每个出现都要么删除调用，要么替换成 `new IdCounter()`（在测试 helper 中）。

- [ ] **Step 10: 运行测试验证通过**

Run: `cd packages/core && npx vitest run test/engine/id-counter.test.ts`
Expected: PASS（两个用例都通过）。

Run: `cd packages/core && npx vitest run`
Expected: 全部用例通过（包括既有用例可能需要的小调整：测试中创建 mutator 的地方加 `new IdCounter()`）。

- [ ] **Step 11: 提交**

```bash
git add packages/core/src/engine/id-counter.ts \
  packages/core/src/engine/state-mutator.ts \
  packages/core/src/engine/game-engine.ts \
  packages/core/src/engine/action-executor.ts \
  packages/core/src/models/card-instance.ts \
  packages/core/src/models/player.ts \
  packages/core/src/models/game.ts \
  packages/core/src/cards/effects/execute-card-effects.ts \
  packages/core/test/engine/id-counter.test.ts \
  packages/shared/src/engine-types.ts
git commit -m "$(cat <<'EOF'
fix(core): isolate instance/buff/stratagem counters per engine

Replace module-level counters with an IdCounter injected through
GameEngine, eliminating ID collisions between players within a game
and across concurrent games.
EOF
)"
```

---

## Task 2: 触发 ON_TURN_END 钩子

**问题:** `packages/core/src/cards/effects/registry.ts:35` 中 `resolveEffects` 已经为 `ON_TURN_END` 派发到 `handler.onTurnEnd`，但 `packages/core/src/engine/game-loop.ts` 整个文件中**只有 `ON_TURN_START`** 被实际调用，导致 `colony.ts` 等依赖 `onTurnEnd` 的 handler 永远不会运行。

**Files:**
- Modify: `packages/core/src/engine/game-loop.ts:205-224`
- Create: `packages/core/test/engine/on-turn-end-trigger.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/engine/on-turn-end-trigger.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import {
  registerEffectHandler,
  clearEffectHandlers,
  getRegisteredHandlers,
} from '../../src/cards/effects/registry.js';
import { createCardInstance } from '../../src/models/card-instance.js';
import { IdCounter } from '../../src/engine/id-counter.js';
import type { EffectHandler, Card } from '@king-card/shared';

const probeCard: Card = {
  id: 'probe', name: 'Probe', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 1, health: 1,
  description: '', keywords: ['BLOCKADE'], effects: [],
};

describe('ON_TURN_END trigger', () => {
  let calls = 0;
  let originalHandlers: readonly EffectHandler[] = [];

  beforeEach(() => {
    originalHandlers = [...getRegisteredHandlers()];
    clearEffectHandlers();
    calls = 0;
    registerEffectHandler({
      keyword: 'BLOCKADE',
      onTurnEnd: () => { calls += 1; },
    });
  });

  afterEach(() => {
    clearEffectHandlers();
    for (const h of originalHandlers) registerEffectHandler(h);
  });

  it('invokes handler.onTurnEnd for each friendly minion when the turn ends', () => {
    const deck = Array.from({ length: 30 }, () => probeCard);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    // 直接构造一个 BLOCKADE 随从放入当前玩家战场；不依赖 deck 类型
    const counter = new IdCounter();
    const minion = createCardInstance(probeCard, 0, counter);
    state.players[0].battlefield.push(minion);

    calls = 0;
    engine.endTurn();
    expect(calls).toBe(1);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/core && npx vitest run test/engine/on-turn-end-trigger.test.ts`
Expected: FAIL，`expected 0 to be 1`。

- [ ] **Step 3: 在 game-loop.ts END phase 触发 ON_TURN_END**

```typescript
// packages/core/src/engine/game-loop.ts —— 在 // ── Phase 5: END ───
// 之前（即 4c reset minister pool 之后）插入：

// ── Phase 5a: ON_TURN_END handlers ────────────────────────────
for (const minion of [...player.battlefield]) {
  const effectCtx: EffectContext = {
    state,
    mutator,
    source: minion,
    playerIndex: state.currentPlayerIndex,
    eventBus: createEffectEventBus(eventBus),
    rng: turnStartRng,
  };
  executeCardEffects('ON_TURN_END', effectCtx);
  resolveEffects('ON_TURN_END', effectCtx);
}
```

注意：`executeTurnStart` 名字仅是历史名，实际上覆盖了一个完整回合（START + END）。因此把 ON_TURN_END 触发放在该函数末尾、`TURN_END` 事件之前是正确语义。

- [ ] **Step 4: 运行测试通过**

Run: `cd packages/core && npx vitest run test/engine/on-turn-end-trigger.test.ts`
Expected: PASS。

- [ ] **Step 5: 全量回归**

Run: `cd packages/core && npx vitest run`
Expected: 全部通过。

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/engine/game-loop.ts \
  packages/core/test/engine/on-turn-end-trigger.test.ts
git commit -m "$(cat <<'EOF'
fix(core): invoke ON_TURN_END effect handlers at end of turn

The dispatcher in registry.ts already routes ON_TURN_END to
handler.onTurnEnd, but game-loop.ts never called it, leaving the
COLONY keyword and any future end-of-turn triggers dead code.
EOF
)"
```

---

## Task 3: 触发 ON_ATTACK 钩子

**问题:** `executeAttack`（`packages/core/src/engine/action-executor.ts:365-499`）只触发 `ON_KILL`，从未触发 `ON_ATTACK`。已注册的 `handler.onAttack` 永远不会被调用。

**Files:**
- Modify: `packages/core/src/engine/action-executor.ts:434-475`
- Create: `packages/core/test/engine/on-attack-trigger.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/engine/on-attack-trigger.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import {
  registerEffectHandler, clearEffectHandlers, getRegisteredHandlers,
} from '../../src/cards/effects/registry.js';
import type { EffectHandler, Card, EffectContext } from '@king-card/shared';

const attackerCard: Card = {
  id: 'striker', name: 'Striker', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 3, health: 3,
  description: '', keywords: ['CHARGE'], effects: [],
};

describe('ON_ATTACK trigger', () => {
  let captured: EffectContext[] = [];
  let saved: readonly EffectHandler[] = [];

  beforeEach(() => {
    saved = [...getRegisteredHandlers()];
    clearEffectHandlers();
    captured = [];
    registerEffectHandler({
      keyword: 'CHARGE',
      onAttack: (ctx) => { captured.push(ctx); },
    });
  });

  afterEach(() => {
    clearEffectHandlers();
    for (const h of saved) registerEffectHandler(h);
  });

  it('invokes handler.onAttack with the attacker as source', () => {
    const deck = Array.from({ length: 30 }, () => attackerCard);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    // Force a CHARGE minion onto player 0 battlefield
    const inst = (state.players[0].deck as any[])[0];
    inst.remainingAttacks = 1;
    inst.justPlayed = false;
    state.players[0].battlefield.push(inst);

    captured.length = 0;
    engine.attack(inst.instanceId, { type: 'HERO', playerIndex: 1 });
    expect(captured).toHaveLength(1);
    expect(captured[0].source.instanceId).toBe(inst.instanceId);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/core && npx vitest run test/engine/on-attack-trigger.test.ts`
Expected: FAIL，`expected length 0 to be 1`。

- [ ] **Step 3: 在 executeAttack 中触发 ON_ATTACK**

```typescript
// packages/core/src/engine/action-executor.ts —— 在 // Decrement remaining attacks 之后、
// 在 collectingBus.emit({ type: 'ATTACK_DECLARED', ... }) 之后插入：

const attackEffectCtx: EffectContext = {
  state,
  mutator,
  source: attacker,
  target: target.type === 'MINION' ? findMinion(state, target.instanceId) : undefined,
  playerIndex: attacker.ownerIndex,
  eventBus: createEffectEventBus(collectingBus),
  rng: { nextInt: () => 0, next: () => 0, pick: (arr) => arr[0], shuffle: (a) => a },
};
resolveEffects('ON_ATTACK', attackEffectCtx);
```

- [ ] **Step 4: 测试通过**

Run: `cd packages/core && npx vitest run test/engine/on-attack-trigger.test.ts`
Expected: PASS。

- [ ] **Step 5: 全量回归**

Run: `cd packages/core && npx vitest run`
Expected: 全部通过。

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/engine/action-executor.ts \
  packages/core/test/engine/on-attack-trigger.test.ts
git commit -m "$(cat <<'EOF'
fix(core): invoke ON_ATTACK effect handlers when a minion attacks

executeAttack previously emitted ATTACK_DECLARED/ATTACK_RESOLVED
events but never called resolveEffects('ON_ATTACK', ctx), leaving
all on-attack handlers (e.g. future BLITZ refinements) dead code.
EOF
)"
```

---

## Task 4: 修正 TURN_END 事件含义

**问题:** `packages/core/src/engine/game-loop.ts:99` 先做 `state.turnNumber += 1` 并切到下一个玩家，再在文件末尾（行 219-223）发送 `TURN_END`，此时 `currentPlayerIndex` 与 `turnNumber` 已是**新**回合的，监听 `TURN_END` 的代码拿到的是新回合数据，语义错乱。

**Files:**
- Modify: `packages/core/src/engine/game-loop.ts`
- Create: `packages/core/test/engine/turn-end-event.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/engine/turn-end-event.test.ts
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import type { Card, GameEvent } from '@king-card/shared';

const blank: Card = {
  id: 'b', name: 'B', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 1, health: 1,
  description: '', keywords: [], effects: [],
};

describe('TURN_END event semantics', () => {
  it('reports the player and turnNumber that just ended (not the next one)', () => {
    const deck = Array.from({ length: 30 }, () => blank);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);

    const events: GameEvent[] = [];
    engine.eventBus.on('TURN_END', (e) => events.push(e));

    const turnBefore = engine.getGameState().turnNumber;
    const playerBefore = engine.getGameState().currentPlayerIndex;

    engine.endTurn();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'TURN_END',
      playerIndex: playerBefore,
      turnNumber: turnBefore,
    });
  });
});
```

注意：如果 `engine.eventBus` 不是 public，把测试改成订阅引擎暴露的 `on` 方法或者 `subscribeAll` 方法（按现有 API 调整）；若没有，则在测试中直接断言通过 `getEvents()` 等历史 API 拿到的最近一条 TURN_END。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/core && npx vitest run test/engine/turn-end-event.test.ts`
Expected: FAIL，`turnNumber` 与 `playerIndex` 与回合开始前不一致。

- [ ] **Step 3: 调整 game-loop.ts 触发顺序**

`executeTurnStart` 命名已经误导（它跑的是"上一回合 END + 本回合 START"）。最小改动方案：在 `engine.endTurn()` 流程中，把 `TURN_END` 事件移到**切换玩家与自增 turnNumber 之前**触发。

定位点：`packages/core/src/engine/game-engine.ts` 中 `endTurn()` 实际负责"切换"。修改它：

```typescript
// packages/core/src/engine/game-engine.ts —— endTurn()
endTurn(): EngineResult {
  const result = executeEndTurn(
    this.state, this.eventBus, this.rng,
    this.state.currentPlayerIndex,
  );
  if (!result.success) return result;

  // ── Emit TURN_END for the player whose turn is ending ──
  this.eventBus.emit({
    type: 'TURN_END',
    playerIndex: this.state.currentPlayerIndex,
    turnNumber: this.state.turnNumber,
  });

  // ── Switch player BEFORE executeTurnStart ──
  this.state.currentPlayerIndex = (1 - this.state.currentPlayerIndex) as 0 | 1;

  // ── Run next player's turn start ──
  executeTurnStart(this.state, this.eventBus);

  return result;
}
```

并删除 `packages/core/src/engine/game-loop.ts:219-223` 中错误位置的 `TURN_END` emit。

如果当前 `endTurn` 不是这种实现，按文件实际结构最小化调整：找到 turnNumber 自增/玩家切换的位置，在其**之前** emit `TURN_END`。

- [ ] **Step 4: 运行测试通过**

Run: `cd packages/core && npx vitest run test/engine/turn-end-event.test.ts`
Expected: PASS。

- [ ] **Step 5: 全量回归**

Run: `cd packages/core && npx vitest run`
Expected: 全部通过。

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/engine/game-loop.ts \
  packages/core/src/engine/game-engine.ts \
  packages/core/test/engine/turn-end-event.test.ts
git commit -m "$(cat <<'EOF'
fix(core): emit TURN_END before switching player and incrementing turn

Previously TURN_END carried the *next* turn's playerIndex/turnNumber,
breaking listeners that expected the just-ended turn's metadata.
EOF
)"
```

---

## Task 5: 修复 RESEARCH 绕过 mutator 与 handLimit

**问题:** `packages/core/src/cards/effects/research.ts:31` 直接 `(player as any).hand.push({ ...randomSpell })`，绕过 `StateMutator`、`handLimit` 与 `CARD_DRAWN` 事件，导致客户端不知情、状态可能超过 hand 上限。

**Files:**
- Modify: `packages/core/src/cards/effects/research.ts`
- Modify: `packages/shared/src/engine-types.ts`（StateMutator 接口新增 `addCardToHand`）
- Modify: `packages/core/src/engine/state-mutator.ts`（实现 `addCardToHand`）
- Create: `packages/core/test/engine/research-hand-limit.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/engine/research-hand-limit.test.ts
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import type { Card } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';

const sorcery: Card = {
  id: 'spell', name: 'Spell', civilization: 'CHINA', type: 'SORCERY',
  rarity: 'COMMON', cost: 1, description: '', keywords: [],
  effects: [{ trigger: 'ON_PLAY', type: 'DAMAGE', params: { amount: 1, target: 'ENEMY_HERO' } }],
};

const researcher: Card = {
  id: 'researcher', name: 'Researcher', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 2, attack: 1, health: 1,
  description: '', keywords: ['RESEARCH'], effects: [],
};

describe('RESEARCH respects hand limit and emits events', () => {
  it('does not exceed handLimit and emits CARD_DRAWN', () => {
    const deck = [researcher, sorcery, sorcery, sorcery];
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    state.players[0].hand = Array.from(
      { length: GAME_CONSTANTS.MAX_HAND_SIZE },
      () => ({ ...sorcery }),
    );
    const before = state.players[0].hand.length;

    const events: any[] = [];
    engine.eventBus.on('CARD_DRAWN', (e) => events.push(e));

    state.players[0].battlefield.push({
      ...(state.players[0].deck as any[]).find((c) => c.card.id === 'researcher'),
      instanceId: 'researcher_test',
      remainingAttacks: 0,
      justPlayed: true,
    } as any);

    // 通过任意触发 ON_PLAY 的方式触发 RESEARCH（如直接 invoke handler 或重新触发）
    // 此处用引擎层 API：模拟卡牌出场后 ON_PLAY 已触发；hand 不应增加。
    expect(state.players[0].hand.length).toBe(before);
  });
});
```

注：测试要在不绕过 mutator 的前提下断言 hand 长度不增。具体写法看 ResearchHandler 的真正触发链，可以改为：把 researcher 放进手牌，调用 `engine.playCard(0, handIndex)`，然后断言 `hand.length <= handLimit` 且至少有一个 `CARD_DRAWN` 事件被 emit。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/core && npx vitest run test/engine/research-hand-limit.test.ts`
Expected: FAIL（手牌超过上限或 CARD_DRAWN 未发出）。

- [ ] **Step 3: 在 StateMutator 接口新增 addCardToHand**

```typescript
// packages/shared/src/engine-types.ts —— 在 StateMutator 接口中追加：
/**
 * Add a card copy to the given player's hand, respecting handLimit.
 * Returns 'HAND_FULL' if rejected, otherwise null. Emits CARD_DRAWN.
 */
addCardToHand(playerIndex: 0 | 1, card: Card): EngineErrorCode | null;
```

- [ ] **Step 4: 在 state-mutator.ts 实现 addCardToHand**

```typescript
// packages/core/src/engine/state-mutator.ts —— 在 createStateMutator 返回对象内追加：
addCardToHand(playerIndex: 0 | 1, card: Card): EngineErrorCode | null {
  const player = state.players[playerIndex];
  if (player.hand.length >= player.handLimit) {
    return 'HAND_FULL';
  }
  const copy: Card = { ...card };
  player.hand.push(copy);
  emit(eventBus, {
    type: 'CARD_DRAWN',
    playerIndex,
    card: copy,
    source: 'EFFECT',
  });
  return null;
},
```

如果 `CARD_DRAWN` 事件没有 `source` 字段，去掉它，与现有形状对齐。

- [ ] **Step 5: 修改 research.ts 使用 mutator**

```typescript
// packages/core/src/cards/effects/research.ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

const researchHandler: EffectHandler = {
  keyword: 'RESEARCH',

  onPlay(ctx) {
    const { source, state, playerIndex, rng, mutator } = ctx;
    if (!source.card.keywords.includes('RESEARCH')) return [];

    const civ = source.card.civilization;
    const player = state.players[playerIndex];

    const spells = player.deck.filter(
      (c) => c.civilization === civ && (c.type === 'SORCERY' || c.type === 'STRATAGEM'),
    );
    if (spells.length === 0) return [];

    const randomSpell = rng.pick(spells);
    mutator.addCardToHand(playerIndex as 0 | 1, randomSpell);

    return [];
  },
};

export function registerResearch(): void {
  registerEffectHandler(researchHandler);
}
registerResearch();
```

- [ ] **Step 6: 测试通过**

Run: `cd packages/core && npx vitest run test/engine/research-hand-limit.test.ts`
Expected: PASS。

- [ ] **Step 7: 全量回归**

Run: `cd packages/core && npx vitest run`
Expected: 全部通过。

- [ ] **Step 8: 提交**

```bash
git add packages/core/src/cards/effects/research.ts \
  packages/core/src/engine/state-mutator.ts \
  packages/shared/src/engine-types.ts \
  packages/core/test/engine/research-hand-limit.test.ts
git commit -m "$(cat <<'EOF'
fix(core): route RESEARCH keyword through mutator.addCardToHand

The previous implementation pushed cards to player.hand directly via
a type-cast, bypassing the hand limit and skipping CARD_DRAWN events.
EOF
)"
```

---

## Task 6: 修复 BLOCKADE 时机错误

**问题:** `packages/core/src/cards/effects/blockade.ts:14` 在**自己回合开始**时扣对手 1 点能量。但下一回合切换到对手后，`game-loop.ts` 的 ENERGY_GAIN 阶段会把 `energyCrystal = maxEnergy`，扣的能量被立即覆盖，关键字完全失效。

**正确语义:** 应在**对手 ENERGY_GAIN 之后**扣 1 点。

**方案选型（重要修订）:**
最初草案是"在 game-loop.ts 中对对手战场再跑一轮 `resolveEffects('ON_TURN_START', …)`"。审核指出此方案会污染其它无 owner guard 的 ON_TURN_START handler（IRON_FIST、MOBILIZATION_ORDER、GARRISON 等），可能在错误一侧触发或给错目标加成。

**改为: 在 ENERGY_GAIN 阶段直接根据对手战场上 BLOCKADE 数量原地扣能量。** `blockade.ts` 不再注册 `onTurnStart`，仅保留一个空 handler（保留 `keyword: 'BLOCKADE'` 注册以便未来扩展）。这样不影响其它任何关键字的语义。

**Files:**
- Modify: `packages/core/src/cards/effects/blockade.ts`（移除 onTurnStart 逻辑）
- Modify: `packages/core/src/engine/game-loop.ts:80-97`（ENERGY_GAIN 阶段后插入 BLOCKADE 扣减）
- Create: `packages/core/test/engine/blockade-timing.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/engine/blockade-timing.test.ts
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import type { Card } from '@king-card/shared';

const blockader: Card = {
  id: 'blockader', name: 'Blockader', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 1, health: 5,
  description: '', keywords: ['BLOCKADE'], effects: [],
};

describe('BLOCKADE reduces opponent effective energy each turn', () => {
  it("opponent has maxEnergy - 1 at the start of their turn while a BLOCKADE is alive", () => {
    const deck = Array.from({ length: 30 }, () => blockader);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    // 强制玩家 0 战场上有 1 个 BLOCKADE
    const inst = (state.players[0].deck as any[])[0];
    state.players[0].battlefield.push(inst);

    // 玩家 0 结束回合 → 切到玩家 1，触发 ENERGY_GAIN
    engine.endTurn();

    expect(state.currentPlayerIndex).toBe(1);
    // 玩家 1 在 BLOCKADE 影响下，可用能量应比 maxEnergy 少 1
    expect(state.players[1].energyCrystal).toBe(state.players[1].maxEnergy - 1);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/core && npx vitest run test/engine/blockade-timing.test.ts`
Expected: FAIL（`energyCrystal` 等于 `maxEnergy`，没有被扣）。

- [ ] **Step 3: 收敛 blockade.ts —— 移除 onTurnStart 逻辑**

```typescript
// packages/core/src/cards/effects/blockade.ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * BLOCKADE keyword.
 *
 * While a BLOCKADE minion is alive, the opponent loses 1 usable energy
 * after their ENERGY_GAIN phase each turn. The actual reduction is
 * implemented inline in game-loop.ts (see ENERGY_GAIN phase) so that
 * the on-turn-start lifecycle is not perturbed for other keywords that
 * lack owner guards.
 *
 * This handler is kept registered as a no-op to preserve the BLOCKADE
 * keyword in the registry for tooling/queries.
 */
const blockadeHandler: EffectHandler = {
  keyword: 'BLOCKADE',
};

export function registerBlockade(): void {
  registerEffectHandler(blockadeHandler);
}
registerBlockade();
```

- [ ] **Step 4: 在 game-loop.ts ENERGY_GAIN 阶段直接扣 BLOCKADE 罚金**

```typescript
// packages/core/src/engine/game-loop.ts —— 在 ENERGY_GAIN 阶段
// 设置 player.energyCrystal = player.maxEnergy 之后、emit ENERGY_GAINED 之前插入：

// ── BLOCKADE penalty: opponent's BLOCKADE minions reduce our usable energy ──
const opponentIdx = (1 - state.currentPlayerIndex) as 0 | 1;
const blockadeCount = state.players[opponentIdx].battlefield.filter(
  (m) => m.card.keywords.includes('BLOCKADE'),
).length;

if (blockadeCount > 0) {
  const reduction = Math.min(blockadeCount, player.energyCrystal);
  player.energyCrystal -= reduction;
  if (reduction > 0) {
    eventBus.emit({
      type: 'ENERGY_SPENT',
      playerIndex: state.currentPlayerIndex,
      amount: reduction,
      remainingEnergy: player.energyCrystal,
    });
  }
}
```

注意：此实现**不**遍历对手战场跑 ON_TURN_START，因此不会触碰 IRON_FIST / MOBILIZATION_ORDER / GARRISON 等无 owner guard 的 handler。也不调用 `mutator.spendEnergy`（避免与"自然能量消耗"混淆）。

- [ ] **Step 5: 运行测试通过**

Run: `cd packages/core && npx vitest run test/engine/blockade-timing.test.ts`
Expected: PASS。

- [ ] **Step 6: 全量回归**

Run: `cd packages/core && npx vitest run`
Expected: 全部通过（旧的 BLOCKADE 测试若依赖"自己回合扣对手能量"语义需更新）。

- [ ] **Step 7: 提交**

```bash
git add packages/core/src/cards/effects/blockade.ts \
  packages/core/src/engine/game-loop.ts \
  packages/core/test/engine/blockade-timing.test.ts
git commit -m "$(cat <<'EOF'
fix(core): apply BLOCKADE energy penalty inline in opponent's ENERGY_GAIN

Previously the penalty fired on the owner's turn and was overwritten
by the opponent's ENERGY_GAIN refresh, neutralizing the keyword.
Implementing it inline in ENERGY_GAIN avoids running an extra
ON_TURN_START pass over the opponent's battlefield, which would
have spuriously triggered other keywords (IRON_FIST,
MOBILIZATION_ORDER, GARRISON) that lack owner guards.
EOF
)"
```

---

## Task 7: 修复 MOBILIZATION_ORDER 永久叠加

**问题:** `packages/core/src/cards/effects/mobilization-order.ts:22` 通过 `mutator.modifyStat` 永久 +1 攻击。多个具备此关键字的随从、跨多个回合都会把战场所有友方随从攻击力**指数级**累计，没有上限。

**修正:** 改用 1 回合临时 buff（`type: 'TEMPORARY'`, `remainingTurns: 1`），由 `expireTemporaryBuffs` 在下一回合开始时移除。

**Files:**
- Modify: `packages/core/src/cards/effects/mobilization-order.ts`
- Create: `packages/core/test/engine/mobilization-order-temporary.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/engine/mobilization-order-temporary.test.ts
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import type { Card } from '@king-card/shared';

const trooper: Card = {
  id: 'trooper', name: 'Trooper', civilization: 'USA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 1, health: 5,
  description: '', keywords: ['MOBILIZATION_ORDER'], effects: [],
};

describe('MOBILIZATION_ORDER buff is temporary, not stacking', () => {
  it('returns to base attack after one full round', () => {
    const deck = Array.from({ length: 30 }, () => trooper);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    const insts = (state.players[0].deck as any[]).slice(0, 3);
    state.players[0].battlefield.push(...insts);

    // 玩家 0 结束 → 玩家 1 → 玩家 0 (新回合 + buff 触发)
    engine.endTurn(); // p0 → p1
    engine.endTurn(); // p1 → p0  (此时 ON_TURN_START 触发 MOBILIZATION_ORDER)

    const after1 = state.players[0].battlefield.map((m) => m.currentAttack);
    expect(after1.every((a) => a === 2)).toBe(true);

    engine.endTurn(); // p0 → p1
    engine.endTurn(); // p1 → p0  (上次 buff 应已过期，本回合再次 +1)

    const after2 = state.players[0].battlefield.map((m) => m.currentAttack);
    expect(after2.every((a) => a === 2)).toBe(true);
    expect(after2.every((a) => a < 5)).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/core && npx vitest run test/engine/mobilization-order-temporary.test.ts`
Expected: FAIL（`after2` 不是 2，而是 3 或更高，证明 buff 永久叠加）。

- [ ] **Step 3: 改写 mobilization-order.ts**

```typescript
// packages/core/src/cards/effects/mobilization-order.ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * MOBILIZATION_ORDER keyword.
 *
 * At the start of each turn, if there are >=3 friendly minions, all
 * friendly minions get +1 attack for THIS TURN ONLY (temporary buff).
 */
const mobilizationOrderHandler: EffectHandler = {
  keyword: 'MOBILIZATION_ORDER',

  onTurnStart(ctx) {
    const { source, state, mutator, playerIndex } = ctx;
    if (!source.card.keywords.includes('MOBILIZATION_ORDER')) return [];
    if (source.ownerIndex !== state.currentPlayerIndex) return [];

    // 防止同回合内多个随从重复触发
    const tag = `mobilization_order_turn_${state.turnNumber}`;
    const battlefield = state.players[playerIndex].battlefield;
    if (battlefield.some((m) => m.buffs.some((b) => b.sourceInstanceId === tag))) {
      return [];
    }

    if (battlefield.length < 3) return [];

    for (const minion of battlefield) {
      const buff: Buff = {
        id: ctx.counter.nextBuffId(),
        type: 'TEMPORARY',
        attackBonus: 1,
        healthBonus: 0,
        maxHealthBonus: 0,
        keywordsGranted: [],
        remainingTurns: 1,
        sourceInstanceId: tag,
      };
      mutator.applyBuff({ type: 'MINION', instanceId: minion.instanceId }, buff);
    }
    return [];
  },
};

export function registerMobilizationOrder(): void {
  registerEffectHandler(mobilizationOrderHandler);
}
registerMobilizationOrder();
```

注意：
- `Buff` 字段使用现有 schema：`attackBonus / healthBonus / maxHealthBonus / keywordsGranted`，**不是** `attack / health`。
- `id` 由调用方通过 `ctx.counter.nextBuffId()` 分配（Task 1 Step 7 已把 `counter` 加入 `EffectContext`）。`StateMutator.applyBuff` 接口保持原样，仍接收完整 `Buff`。
- 顶部需 `import type { Buff } from '@king-card/shared';`。

- [ ] **Step 4: 测试通过**

Run: `cd packages/core && npx vitest run test/engine/mobilization-order-temporary.test.ts`
Expected: PASS。

- [ ] **Step 5: 全量回归**

Run: `cd packages/core && npx vitest run`
Expected: 全部通过。

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/cards/effects/mobilization-order.ts \
  packages/core/test/engine/mobilization-order-temporary.test.ts
git commit -m "$(cat <<'EOF'
fix(core): apply MOBILIZATION_ORDER as a temporary one-turn buff

Previously each turn permanently added +1 attack via modifyStat,
causing exponential stacking across multiple turns and multiple
sources. Switch to TEMPORARY buffs (remainingTurns=1) deduped per
turn so the +1 is granted once and expires next round.
EOF
)"
```

---

## Task 8: AI 每个动作后重新计算 valid actions

**问题:** `packages/server/src/aiPlayer.ts:42-52` 在循环外抓取一次 `getValidActions(playerIndex)`，然后串行执行 attack。一旦攻击杀死了某个目标，后续 attack 引用的 `targetInstanceId` 已不存在，引擎返回 `INVALID_TARGET`，AI 静默失败。

**Files:**
- Modify: `packages/server/src/aiPlayer.ts:42-93`
- Create: `packages/server/test/aiPlayer.test.ts`（如已存在则修改）

- [ ] **Step 1: 写失败测试**

```typescript
// packages/server/test/aiPlayer.test.ts
import { describe, it, expect, vi } from 'vitest';
import { runAiTurn } from '../src/aiPlayer.js';
import { GameEngine } from '@king-card/core';
import { ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import type { Card } from '@king-card/shared';

const oneShot: Card = {
  id: 'oneshot', name: 'OneShot', civilization: 'USA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 5, health: 1,
  description: '', keywords: ['CHARGE'], effects: [],
};

describe('AI re-fetches valid actions after each attack', () => {
  it('does not call attack with stale invalid targets', async () => {
    const deck = Array.from({ length: 30 }, () => oneShot);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);

    const state = engine.getGameState();
    const insts = (state.players[1].deck as any[]).slice(0, 2)
      .map((c) => ({ ...c, remainingAttacks: 1, justPlayed: false }));
    state.players[1].battlefield.push(...insts);

    const enemyTarget = (state.players[0].deck as any[])[0];
    state.players[0].battlefield.push({
      ...enemyTarget, currentHealth: 3, currentAttack: 0,
    });

    // 监听 attack 调用次数
    const spy = vi.spyOn(engine, 'attack');

    await runAiTurn(engine, 1);

    // 至少应有 1 次成功的 attack；不能有任何调用返回 INVALID_TARGET
    const calls = spy.mock.results;
    for (const c of calls) {
      if (c.type === 'return') {
        expect((c.value as any).errorCode).not.toBe('INVALID_TARGET');
      }
    }
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/server && npx vitest run test/aiPlayer.test.ts`
Expected: FAIL（至少一次 `attack` 返回 `INVALID_TARGET`）。

- [ ] **Step 3: 修改 aiPlayer.ts 在循环内重新拉取 actions**

```typescript
// packages/server/src/aiPlayer.ts —— 替换 step 2 (Attack) 整个循环：

// 2. Attack with all minions that can attack (re-evaluate after each action)
while (true) {
  if (isGameOver(engine)) return;
  const fresh = engine.getValidActions(playerIndex);
  const next = fresh.find(
    (a): a is Extract<ValidAction, { type: 'ATTACK' }> => a.type === 'ATTACK',
  );
  if (!next) break;

  const target = convertTargetInstanceId(next.targetInstanceId, playerIndex);
  engine.attack(next.attackerInstanceId, target);
  await delay(AI_ACTION_DELAY);
}
```

同样的循环模式可考虑应用到 hero / minister / general skill，避免后续技能因为前面的攻击改变战场而失败。最小改动：在每次进入下一类动作之前调一次 `getValidActions` 即可（已有），但每个 ATTACK 后必须重拉。

- [ ] **Step 4: 测试通过**

Run: `cd packages/server && npx vitest run test/aiPlayer.test.ts`
Expected: PASS。

- [ ] **Step 5: 全量回归**

Run: `cd packages/server && npx vitest run`
Expected: 全部通过。

- [ ] **Step 6: 提交**

```bash
git add packages/server/src/aiPlayer.ts packages/server/test/aiPlayer.test.ts
git commit -m "$(cat <<'EOF'
fix(server): re-fetch valid actions between AI attacks

Previously the AI captured a snapshot of valid attacks and iterated
through it; once a target died, subsequent attacks silently failed
with INVALID_TARGET. Now we re-evaluate after each action.
EOF
)"
```

---

## Task 9: PvP 配对避免自匹配

**问题:** `packages/server/src/gameManager.ts:74-81` `findWaitingPvpGame()` 只看 `state==='waiting' && players[0]`，没有排除请求者自身的 socketId，理论上玩家可以加入自己创建的房间。

**Files:**
- Modify: `packages/server/src/gameManager.ts:74-81`
- Modify: `packages/server/src/socketHandler.ts:250`（传入 `socket.id`）
- Create: `packages/server/test/gameManager.test.ts`（仅新增 `findWaitingPvpGame` 用例；若已存在则追加）

- [ ] **Step 1: 写失败测试**

```typescript
// packages/server/test/gameManager.test.ts —— 新增/追加：
import { describe, it, expect } from 'vitest';
import { GameManager } from '../src/gameManager.js';

describe('GameManager.findWaitingPvpGame excludes self', () => {
  it('does not return a session whose player[0] socket equals the caller', () => {
    const mgr = new GameManager();
    const session = mgr.createPvpWaiting(0);
    mgr.setPlayerSocket(session.id, 0, 'socket-A');

    expect(mgr.findWaitingPvpGame('socket-A')).toBeUndefined();
    expect(mgr.findWaitingPvpGame('socket-B')?.id).toBe(session.id);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/server && npx vitest run test/gameManager.test.ts`
Expected: FAIL（接口不接受参数 / 返回了 self session）。

- [ ] **Step 3: 修改 findWaitingPvpGame 接收 callerSocketId**

```typescript
// packages/server/src/gameManager.ts:74-81
findWaitingPvpGame(callerSocketId?: string): GameSession | undefined {
  for (const session of this.games.values()) {
    if (
      session.mode === 'pvp' &&
      session.state === 'waiting' &&
      session.players[0] &&
      !session.players[1] &&
      session.players[0] !== callerSocketId
    ) {
      return session;
    }
  }
  return undefined;
}
```

- [ ] **Step 4: 修改 socketHandler.ts 调用方**

```typescript
// packages/server/src/socketHandler.ts:250
const waitingSession = gameManager.findWaitingPvpGame(socket.id);
```

- [ ] **Step 5: 测试通过**

Run: `cd packages/server && npx vitest run test/gameManager.test.ts`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add packages/server/src/gameManager.ts \
  packages/server/src/socketHandler.ts \
  packages/server/test/gameManager.test.ts
git commit -m "$(cat <<'EOF'
fix(server): exclude caller from PvP auto-matching

Previously a player could be matched into the PvP room they
themselves created if they re-issued game:pvpJoin from the same
socket.
EOF
)"
```

---

## Task 10: concede / disconnect 时清理对手 socketMapping

**问题:** `packages/server/src/socketHandler.ts:557-580` 的 `game:concede` 与 `socket.on('disconnect', ...)` (584-603) 都会 destroy session，但只 delete 自己的 `socketMapping` 条目。对手的 mapping 仍指向已销毁的 gameId，下一次对手发任意指令都会拿到 `NO_GAME` 错误。

**Files:**
- Modify: `packages/server/src/socketHandler.ts:555-603`
- Create: `packages/server/test/socketHandler.test.ts`（新建一个最小测试，或者用现有 Socket.IO mock）

- [ ] **Step 1: 写失败测试（直接验证 mapping 被双向清理）**

为了避免引入完整 Socket.IO 集成测试栈，把"清理 mapping"的逻辑抽到一个纯函数中。

```typescript
// packages/server/test/socketHandler.test.ts
import { describe, it, expect } from 'vitest';
import { cleanupSessionMappings } from '../src/socketHandler.js';

describe('cleanupSessionMappings', () => {
  it('removes both players socketIds from the mapping for a session', () => {
    const mapping = new Map<string, { gameId: string; playerIndex: 0 | 1 }>();
    mapping.set('s-A', { gameId: 'game-1', playerIndex: 0 });
    mapping.set('s-B', { gameId: 'game-1', playerIndex: 1 });
    mapping.set('s-C', { gameId: 'game-2', playerIndex: 0 });

    cleanupSessionMappings(mapping, 'game-1');

    expect(mapping.has('s-A')).toBe(false);
    expect(mapping.has('s-B')).toBe(false);
    expect(mapping.has('s-C')).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/server && npx vitest run test/socketHandler.test.ts`
Expected: FAIL（`cleanupSessionMappings` 未导出）。

- [ ] **Step 3: 在 socketHandler.ts 提取并导出**

```typescript
// packages/server/src/socketHandler.ts —— 文件顶部追加：

interface PlayerMapping {
  gameId: string;
  playerIndex: 0 | 1;
}

export function cleanupSessionMappings(
  mapping: Map<string, PlayerMapping>,
  gameId: string,
): void {
  for (const [socketId, m] of mapping) {
    if (m.gameId === gameId) {
      mapping.delete(socketId);
    }
  }
}
```

并在 `game:concede` 与 `disconnect` 末尾调用：

```typescript
// concede 处理 (~ line 579 之前)，紧跟 gameManager.destroyGame(session.id):
cleanupSessionMappings(socketMapping, session.id);

// disconnect 处理 (~ line 598 之前)，紧跟 gameManager.destroyGame(mapping.gameId):
cleanupSessionMappings(socketMapping, mapping.gameId);
// （可移除原本单独的 socketMapping.delete(socket.id)，因为 cleanup 已覆盖）
```

- [ ] **Step 4: 测试通过**

Run: `cd packages/server && npx vitest run test/socketHandler.test.ts`
Expected: PASS。

- [ ] **Step 5: 全量回归**

Run: `cd packages/server && npx vitest run`
Expected: 全部通过。

- [ ] **Step 6: 提交**

```bash
git add packages/server/src/socketHandler.ts packages/server/test/socketHandler.test.ts
git commit -m "$(cat <<'EOF'
fix(server): drop both players' socket mappings on concede/disconnect

Previously only the disconnecting/conceding player's mapping was
removed; the opponent's mapping still pointed to the destroyed
session, surfacing NO_GAME errors on every subsequent action.
EOF
)"
```

---

## Task 11: 统一卡牌成本计算（含 costReduction）

**问题:** `packages/server/src/serialization.ts:10-16` 计算客户端可见 cost 时只应用了 `player.costModifiers`，没有再减 `player.costReduction`，与 `packages/core/src/engine/game-engine.ts:23-28` 中 `getEffectiveCardCost` 的逻辑不一致——客户端显示的费用可能比服务端真正扣的高，导致用户以为打不出实际能打出的牌。

**Files:**
- Create: `packages/shared/src/cost.ts`
- Modify: `packages/server/src/serialization.ts:7-16`
- Modify: `packages/core/src/engine/game-engine.ts:23-28`（复用共享函数）
- Create: `packages/server/test/serialization.test.ts`（如已存在则追加）

- [ ] **Step 1: 写失败测试**

```typescript
// packages/server/test/serialization.test.ts
import { describe, it, expect } from 'vitest';
import { serializeForPlayer } from '../src/serialization.js';
import type { GameState, Card } from '@king-card/shared';

const card: Card = {
  id: 'c', name: 'C', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 5, attack: 1, health: 1,
  description: '', keywords: [], effects: [],
};

function makeState(): GameState {
  const player: any = {
    id: 'p1', name: 'P1', civilization: 'CHINA',
    hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: { name: '', description: '', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: { amount: 0 } } }, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
    hand: [card],
    handLimit: 10, deck: [], graveyard: [], battlefield: [],
    activeStratagems: [], costModifiers: [],
    energyCrystal: 5, maxEnergy: 5, cardsPlayedThisTurn: 0,
    cannotDrawNextTurn: false, costReduction: 2, ministerPool: [],
    activeMinisterIndex: -1, boundCards: [],
  };
  return {
    players: [player, { ...player, id: 'p2', hand: [] }],
    turnNumber: 1, currentPlayerIndex: 0, phase: 'MAIN',
    isGameOver: false, winnerIndex: null, winReason: null,
  } as any;
}

describe('serializeForPlayer applies costReduction', () => {
  it('shows hand card cost reduced by player.costReduction', () => {
    const serialized = serializeForPlayer(makeState(), 0);
    expect((serialized.me.hand[0] as any).cost).toBe(3);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/server && npx vitest run test/serialization.test.ts`
Expected: FAIL（cost=5，没扣 costReduction）。

- [ ] **Step 3: 新建共享 cost 函数**

```typescript
// packages/shared/src/cost.ts
import type { Card, Player } from './engine-types.js';

export function getEffectiveCardCost(player: Player, card: Card): number {
  const modified = player.costModifiers.reduce(
    (cost, modifier) => modifier.condition(card) ? modifier.modifier(cost) : cost,
    card.cost,
  );
  return Math.max(0, modified - player.costReduction);
}
```

记得在 `packages/shared/src/index.ts` 导出 `cost` 模块（按现有 barrel 结构）。

- [ ] **Step 4: serialization.ts 改为调用共享函数**

```typescript
// packages/server/src/serialization.ts
import type { GameState, Player } from '@king-card/shared';
import { getEffectiveCardCost } from '@king-card/shared';
import type { SerializedGameState, SerializedPlayer, HiddenCard } from './types.js';

function serializePlayer(player: Player, hideHand: boolean): SerializedPlayer {
  const visibleHand = hideHand
    ? player.hand.map(() => ({ hidden: true as const }))
    : player.hand.map((card) => ({
      ...card,
      cost: getEffectiveCardCost(player, card),
    }));

  return {
    id: player.id,
    name: player.name,
    civilization: player.civilization,
    hero: player.hero,
    hand: visibleHand,
    battlefield: player.battlefield,
    energyCrystal: player.energyCrystal,
    maxEnergy: player.maxEnergy,
    deckCount: player.deck.length,
    activeMinisterIndex: player.activeMinisterIndex,
    ministerPool: player.ministerPool,
    activeStratagems: player.activeStratagems,
    cannotDrawNextTurn: player.cannotDrawNextTurn,
    boundCards: player.boundCards,
    graveyard: player.graveyard,
  };
}

export function serializeForPlayer(
  state: Readonly<GameState>,
  playerIndex: 0 | 1,
): SerializedGameState {
  const me = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];
  return {
    turnNumber: state.turnNumber,
    currentPlayerIndex: state.currentPlayerIndex,
    phase: state.phase,
    isGameOver: state.isGameOver,
    winnerIndex: state.winnerIndex,
    winReason: state.winReason,
    me: serializePlayer(me, false),
    opponent: serializePlayer(opponent, true),
  };
}
```

- [ ] **Step 5: 引擎层 game-engine.ts 复用同一函数**

```typescript
// packages/core/src/engine/game-engine.ts:23-28 —— 删掉本地 getEffectiveCardCost，
// 改为：
import { getEffectiveCardCost } from '@king-card/shared';
```

并把所有调用 `getEffectiveCardCost(player, card)` 处保持参数顺序一致。

- [ ] **Step 6: 测试通过**

Run: `cd packages/server && npx vitest run test/serialization.test.ts`
Expected: PASS。

- [ ] **Step 7: 全量回归**

Run: `pnpm run build && pnpm -r test`
Expected: 全部通过。

- [ ] **Step 8: 提交**

```bash
git add packages/shared/src/cost.ts \
  packages/shared/src/index.ts \
  packages/server/src/serialization.ts \
  packages/core/src/engine/game-engine.ts \
  packages/server/test/serialization.test.ts
git commit -m "$(cat <<'EOF'
refactor(shared): extract getEffectiveCardCost and apply costReduction

Both server-side serialization (client-visible cost) and
GameEngine.getValidActions now share a single source of truth that
includes player.costReduction, fixing client/server cost desync.
EOF
)"
```

---

## Task 12: 修复 Player.deck 类型撒谎

**问题:** `packages/core/src/models/player.ts:47` 把 `CardInstance[]` 直接 `as unknown as Card[]` 赋给 `Player.deck`。`Player.deck` 在类型上是 `Card[]`，但实际持有的是带 `instanceId / currentHealth` 等字段的 instance，所有 reader 必须再次 cast 才能用，掩盖类型错误并降低 IDE 支持。

**修正:** 在 `Player` 接口里把 `deck` 类型改为 `CardInstance[]`，并修复所有读取处。

**Files:**
- Modify: `packages/shared/src/engine-types.ts`（`Player.deck: CardInstance[]`）
- Modify: `packages/core/src/models/player.ts:47`
- Modify: `packages/core/src/engine/state-mutator.ts`（`drawCards` 等访问 deck 的地方）
- Modify: `packages/core/src/cards/effects/research.ts`（filter deck 时元素已是 CardInstance）
- Modify: 任何依赖 `player.deck` 是 `Card[]` 的代码（grep 排查）

- [ ] **Step 1: 写失败测试**

```typescript
// packages/core/test/engine/deck-type.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type { Player, CardInstance } from '@king-card/shared';

describe('Player.deck type', () => {
  it('is CardInstance[] not Card[]', () => {
    type DeckType = Player['deck'];
    expectTypeOf<DeckType>().toEqualTypeOf<CardInstance[]>();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/core && npx vitest run test/engine/deck-type.test.ts`
Expected: FAIL（类型不匹配 / 编译错误）。

- [ ] **Step 3: 修改 Player 接口**

```typescript
// packages/shared/src/engine-types.ts —— 找到 interface Player：
deck: CardInstance[];
```

- [ ] **Step 4: 删除 player.ts 的 cast**

```typescript
// packages/core/src/models/player.ts:47
deck: deckInstances,
```

- [ ] **Step 5: 修复所有读 deck 的位置**

执行：

```bash
cd packages/core && rg -n "\.deck\." src
```

把每个把 deck 元素当 `Card` 用的地方改为：
- `card.civilization` / `card.type` 等读字段：保持不变（CardInstance 的 `card.card` 才是原 Card；要么改成 `inst.card.civilization`，要么如果之前已经 cast 也调整）。
- `research.ts:22-24` 已使用 `c.civilization` 直接访问，需要改为 `inst.card.civilization`：

```typescript
const spells = player.deck.filter(
  (inst) => inst.card.civilization === civ
    && (inst.card.type === 'SORCERY' || inst.card.type === 'STRATAGEM'),
);
if (spells.length === 0) return [];

const randomSpell = rng.pick(spells);
mutator.addCardToHand(playerIndex as 0 | 1, randomSpell.card);
```

- `state-mutator.drawCards`：原本可能 `state.players[playerIndex].deck.shift()` 返回 Card，现在返回 CardInstance；要么取 `.card` 进 hand（hand 仍是 `Card[]`），要么把 hand 也改成 `CardInstance[]`。**最小改动:** 取 `.card`：

```typescript
const drawn = player.deck.shift();
if (!drawn) { /* 失败处理 */ break; }
player.hand.push(drawn.card);
```

- [ ] **Step 6: 全量编译 & 测试**

Run: `pnpm run build`
Expected: 编译通过。

Run: `pnpm -r test`
Expected: 全部通过。

- [ ] **Step 7: 提交**

```bash
git add packages/shared/src/engine-types.ts \
  packages/core/src/models/player.ts \
  packages/core/src/engine/state-mutator.ts \
  packages/core/src/cards/effects/research.ts \
  packages/core/test/engine/deck-type.test.ts
git commit -m "$(cat <<'EOF'
refactor(shared): type Player.deck as CardInstance[] not Card[]

Removes the misleading 'as unknown as Card[]' cast in createPlayer
and forces readers to handle the actual instance shape, eliminating
silent runtime type confusion.
EOF
)"
```

---

## Task 13: 区分 Play Again 与 Back To Main Menu

**问题:** `packages/client/src/App.tsx:42,48` 两个按钮都调用同一个 `_reset()`，文案不同但行为完全一样。"Play Again" 应直接重新开局（沿用之前的皇帝/卡组），"Back To Main Menu" 应回到主菜单选择界面。

**Files:**
- Modify: `packages/client/src/stores/gameStore.ts`（新增 `restartGame` action 或读出最近一次的 emperorIndex / deckDefinition）
- Modify: `packages/client/src/App.tsx:14-54`
- Modify: `packages/client/src/__tests__/App.test.tsx`（如已存在则追加，否则新建）

- [ ] **Step 1: 写失败测试**

```typescript
// packages/client/src/__tests__/App.test.tsx —— 新增/追加：
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { useGameStore } from '../stores/gameStore';

describe('GameOver screen buttons differ', () => {
  beforeEach(() => {
    useGameStore.setState({
      gameState: { isGameOver: true, winnerIndex: 0, winReason: 'HERO_KILLED' } as any,
      playerIndex: 0,
      lastEmperorIndex: 2,
      lastDeckDefinition: null,
    } as any);
  });

  it('Play Again calls restartGame, Back returns to main menu', () => {
    const restartGame = vi.fn();
    const backToMainMenu = vi.fn();
    useGameStore.setState({ restartGame, backToMainMenu } as any);

    render(<App />);
    fireEvent.click(screen.getByText(/再来一局|Play Again/));
    expect(restartGame).toHaveBeenCalledTimes(1);
    expect(backToMainMenu).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(/返回主菜单|Back/));
    expect(backToMainMenu).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd packages/client && npx vitest run src/__tests__/App.test.tsx`
Expected: FAIL（两个按钮都调用同一函数）。

- [ ] **Step 3: gameStore 增加 restartGame / backToMainMenu**

```typescript
// packages/client/src/stores/gameStore.ts —— 在 actions 区域追加：

restartGame: () => {
  const state = get();
  if (state.lastEmperorIndex == null) {
    state.backToMainMenu();
    return;
  }
  state._reset();
  socketService.emit('game:join', {
    emperorIndex: state.lastEmperorIndex,
    deck: state.lastDeckDefinition ?? undefined,
  });
},

backToMainMenu: () => {
  get()._reset();
  // _reset 已经把 gameState/playerIndex 清掉，回到 lobby 路径
},
```

并在 `connect()` 成功 / `game:join` 派发时记录 `lastEmperorIndex` 与 `lastDeckDefinition`：

```typescript
joinGame: (emperorIndex, deck) => {
  set({ lastEmperorIndex: emperorIndex, lastDeckDefinition: deck ?? null });
  socketService.emit('game:join', { emperorIndex, deck });
},
```

并在 store 类型定义里追加这两个字段。

- [ ] **Step 4: App.tsx 改用新 action**

```typescript
// packages/client/src/App.tsx:14-54
function GameOverScreen() {
  const gameState = useGameStore(s => s.gameState);
  const playerIndex = useGameStore(s => s.playerIndex);
  const restartGame = useGameStore(s => s.restartGame);
  const backToMainMenu = useGameStore(s => s.backToMainMenu);
  const locale = useLocaleStore((state) => state.locale);

  const won = gameState?.winnerIndex === playerIndex;
  const reason = gameState?.winReason === 'HERO_KILLED'
    ? locale === 'en-US' ? 'Hero defeated' : '英雄被击杀'
    : locale === 'en-US' ? 'Deck exhausted' : '牌库耗尽';
  const playAgainLabel = locale === 'en-US' ? 'Play Again' : '再来一局';
  const backLabel = locale === 'en-US' ? 'Back To Main Menu' : '返回主菜单';

  return (
    <div /* ...className/style same... */>
      {/* ...title/result text same... */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => { restartGame(); }}
          className="px-8 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-lg cursor-pointer transition-colors"
        >
          {playAgainLabel}
        </button>
        <button
          onClick={() => { backToMainMenu(); }}
          className="px-8 py-3 rounded-lg border border-gray-500 bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold text-lg cursor-pointer transition-colors"
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 测试通过**

Run: `cd packages/client && npx vitest run src/__tests__/App.test.tsx`
Expected: PASS。

- [ ] **Step 6: 全量回归**

Run: `cd packages/client && npx vitest run`
Expected: 全部通过。

- [ ] **Step 7: 提交**

```bash
git add packages/client/src/App.tsx \
  packages/client/src/stores/gameStore.ts \
  packages/client/src/__tests__/App.test.tsx
git commit -m "$(cat <<'EOF'
fix(client): differentiate Play Again from Back To Main Menu

Play Again now restarts a game with the previously selected emperor
and deck, while Back To Main Menu returns to the lobby. Previously
both buttons invoked the same _reset action.
EOF
)"
```

---

## Task 14: 添加 ESLint 9 flat config，修复 lint 命令

**问题:** `package.json:8` 定义 `"lint": "eslint packages/"`，依赖 ESLint v9 (`packages.json:19`)，但仓库**没有任何 `eslint.config.js` / `.eslintrc.*`**。`pnpm lint` 直接报 "ESLint couldn't find an eslint.config.(js|mjs|cjs) file."。

**Files:**
- Create: `eslint.config.js`
- Verify: `package.json` lint script 不变

- [ ] **Step 1: 创建 flat config**

```javascript
// eslint.config.js
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.vitest-cache/**',
      '**/vitest.config.ts.timestamp-*.mjs',
      '.claude/**',
    ],
  },
  {
    files: ['packages/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
```

注：本仓库现状大量使用 `as any`，`no-explicit-any` 暂保持 off；后续 hardening Task（不在本计划范围）再开启。

- [ ] **Step 2: 运行 lint 验证通过（或仅有 warn）**

Run: `pnpm lint`
Expected: 退出码 0（warning 允许，error 不允许）。如果出现 error，按需在 config 里加 ignore 或调整规则严重度，但**不修改业务代码**——业务修复属于其它任务。

- [ ] **Step 3: 提交**

```bash
git add eslint.config.js
git commit -m "$(cat <<'EOF'
chore: add ESLint 9 flat config so pnpm lint runs

The repo declared eslint@^9 but had no config file, so `pnpm lint`
errored out immediately. This adds a minimal flat config that ignores
build artifacts and applies typescript-eslint to packages/.
EOF
)"
```

---

## 自检（Self-Review）

**1. Spec 覆盖：** 审核报告中列出的关键缺陷是否每条都有 Task 对应？

| 缺陷 | Task |
|---|---|
| 全局 counter 导致 ID 冲突 | Task 1 ✓ |
| ON_TURN_END 未触发 | Task 2 ✓ |
| ON_ATTACK 未触发 | Task 3 ✓ |
| TURN_END 事件值错误 | Task 4 ✓ |
| RESEARCH 绕过 mutator/handLimit | Task 5 ✓ |
| BLOCKADE 时机错误 | Task 6 ✓ |
| MOBILIZATION_ORDER 永久叠加 | Task 7 ✓ |
| AI 动作后不刷新 | Task 8 ✓ |
| PvP 自匹配 | Task 9 ✓ |
| concede/disconnect 未清对手 mapping | Task 10 ✓ |
| 客户端 cost 缺 costReduction | Task 11 ✓ |
| Player.deck 类型谎言 | Task 12 ✓ |
| PlayAgain / BackToMainMenu 行为相同 | Task 13 ✓ |
| ESLint 配置缺失 | Task 14 ✓ |

审核报告中暂未拆出独立 Task 的次级问题（CORS `*`、emperor-registry 全局、`as any` 关键字检查、AURA/GARRISON buff 永久持有、`gainArmor` 不发事件、useTargeting 测试 teardown），属于 **architectural hardening / 安全加固**，建议另起 spec（建议名称 `2026-04-19-engine-hardening-spec.md`）；本计划只覆盖功能性正确性缺陷。

**2. 占位符扫描：** 已确认无 TBD / "implement later" / "fill in details"。每个测试都给出可运行的代码块。

**3. 类型一致性：**
- `IdCounter` 的方法名（`nextInstanceId` / `nextBuffId` / `nextStratagemId` / `nextSyntheticSourceId`）在 Task 1 各步骤之间一致。
- `EffectContext.counter` 使用结构化签名（`shared` 不反向依赖 `core`），`IdCounter` 类正好符合。Task 1 Step 7 与 Task 7 的 buff id 分配方式一致：`ctx.counter.nextBuffId()`。
- `Buff` 接口字段一律使用现有 schema：`attackBonus / healthBonus / maxHealthBonus / keywordsGranted`；本计划**不**修改该 schema。
- `StateMutator.applyBuff(target, buff: Buff)` 接口保持原样（不引入 `Omit<Buff, 'id'>`），所有调用方在外部分配 id。
- `mutator.addCardToHand(playerIndex, card)` 在 Task 5 的接口、实现、调用点一致。
- `findWaitingPvpGame(callerSocketId?: string)` 的签名在 Task 9 中前后一致。
- `cleanupSessionMappings(mapping, gameId)` 在 Task 10 的导出声明与调用形式一致。

**4. 任务依赖关系（修订）：**
- Task 1 的失败测试**只**针对 `IdCounter` / `createCardInstance` 直接 API，**不**触及 `state.players[*].deck`。Task 12（deck 类型修复）独立执行；执行顺序：Task 1 → 任意 → Task 12。
- Task 6 改为在 ENERGY_GAIN 阶段内联处理 BLOCKADE，**不**对对手战场跑额外的 ON_TURN_START，因此 Task 7（MOBILIZATION_ORDER）的实现不依赖 Task 6 的副作用。
- Task 7 依赖 Task 1 Step 7（`EffectContext.counter`）已落地。建议执行顺序：Task 1 → Task 7。

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-18-code-review-remediation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — 每个 Task 起一个新的 subagent，主 agent 在两 Task 之间审查，迭代速度快。

**2. Inline Execution** — 在当前 session 用 `executing-plans` 串行执行，按阶段（Task 1 / Task 2-4 / Task 5-7 / Task 8-10 / Task 11-14）设 checkpoint 评审。

**Which approach?**
