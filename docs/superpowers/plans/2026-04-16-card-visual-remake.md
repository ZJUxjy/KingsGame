# 卡牌视觉重构实施计划

> **For agentic workers:** 使用 `superpowers:executing-plans` 按任务顺序执行。实现阶段遵循 TDD；每个任务先补失败测试，再写最小实现。

**Goal:** 将当前 90×130 的矩形 `CardComponent` 重构为基于 Figma 方向的华丽 SVG 卡牌，同时保留现有交互状态、主题 token、测试契约，并且不引入当前仓库尚不存在的卡图资源管线。

**Architecture:** 提取一个纯视觉的 `CardArtwork` 组件负责 SVG 卡面，`CardComponent` 负责尺寸、交互、高亮、驻守遮罩和测试标识。所有 SVG `defs` ID 使用 React `useId()` 生成，避免同名手牌、同名战场单位、多个卡背同时存在时产生冲突。手牌使用 `Card` 数据，战场使用 `CardInstance` 数据，数值读取统一采用 `instance ?? card` 的回退逻辑。

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, SVG

**Design Reference:** `tmp/card_design/components/HearthstoneCard.tsx`

**Corrected Baseline:**
- 当前 `CardComponent` 仍是矩形 HTML 结构，不是 SVG。
- 当前 `CardComponent.test.tsx` 有 19 个测试，不是 17 个。
- 当前项目没有卡图 URL / 资源字段，也没有图片加载链路；本次不创建未接线的 `ImageWithFallback`。
- 当前 `HandZone` 把手牌强转为 `CardInstance` 传给 `CardComponent`，这是潜在 bug，新实现必须显式兼容“只有 `Card` 没有 `instance`”的路径。

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/client/src/components/board/CardArtwork.tsx` | 纯视觉 SVG 卡面与卡背 |
| Modify | `packages/client/src/components/board/CardComponent.tsx` | 组合视觉层与游戏状态层，提供 size 变体 |
| Modify | `packages/client/src/components/board/CardComponent.test.tsx` | 锁定测试契约与新增回归测试 |
| Modify | `packages/client/src/components/board/HandZone.tsx` | 使用新的 `size="hand"` 并移除重复卡背实现 |
| Modify | `packages/client/src/components/board/Battlefield.tsx` | 显式使用 `size="battlefield"` |
| Modify | `packages/client/src/index.css` | 仅在缺 token 时补充最少变量 |

---

## Design Decisions

### D1: 保留测试契约，而不是移除它

以下 `data-testid` 继续保留，避免把测试退化成对 `textContent` 的模糊断言：

- `card`
- `card-back`
- `card-cost`
- `card-art`
- `card-type-badge`
- `card-atk`
- `card-hp`
- `garrison-overlay`

这些标识可以挂在 SVG 的 `<g>` / `<text>` / 外层容器上，不要求必须是 HTML `div`。

### D2: SVG `defs` 必须使用实例级唯一 ID

不能使用 `instanceId ?? card.id`，因为手里可能同时有两张相同 `card.id` 的牌；卡背也不能用固定 `width-height` 作为 ID。统一使用 `useId()` 生成实例级前缀，并在组件内清洗为可用于 SVG 的字符串。

### D3: 数值来源必须兼容手牌与战场两种数据形态

`CardComponent` 内部统一采用：

```ts
const attack = instance?.currentAttack ?? card.attack ?? 0;
const health = instance?.currentHealth ?? card.health ?? 0;
const maxHealth = instance?.currentMaxHealth ?? card.health ?? 0;
```

这既支持战场单位，也支持手牌中的随从/将领牌。

### D4: 本次不接入卡图资源管线

当前仓库没有 `artUrl` / `imageUrl` / 静态素材约定。本次卡图区域使用 SVG 椭圆画框 + 文明主题渐变 + 类型图标兜底，不创建未消费的 `ImageWithFallback`。如果未来落地图像资源，再单独规划资源字段与加载失败处理。

### D5: 支持全部卡牌类型，不倒退现有内容范围

视觉映射至少覆盖：

- `MINION`
- `GENERAL`
- `STRATAGEM`
- `SORCERY`
- `EMPEROR`（仅 detail / 特殊场景兼容，不作为普通战场牌）

关键词映射必须继续兼容当前 shared 枚举，包括 `ASSASSIN` 和 `STEALTH_KILL`。

### D6: 尺寸策略

| 场景 | 尺寸 | 说明 |
|------|------|------|
| `hand` | `90×130` | 与现有扇形手牌布局兼容 |
| `battlefield` | `90×130` | 与现有战场布局兼容 |
| `detail` | `288×420` | 保留完整设计尺寸，当前无消费者但作为后续扩展点 |

`hand` / `battlefield` 小尺寸下不展示完整描述羊皮纸，只保留名称、费用、类型与攻击/血量等关键元素；`detail` 才显示完整描述区。

---

## Task 1: 先补回归测试，锁定正确契约

**Files:**
- Modify: `packages/client/src/components/board/CardComponent.test.tsx`

- [ ] **Step 1: 为“只有 Card 没有 instance 的手牌路径”补测试**

新增测试覆盖：

1. `MINION` 手牌在未传 `instance` 时仍渲染 `card-atk` / `card-hp`
2. `GENERAL` 也走同样的数值回退逻辑

- [ ] **Step 2: 为 SVG 唯一 ID 回归补测试**

渲染两张相同 `card.id` 的卡，断言内部 `defs` 生成的关键 ID 不重复。

- [ ] **Step 3: 为卡背唯一 ID 补测试**

渲染两张隐藏牌，断言两个 `card-back` 内使用的 SVG `defs` ID 不重复。

- [ ] **Step 4: 为新增类型覆盖补测试**

至少新增：

1. `STRATAGEM` 渲染 `card-type-badge`
2. `SORCERY` 渲染 `card-type-badge`
3. `SPELL` 不再作为真实类型依赖；若仍保留兼容映射，应在测试中注明是兼容旧用例而非游戏真实类型

- [ ] **Step 5: 运行单测，确认先红灯**

Run: `pnpm --filter @king-card/client test -- CardComponent.test.tsx`

Expected: 新增测试先失败，且失败原因与唯一 ID / 数值回退 / 新类型缺失一致。

---

## Task 2: 创建 `CardArtwork`，承接 SVG 视觉层

**Files:**
- Create: `packages/client/src/components/board/CardArtwork.tsx`

- [ ] **Step 1: 提供正面卡牌 SVG**

`CardArtwork` 负责：

1. 异形卡体与金色边框
2. 椭圆画框
3. 六边形费用水晶
4. 名称横幅
5. 攻击/血量徽章
6. 小尺寸与 detail 尺寸的内容裁剪

- [ ] **Step 2: 提供卡背 SVG**

在同文件内导出 `CardBackArtwork` 或等价组件，统一卡背视觉，替代 `HandZone` 中的 `OpponentCardBack` 重复实现。

- [ ] **Step 3: 保留测试锚点**

SVG 内需保留 `card-cost` / `card-art` / `card-type-badge` / `card-atk` / `card-hp` 对应的 `data-testid`。

- [ ] **Step 4: 仅使用当前已有设计 token**

优先复用现有 CSS 变量；如果必须新增 token，只补最少变量到 `index.css`，不要引入整套新 token 系统。

---

## Task 3: 重构 `CardComponent`

**Files:**
- Modify: `packages/client/src/components/board/CardComponent.tsx`

- [ ] **Step 1: 引入 `size` 变体与 `useId()`**

新增 `size: 'hand' | 'battlefield' | 'detail'`，默认保持 `battlefield`。

- [ ] **Step 2: 用 `CardArtwork` / `CardBackArtwork` 替换 HTML 结构**

但外层交互逻辑保持不变：

1. `selected`
2. `actionable`
3. `validTarget`
4. `animationClass`
5. `garrison-overlay`

- [ ] **Step 3: 修复手牌数值回退**

彻底移除“有 `instance` 就只读 `instance`”的假设，统一改为 `instance ?? card` 回退逻辑。

- [ ] **Step 4: 支持全部真实卡牌类型**

视觉映射补齐 `STRATAGEM` / `SORCERY`，并兼容 `STEALTH_KILL` 关键词文本。

- [ ] **Step 5: 运行单测，确认转绿**

Run: `pnpm --filter @king-card/client test -- CardComponent.test.tsx`

Expected: `CardComponent.test.tsx` 全部通过。

---

## Task 4: 更新消费者组件

**Files:**
- Modify: `packages/client/src/components/board/HandZone.tsx`
- Modify: `packages/client/src/components/board/Battlefield.tsx`

- [ ] **Step 1: 更新 `HandZone`**

1. 玩家手牌传 `size="hand"`
2. 不再把手牌强转为 `CardInstance`
3. 对手手牌改用 `<CardComponent isHidden size="hand" />`
4. 删除 `OpponentCardBack`

- [ ] **Step 2: 更新 `Battlefield`**

战场卡牌显式传 `size="battlefield"`，让尺寸契约清晰可见。

- [ ] **Step 3: 运行相关测试**

Run: `pnpm --filter @king-card/client test -- HandZone.test.tsx Battlefield.test.tsx CardComponent.test.tsx`

Expected: 三组测试全部通过。

---

## Task 5: 全量验证与视觉回归

**Files:**
- Possibly `packages/client/src/index.css`
- Possibly `packages/client/src/components/board/CardArtwork.tsx`

- [ ] **Step 1: 运行 client 全量测试**

Run: `pnpm --filter @king-card/client test`

Expected: client 测试全绿。

- [ ] **Step 2: 运行全仓构建**

Run: `pnpm build`

Expected: 全仓构建通过。

- [ ] **Step 3: 手动视觉核查**

Run: `pnpm dev:all`

检查：

1. 手牌 hover / 拖拽未退化
2. 战场 7 个单位排列未爆版
3. 对手手牌显示统一 SVG 卡背
4. 绿色可行动高亮 / 红色目标高亮 / 蓝色驻守遮罩仍正常
5. 同名卡重复出现时无 SVG 渐变串线

---

## Self-Review

### Coverage

| Requirement | Covered By |
|-------------|------------|
| 华丽 SVG 卡面 | Task 2 |
| 保留交互状态 | Task 3 |
| 保留测试契约 | Task 1, 2, 3 |
| 修复手牌 `Card` / 战场 `CardInstance` 差异 | Task 1, 3, 4 |
| 删除未接线图片兜底组件 | D4 |
| 修复重复卡 ID 的 SVG 冲突 | Task 1, 3 |
| 统一卡背实现 | Task 2, 4 |
| 不破坏手牌/战场布局 | D6, Task 4, Task 5 |

### Known Trade-offs

- 本次不接真实卡图资源，只做可扩展的画框和占位视觉。
- 小尺寸卡面优先可读性，不强行塞入完整描述文案。
- `detail` 尺寸本次主要作为结构预留，当前 UI 未直接消费。

---

## Execution Handoff

这份计划已修正以下问题：

1. 移除了未接线的 `ImageWithFallback` 任务
2. 修正了 SVG `defs` 唯一 ID 方案
3. 把“手牌是 `Card`、战场是 `CardInstance`”写进实现要求与测试要求
4. 修复了“要保留 data-testid”与“移除 data-testid”之间的自相矛盾
5. 将测试顺序调整为先红后绿的 TDD 执行方式