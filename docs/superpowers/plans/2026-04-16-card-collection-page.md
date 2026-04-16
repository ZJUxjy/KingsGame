# 卡牌收藏页实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于参考图新增一个炉石收藏页风格的“卡牌收藏”页面，支持按文明浏览、按类型筛选、按帝王查看绑定卡，并从大厅直接进入，无需连接服务器。

**Architecture:** 新增一个纯客户端的 `collection` UI phase，在客户端直接消费 `@king-card/core` 导出的卡牌与帝王数据。页面采用“三段式”结构：顶部命令栏、中部羊皮纸卡牌网格、右侧帝王侧栏；第一版聚焦“卡牌图鉴与文明预览”，不实现玩家拥有量持久化和完整套牌编辑。

**Tech Stack:** React 19, Zustand 5, Tailwind CSS v4, TypeScript 5.5, Vitest, Testing Library

**Design Reference:** 用户提供的炉石收藏页截图（木质框架 + 羊皮纸卡池 + 右侧牌册导航）

**Scope Guardrails:**
- 当前仓库没有玩家收藏拥有量、分解粉尘、开包或套牌持久化数据，本期不伪造这些系统。
- 收藏页展示规则上限而非“已拥有张数”：普通随从/谋略显示 `x2`，将领/巫术/帝王显示 `x1`，与 [detailed_design.md](detailed_design.md#L323) 的构筑规则一致。
- 右侧栏采用“帝王册/绑定卡预览”而不是“可编辑我的套牌”，视觉借鉴参考图的木牌列表结构，但语义适配当前项目。
- 文明过滤遵循“本文明 + 中立卡池”；当前仓库没有中立牌，过滤逻辑仍保留 `NEUTRAL` 兼容位。

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `packages/client/src/stores/gameStore.ts` | 新增 `collection` UI phase |
| Modify | `packages/client/src/App.tsx` | 注册收藏页入口 |
| Modify | `packages/client/src/components/lobby/Lobby.tsx` | 新增“卡牌收藏”入口按钮 |
| Create | `packages/client/src/components/lobby/Lobby.test.tsx` | 验证收藏页入口不触发 socket 连接 |
| Create | `packages/client/src/components/collection/collection-utils.ts` | 收藏页数据派生、过滤、排序、规则上限 |
| Create | `packages/client/src/components/collection/collection-utils.test.ts` | 锁定过滤与复制上限逻辑 |
| Create | `packages/client/src/components/collection/CollectionToolbar.tsx` | 顶部文明选择、类型筛选、搜索、只看绑定开关 |
| Create | `packages/client/src/components/collection/CollectionCardTile.tsx` | 收藏页卡牌格子，复用 `CardComponent` |
| Create | `packages/client/src/components/collection/CollectionGrid.tsx` | 中央羊皮纸卡牌网格 |
| Create | `packages/client/src/components/collection/CollectionSidebar.tsx` | 右侧帝王册和统计面板 |
| Create | `packages/client/src/components/collection/CollectionPage.tsx` | 收藏页总装配 |
| Create | `packages/client/src/components/collection/CollectionPage.test.tsx` | 页面交互测试 |
| Create | `packages/client/src/components/collection/index.ts` | 导出收藏页组件 |
| Modify | `packages/client/src/components/board/CardComponent.tsx` | 增加 `collection` 尺寸 |
| Modify | `packages/client/src/components/board/CardComponent.test.tsx` | 覆盖 `collection` 尺寸回归 |
| Modify | `packages/client/src/index.css` | 收藏页木框/羊皮纸/侧栏设计 token |

---

## Visual Direction

### Page Composition

- 顶部：木质工具栏，左侧文明下拉，中间类型筛选，右侧搜索和“只看绑定”按钮。
- 中部：偏暖色羊皮纸画布，4 列卡牌网格，卡牌下方显示规则张数 `x1/x2`。
- 右侧：深木色竖向书脊结构，上方为当前文明帝王列表，下方为统计与返回按钮。

### Project-Specific Adaptation

- 参考图中的“我的套牌”被替换为“帝王册”，避免承诺当前不存在的套牌持久化。
- 参考图中的“多余/卡牌制作”被替换为“全部卡牌/只看绑定”，更贴合现有数据能力。
- 页面默认展示华夏文明，右侧同步展示对应帝王列表，用户切换文明时网格与侧栏同步更新。

---

## Task 1: 建立收藏页数据模型与测试

**Files:**
- Create: `packages/client/src/components/collection/collection-utils.ts`
- Create: `packages/client/src/components/collection/collection-utils.test.ts`

- [ ] **Step 1: 先写失败测试，锁定过滤、排序和上限规则**

创建 `packages/client/src/components/collection/collection-utils.test.ts`：

```ts
import {
  ALL_EMPEROR_DATA_LIST,
  CHINA_ALL_CARDS,
  JAPAN_ALL_CARDS,
} from '@king-card/core';
import { describe, expect, it } from 'vitest';
import {
  getCollectionCards,
  getCopyLimit,
  getEmperorsForCivilization,
} from './collection-utils.js';

describe('collection-utils', () => {
  it('returns only the selected civilization cards plus neutral cards', () => {
    const cards = getCollectionCards({
      civilization: 'CHINA',
      type: 'ALL',
      search: '',
      emperorId: null,
      showBoundOnly: false,
    });

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((card) => card.civilization === 'CHINA' || card.civilization === 'NEUTRAL')).toBe(true);
    expect(cards.some((card) => card.civilization === 'JAPAN')).toBe(false);
  });

  it('filters by search text across name, description, and keywords', () => {
    const sampleChinaCard = CHINA_ALL_CARDS.find((card) => card.type !== 'EMPEROR');
    expect(sampleChinaCard).toBeTruthy();

    const cards = getCollectionCards({
      civilization: 'CHINA',
      type: 'ALL',
      search: sampleChinaCard!.name,
      emperorId: null,
      showBoundOnly: false,
    });

    expect(cards.some((card) => card.id === sampleChinaCard!.id)).toBe(true);
  });

  it('returns only bound cards when an emperor is selected and showBoundOnly is true', () => {
    const emperor = ALL_EMPEROR_DATA_LIST.find((item) => item.emperorCard.civilization === 'CHINA');
    expect(emperor).toBeTruthy();

    const cards = getCollectionCards({
      civilization: 'CHINA',
      type: 'ALL',
      search: '',
      emperorId: emperor!.emperorCard.id,
      showBoundOnly: true,
    });

    const boundIds = new Set([
      ...emperor!.boundGenerals.map((card) => card.id),
      ...emperor!.boundSorceries.map((card) => card.id),
    ]);

    expect(cards.length).toBe(boundIds.size);
    expect(cards.every((card) => boundIds.has(card.id))).toBe(true);
  });

  it('sorts cards by cost first and keeps names stable within the same cost bucket', () => {
    const cards = getCollectionCards({
      civilization: 'JAPAN',
      type: 'ALL',
      search: '',
      emperorId: null,
      showBoundOnly: false,
    });

    expect(cards.length).toBeGreaterThan(1);
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].cost).toBeGreaterThanOrEqual(cards[i - 1].cost);
    }
  });

  it('returns the rule-based copy limit for each collectible type', () => {
    expect(getCopyLimit(CHINA_ALL_CARDS.find((card) => card.type === 'MINION')!)).toBe(2);
    expect(getCopyLimit(CHINA_ALL_CARDS.find((card) => card.type === 'STRATAGEM')!)).toBe(2);
    expect(getCopyLimit(CHINA_ALL_CARDS.find((card) => card.type === 'GENERAL')!)).toBe(1);
    expect(getCopyLimit(CHINA_ALL_CARDS.find((card) => card.type === 'SORCERY')!)).toBe(1);
  });

  it('returns emperors only for the requested civilization', () => {
    const japanEmperors = getEmperorsForCivilization('JAPAN');

    expect(japanEmperors.length).toBeGreaterThan(0);
    expect(japanEmperors.every((item) => item.emperorCard.civilization === 'JAPAN')).toBe(true);
    expect(japanEmperors.some((item) => item.emperorCard.civilization === 'CHINA')).toBe(false);
    expect(japanEmperors.length).toBeLessThan(ALL_EMPEROR_DATA_LIST.length);
    expect(JAPAN_ALL_CARDS.some((card) => card.type === 'EMPEROR')).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试，确认当前为红灯**

Run: `pnpm --filter @king-card/client test -- collection-utils.test.ts`

Expected: FAIL，提示 `collection-utils.ts` 尚不存在，或导出函数未定义。

- [ ] **Step 3: 实现收藏页数据工具**

创建 `packages/client/src/components/collection/collection-utils.ts`：

```ts
import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import type { Card, CardType, Civilization, EmperorData, Keyword } from '@king-card/shared';

export type CollectionCardTypeFilter = 'ALL' | Exclude<CardType, 'EMPEROR'>;

export interface CollectionFilters {
  civilization: Civilization;
  type: CollectionCardTypeFilter;
  search: string;
  emperorId: string | null;
  showBoundOnly: boolean;
}

const TYPE_ORDER: Record<Exclude<CardType, 'EMPEROR'>, number> = {
  MINION: 0,
  GENERAL: 1,
  STRATAGEM: 2,
  SORCERY: 3,
};

const COLLECTIBLE_CARDS = ALL_CARDS.filter((card) => card.type !== 'EMPEROR');

function keywordText(keywords: Keyword[]): string {
  return keywords.join(' ');
}

function sortCards(left: Card, right: Card): number {
  if (left.cost !== right.cost) return left.cost - right.cost;
  if (left.type !== right.type) return TYPE_ORDER[left.type] - TYPE_ORDER[right.type];
  return left.name.localeCompare(right.name, 'zh-CN');
}

function getBoundCardIds(emperorId: string | null): Set<string> | null {
  if (!emperorId) return null;
  const emperorData = ALL_EMPEROR_DATA_LIST.find((item) => item.emperorCard.id === emperorId);
  if (!emperorData) return null;

  return new Set([
    ...emperorData.boundGenerals.map((card) => card.id),
    ...emperorData.boundSorceries.map((card) => card.id),
  ]);
}

export function getEmperorsForCivilization(civilization: Civilization): EmperorData[] {
  return ALL_EMPEROR_DATA_LIST.filter((item) => item.emperorCard.civilization === civilization);
}

/**
 * Precondition: caller only passes collectible non-EMPEROR cards.
 * The collection page central grid already filters emperors out.
 */
export function getCopyLimit(card: Card): 1 | 2 {
  return card.type === 'MINION' || card.type === 'STRATAGEM' ? 2 : 1;
}

export function getCollectionCards(filters: CollectionFilters): Card[] {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const boundCardIds = getBoundCardIds(filters.emperorId);

  return COLLECTIBLE_CARDS
    .filter((card) => card.civilization === filters.civilization || card.civilization === 'NEUTRAL')
    .filter((card) => filters.type === 'ALL' || card.type === filters.type)
    .filter((card) => {
      if (!normalizedSearch) return true;

      const haystack = [card.name, card.description, keywordText(card.keywords)]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    })
    .filter((card) => {
      if (!filters.showBoundOnly) return true;
      if (!boundCardIds) return false;
      return boundCardIds.has(card.id);
    })
    .sort(sortCards);
}
```

- [ ] **Step 4: 重新运行测试，确认转绿**

Run: `pnpm --filter @king-card/client test -- collection-utils.test.ts`

Expected: PASS，`collection-utils.test.ts` 全部通过。

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/components/collection/collection-utils.ts packages/client/src/components/collection/collection-utils.test.ts
git commit -m "feat(client): add collection page data derivation utilities"
```

---

## Task 2: 接入新的 collection phase 与大厅入口

**Files:**
- Modify: `packages/client/src/stores/gameStore.ts`
- Modify: `packages/client/src/App.tsx`
- Modify: `packages/client/src/components/lobby/Lobby.tsx`
- Create: `packages/client/src/components/lobby/Lobby.test.tsx`

- [ ] **Step 1: 先写大厅入口测试**

创建 `packages/client/src/components/lobby/Lobby.test.tsx`：

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Lobby from './Lobby.js';
import { useGameStore } from '../../stores/gameStore.js';

const initialState = useGameStore.getState();

describe('Lobby', () => {
  const connect = vi.fn();

  beforeEach(() => {
    connect.mockReset();
    useGameStore.setState({
      ...initialState,
      connect,
      uiPhase: 'lobby',
    });
  });

  afterEach(() => {
    cleanup();
    useGameStore.setState(initialState, true);
  });

  it('opens the collection page without connecting to the game server', () => {
    render(<Lobby />);

    fireEvent.click(screen.getByRole('button', { name: /卡牌收藏/ }));

    expect(connect).not.toHaveBeenCalled();
    expect(useGameStore.getState().uiPhase).toBe('collection');
  });
});
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run: `pnpm --filter @king-card/client test -- Lobby.test.tsx`

Expected: FAIL，因为当前没有“卡牌收藏”按钮，也没有 `collection` phase。

- [ ] **Step 3: 修改 store、App、Lobby 接入收藏页路由**

在 `packages/client/src/stores/gameStore.ts` 中扩展 `UiPhase`：

```ts
export type UiPhase = 'lobby' | 'hero-select' | 'pvp-waiting' | 'playing' | 'game-over' | 'collection';
```

在 `packages/client/src/App.tsx` 中注册收藏页：

```tsx
import CollectionPage from './components/collection/CollectionPage.js';

export default function App() {
  const uiPhase = useGameStore((s) => s.uiPhase);

  useGameSocket();

  switch (uiPhase) {
    case 'lobby':
      return <Lobby />;
    case 'hero-select':
      return <HeroSelect />;
    case 'pvp-waiting':
      return <PvpWaiting />;
    case 'playing':
      return <GameBoard />;
    case 'game-over':
      return <GameOverScreen />;
    case 'collection':
      return <CollectionPage />;
  }
}
```

在 `packages/client/src/components/lobby/Lobby.tsx` 中新增按钮：

```tsx
  const handleCollection = () => {
    setUiPhase('collection');
  };

      <div className="flex gap-8">
        <button
          onClick={handlePvE}
          className="group w-72 h-48 rounded-2xl bg-gray-800 border-2 border-yellow-600
                     flex flex-col items-center justify-center gap-4
                     hover:bg-gray-700 hover:border-yellow-400 hover:scale-105
                     transition-all duration-200 cursor-pointer"
        >
          <span className="text-3xl">⚔️</span>
          <span className="text-2xl font-bold text-yellow-400">单人模式</span>
          <span className="text-sm text-gray-400">PvE</span>
        </button>

        <button
          onClick={handlePvP}
          className="group w-72 h-48 rounded-2xl bg-gray-800 border-2 border-blue-600
                     flex flex-col items-center justify-center gap-4
                     hover:bg-gray-700 hover:border-blue-400 hover:scale-105
                     transition-all duration-200 cursor-pointer"
        >
          <span className="text-3xl">🤝</span>
          <span className="text-2xl font-bold text-blue-400">双人模式</span>
          <span className="text-sm text-gray-400">PvP</span>
        </button>

        <button
          onClick={handleCollection}
          className="group w-72 h-48 rounded-2xl bg-gray-800 border-2 border-amber-600
                     flex flex-col items-center justify-center gap-4
                     hover:bg-gray-700 hover:border-amber-400 hover:scale-105
                     transition-all duration-200 cursor-pointer"
        >
          <span className="text-3xl">📚</span>
          <span className="text-2xl font-bold text-amber-300">卡牌收藏</span>
          <span className="text-sm text-gray-400">Collection</span>
        </button>
      </div>
```

- [ ] **Step 4: 重新运行大厅测试**

Run: `pnpm --filter @king-card/client test -- Lobby.test.tsx`

Expected: PASS，且点击收藏按钮不会触发 `connect()`。

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/stores/gameStore.ts packages/client/src/App.tsx packages/client/src/components/lobby/Lobby.tsx packages/client/src/components/lobby/Lobby.test.tsx
git commit -m "feat(client): add lobby entry for the collection page"
```

---

## Task 3: 为收藏页主交互写失败测试

**Files:**
- Create: `packages/client/src/components/collection/CollectionPage.test.tsx`

- [ ] **Step 1: 编写页面交互测试**

创建 `packages/client/src/components/collection/CollectionPage.test.tsx`：

```tsx
import {
  ALL_EMPEROR_DATA_LIST,
  CHINA_ALL_CARDS,
  JAPAN_ALL_CARDS,
} from '@king-card/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import CollectionPage from './CollectionPage.js';
import { useGameStore } from '../../stores/gameStore.js';

const initialState = useGameStore.getState();

describe('CollectionPage', () => {
  beforeEach(() => {
    useGameStore.setState({
      ...initialState,
      uiPhase: 'collection',
    });
  });

  afterEach(() => {
    cleanup();
    useGameStore.setState(initialState, true);
  });

  it('shows China cards by default and switches to the selected civilization', () => {
    const chinaCard = CHINA_ALL_CARDS.find((card) => card.type !== 'EMPEROR')!;
    const japanCard = JAPAN_ALL_CARDS.find((card) => card.type !== 'EMPEROR')!;

    render(<CollectionPage />);

    expect(screen.getByText(chinaCard.name)).toBeTruthy();
    expect(screen.queryByText(japanCard.name)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /大和/ }));

    expect(screen.getByText(japanCard.name)).toBeTruthy();
    expect(screen.queryByText(chinaCard.name)).toBeNull();
  });

  it('filters to an emperor bound package when toggling bound-only mode', () => {
    const emperor = ALL_EMPEROR_DATA_LIST.find((item) => item.emperorCard.civilization === 'CHINA')!;
    const boundCard = emperor.boundGenerals[0] ?? emperor.boundSorceries[0];
    const boundIds = new Set([
      ...emperor.boundGenerals.map((card) => card.id),
      ...emperor.boundSorceries.map((card) => card.id),
    ]);
    const nonBoundChinaCard = CHINA_ALL_CARDS.find(
      (card) => card.type !== 'EMPEROR' && !boundIds.has(card.id),
    )!;

    render(<CollectionPage />);

    fireEvent.click(screen.getByRole('button', { name: emperor.emperorCard.name }));
    fireEvent.click(screen.getByRole('button', { name: /只看绑定/ }));

    expect(screen.getByText(boundCard.name)).toBeTruthy();
    expect(screen.queryByText(nonBoundChinaCard.name)).toBeNull();
  });

  it('returns to the lobby when clicking the back button', () => {
    render(<CollectionPage />);

    fireEvent.click(screen.getByRole('button', { name: /返回大厅/ }));

    expect(useGameStore.getState().uiPhase).toBe('lobby');
  });
});
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run: `pnpm --filter @king-card/client test -- CollectionPage.test.tsx`

