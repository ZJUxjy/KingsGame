# 文明选择器 UI 重构 & 已知问题修复 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 HeroSelect 从硬编码 3 个中国帝王重构为"先选文明 → 再选帝王"的两步流程，支持全部 5 个文明 7 个帝王，并修复 AI 固定选汉武帝、非中国文明描述语言不一致等已知问题。

**Architecture:** 客户端引入共享常量 `CIVILIZATION_META`（文明元数据：名称、描述、图标），HeroSelect 改为两阶段选择器。帝王数据从 core 包的 `ALL_EMPEROR_DATA_LIST` 动态获取，不再硬编码。服务端 `AI_DECK_EMPEROR_INDEX` 改为随机选取。非中国文明卡牌描述统一为中文。

**Tech Stack:** React 19, Zustand 5, Tailwind CSS v4, TypeScript, Socket.IO

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/shared/src/civilization-meta.ts` | 文明元数据常量（名称、描述、图标） |
| Modify | `packages/shared/src/index.ts` | 导出新常量 |
| Modify | `packages/shared/src/types.ts` | 无变更（已有 Civilization 类型） |
| Modify | `packages/client/src/components/lobby/HeroSelect.tsx` | 重构为两阶段文明/帝王选择器 |
| Modify | `packages/server/src/deckBuilder.ts` | AI 随机选帝王替代固定 index 1 |
| Modify | `packages/server/src/gameManager.ts` | 使用随机 AI 帝王索引 |
| Modify | `packages/core/src/cards/definitions/usa-emperors.ts` | 描述改中文 |
| Modify | `packages/core/src/cards/definitions/uk-emperors.ts` | 描述改中文 |
| Modify | `packages/core/src/cards/definitions/germany-emperors.ts` | 描述改中文 |
| Create | `docs/superpowers/plans/2026-04-16-civilization-selector.md` | 本计划文件 |

---

### Task 1: 创建文明元数据常量

**Files:**
- Create: `packages/shared/src/civilization-meta.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: 创建文明元数据文件**

创建 `packages/shared/src/civilization-meta.ts`：

```typescript
import type { Civilization } from './types.js';

export interface CivilizationMeta {
  id: Civilization;
  name: string;
  description: string;
  icon: string;
}

export const CIVILIZATION_ORDER: Civilization[] = [
  'CHINA',
  'JAPAN',
  'USA',
  'UK',
  'GERMANY',
];

export const CIVILIZATION_META: Record<Civilization, CivilizationMeta> = {
  CHINA: {
    id: 'CHINA',
    name: '华夏',
    description: '千古帝业，万里长城',
    icon: '🐉',
  },
  JAPAN: {
    id: 'JAPAN',
    name: '大和',
    description: '武士之道，战国风云',
    icon: '⚔️',
  },
  USA: {
    id: 'USA',
    name: '美利坚',
    description: '自由之光，民主先锋',
    icon: '🗽',
  },
  UK: {
    id: 'UK',
    name: '不列颠',
    description: '日不落帝国，海权霸主',
    icon: '👑',
  },
  GERMANY: {
    id: 'GERMANY',
    name: '普鲁士',
    description: '铁血意志，军事传统',
    icon: '🦅',
  },
  NEUTRAL: {
    id: 'NEUTRAL',
    name: '中立',
    description: '',
    icon: '⚖️',
  },
};
```

- [ ] **Step 2: 在 shared/index.ts 中导出新常量**

在 `packages/shared/src/index.ts` 中添加导出：

```typescript
export { CIVILIZATION_ORDER, CIVILIZATION_META, type CivilizationMeta } from './civilization-meta.js';
```

- [ ] **Step 3: 验证 shared 包编译**

