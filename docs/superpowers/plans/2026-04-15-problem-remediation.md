# Problem.md 交互与稳定性修复计划

> **For agentic workers:** Use this plan as the execution checklist. Keep scope focused on `docs/problem.md` and the attached code review findings. Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** 修复当前试玩中暴露的 5 个核心交互/布局问题，并核实附带 code review 报告中的问题是否属实；对属实项补上实现与回归测试。

**Architecture:** 先做引擎与服务端核查，避免前端交互建立在错误状态之上；随后按“输入交互 → 反馈高亮/箭头 → 布局动画”顺序改造客户端，最后统一做联调验证。

**Tech Stack:** TypeScript, React 19, Zustand, Socket.IO, Vitest, Vite

**Inputs:** `docs/problem.md`, 当前 `packages/client`、`packages/core`、`packages/server` 实现

---

## Task 1: 核实 code review 报告并补齐必要修复

**目标:** 区分属实问题与已修复/误报问题，只改必要内容。

**Files:**
- Inspect: `packages/core/src/engine/game-loop.ts`
- Inspect: `packages/server/src/socketHandler.ts`
- Inspect: `packages/core/src/cards/effects/execute-card-effects.ts`
- Inspect: 相关测试文件

- [x] 检查 `usedGeneralSkills` 是否在回合开始时重置；若未重置，则在回合切换逻辑中修复并补回归测试。
- [x] 检查 `socketHandler` 是否缺少当前行动玩家的前置校验；若缺失，则在服务端入口提前拒绝非法 action 并保留引擎兜底。
- [x] 检查 `buffCounter` 是否存在模块级全局污染；若存在测试隔离风险，则导出 reset 能力并在测试中使用。
- [x] 评估 fixture 重复、`as any`、线性查找、`.worktrees` 重复测例风险是否需要本轮处理；只记录真实风险，不盲改。

**核查结论:**
- `usedGeneralSkills` 报告属实，已在回合开始时重置并补测试。
- `socketHandler` 报告属实，已增加服务端当前回合玩家前置校验并补测试。
- `buffCounter` 报告属实，已导出 `resetBuffCounter()` 并在测试中使用。
- fixture 重复、`GameBoard.tsx` 中 `as any`、`findCardById` 线性搜索属实但不阻塞本轮交互修复，暂不扩大改动面。
- `.worktrees` 重复测例风险通过删除残留 `review-remediation` worktree 实际消除。

## Task 2: 改成拖拽式出牌

**目标:** 手牌出牌从点击触发改为“拖出手牌区后松手打出，拖回手牌区取消”。

**Files:**
- Modify: `packages/client/src/components/board/HandZone.tsx`
- Modify: `packages/client/src/components/board/CardComponent.tsx`
- Modify: `packages/client/src/components/board/GameBoard.tsx`
- Modify: `packages/client/src/stores/gameStore.ts`

- [x] 梳理当前出牌交互入口与合法行动数据来源。
- [x] 为手牌卡实现拖拽状态、指针偏移、释放判定。
- [x] 释放到有效出牌区时触发出牌；释放回手牌区或无效区域时取消，不扣费用。
- [x] 保持移动端/桌面端事件模型一致，至少保证鼠标流程稳定。

## Task 3: 改造战场动态布局

**目标:** 战场随从不再占用固定槽位，而是围绕中轴动态重排。

**Files:**
- Modify: `packages/client/src/components/board/Battlefield.tsx`
- Modify: `packages/client/src/components/board/GameBoard.tsx`
- Modify: 相关样式文件

- [x] 抽离战场卡牌位置计算函数，按卡牌数量计算居中布局。
- [x] 支持左右两侧战场镜像排列，并在数量变化时平滑过渡。
- [x] 确保攻击、选中、悬浮态不会破坏布局计算。

## Task 4: 实现指向性箭头与目标高亮

**目标:** 攻击/指定目标时，显示实时箭头，并在可攻击目标上显示红色轮廓。

**Files:**
- Modify: `packages/client/src/components/board/GameBoard.tsx`
- Modify: `packages/client/src/components/board/CardComponent.tsx`
- Modify: `packages/client/src/components/board/HeroPanel.tsx`
- Modify: `packages/client/src/components/board/MinisterPanel.tsx`
- Create or Modify: 箭头渲染组件

- [x] 找出现有攻击与目标选择状态机。
- [x] 实现从攻击源到指针位置的实时箭头渲染。
- [x] 当指针悬浮可攻击目标时显示红色轮廓；不可攻击目标不高亮。
- [x] 将相同交互复用于英雄、随从、技能指向目标。

## Task 5: 强化可交互状态的视觉反馈

**目标:** 手牌可打出卡、可攻击随从显示绿色光环，可被当前箭头命中的目标显示红色光环。

**Files:**
- Modify: `packages/client/src/components/board/CardComponent.tsx`
- Modify: `packages/client/src/components/board/HeroPanel.tsx`
- Modify: `packages/client/src/index.css`

- [x] 基于 `validActions` 推导“可打出”“可攻击”“可作为当前目标”三类状态。
- [x] 为手牌和战场单位加入一致的绿色外发光视觉。
- [x] 为当前命中的有效目标加入红色轮廓视觉，并避免与已有选中态冲突。

## Task 6: 优化手牌扇形布局

**目标:** 手牌较少时更紧凑，整体更接近炉石式扇形分布。

**Files:**
- Modify: `packages/client/src/utils/fanLayout.ts`
- Modify: `packages/client/src/components/board/HandZone.tsx`

- [x] 检查当前扇形参数为何导致低手牌数时过度分散。
- [x] 重写角度、半径、水平间距策略，使 1-6 张手牌明显更紧凑。
- [x] 保证高张数时不重叠到不可读，并兼容拖拽抬起状态。

## Task 7: 回归测试与联调验证

**目标:** 保证新交互不会破坏核心引擎与现有 UI 流程。

**Files:**
- Modify/Create: 相关单元测试与组件测试

- [x] 为 code review 属实项补测试。
- [x] 为关键交互状态机补测试，至少覆盖拖拽取消、拖拽成功、目标高亮判定。
- [x] 运行受影响包测试与必要的构建/手动验证。
