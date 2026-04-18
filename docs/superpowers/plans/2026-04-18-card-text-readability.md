# 卡牌文字可读性重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 解决当前卡牌正面文字"挤、被截断、与攻血徽章互相重叠"的问题，让中文/英文/混排描述都能在 hand / battlefield / collection / detail 四个尺寸下正确换行并优雅省略。

**Architecture:** 把卡牌正面拆成两层：保留 SVG 负责装饰（外框、艺术区、费用宝石、攻血徽章、底部 banner），新增 HTML 文字层 `CardTextLayer` 负责卡名 + 关键字 + 描述，借助浏览器原生 CSS 自动换行 + `line-clamp` 解决换行/截断。同时把 SVG 中攻击力 / 血量徽章下沉到一个独立的底部 banner，让出文字带的水平/垂直空间，避免横向冲突（参考炉石）。

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, SVG, Vitest + React Testing Library

**Design Reference:**
- Hearthstone 截图：底部 banner 内放攻击/血量；中段独立文字面板；卡名横亘其上。
- 当前问题截图：`card1.png`、`cards.png` 中 `Burn the Bo…`、`Anelitesol dierstati…`、Garrison 关键字撞 HP 徽章。

**Corrected Baseline:**
- 卡身尺寸 120×172（保留），所有 SVG 坐标基于该 viewBox。
- ATK 当前位于 `M16 148 L28 155 L16 162 L4 155 Z`，HP 当前 `cx=104 cy=155 r=13`，与描述 `y=132~146` 在垂直/水平方向都重叠。
- 描述目前由 `splitDescription`（按字符数硬切）+ SVG `<tspan>` 渲染，对中英混排和长描述都不友好；并且 `description.replace(/\s+/g,'')` 会把英文单词粘连为 `Opponentdistards…`。
- 现有 28 个测试中，下列直接耦合 SVG 实现细节，本次必须同步修改：
  - `wraps mixed-language snippets by character count instead of isolating Chinese text as one word`
  - `allows stratagem cards to use a denser three-line summary in collection size`
  - `keeps punctuation attached to the previous wrapped line in collection summaries`
  - `does not add an ellipsis when the summary fits exactly on one line`
- `data-testid="card-description-snippet"` 必须保留，`renders a description snippet for non-detail cards` 等用例改 HTML 后仍然要能命中。

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/client/src/components/board/CardTextLayer.tsx` | 卡名 + 关键字 + 描述的 HTML 层（按 size 自适应字号、`line-clamp` 控制溢出） |
| Create | `packages/client/src/components/board/CardTextLayer.test.tsx` | `CardTextLayer` 的单元测试 |
| Modify | `packages/client/src/components/board/CardArtwork.tsx` | 删除 SVG 中的卡名/关键字/描述节点；删除 `splitDescription`、`getDescriptionLayout`；上移艺术区、新增底部 banner 矩形、下移 ATK/HP 到 `y≈160` |
| Modify | `packages/client/src/components/board/CardComponent.tsx` | 在 SVG 之上叠加 `<CardTextLayer />`，保持点击/悬浮/驻守/选中等所有状态 |
| Modify | `packages/client/src/components/board/CardComponent.test.tsx` | 替换 4 个耦合 `<tspan>`/字符计数的用例；新增 1 个回归用例：长英文不再被 `replace(/\s+/g,'')` 粘连 |
| Verify | `packages/client/src/components/board/HandZone.test.tsx`、`Battlefield.test.tsx`、`GameBoard.test.tsx` 等 | 不需改动，只需 `pnpm --filter @king-card/client test` 全绿 |

---

## Layout Contract

视觉上把 `viewBox="0 0 120 172"` 的卡面由上至下切成三段，HTML 文字层在 SVG 之上以百分比定位：

```
y=0   ┌──────────────────────────────┐
      │                              │
      │         art frame            │  art:    0   .. 96  (≈55%)
      │                              │
y=96  ├──────────────────────────────┤
      │   name (1 line, ellipsis)    │  text:   96  .. 148 (≈30%)
      │   keyword chips (truncate)   │
      │   description (line-clamp)   │
