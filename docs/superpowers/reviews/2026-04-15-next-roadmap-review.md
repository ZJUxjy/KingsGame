# Next Roadmap Review Report (2026-04-15)

Branch: `feat/next-roadmap`
Commits reviewed: c5ed6cd, 1fb1ebf, 100da1d, 49a5d51, b23a29a
Tests: 407 passing | Build: clean

---

## 1. Problem-Remediation 收尾 (c5ed6cd) — 合格

12 个测试覆盖拖拽取消/成功、目标高亮、pointercancel。

**小问题（可延后）：**
- pointercancel 测试表面化 — 卡牌释放在手牌区内，无论 pointercancel 还是 pointerup 都不出牌，测试无法区分
- 缺少拖拽移动阈值（6px）的边界测试

---

## 2. Emperor-Specific Ministers (1fb1ebf) — 合格（需修）

5 个新谋士，3 个帝王专属池，56 测试通过。

### 需修复：

**BUG-EM-1: WEIZHI（魏徵）描述-效果不一致**
- 文件：`packages/core/src/cards/definitions/china-ministers.ts` 约 140-148 行
- 描述："抽一张牌并获得1点护甲"
- 实际效果：只有 `type: 'DRAW', params: { count: 1 }`
- 缺少：`GAIN_ARMOR` 效果

**BUG-EM-2: FANGXUANLING（房玄龄）描述-效果不一致**
- 文件：`packages/core/src/cards/definitions/china-ministers.ts` 约 159-167 行
- 描述："恢复2点生命值，获得2点护甲"
- 实际效果：只有 `type: 'GAIN_ARMOR', params: { amount: 2 }`
- 缺少：`HEAL` 效果

**TODO-EM-3: emperor-switch.test.ts 未更新**
- 文件：`packages/core/test/engine/emperor-switch.test.ts` 第 122 行
- 仍用旧的 `[LISI, HANXIN, XIAOHE, CHENPING]` 共享池，应改为 per-emperor 池

---

## 3. Civilization Expansion (100da1d) — 数据层完成，运行时未集成

24 个卡牌文件，84 测试通过。但 4 个关键集成缺口使新文明不可用。

### 需修复（关键）：

**BUG-CIV-1: findCardById() 只搜索中国卡池**
- 文件：`packages/core/src/cards/effects/execute-card-effects.ts` 第 18-20 行
- 当前：`return CHINA_ALL_CARDS.find(...)`
- 修复：需搜索所有文明的卡牌（创建 `ALL_CARDS` 聚合数组或遍历所有文明）

**BUG-CIV-2: Core 包只导出中国数据**
- 文件：`packages/core/src/index.ts` 第 14-20 行
- 缺少导出：`JAPAN_ALL_CARDS`, `USA_ALL_CARDS`, `UK_ALL_CARDS`, `GERMANY_ALL_CARDS`
- 缺少导出：`JAPAN_EMPEROR_DATA_LIST`, `USA_EMPEROR_DATA_LIST`, `UK_EMPEROR_DATA_LIST`, `GERMANY_EMPEROR_DATA_LIST`
- 建议新增：`ALL_CARDS`（全部聚合）、`ALL_EMPEROR_DATA_LIST`（全部聚合）

**BUG-CIV-3: 牌组构建器硬编码中国卡牌**
- 文件：`packages/server/src/deckBuilder.ts` 第 1、7 行
- 当前：`import { CHINA_ALL_CARDS }` 和 `CHINA_ALL_CARDS.filter(...)`
- 修复：接受参数化的卡池或使用 `ALL_CARDS`

**BUG-CIV-4: GameManager 硬编码中国帝王**
- 文件：`packages/server/src/gameManager.ts` 第 1、19、21、77、78 行
- 当前：`import { CHINA_EMPEROR_DATA_LIST }`
- 修复：支持选择不同文明的帝王数据列表

### 需修复（次要）：

**BUG-CIV-5: 日本卡牌描述混用中日文**
- 文件：`packages/core/src/cards/definitions/japan-minions.ts`
- 例如第 28 行 `'冲锋。隠密なる刺客。'`（中文关键词 + 日文描述）
- 建议统一为一种语言

**TODO-CIV-6: 缺少 `ALL_CARDS` / `ALL_EMPEROR_DATA_LIST` 全局聚合**
- 文件：`packages/core/src/cards/definitions/index.ts`
- 需新增聚合导出，供 findCardById 和 deckBuilder 使用

---

## 4. Animation & Audio (49a5d51) — 部分完成

### 需修复（重要）：