Expected: FAIL，提示 `CollectionPage.tsx` 尚不存在。

---

## Task 4: 实现收藏页组件与 collection 卡牌尺寸

**Files:**
- Create: `packages/client/src/components/collection/CollectionToolbar.tsx`
- Create: `packages/client/src/components/collection/CollectionCardTile.tsx`
- Create: `packages/client/src/components/collection/CollectionGrid.tsx`
- Create: `packages/client/src/components/collection/CollectionSidebar.tsx`
- Create: `packages/client/src/components/collection/CollectionPage.tsx`
- Create: `packages/client/src/components/collection/index.ts`
- Modify: `packages/client/src/components/board/CardComponent.tsx`
- Modify: `packages/client/src/components/board/CardComponent.test.tsx`

- [ ] **Step 1: 先让 `CardComponent` 支持收藏页尺寸**

修改 `packages/client/src/components/board/CardComponent.tsx`：

```tsx
type CardSize = 'hand' | 'battlefield' | 'detail' | 'collection';

const SIZE_MAP: Record<CardSize, { width: number; height: number }> = {
  hand: { width: 90, height: 130 },
  battlefield: { width: 90, height: 130 },
  detail: { width: 288, height: 420 },
  collection: { width: 168, height: 246 },
};
```

在 `packages/client/src/components/board/CardComponent.test.tsx` 中补一个尺寸回归：