y=148 ├──────────────────────────────┤
      │ ATK            HP            │  bottom: 148 .. 172 (≈14%)
y=172 └──────────────────────────────┘
```

**SVG 坐标变化**
- 艺术区 `<rect>` 高度由 `0..104` 改为 `0..96`，圆形艺术框中心由 `cy=60` 改为 `cy=52`、`ry=24`，类型徽章 pill 由 `y=84` 改为 `y=78`。
- 删除 SVG 内卡名 (`y=116`)、关键字 (`y=128`)、描述 (`y=startY`) 三段 `<text>`。
- 新增底部 banner：`<rect x="0" y="148" width="120" height="24" fill="rgba(0,0,0,0.45)" />`。
- ATK 菱形下移 5px：`M16 153 L28 160 L16 167 L4 160 Z`，文字 `y=164`。
- HP 圆形下移 5px：`cx=104 cy=160 r=12`，文字 `y=164`。

**HTML 文字层**（绝对定位覆盖整张卡面，按百分比对齐 SVG）
- 容器：`absolute inset-0 flex flex-col pointer-events-none`，使用 `padding-top: 56%` 把 art 区域留空。
- 卡名：1 行，`overflow-hidden text-ellipsis whitespace-nowrap`。
- 关键字：1 行（仅当 `card.keywords.length > 0`），`truncate`。
- 描述：`line-clamp` 行数随 size 选择（hand/battlefield: 2，collection: 3，detail: 4）。
- 字号映射（写在组件内部 const 表里，避免散落）：
  | size         | name | keywords | description |
  |--------------|------|----------|-------------|
  | hand         | 11px | 9px      | 9px         |
  | battlefield  | 11px | 9px      | 9px         |
  | collection   | 13px | 10px     | 10px        |
  | detail       | 18px | 12px     | 13px        |

---

## Design Decisions

### D1: HTML 文字层用绝对定位覆盖，而非 `<foreignObject>`
理由：测试环境是 jsdom，`<foreignObject>` 内嵌 HTML 在 jsdom 里行为不一致；并且 Tailwind 直接作用在 `<div>` 比作用在 `<foreignObject>` 内部更可靠。代价是导出 PNG 截图时需要分别处理两层（当前项目暂无导出需求）。

### D2: ATK/HP 仍然是 SVG，不迁移到 HTML
理由：菱形/圆形渐变描边和数字阴影在 SVG 里几乎零成本；HTML 实现需要堆 `clip-path` + `text-shadow` 才能复刻。文字层不重叠后，徽章本身没有可读性问题。

### D3: 删除 `description.replace(/\s+/g, '')`
理由：这是导致英文单词粘连的根因。HTML 自动按 `word-break: normal` + `overflow-wrap: anywhere` 处理中英混排即可。

### D4: 用 CSS `-webkit-line-clamp` 控制描述行数，不再手动加 "…"
理由：浏览器原生省略号能精确按容器宽度判断溢出；手动按字符数加 "…" 永远会与中英文宽度差对不上。`line-clamp` 在所有现代浏览器（含 WebKit、Blink、Gecko 137+）已标准化。

### D5: `card-description-snippet` testid 保留，但宿主从 SVG `<text>` 改为 HTML `<div>`
理由：让现有 `expect(snippet.textContent).toContain(...)` 之类的"行为型"断言无须改动；只有 4 个"实现型"用例需要重写。

---

## Tasks

### Task 1: 上移艺术区 + 下沉 ATK/HP + 添加底部 banner（仅 SVG，零文字行为变化）

**Files:**
- Modify: `packages/client/src/components/board/CardArtwork.tsx:142-313`
- Test: `packages/client/src/components/board/CardComponent.test.tsx`

- [ ] **Step 1: 写失败测试 — ATK 菱形下沉到 y≈160 中心**

在 `CardComponent.test.tsx` 末尾追加：

```ts
it('renders the ATK badge inside the bottom banner band (y center ≈ 160)', () => {
  const { container } = render(
    <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance()} />,
  );
  const atkPath = container.querySelector('[data-testid="card-atk"] path');
  expect(atkPath?.getAttribute('d')).toBe('M16 153 L28 160 L16 167 L4 160 Z');
});

