# Spec A — UI 质量与交互优化

**Date**: 2026-04-17
**Status**: Approved for planning

## Goal

提升客户端代码质量（拆分大文件、类型安全、性能优化）并完善拖拽交互体验（回弹动画、战场位置选择、落点指示）。

所有改动限于 `packages/client/src/components/board/` 及相关 hooks/utils，不涉及引擎或服务端逻辑。

## Scope

### 1. GameBoard.tsx 拆分

当前 GameBoard.tsx 有 717 行，承担了过多职责。拆分为：

**提取 `useTargeting()` hook (~150 行)**
- 箭头源计算（selectedAttacker / pendingSkillAction → anchor ID）
- 全局 pointermove 追踪 pointerPosition
- 全局 pointerup 处理（hoveredTarget → 执行攻击/技能）
- Escape 键取消
- hoveredTarget / selectedAttacker / pendingSkillAction 的 ref 同步

**提取 `useDerivedActions()` hook (~110 行)**
- 从 validActions 计算：validPlayIndices, validAttackerIds, validAttackTargetIds, validSkillTargetIds 等 8 个派生集合
- 纯函数逻辑，可独立测试

**合并 store selectors**
- 将 11 个独立 `useGameStore()` 调用替换为单个 shallow selector：
  ```ts
  const { gameState, validActions, locale, ... } = useGameStore(
    useShallow(s => ({ gameState: s.gameState, validActions: s.validActions, ... }))
  );
  ```

### 2. 类型安全

- `HandZone.tsx` line 7: `cards: any[]` → `cards: CardInstance[]`
- `Battlefield.tsx` line 4: `minions: any[]` → `minions: CardInstance[]`
- `Battlefield.tsx` line 38: `(minion: any)` → `(minion: CardInstance)`
- 导入类型来自 `@king-card/shared`

### 3. React.memo 与性能

- 用 `React.memo` 包裹 `CardComponent`、`Battlefield`、`HandZone`
- `CardComponent` 的 tooltip 从 hover mount/unmount 改为单个持久化容器 + 重新定位
- `HandZone` 的 `key={i}` 替换为 `key={card.instanceId}`

### 4. Error Boundary

- 在 `GameBoard` 外层包裹 `<ErrorBoundary>`，捕获子组件渲染错误
- 显示友好的错误信息和"重新加载"按钮，而非白屏

### 5. Bug 修复

**死亡随从排序 (GameBoard.tsx lines 512-514)**
- 当前死亡动画随从被 `[...me.battlefield, ...myDying]` 追加到末尾
- 修复：记录死亡随从原始位置，在死亡动画期间保持原位

**locale 读取 (GameBoard.tsx lines 294-295)**
- `useLocaleStore.getState()` 在 useEffect 内读取 → 改为使用已订阅的 `locale` 变量

**内联 style 覆盖 (HandZone.tsx lines 176-187)**
- `onMouseEnter`/`onMouseLeave` 直接操作 `el.style` 绕过 React → 改为 state-driven hover

### 6. 拖拽交互优化

**回弹动画**
- 拖拽取消时（释放位置低于阈值），用 CSS transition (300ms ease-out) 将卡牌动画回到扇形位置
- 回弹过程中 opacity: 0.6 表示"未打出"

**战场位置选择**
- 拖拽可打出的随从时，在战场现有随从之间显示发光的插入槽位
- 悬停在槽位上时高亮该位置，释放时将 `boardPosition` 传给服务端
- 未悬停任何槽位时默认放置在最右侧

**落点指示器**
- 拖拽超过手牌区上沿时，在战场区域显示半透明覆盖层提示"放下可打出"
- 覆盖层随拖拽状态淡入淡出

## Architecture Direction

- 所有拆分保持功能不变，测试先行（先确保现有测试通过，再重构）
- hooks 提取后 GameBoard.tsx 应降至 ~450 行以下
- 性能优化以 React DevTools Profiler 验证效果

## Testing

- 现有 25 个 client 测试必须继续通过
- 新增 `useTargeting` hook 单元测试
- 新增 `useDerivedActions` hook 单元测试
- 拖拽交互测试（通过 testing-library userEvent 或 pointer event 模拟）