Run: `pnpm --filter @king-card/shared build 2>&1 | tail -5`
Expected: 无错误，编译成功

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/civilization-meta.ts packages/shared/src/index.ts
git commit -m "feat(shared): add civilization metadata constants"
```

---

### Task 2: 非中国文明帝王卡描述统一为中文

**Files:**
- Modify: `packages/core/src/cards/definitions/usa-emperors.ts`
- Modify: `packages/core/src/cards/definitions/uk-emperors.ts`
- Modify: `packages/core/src/cards/definitions/germany-emperors.ts`

- [ ] **Step 1: 修改 USA 帝王描述为中文**

修改 `packages/core/src/cards/definitions/usa-emperors.ts`，将 LINCOLN 的描述和技能改为中文：

```typescript
export const LINCOLN: Card = {
  id: 'usa_lincoln',
  name: 'Abraham Lincoln',
  civilization: 'USA',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: '帝王技能：所有友方生物恢复2点生命。入场时所有友方生物获得+1生命。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 1 },
    },
  ],
  heroSkill: {
    name: '解放宣言',
    description: '所有友方生物恢复2点生命',
    cost: 2,
    cooldown: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'HEAL',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', amount: 2 },
    },
  },
};
```

- [ ] **Step 2: 修改 UK 帝王描述为中文**

修改 `packages/core/src/cards/definitions/uk-emperors.ts`：

```typescript
export const VICTORIA: Card = {
  id: 'uk_victoria',
  name: 'Queen Victoria',
  civilization: 'UK',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 0,
  health: 30,
  description: '帝王技能：所有友方生物获得+1/+1。入场时获得3点护甲。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 3 },
    },
  ],
  heroSkill: {
    name: '帝国号令',
    description: '所有友方生物获得+1/+1',
    cost: 2,
    cooldown: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 },
    },
  },
};
```

- [ ] **Step 3: 修改 Germany 帝王描述为中文**

修改 `packages/core/src/cards/definitions/germany-emperors.ts`：

```typescript
export const FRIEDRICH: Card = {
  id: 'germany_friedrich',
  name: 'Friedrich der Große',
  civilization: 'GERMANY',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: '帝王技能：对一个敌方生物造成2点伤害。入场时所有友方生物获得+1攻击。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 },
    },
  ],
  heroSkill: {
    name: '斜线阵',
    description: '对一个敌方生物造成2点伤害',
    cost: 1,
    cooldown: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  },
};
```

- [ ] **Step 4: 验证 core 包编译**

Run: `pnpm --filter @king-card/core build 2>&1 | tail -5`
Expected: 无错误

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/cards/definitions/usa-emperors.ts packages/core/src/cards/definitions/uk-emperors.ts packages/core/src/cards/definitions/germany-emperors.ts
git commit -m "fix(core): unify non-China emperor descriptions to Chinese"
```

---

### Task 3: AI 随机选择帝王

**Files:**
- Modify: `packages/server/src/deckBuilder.ts`
- Modify: `packages/server/src/gameManager.ts`

- [ ] **Step 1: 修改 deckBuilder 导出随机选取函数**

修改 `packages/server/src/deckBuilder.ts`，移除固定的 `AI_DECK_EMPEROR_INDEX`，改为导出随机选取函数：

```typescript
import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import type { Card, EmperorData } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';

const nonEmperorCards = ALL_CARDS.filter((c) => c.type !== 'EMPEROR');

export function buildDeck(emperorData: EmperorData): Card[] {
  const deck: Card[] = [
    ...emperorData.boundGenerals,
    ...emperorData.boundSorceries,
  ];

  let fillIdx = 0;
  while (deck.length < GAME_CONSTANTS.DECK_SIZE) {
    deck.push(nonEmperorCards[fillIdx % nonEmperorCards.length]);
    fillIdx++;
  }

  return deck;
}

export function getRandomAiEmperorIndex(): number {
  return Math.floor(Math.random() * ALL_EMPEROR_DATA_LIST.length);
}
```

- [ ] **Step 2: 修改 gameManager 使用随机 AI 帝王**

修改 `packages/server/src/gameManager.ts`，将 `AI_DECK_EMPEROR_INDEX` 替换为 `getRandomAiEmperorIndex()`：

```typescript
import { GameEngine, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import { buildDeck, getRandomAiEmperorIndex } from './deckBuilder.js';

// ... GameSession interface 不变 ...

export class GameManager {
  // ... 其余方法不变，只修改 createGame ...

  createGame(mode: 'pve' | 'pvp', playerEmperorIndex: number): GameSession {
    const id = crypto.randomUUID();

    const emperor1 = ALL_EMPEROR_DATA_LIST[playerEmperorIndex];
    const emperor2Index = mode === 'pve' ? getRandomAiEmperorIndex() : 0;
    const emperor2 = ALL_EMPEROR_DATA_LIST[emperor2Index];

    const deck1 = buildDeck(emperor1);
    const deck2 = buildDeck(emperor2);

    const engine = GameEngine.create(deck1, deck2, emperor1, emperor2);

    const session: GameSession = {
      id,
      engine,
      players: [null, null],
      state: 'waiting',
      mode,
      playerEmperorIndices: [playerEmperorIndex, emperor2Index],
    };

    this.games.set(id, session);
    return session;
  }

  // ... 其余方法完全不变 ...
}
```

- [ ] **Step 3: 验证 server 包编译**