it('renders the HP badge inside the bottom banner band (cy ≈ 160)', () => {
  const { container } = render(
    <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance()} />,
  );
  const hpCircle = container.querySelector('[data-testid="card-hp"] circle');
  expect(hpCircle?.getAttribute('cy')).toBe('160');
});

it('renders a dedicated bottom banner rectangle for ATK/HP', () => {
  const { container } = render(
    <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance()} />,
  );
  const banner = container.querySelector('[data-testid="card-bottom-banner"]');
  expect(banner).not.toBeNull();
  expect(banner?.getAttribute('y')).toBe('148');
  expect(banner?.getAttribute('height')).toBe('24');
});
```

- [ ] **Step 2: 运行测试，确认 3 条全部失败**

```bash
cd packages/client && pnpm test --run -t "bottom banner" -t "ATK badge inside" -t "HP badge inside"
```
Expected: 3 FAIL（属性值不匹配 / 找不到 `card-bottom-banner`）。

- [ ] **Step 3: 修改 `CardArtwork.tsx` — 上移艺术区**

在 `<g data-testid="card-art">` 块（约 `:201-222`）替换为：

```tsx
<g data-testid="card-art">
  <rect x="0" y="0" width="120" height="96" fill={`url(#${typeGradId})`} />
  <rect x="8" y="20" width="104" height="68" rx="4" fill={`url(#${svgIdBase}-civ-bg)`} />
  <rect x="8" y="20" width="104" height="68" rx="4" fill={`url(#${svgIdBase}-texture)`} opacity="0.15" />

  <ellipse cx="60" cy="52" rx="28" ry="24"
    fill="rgba(0,0,0,0.45)" stroke={typeStyle.borderColor} strokeWidth="2" />
  <ellipse cx="60" cy="52" rx="25" ry="21"
    fill="none" stroke={`${typeStyle.borderColor}66`} strokeWidth="0.5" />

  <text x="60" y="58" textAnchor="middle" fill="white" fontSize="20" opacity="0.8" fontWeight="700"
    style={{ filter: `drop-shadow(0 0 4px ${typeStyle.glowColor})` }}>
    {typeBadgeLabel(card.type, locale)}
  </text>

  <text x="100" y="32" textAnchor="middle" fill={civColors.secondary} fontSize="12" opacity="0.5">
    {civColors.emblem}
  </text>
</g>
```

- [ ] **Step 4: 修改 `CardArtwork.tsx` — 类型徽章 pill 上移**

把约 `:239-244` 的 `card-type-badge` `<g>` 改为：

```tsx
<g data-testid="card-type-badge">
  <rect x="88" y="76" width="26" height="16" rx="7" fill={`var(--badge-${typeKey})`} />
  <text x="101" y="87" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
    {typeBadgeLabel(card.type, locale)}
  </text>
</g>
```

- [ ] **Step 5: 修改 `CardArtwork.tsx` — 添加底部 banner**

在 `{/* ATK badge – diamond */}` 之前插入：

```tsx
{/* Bottom banner for ATK/HP */}
<rect
  data-testid="card-bottom-banner"
  x="0"
  y="148"
  width="120"
  height="24"
  fill="rgba(0,0,0,0.45)"