```tsx
it('renders the collection size without throwing', () => {
  const { getByTestId } = render(
    <CardComponent card={makeCard()} size="collection" />,
  );

  expect(getByTestId('card')).toBeTruthy();
});

it('renders collection size for the real tile path without instance stats', () => {
  const { getByTestId, queryByTestId } = render(
    <CardComponent card={makeCard({ type: 'STRATAGEM' })} size="collection" />,
  );

  expect(getByTestId('card')).toBeTruthy();
  expect(queryByTestId('card-atk')).toBeNull();
  expect(queryByTestId('card-hp')).toBeNull();
});
```

- [ ] **Step 2: 创建顶部命令栏与单卡 Tile**

创建 `packages/client/src/components/collection/CollectionToolbar.tsx`：

```tsx
import { CIVILIZATION_META, CIVILIZATION_ORDER, type Civilization } from '@king-card/shared';
import type { CollectionCardTypeFilter } from './collection-utils.js';

interface CollectionToolbarProps {
  civilization: Civilization;
  selectedType: CollectionCardTypeFilter;
  search: string;
  canToggleBoundOnly: boolean;
  showBoundOnly: boolean;
  onCivilizationChange: (civilization: Civilization) => void;
  onTypeChange: (type: CollectionCardTypeFilter) => void;
  onSearchChange: (value: string) => void;
  onToggleBoundOnly: () => void;
}

const TYPE_LABELS: Record<CollectionCardTypeFilter, string> = {
  ALL: '全部',
  MINION: '随从',
  GENERAL: '将领',
  STRATAGEM: '谋略',
  SORCERY: '巫术',
};

export function CollectionToolbar(props: CollectionToolbarProps) {
  return (
    <div className="rounded-[28px] border border-amber-950/40 bg-[rgba(59,32,18,0.88)] px-6 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 rounded-full bg-black/20 px-4 py-2 text-stone-100">
          <span className="text-sm tracking-[0.2em] text-amber-100/70">文明</span>
          <div className="flex flex-wrap gap-2">
            {CIVILIZATION_ORDER.map((civilization) => (
              <button
                key={civilization}
                onClick={() => props.onCivilizationChange(civilization)}
                className={`rounded-full px-4 py-2 text-sm transition ${props.civilization === civilization ? 'bg-amber-200 text-stone-900' : 'bg-stone-800/70 text-stone-100 hover:bg-stone-700/70'}`}
              >
                {CIVILIZATION_META[civilization].name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as CollectionCardTypeFilter[]).map((type) => (
            <button
              key={type}
              onClick={() => props.onTypeChange(type)}
              className={`rounded-full px-4 py-2 text-sm transition ${props.selectedType === type ? 'bg-yellow-300 text-stone-900' : 'bg-stone-950/50 text-stone-200 hover:bg-stone-900/70'}`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <input
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="搜索名称、描述或关键词"
          className="ml-auto min-w-64 rounded-full border border-stone-700 bg-stone-950/70 px-4 py-2 text-sm text-stone-100 outline-none placeholder:text-stone-500"
        />

        <button
          onClick={props.onToggleBoundOnly}
          disabled={!props.canToggleBoundOnly}
          className={`rounded-full px-4 py-2 text-sm transition ${props.canToggleBoundOnly ? props.showBoundOnly ? 'bg-emerald-300 text-stone-900' : 'bg-stone-900/70 text-stone-100 hover:bg-stone-800/80' : 'cursor-not-allowed bg-stone-900/30 text-stone-500'}`}
        >
          只看绑定
        </button>
      </div>
    </div>
  );
}
```