Run: `pnpm --filter @king-card/server build 2>&1 | tail -5`
Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/deckBuilder.ts packages/server/src/gameManager.ts
git commit -m "fix(server): randomize AI emperor selection instead of always Han Wudi"
```

---

### Task 4: 重构 HeroSelect 为两阶段文明/帝王选择器

**Files:**
- Modify: `packages/client/src/components/lobby/HeroSelect.tsx`

- [ ] **Step 1: 重写 HeroSelect 组件**

完全重写 `packages/client/src/components/lobby/HeroSelect.tsx`：

```typescript
import { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore.js';
import { CIVILIZATION_ORDER, CIVILIZATION_META } from '@king-card/shared';
import type { Civilization } from '@king-card/shared';
import type { EmperorData } from '@king-card/shared';

/**
 * Dynamically import emperor data from core.
 * We use a static mapping to avoid importing the entire core bundle at lobby time.
 */
const EMPEROR_DATA_BY_CIV: Record<string, EmperorData[]> = await import(
  '@king-card/core'
).then((m) => ({
  CHINA: m.CHINA_EMPEROR_DATA_LIST,
  JAPAN: m.JAPAN_EMPEROR_DATA_LIST,
  USA: m.USA_EMPEROR_DATA_LIST,
  UK: m.UK_EMPEROR_DATA_LIST,
  GERMANY: m.GERMANY_EMPEROR_DATA_LIST,
}));

/**
 * Compute the global emperor index in ALL_EMPEROR_DATA_LIST for a given civ+localIndex.
 * ALL_EMPEROR_DATA_LIST order: CHINA(0-2), JAPAN(3), USA(4), UK(5), GERMANY(6)
 */
const CIV_OFFSETS: Record<string, number> = {
  CHINA: 0,
  JAPAN: 3,
  USA: 4,
  UK: 5,
  GERMANY: 6,
};

function getGlobalEmperorIndex(civ: string, localIndex: number): number {
  return (CIV_OFFSETS[civ] ?? 0) + localIndex;
}

export default function HeroSelect() {
  const joinGame = useGameStore((s) => s.joinGame);
  const joinPvp = useGameStore((s) => s.joinPvp);
  const gameMode = useGameStore((s) => s.gameMode);
  const [selectedCiv, setSelectedCiv] = useState<Civilization | null>(null);
  const [selectedLocalIdx, setSelectedLocalIdx] = useState<number | null>(null);

  const emperors = useMemo(() => {
    if (!selectedCiv) return [];
    return EMPEROR_DATA_BY_CIV[selectedCiv] ?? [];
  }, [selectedCiv]);

  const handleStart = () => {
    if (selectedCiv !== null && selectedLocalIdx !== null) {
      const globalIdx = getGlobalEmperorIndex(selectedCiv, selectedLocalIdx);
      if (gameMode === 'pvp') {
        joinPvp(globalIdx);
      } else {
        joinGame(globalIdx);
      }
    }
  };

  const handleBack = () => {
    if (selectedLocalIdx !== null) {
      setSelectedLocalIdx(null);
    } else {
      setSelectedCiv(null);
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col items-center justify-center">
      {/* Header */}
      <h2 className="text-4xl font-bold text-yellow-400 mb-8">
        {selectedCiv ? '选择帝王' : '选择文明'}
      </h2>

      {/* Back button */}
      {selectedCiv && (
        <button
          onClick={handleBack}
          className="mb-6 px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold cursor-pointer transition-colors"
        >
          ← 返回
        </button>
      )}

      {/* Phase 1: Civilization grid */}
      {!selectedCiv && (
        <div className="grid grid-cols-3 gap-6 mb-12">
          {CIVILIZATION_ORDER.map((civId) => {
            const meta = CIVILIZATION_META[civId];
            const emperorCount = (EMPEROR_DATA_BY_CIV[civId] ?? []).length;
            return (
              <button
                key={civId}
                onClick={() => setSelectedCiv(civId)}
                className="w-64 h-72 rounded-2xl bg-gray-800 border-2 border-gray-600
                           flex flex-col items-center justify-center gap-4 p-6
                           hover:border-yellow-400 hover:scale-105
                           transition-all duration-200 cursor-pointer"
              >
                <span className="text-5xl">{meta.icon}</span>
                <span className="text-3xl font-bold text-yellow-400">
                  {meta.name}
                </span>
                <span className="text-gray-300 text-center text-sm">
                  {meta.description}
                </span>
                <span className="text-xs text-gray-500">
                  {emperorCount} 位帝王
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Phase 2: Emperor selection */}
      {selectedCiv && (
        <div className="flex gap-6 mb-12">
          {emperors.map((emperorData, localIdx) => {
            const card = emperorData.emperorCard;
            const skill = card.heroSkill;
            const isSelected = selectedLocalIdx === localIdx;
            return (
              <button
                key={card.id}
                onClick={() => setSelectedLocalIdx(localIdx)}
                className={`w-64 h-80 rounded-2xl bg-gray-800 border-2 flex flex-col
                            items-center justify-center gap-3 p-6 transition-all duration-200
                            ${
                              isSelected
                                ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-400/20'
                                : 'border-gray-600 hover:border-gray-400'
                            }`}
              >
                <span className="text-4xl font-bold text-yellow-400">
                  {card.name}
                </span>
                {skill && (
                  <>
                    <span className="text-sm text-blue-400 font-bold">
                      {skill.name}
                    </span>
                    <span className="text-gray-300 text-center text-sm px-2">
                      {skill.description}
                    </span>
                  </>
                )}
                <span className="text-xs text-gray-500">
                  费用: {card.cost}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Start / Confirm button */}
      <button
        onClick={handleStart}
        disabled={selectedCiv === null || selectedLocalIdx === null}
        className={`px-12 py-4 rounded-xl text-xl font-bold transition-all duration-200
                    ${
                      selectedCiv !== null && selectedLocalIdx !== null
                        ? 'bg-yellow-600 text-white hover:bg-yellow-500 cursor-pointer'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
      >
        {gameMode === 'pvp' ? '匹配对手' : '开始对战'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 验证客户端编译**

Run: `pnpm --filter @king-card/client build 2>&1 | tail -10`
Expected: 无错误

- [ ] **Step 3: 手动验证 — 启动开发服务器**

Run: `pnpm dev:all`

在浏览器中访问 http://localhost:3000/：
1. 点击"单人模式"
2. 应该看到 5 个文明的网格（华夏、大和、美利坚、不列颠、普鲁士）
3. 点击任一文明，应显示该文明下的帝王列表
4. 选择一个帝王，点击"开始对战"，游戏应正常启动
5. 点击"← 返回"应能回到文明选择

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/components/lobby/HeroSelect.tsx
git commit -m "feat(client): two-phase civilization/emperor selector supporting all 5 civs"
```

---

### Task 5: 验证全量构建和测试

**Files:**
- None (verification only)

- [ ] **Step 1: 运行全量构建**

Run: `pnpm build 2>&1 | tail -20`
Expected: 所有 5 个包编译成功

- [ ] **Step 2: 运行全量测试**

Run: `pnpm test 2>&1 | tail -30`
Expected: 所有测试通过

- [ ] **Step 3: 端到端冒烟测试**

启动 `pnpm dev:all`，逐个验证：
1. 选华夏 → 秦始皇 → PvE 启动 → 打几回合 → 正常
2. 选大和 → 織田信長 → PvE 启动 → AI 帝王不再是固定的汉武帝
3. 选美利坚 → Lincoln → PvE 启动 → 技能描述为中文
4. 选不列颠 → Victoria → PvE 启动 → 技能描述为中文
5. 选普鲁士 → Friedrich → PvE 启动 → 技能描述为中文

- [ ] **Step 4: 最终 Commit（如有任何修复）**

```bash
git add -A
git commit -m "chore: verify all civilizations work end-to-end"
```

---

## Self-Review

### 1. Spec Coverage

| 需求 | 覆盖任务 |
|------|----------|
| UI 支持选择所有文明 | Task 4 |
| 先选文明再选帝王的两步流程 | Task 4 |
| AI 不再固定选汉武帝 | Task 3 |
| 非中国文明描述统一中文 | Task 2 |
| 文明元数据可复用 | Task 1 |
| 全量构建和测试验证 | Task 5 |

### 2. Placeholder Scan

无 TBD/TODO/placeholder。所有步骤包含完整代码。

### 3. Type Consistency

- `Civilization` 类型来自 `@king-card/shared`，Task 1 新增的 `CIVILIZATION_ORDER` 和 `CIVILIZATION_META` 使用同一类型
- `EmperorData` 类型来自 `@king-card/shared`，与 core 包导出一致
- `getGlobalEmperorIndex` 的 offset 计算（CHINA:0, JAPAN:3, USA:4, UK:5, GERMANY:6）与 `ALL_EMPEROR_DATA_LIST` 的组装顺序完全匹配（参见 `packages/core/src/cards/definitions/index.ts` 第 442-448 行）

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-16-civilization-selector.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