/>
```

- [ ] **Step 6: 修改 `CardArtwork.tsx` — 下沉 ATK 菱形与文字**

把约 `:277-289` 的 ATK 块替换为：

```tsx
{isMinion && (
  <g data-testid="card-atk">
    <path
      d="M16 153 L28 160 L16 167 L4 160 Z"
      fill={`url(#${atkGradId})`}
      stroke="var(--atk-border)"
      strokeWidth="1"
    />
    <text x="16" y="164" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
      {attack}
    </text>
  </g>
)}
```

- [ ] **Step 7: 修改 `CardArtwork.tsx` — 下沉 HP 圆形与文字**

把约 `:291-313` 的 HP 块替换为：

```tsx
{isMinion && (
  <g data-testid="card-hp">
    <circle
      cx="104"
      cy="160"
      r="12"
      fill={`url(#${hpGradId})`}
      stroke="var(--hp-border)"
      strokeWidth="1"
    />
    <text
      x="104"
      y="164"
      textAnchor="middle"
      fill={health < maxHealth ? 'var(--hp-text-damaged)' : 'var(--hp-text-full)'}
      fontSize="11"
      fontWeight="bold"
    >
      {health}
    </text>
  </g>
)}
```

- [ ] **Step 8: 运行新增 3 条测试，确认通过**

```bash
cd packages/client && pnpm test --run -t "bottom banner" -t "ATK badge inside" -t "HP badge inside"
```
Expected: 3 PASS。

- [ ] **Step 9: 运行整个 CardComponent 套件，确认未破坏其它**

```bash
cd packages/client && pnpm test --run CardComponent
```
Expected: 全部 PASS（此时 SVG 仍然渲染卡名/关键字/描述，文字行为没变）。

- [ ] **Step 10: 提交**

```bash
git add packages/client/src/components/board/CardArtwork.tsx packages/client/src/components/board/CardComponent.test.tsx
git commit -m "refactor(card): lift art frame & sink ATK/HP into bottom banner"
```

---

### Task 2: 新建 `CardTextLayer` 组件（HTML 文字层）

**Files:**
- Create: `packages/client/src/components/board/CardTextLayer.tsx`
- Create: `packages/client/src/components/board/CardTextLayer.test.tsx`

- [ ] **Step 1: 写失败测试**

新建 `packages/client/src/components/board/CardTextLayer.test.tsx`：

```tsx
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { CardTextLayer } from './CardTextLayer.js';
import { useLocaleStore } from '../../stores/localeStore.js';

afterEach(() => {
  cleanup();
  useLocaleStore.setState({ locale: 'zh-CN' });
});

function makeCard(overrides: Record<string, unknown> = {}) {
  return {
    id: 'card-1',
    name: '步兵',
    type: 'MINION',
    cost: 3,
    attack: 2,
    health: 4,
    rarity: 'COMMON',
    keywords: [],
    description: '一个普通步兵',
    civilization: 'CHINA',
    ...overrides,
  } as any;
}