创建 `packages/client/src/components/collection/CollectionCardTile.tsx`：

```tsx
import type { Card } from '@king-card/shared';
import { CardComponent } from '../board/CardComponent.js';

interface CollectionCardTileProps {
  card: Card;
  copyLimit: 1 | 2;
  highlighted?: boolean;
}

export function CollectionCardTile({ card, copyLimit, highlighted }: CollectionCardTileProps) {
  return (
    <div className="relative flex flex-col items-center">
      <div className={`rounded-[22px] p-1 transition ${highlighted ? 'bg-yellow-300/40 shadow-[0_0_24px_rgba(250,204,21,0.4)]' : ''}`}>
        <CardComponent card={card} size="collection" />
      </div>
      <div className="mt-2 rounded-full bg-amber-900/75 px-4 py-1 text-sm font-semibold tracking-[0.3em] text-amber-50">
        x{copyLimit}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建网格、侧栏和页面总装配**

创建 `packages/client/src/components/collection/CollectionGrid.tsx`：

```tsx
import type { Card } from '@king-card/shared';
import { CollectionCardTile } from './CollectionCardTile.js';

interface CollectionGridProps {
  cards: Card[];
  highlightedIds: Set<string>;
  getCopyLimit: (card: Card) => 1 | 2;
}

export function CollectionGrid({ cards, highlightedIds, getCopyLimit }: CollectionGridProps) {
  return (
    <div className="rounded-[34px] border border-[#d9c9a2] bg-[linear-gradient(180deg,#f4e5ba_0%,#ebd6aa_100%)] p-6 shadow-[inset_0_0_40px_rgba(120,75,26,0.12),0_30px_60px_rgba(0,0,0,0.18)]">
      <div className="grid grid-cols-4 gap-x-6 gap-y-10">
        {cards.map((card) => (
          <CollectionCardTile
            key={card.id}
            card={card}
            copyLimit={getCopyLimit(card)}
            highlighted={highlightedIds.has(card.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

创建 `packages/client/src/components/collection/CollectionSidebar.tsx`：

```tsx
import { CIVILIZATION_META, type Civilization, type EmperorData } from '@king-card/shared';

interface CollectionSidebarProps {
  civilization: Civilization;
  emperors: EmperorData[];
  selectedEmperorId: string | null;
  visibleCount: number;
  totalCount: number;
  onSelectEmperor: (emperorId: string) => void;
  onBack: () => void;
}

export function CollectionSidebar(props: CollectionSidebarProps) {
  return (
    <aside className="w-[320px] shrink-0 rounded-[32px] border border-amber-950/40 bg-[linear-gradient(180deg,rgba(61,33,18,0.96)_0%,rgba(34,20,12,0.96)_100%)] p-5 text-stone-100 shadow-[0_24px_54px_rgba(0,0,0,0.35)]">
      <div className="rounded-[20px] border border-amber-200/15 bg-stone-950/25 px-5 py-4 text-center text-2xl font-bold tracking-[0.18em] text-amber-100">
        {CIVILIZATION_META[props.civilization].name} 帝王册
      </div>

      <div className="mt-5 space-y-4">
        {props.emperors.map((item) => {
          const active = props.selectedEmperorId === item.emperorCard.id;
          return (
            <button
              key={item.emperorCard.id}
              onClick={() => props.onSelectEmperor(item.emperorCard.id)}
              className={`block w-full rounded-[20px] border px-4 py-4 text-left transition ${active ? 'border-yellow-300 bg-yellow-200/10 shadow-[0_0_20px_rgba(250,204,21,0.18)]' : 'border-amber-100/10 bg-black/15 hover:bg-black/25'}`}
            >
              <div className="text-lg font-bold text-yellow-50">{item.emperorCard.name}</div>
              <div className="mt-1 text-sm text-stone-300">{item.emperorCard.heroSkill?.name}</div>
              <div className="mt-2 text-xs tracking-[0.2em] text-stone-400">
                绑定 {item.boundGenerals.length + item.boundSorceries.length} 张
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[24px] border border-amber-100/10 bg-black/20 px-5 py-4">
        <div className="text-sm tracking-[0.25em] text-stone-400">当前展示</div>
        <div className="mt-2 text-4xl font-black text-amber-50">{props.visibleCount}/{props.totalCount}</div>
        <div className="mt-2 text-sm leading-6 text-stone-300">收藏页仅展示当前文明与中立卡池，右侧点击帝王后可高亮或过滤其绑定将领与巫术。</div>
      </div>

      <button
        onClick={props.onBack}
        className="mt-6 w-full rounded-[20px] border border-amber-200/20 bg-amber-200/10 px-5 py-4 text-lg font-bold text-amber-50 transition hover:bg-amber-200/20"
      >
        返回大厅
      </button>
    </aside>
  );
}
```

创建 `packages/client/src/components/collection/CollectionPage.tsx`：

```tsx
import { useMemo, useState } from 'react';
import { CIVILIZATION_META, type Civilization } from '@king-card/shared';
import { useGameStore } from '../../stores/gameStore.js';
import { CollectionGrid } from './CollectionGrid.js';
import { CollectionSidebar } from './CollectionSidebar.js';
import { CollectionToolbar } from './CollectionToolbar.js';
import {
  getCollectionCards,
  getCopyLimit,
  getEmperorsForCivilization,
  type CollectionCardTypeFilter,
} from './collection-utils.js';

export default function CollectionPage() {
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const [civilization, setCivilization] = useState<Civilization>('CHINA');
  const [selectedType, setSelectedType] = useState<CollectionCardTypeFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selectedEmperorId, setSelectedEmperorId] = useState<string | null>(null);
  const [showBoundOnly, setShowBoundOnly] = useState(false);

  const emperors = useMemo(() => getEmperorsForCivilization(civilization), [civilization]);

  const baseCards = useMemo(
    () => getCollectionCards({
      civilization,
      type: 'ALL',
      search: '',
      emperorId: null,
      showBoundOnly: false,
    }),
    [civilization],
  );

  const cards = useMemo(
    () => getCollectionCards({ civilization, type: selectedType, search, emperorId: selectedEmperorId, showBoundOnly }),
    [civilization, search, selectedEmperorId, selectedType, showBoundOnly],
  );

  const totalCards = baseCards.length;

  const highlightedIds = useMemo(() => {
    if (!selectedEmperorId) return new Set<string>();
    const emperor = emperors.find((item) => item.emperorCard.id === selectedEmperorId);
    if (!emperor) return new Set<string>();
    return new Set([
      ...emperor.boundGenerals.map((card) => card.id),
      ...emperor.boundSorceries.map((card) => card.id),
    ]);
  }, [emperors, selectedEmperorId]);

  const handleCivilizationChange = (nextCivilization: Civilization) => {
    setCivilization(nextCivilization);
    setSelectedType('ALL');
    setSearch('');
    setSelectedEmperorId(null);
    setShowBoundOnly(false);
  };

  const handleSelectEmperor = (emperorId: string) => {
    setSelectedEmperorId((current) => (current === emperorId ? null : emperorId));
    setShowBoundOnly(false);
  };

  return (
    <div className="min-h-screen bg-collection-shell px-8 py-8 text-stone-900">
      <div className="mx-auto flex max-w-[1680px] gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-5 rounded-[30px] border border-amber-100/20 bg-black/15 px-6 py-5 text-stone-100">
            <div className="text-sm tracking-[0.35em] text-amber-100/70">COLLECTION</div>
            <div className="mt-2 text-4xl font-black text-amber-50">{CIVILIZATION_META[civilization].name} 卡牌收藏</div>
            <div className="mt-2 text-base text-amber-50/75">参考炉石收藏页的木框与羊皮纸结构，但语义适配帝王、绑定卡与文明卡池。</div>
          </div>

          <CollectionToolbar
            civilization={civilization}
            selectedType={selectedType}
            search={search}
            canToggleBoundOnly={selectedEmperorId !== null}
            showBoundOnly={showBoundOnly}
            onCivilizationChange={handleCivilizationChange}
            onTypeChange={setSelectedType}
            onSearchChange={setSearch}
            onToggleBoundOnly={() => setShowBoundOnly((value) => !value)}
          />

          <div className="mt-6">
            <CollectionGrid
              cards={cards}
              highlightedIds={highlightedIds}
              getCopyLimit={getCopyLimit}
            />
          </div>
        </div>

        <CollectionSidebar
          civilization={civilization}
          emperors={emperors}
          selectedEmperorId={selectedEmperorId}
          visibleCount={cards.length}
          totalCount={totalCards}
          onSelectEmperor={handleSelectEmperor}
          onBack={() => setUiPhase('lobby')}
        />
      </div>
    </div>
  );
}
```

创建 `packages/client/src/components/collection/index.ts`：

```ts
export { default as CollectionPage } from './CollectionPage.js';
export { CollectionToolbar } from './CollectionToolbar.js';
export { CollectionGrid } from './CollectionGrid.js';
export { CollectionSidebar } from './CollectionSidebar.js';
export { CollectionCardTile } from './CollectionCardTile.js';
```

- [ ] **Step 4: 运行相关测试，确认页面与尺寸功能都转绿**

Run: `pnpm --filter @king-card/client test -- CollectionPage.test.tsx CardComponent.test.tsx`

Expected: PASS，收藏页交互测试和 `CardComponent` 回归测试全部通过。

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/components/collection packages/client/src/components/board/CardComponent.tsx packages/client/src/components/board/CardComponent.test.tsx
git commit -m "feat(client): build hearthstone-inspired collection page layout"
```

---

## Task 5: 补齐收藏页视觉 token 并做整体验证

**Files:**
- Modify: `packages/client/src/index.css`

- [ ] **Step 1: 添加收藏页背景与材质 token**

在 `packages/client/src/index.css` 的 `:root` 中追加：

```css
  --collection-wood-dark: #2c170e;
  --collection-wood-mid: #5a2f18;
  --collection-wood-light: #8a5a2b;
  --collection-paper-top: #f7e7bc;
  --collection-paper-bottom: #ead29f;
  --collection-paper-shadow: rgba(81, 43, 18, 0.18);
  --collection-brass: #d7b062;
  --collection-brass-deep: #9b6b26;
```

并追加页面级工具类：

```css
.bg-collection-shell {
  background:
    radial-gradient(circle at top, rgba(134, 74, 34, 0.28), transparent 30%),
    linear-gradient(180deg, #5b2d18 0%, #3f210f 36%, #24120a 100%);
}

.collection-wood-frame {
  background: linear-gradient(180deg, var(--collection-wood-light) 0%, var(--collection-wood-mid) 28%, var(--collection-wood-dark) 100%);
}

.collection-paper {
  background: linear-gradient(180deg, var(--collection-paper-top) 0%, var(--collection-paper-bottom) 100%);
  box-shadow: inset 0 0 40px var(--collection-paper-shadow);
}
```

- [ ] **Step 2: 运行 client 测试**

Run: `pnpm --filter @king-card/client test`

Expected: client 包测试全部通过。

- [ ] **Step 3: 运行 client 构建**

Run: `pnpm --filter @king-card/client build`

Expected: client 包构建通过，无 TypeScript 错误。

- [ ] **Step 4: 手动视觉检查**

Run: `pnpm --filter @king-card/client dev`

Checklist:
- 大厅出现“卡牌收藏”按钮，点击后不依赖 socket 连接。
- 收藏页默认显示华夏文明，右侧帝王册只列出华夏帝王。
- 切换到大和/美利坚/不列颠/普鲁士时，中央卡牌网格同步切换，不出现跨文明卡牌。
- 点击某个帝王后，绑定卡有高亮边框；再点“只看绑定”后，网格仅保留该帝王绑定将领与巫术。
- 卡牌下方 `x1/x2` 标识符合构筑规则，看起来像收藏页槽位而不是战场数值。
- 页面整体具备参考图中的木框、羊皮纸、右侧书脊式层次，不应退化为普通后台表格页。

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/index.css
git commit -m "style(client): add collection page visual tokens and finish verification"
```

---

## Self-Review

### 1. Spec Coverage

| Requirement | Covered By |
|-------------|------------|
| 炉石收藏页风格布局 | Task 4, Task 5 |
| 大厅可进入收藏页 | Task 2 |
| 按文明浏览卡池 | Task 1, Task 4 |
| 按类型筛选与搜索 | Task 1, Task 4 |
| 右侧帝王册 | Task 4 |
| 帝王绑定卡高亮与过滤 | Task 1, Task 3, Task 4 |
| 不连接服务器 | Task 2 |
| 测试覆盖与构建验证 | Task 1, Task 2, Task 3, Task 5 |

### 2. Placeholder Scan

- 无 `TODO`、`TBD`、`类似 Task N` 之类占位语。
- 所有新增文件路径、命令、关键代码片段都已明确给出。

### 3. Type Consistency

- `CollectionCardTypeFilter` 明确为 `'ALL' | Exclude<CardType, 'EMPEROR'>`，与收藏页“不展示帝王卡进中央网格”的范围一致。
- `getCopyLimit(card)` 已在计划中注明前置条件：只接受中央网格已过滤后的非 `EMPEROR` 卡牌，避免函数签名和实际用法脱节。
- `UiPhase` 新值统一命名为 `collection`，在 `gameStore.ts`、`App.tsx`、`Lobby.tsx`、测试文件中保持一致。
- 收藏页始终通过 `Card` 数据渲染，不引入 `CardInstance`，符合图鉴场景。

### 4. Known Trade-offs

- 这版收藏页不做玩家拥有量持久化，因此 `x1/x2` 表达的是“构筑规则上限”，不是账号库存。
- 右侧栏先做“帝王册”而不是“我的套牌”，这样可以最大化复用现有 `EmperorData`，同时为未来的套牌构筑页保留演化空间。
- 页面直接静态导入 `@king-card/core` 卡牌定义，和现有 `HeroSelect` 的模式一致；若未来卡池继续增大，再考虑抽出轻量只读元数据层。

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-16-card-collection-page.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**