**BUG-AA-1: attack 动画从未触发**
- 文件：`packages/client/src/hooks/useAnimations.ts`
- CSS 有 `animate-attack`，但 hook 从未产出该 class
- 原因：攻击表现为目标 HP 变化（触发 damage），攻击者本身无状态变化
- 修复思路：需要从 state diff 中检测"谁发起了攻击"（可能需要额外的 action metadata）

**BUG-AA-2: death 动画被跳过**
- 文件：`packages/client/src/hooks/useAnimations.ts` 约 53-55 行
- 注释明确说"skip death animation on removal since the element is gone"
- 修复思路：需要一个"pending removal"队列，延迟移除已死亡的随从

**BUG-AA-3: 无音频资源文件**
- `audioService` 引用 `/audio/{effect}.mp3`，但 `packages/client/public/` 不存在
- 所有 `play()` 调用静默失败
- 修复：创建 public/audio 目录并放入实际音频文件（至少放占位文件）

**BUG-AA-4: 每次播放创建新 Audio 元素无复用**
- 文件：`packages/client/src/services/audioService.ts` 第 38 行
- 每次 `play()` 都 `new Audio()`，无池化/缓存/清理
- 快速游戏中会累积大量孤立 Audio 元素

**CLEANUP-AA-5: 无关文件混入 commit**
- `docs/research/figma-mcp-integration.md` 与动画音效无关，不应在此 commit

---

## 5. PvP Mode (b23a29a) — 致命 Bug，不可上线

### 需修复（致命）：

**BUG-PVP-1: 玩家 1 永远收不到 game:joined**
- 文件：`packages/server/src/socketHandler.ts` 约 204-215 行
- 玩家 1 创建等待房间时收到 `game:pvpWaiting`（不是 `game:joined`）
- 玩家 2 加入时，玩家 1 收到 `game:pvpStart`（不是 `game:joined`）
- 结果：玩家 1 客户端 store 中 `gameId` 和 `playerIndex` 始终为 `null`
- 影响：`isMyTurn()` 永远返回 `false`，玩家 1 客户端完全不可用
- 修复：在 `game:pvpStart` 处理中也设置 `gameId` 和 `playerIndex`，或给玩家 1 也发 `game:joined`

**BUG-PVP-2: GameSession.engine 类型不安全**
- 文件：`packages/server/src/gameManager.ts` 第 50 行
- `engine: null as unknown as GameEngine` 强转绕过类型检查
- 等待状态的 session 访问 engine 会运行时崩溃
- 修复：将 `engine` 类型改为 `GameEngine | null`，在访问处强制 null check

**BUG-PVP-3: 内存泄漏 — destroyGame() 从未被调用**
- 文件：`packages/server/src/socketHandler.ts` 第 475-493、111-134 行
- disconnect handler 和 subscribeGameOver 都设置 `state = 'finished'` 但不移除 session
- 所有游戏 session 永久留在 `games` Map 中
- 修复：在 `state = 'finished'` 后调用 `destroyGame(gameId)` 或 `this.games.delete(gameId)`

### 需修复（重要）：

**BUG-PVP-4: initializePvpEngine 无边界检查**
- 文件：`packages/server/src/gameManager.ts` 第 77-78 行
- 直接访问 `CHINA_EMPEROR_DATA_LIST[session.playerEmperorIndices[1]]` 无验证
- 如果索引为 -1（默认值），会访问 undefined 导致崩溃

**BUG-PVP-5: 无应用层取消事件**
- PvpWaiting 取消只靠 TCP 断开
- 修复：添加 `game:pvpCancel` 服务端事件

**TODO-PVP-6: 客户端测试未创建**
- 计划要求 `packages/client/src/hooks/useGameSocket.test.tsx`，未实现

---

## 优先级排序

| 优先级 | 编号 | 描述 |
|--------|------|------|
| P0 致命 | BUG-PVP-1 | 玩家 1 客户端不可用 |
| P0 致命 | BUG-PVP-3 | 内存泄漏 |
| P0 致命 | BUG-PVP-2 | engine 类型不安全 |
| P1 关键 | BUG-CIV-1 | findCardById 只搜中国 |
| P1 关键 | BUG-CIV-2 | Core 不导出新文明 |
| P1 关键 | BUG-CIV-3 | deckBuilder 硬编码 |
| P1 关键 | BUG-CIV-4 | GameManager 硬编码 |
| P2 重要 | BUG-EM-1/2 | 谋士描述-效果不一致 |
| P2 重要 | BUG-AA-1/2 | attack/death 动画未触发 |
| P2 重要 | BUG-AA-3 | 无音频资源 |
| P2 重要 | BUG-AA-4 | Audio 无复用 |
| P3 次要 | BUG-CIV-5 | 日本描述语言混乱 |
| P3 次要 | BUG-PVP-4/5 | 边界检查/取消事件 |
| P3 次要 | TODO-* | 缺失测试 |