describe('CardTextLayer', () => {
  it('renders the full card name without truncation in the DOM', () => {
    const { container } = render(
      <CardTextLayer
        card={makeCard({ name: '一个非常非常非常非常长的卡名' })}
        size="battlefield"
      />,
    );
    const name = within(container).getByTestId('card-name');
    expect(name.textContent).toBe('一个非常非常非常非常长的卡名');
  });

  it('renders the full description without manual ellipsis or whitespace stripping', () => {
    const { container } = render(
      <CardTextLayer
        card={makeCard({
          type: 'STRATAGEM',
          description: 'Opponent discards a random card. You gain 1 mana.',
        })}
        size="collection"
      />,
    );
    const snippet = within(container).getByTestId('card-description-snippet');
    expect(snippet.textContent).toBe('Opponent discards a random card. You gain 1 mana.');
    expect(snippet.textContent).not.toContain('Opponentdiscards');
  });

  it('omits the description block when description is empty', () => {
    const { container } = render(
      <CardTextLayer card={makeCard({ description: '' })} size="battlefield" />,
    );
    expect(container.querySelector('[data-testid="card-description-snippet"]')).toBeNull();
  });

  it('omits the keyword row when there are no keywords', () => {
    const { container } = render(
      <CardTextLayer card={makeCard({ keywords: [] })} size="battlefield" />,
    );
    expect(container.querySelector('[data-testid="card-keywords"]')).toBeNull();
  });

  it('renders the keyword row when keywords are present', () => {
    const { container } = render(
      <CardTextLayer
        card={makeCard({ keywords: ['CHARGE'] })}
        size="battlefield"
      />,
    );
    const keywords = within(container).getByTestId('card-keywords');
    expect(keywords.textContent).toContain('冲锋');
  });

  it('applies line-clamp 2 for battlefield/hand and 3 for collection', () => {
    const { container: hand } = render(
      <CardTextLayer
        card={makeCard({ description: '长描述' })}
        size="battlefield"
      />,
    );
    const handSnippet = within(hand).getByTestId('card-description-snippet');
    expect((handSnippet as HTMLElement).style.webkitLineClamp).toBe('2');

    const { container: coll } = render(
      <CardTextLayer
        card={makeCard({ description: '长描述' })}
        size="collection"
      />,
    );
    const collSnippet = within(coll).getByTestId('card-description-snippet');
    expect((collSnippet as HTMLElement).style.webkitLineClamp).toBe('3');
  });

  it('uses pointer-events-none so the SVG layer keeps receiving clicks', () => {
    const { container } = render(
      <CardTextLayer card={makeCard()} size="battlefield" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('pointer-events-none');
  });
});
```

- [ ] **Step 2: 运行测试，确认全部失败（因为组件不存在）**

```bash
cd packages/client && pnpm test --run CardTextLayer
```
Expected: FAIL（"Failed to resolve import './CardTextLayer.js'"）。

- [ ] **Step 3: 实现最小可用组件**

新建 `packages/client/src/components/board/CardTextLayer.tsx`：

```tsx
import type { Card } from '@king-card/shared';
import { getCardDisplayText, getKeywordText } from '../../utils/cardText.js';
import { useLocaleStore } from '../../stores/localeStore.js';

type CardSize = 'hand' | 'battlefield' | 'detail' | 'collection';

interface SizeStyle {
  paddingTopPct: string;
  namePx: number;
  keywordPx: number;
  descriptionPx: number;
  descriptionLineClamp: number;
}

const SIZE_STYLE: Record<CardSize, SizeStyle> = {
  hand: { paddingTopPct: '56%', namePx: 11, keywordPx: 9, descriptionPx: 9, descriptionLineClamp: 2 },
  battlefield: { paddingTopPct: '56%', namePx: 11, keywordPx: 9, descriptionPx: 9, descriptionLineClamp: 2 },
  collection: { paddingTopPct: '56%', namePx: 13, keywordPx: 10, descriptionPx: 10, descriptionLineClamp: 3 },
  detail: { paddingTopPct: '56%', namePx: 18, keywordPx: 12, descriptionPx: 13, descriptionLineClamp: 4 },
};

interface CardTextLayerProps {
  card: Card;
  size: CardSize;
}

export function CardTextLayer({ card, size }: CardTextLayerProps) {
  const locale = useLocaleStore((state) => state.locale);
  const displayCard = getCardDisplayText(card, locale);
  const style = SIZE_STYLE[size];
  const hasKeywords = card.keywords.length > 0;
  const hasDescription = Boolean(displayCard.description);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-stretch text-white"
      style={{ paddingTop: style.paddingTopPct, paddingBottom: '14%', paddingInline: '6%' }}
    >
      <div
        data-testid="card-name"
        className="text-center font-bold leading-tight overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ fontSize: `${style.namePx}px` }}
      >
        {displayCard.name}
      </div>

      {hasKeywords && (
        <div
          data-testid="card-keywords"
          className="text-center font-bold text-amber-300 leading-tight truncate"
          style={{ fontSize: `${style.keywordPx}px`, marginTop: '2px' }}
        >
          {getKeywordText(card.keywords, locale)}
        </div>
      )}

      {hasDescription && (
        <div
          data-testid="card-description-snippet"
          className="mx-auto mt-1 text-center text-stone-200 leading-snug overflow-hidden break-words"
          style={{
            fontSize: `${style.descriptionPx}px`,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: style.descriptionLineClamp,
            wordBreak: 'normal',
            overflowWrap: 'anywhere',
          }}
        >
          {displayCard.description}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 运行测试，确认全部通过**

```bash
cd packages/client && pnpm test --run CardTextLayer
```
Expected: PASS（7 个用例全部绿）。

- [ ] **Step 5: 提交**

```bash
git add packages/client/src/components/board/CardTextLayer.tsx packages/client/src/components/board/CardTextLayer.test.tsx
git commit -m "feat(card): add HTML CardTextLayer for name/keywords/description"
```

---

### Task 3: 把 `CardTextLayer` 接入 `CardComponent`

**Files:**
- Modify: `packages/client/src/components/board/CardComponent.tsx:187-205`

- [ ] **Step 1: 写失败测试 — CardComponent 顶层应渲染 HTML 描述层**

在 `CardComponent.test.tsx` 末尾追加：

```ts
it('renders the description in an HTML overlay layer (not as SVG <text>)', () => {
  const { container } = render(
    <CardComponent
      card={makeCard({ type: 'STRATAGEM', description: 'Hello world description' })}
      size="collection"
    />,
  );
  const snippet = within(container).getByTestId('card-description-snippet');
  expect(snippet.tagName).toBe('DIV');
  expect(snippet.textContent).toBe('Hello world description');
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd packages/client && pnpm test --run -t "HTML overlay layer"
```
Expected: FAIL（当前是 `<text>` 元素，`tagName` 是 `text`）。

- [ ] **Step 3: 在 `CardComponent.tsx` 顶部追加 import**

```tsx
import { CardTextLayer } from './CardTextLayer.js';
```

- [ ] **Step 4: 在 `CardComponent.tsx` 渲染 `<CardArtwork />` 后插入文字层**

把约 `:187-205` 的 `<div className="absolute inset-0 overflow-hidden">…</div>` 块替换为：

```tsx
<div
  className="absolute inset-0 overflow-hidden"
  style={{ borderRadius: 'var(--card-border-radius)' }}
>
  <CardArtwork card={displayCard} instance={instance} svgIdBase={svgIdBase} size={size} locale={locale} />
  <CardTextLayer card={displayCard} size={size} />

  {/* Garrison overlay */}
  {instance && instance.garrisonTurns > 0 && (
    <div
      data-testid="garrison-overlay"
      className="absolute inset-0 bg-blue-900/60 flex items-center justify-center"
      style={{ borderRadius: 'var(--card-border-radius)' }}
    >
      <span className="text-blue-300 text-xs font-bold">
        {garrisonLabel}
      </span>
    </div>
  )}
</div>
```

- [ ] **Step 5: 运行新加用例，确认通过**

```bash
cd packages/client && pnpm test --run -t "HTML overlay layer"
```
Expected: PASS。

- [ ] **Step 6: 运行整个 CardComponent 套件，预期出现"重复 testid"错误**

```bash
cd packages/client && pnpm test --run CardComponent
```
Expected: 部分用例失败 — 例如 `getByTestId('card-description-snippet')` 命中两个节点（SVG 和 HTML）。这是符合预期的失败，下一任务清理。

- [ ] **Step 7: 提交**

```bash
git add packages/client/src/components/board/CardComponent.tsx packages/client/src/components/board/CardComponent.test.tsx
git commit -m "feat(card): mount CardTextLayer over CardArtwork inside CardComponent"
```

---

### Task 4: 从 `CardArtwork` 移除 SVG 内的卡名/关键字/描述

**Files:**
- Modify: `packages/client/src/components/board/CardArtwork.tsx:79-140, 246-274`

- [ ] **Step 1: 删除 `getDescriptionLayout`、`splitDescription` 两个工具函数**

定位 `CardArtwork.tsx` 中以下两个函数（约 `:79-140`）：

```ts
interface DescriptionLayout { … }
function getDescriptionLayout(card: Card, size: CardSize): DescriptionLayout { … }
function splitDescription(description: string, maxCharsPerLine: number, maxLines: number): string[] { … }
```

整段删除，并删掉文件顶部对 `getKeywordText` 的 import（HTML 层已经用上）。

- [ ] **Step 2: 删除 `CardArtwork` 函数体中对它们的调用**

把约 `:150-155` 的调用块删掉：

```ts
const descriptionLayout = getDescriptionLayout(card, size);
const descriptionLines = splitDescription(
  card.description,
  descriptionLayout.maxCharsPerLine,
  descriptionLayout.maxLines,
);
```

- [ ] **Step 3: 删除 SVG 中的卡名 / 关键字 / 描述 三段 `<text>`**

删除约 `:246-274` 的整段：

```tsx
{/* Name */}
<text x="60" y="116" …>{…}</text>

{/* Keywords */}
{card.keywords.length > 0 && (<text x="60" y="128" …>{…}</text>)}

{/* Description snippet */}
{descriptionLines.length > 0 && (<text data-testid="card-description-snippet" …>{…}</text>)}
```

- [ ] **Step 4: 运行 typecheck，确认未留下 dead import**

```bash
cd /home/xu/code/KingsGame && pnpm --filter @king-card/client exec tsc -p tsconfig.build.json --noEmit
```
Expected: 0 错误。

- [ ] **Step 5: 运行 CardComponent 套件，记录失败用例**

```bash
cd packages/client && pnpm test --run CardComponent
```
Expected: 4 个用例失败：
- `wraps mixed-language snippets by character count instead of isolating Chinese text as one word`
- `allows stratagem cards to use a denser three-line summary in collection size`
- `keeps punctuation attached to the previous wrapped line in collection summaries`
- `does not add an ellipsis when the summary fits exactly on one line`

下一任务修这些用例。

- [ ] **Step 6: 提交**

```bash
git add packages/client/src/components/board/CardArtwork.tsx
git commit -m "refactor(card): remove SVG name/keywords/description; drop manual line splitter"
```

---

### Task 5: 替换耦合 SVG 实现的 4 个测试

**Files:**
- Modify: `packages/client/src/components/board/CardComponent.test.tsx:141-274`

- [ ] **Step 1: 替换 `wraps mixed-language snippets...`**

把该用例（约 `:141-156`）整段替换为：

```tsx
it('preserves whitespace between English words in mixed-language snippets', () => {
  const { container } = render(
    <CardComponent
      card={makeCard({
        type: 'STRATAGEM',
        description: 'Rush. 突袭突袭突袭突袭突袭',
      })}
      size="collection"
    />,
  );

  const snippet = within(container).getByTestId('card-description-snippet');
  expect(snippet.textContent).toBe('Rush. 突袭突袭突袭突袭突袭');
});
```

- [ ] **Step 2: 替换 `allows stratagem cards to use a denser three-line summary...`**

把该用例（约 `:217-230`）整段替换为：

```tsx
it('uses three-line clamp for stratagem cards in collection size', () => {
  const { container } = render(
    <CardComponent
      card={makeCard({
        type: 'STRATAGEM',
        description: '持续妙计：令所有友方生物在本回合获得+2攻击力并抽一张牌，然后使一个敌方生物本回合无法攻击。',
      })}
      size="collection"
    />,
  );

  const snippet = within(container).getByTestId('card-description-snippet') as HTMLElement;
  expect(snippet.style.webkitLineClamp).toBe('3');
  expect(snippet.textContent).toBe(
    '持续妙计：令所有友方生物在本回合获得+2攻击力并抽一张牌，然后使一个敌方生物本回合无法攻击。',
  );
});
```

- [ ] **Step 3: 替换 `keeps punctuation attached...`**

把该用例（约 `:232-249`）整段替换为：

```tsx
it('renders punctuation in its original position without manual rewriting', () => {
  const { container } = render(
    <CardComponent
      card={makeCard({
        type: 'STRATAGEM',
        description: '一二三四五六七八九十。十二三四五六七八九十',
      })}
      size="collection"
    />,
  );

  const snippet = within(container).getByTestId('card-description-snippet');
  expect(snippet.textContent).toBe('一二三四五六七八九十。十二三四五六七八九十');
});
```

- [ ] **Step 4: 替换 `does not add an ellipsis when the summary fits exactly...`**

把该用例（约 `:262-274`）整段替换为：

```tsx
it('does not append a manual ellipsis to short descriptions', () => {
  const { container } = render(
    <CardComponent
      card={makeCard({
        type: 'STRATAGEM',
        description: '一二三四五六七八九十',
      })}
      size="collection"
    />,
  );

  const snippet = within(container).getByTestId('card-description-snippet');
  expect(snippet.textContent).toBe('一二三四五六七八九十');
  expect(snippet.textContent).not.toContain('…');
});
```

- [ ] **Step 5: 运行 CardComponent 套件，确认全部 PASS**

```bash
cd packages/client && pnpm test --run CardComponent
```
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add packages/client/src/components/board/CardComponent.test.tsx
git commit -m "test(card): swap tspan-based assertions for HTML overlay assertions"
```

---

### Task 6: 全量回归 + 构建验证

**Files:** （只跑命令，不改代码）

- [ ] **Step 1: 跑全部 client 测试**

```bash
cd /home/xu/code/KingsGame && pnpm --filter @king-card/client test
```
Expected: 全部 PASS（含新增的 `CardTextLayer` 7 用例 + Task 1 新增的 3 用例 + Task 3 新增的 1 用例）。

- [ ] **Step 2: 跑根目录 build（typecheck + vite build）**

```bash
cd /home/xu/code/KingsGame && pnpm build
```
Expected: 4 个 package 全部绿，`vite build` 成功。

- [ ] **Step 3: 启动 dev 服务，本地肉眼回归**

```bash
cd /home/xu/code/KingsGame && pnpm dev:all
```
打开 http://localhost:3000/，进入"卡牌收藏"，依次切换中文/英文 locale，对照检查：
- `cards.png` 中 `Burn the Bo…` / `Anelitesol dierstati…` 现在应展示完整或按 `line-clamp` 换行后省略，且不再有英文单词粘连。
- `card1.png` 中"筑城令"描述不再被 ATK/HP 区域挤压，关键字 `Garrison` 不与右下角徽章重叠。
- 鼠标悬浮 tooltip 仍正常出现且包含完整文本。
- 战场上手牌（hand）/ 我方场上（battlefield）的体型未变形。

- [ ] **Step 4: 视觉验证完毕后提交（如本任务无代码变更则跳过）**

如果只是验证，无需提交。如发现需要微调的字号 / 行高，请回到 Task 2 的 `SIZE_STYLE` 表里调整后追加 `style(card): tweak font sizes per size` 提交。

---

## Self-Review

**1. Spec coverage**
- 文字"挤" → Task 1 上移艺术区 + 下沉 ATK/HP + 添加 banner，腾出 51px 文字带（原 14px）。✓
- "显示不完文字" → Task 2 用 CSS `line-clamp` + 浏览器原生换行；Task 4 删除 `splitDescription` 与 `description.replace(/\s+/g,'')`。✓
- "炉石的攻击/血量给文字让出空间" → Task 1 SVG 重排。✓
- "炉石是不是 HTML 渲染文字" → Task 2/3 用 HTML `<div>` + `data-testid="card-description-snippet"`。✓

**2. Placeholder scan** — 已检查；所有代码块、命令、测试断言均给出具体内容。

**3. Type consistency**
- `CardTextLayer` 接收 `{ card: Card; size: CardSize }`，`CardSize` 定义同 `CardComponent.tsx` / `CardArtwork.tsx`（'hand' | 'battlefield' | 'detail' | 'collection'）。✓
- `getKeywordText`、`getCardDisplayText` 已在 `utils/cardText.ts` 提供。✓
- `data-testid="card-description-snippet"` 在 Task 2/3/5 自始至终保持一致；testid `card-name` / `card-keywords` / `card-bottom-banner` 在文件中只出现一次定义点。✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-18-card-text-readability.md`. Two execution options:

1. **Subagent-Driven (recommended)** —— 每个 Task 派一个新子 agent 执行，期间复审，迭代快。
2. **Inline Execution** —— 在当前会话顺序执行所有 Task，每个 Task 之间停下来给你确认。

请选一个。
