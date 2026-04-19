# 帝王牌 CCG 深化 Phase 1 设计

**Date**: 2026-04-18
**Status**: Approved for planning

## Goal

在不改变现有 CCG 基础架构的前提下，给"帝王牌"加 8 个炉石风格的新关键字 + 配套新卡，让对战体验从"数值堆砌"扩展到"机制博弈"，同时为后续可能的 PvP 深度玩法（奥秘心理战、抉择即时决策）打好底层。

## Scope Split

整个 Phase 1 拆成 4 个独立可执行子项目，每个都能独立合并、独立见效，支持中途暂停去做别的事：

| Milestone | 范围 | 主要工作 | 工作量 |
|-----------|------|---------|--------|
| **M1 调味料五件套** | 圣盾 / 剧毒 / 风怒 / 吸血 / 重生 | 5 个 effect handler + ~15 张样卡 + 单元测试 | ~1 周 |
| **M2 选项类机制** | 抉择 / 发现 + 共享"卡牌选择器" modal | 2 个 handler + 1 个 client UI 组件 + ~8 张样卡 | ~1 周 |
| **M3 奥秘机制** | 奥秘 + 隐藏卡槽 UI + 事件触发系统 | 1 个 handler + 隐藏卡槽（client + server 协议） + ~6 张奥秘卡 | ~1 周 |
| **M4 数量补强** | 不带新机制、专门补现有套牌缺口的 30-50 张普通卡 | 等 M1-M3 落地后看哪个文明/费用段薄弱再补 | ~3-5 天 |

**总规模**：~70-95 张新卡 + 8 个关键字 + 2 套新 UI（modal + 隐藏卡槽）。

## Priority Order

按 1→2→3→4 顺序执行。理由：

- **M1 优先**：每个关键字都是 1 个 handler 文件、不动任何 UI、风险最低，是验证整套扩展方法论的最佳起点。
- **M2 次之**：抉择和发现共用"从 N 选 1"卡牌选择器 modal，2 个关键字共担一套 UI 工作量。
- **M3 放第三**：奥秘需要新的隐藏卡槽 UI、ON_PLAY/ON_ATTACK 等事件触发系统，且在 PvE（AI 对手）下意义有限，必须等 M1+M2 让对战节奏先因调味料丰富起来再上。
- **M4 最后**：数量补强等 M1-M3 都跑过 1-2 周对局后再开，靠真实对局数据决定要补哪些卡，避免无的放矢。

## Architecture Direction

### Effect Handler Pattern Reuse

所有新关键字严格沿用 `packages/core/src/cards/effects/<keyword>.ts` 的现有模式：每个关键字 = 1 个 handler 文件 + `Keyword` 枚举追加 1 行 + `registry.ts` 自动注册。新关键字与既有关键字（亡语、嘲讽、突袭等）的交互必须显式写测试覆盖（例如：剧毒 + 嘲讽必死、圣盾 + 风怒第一击免疫第二击生效）。

### UI Layer Separation

M2 / M3 引入新 UI 组件时，规则层（`core`）只发出"等待选择"的状态，UI 层（`client`）负责弹 modal / 渲染卡槽 / 收集玩家输入。绝不把 UI 决策权下放给 `core`，避免破坏 server-authoritative 原则。

### Client-Side Choice Resolution Protocol

抉择 / 发现 / 奥秘三个机制都要让玩家做选择。统一走"`core` 提交 pending action → `server` 广播 → `client` 弹 UI → `client` 提交决定 → `server` 验证后写状态"的回路，不为每个机制单独发明协议。

### Naming Convention

8 个新关键字中文名沿用炉石标准译法（圣盾、剧毒、风怒、吸血、重生、抉择、奥秘、发现）。理由：项目现有关键字（战吼 / 亡语 / 突袭 / 嘲讽 / 冲锋）就是炉石标准译法，新关键字保持一致让有炉石经验的玩家零学习成本。英文 key 用 `DIVINE_SHIELD / POISONOUS / WINDFURY / LIFESTEAL / REBORN / CHOOSE_ONE / SECRET / DISCOVER`。

## Card Design Principles

### Distribution Across Civilizations

新卡进入"通用池"（不动 EmperorData 的 boundGenerals/boundSorceries，保持现有帝王特色稳定），玩家在 deck builder 里自由挑选。每个文明在每个 milestone 至少分到 1-2 张新卡，避免"某文明独享、其余零受益"。

### Keyword–Civilization Affinity

让关键字与现有文明特色自然配对，避免"圣盾忍者"这种违和感：

| 关键字 | 主推文明 | 文化锚点 |
|--------|---------|---------|
| 剧毒 | 日本 | 忍者刺客、毒针 |
| 圣盾 | 英国 | 皇家骑士、龙骑兵 |
| 风怒 | 德国 | 闪电战、装甲突进 |
| 吸血 | 中国 | 蛊术、五毒 |
| 重生 | 中立 / 日本 | 不死战士、武士道 |
| 抉择 | 美国 | 民主决策、选择权 |
| 发现 | 中国 | 智囊团、研究 |
| 奥秘 | 英国 | 谍报、暗杀计 |

每个关键字仍然在其它文明里出现 1-2 张，但主力放在锚点文明。

## Numerical Balance Policy

### Keyword Cost Floors

加 8 个关键字会显著破坏现有数值曲线（剧毒 1/1 比 1/1 普通随从强太多）。强制以下"关键字 × 最低费用 × 攻击/血量"上限表，新卡严格按表设计：

| 关键字 | 最低费用 | 同费下攻血上限 | 备注 |
|--------|---------|---------------|------|
| 圣盾 | 1 | (1, 2) at 1 费 / (2, 3) at 2 费 | 不能 1 费 2/2 圣盾 |
| 剧毒 | 2 | (1, 2) at 2 费 / (2, 3) at 3 费 | 不能 1 费剧毒 |
| 风怒 | 4 | (3, 3) at 4 费 / (4, 4) at 5 费 | 因为攻击翻倍 |
| 吸血 | 2 | (2, 2) at 2 费 / (3, 3) at 3 费 | 续航强 |
| 重生 | 3 | (2, 3) at 3 费 / (3, 4) at 4 费 | 等同获得"两条命" |
| 抉择 | 2 | 视抉择内容 | 两个抉择各自单独估值，取较强者再 +1 费 |
| 发现 | 2 | 视发现池强度 | 默认 +1 费 vs 直接抽 1 牌 |
| 奥秘 | 2 | 不带身材 | 奥秘卡是法术，没有身材 |

### Validation Approach

数值不靠"先做完再回调"，而是**写卡时即查表**。每张新卡的 PR 描述里必须列出"我用了关键字 X，按表 X 应该最低 N 费、最大 (A, H)，本卡 N=__、(A,H)=__"，方便 review 时一眼看到越界。

### Soft Watch Period

M1+M2+M3 全落地后，留 1 周对战观察期再开 M4，看实际对局是否需要数值回调，再决定要不要补的方向。

## Testing Strategy

| 层 | 内容 | 量 |
|----|------|----|
| **Unit (core)** | 每个 handler 至少 3 个测试：基础生效 / 与某既有关键字交互 / 边界（叠加/失效） | 8 关键字 × 3 ≈ 24 个 |
| **Card integration (core)** | 每张**带效果**的新卡至少 1 个集成测试，确认效果在引擎中实际触发；M4 的 vanilla 数值卡只挂在现有 catalog 测试里集体扫一遍即可 | ~50-70 个 |
| **UI (client)** | M2 modal / M3 隐藏卡槽各 5-8 个 RTL 测试 | ~13-16 个 |
| **PvP protocol (server)** | M2/M3 的"等待玩家选择"回路在 PvP 下不阻塞对方时序 | M2/M3 各 1-2 个 |
| **奥秘特别要测** | 触发时机准确（每张奥秘只触发一次）、对手能看到"有奥秘"但看不见内容 | M3 内额外 4-5 个 |

## Out of Scope (Phase 1 不做)

- **新游戏模式**（roguelike 远征 / 战役关卡）—— 是 Phase 2 议题。
- **Tribal/Archetype 系统**（"骑兵流"、"水师流" 共享 tag）—— 第二轮 brainstorm 已主动放弃 B 路线。
- **过载（Overload）/ 沉睡（Dormant）/ 狂怒（Frenzy）等 5 个未入选关键字** —— 留待 Phase 2 视玩家反馈再考虑。
- **数值平衡的回调** —— 留到 M4 启动前 1 周观察期。
- **新美术资源** —— 沿用现有 SVG 卡牌渲染流水线，不引入图片资源。

## Deliverables

本轮 brainstorm 交付：
- 1 份 overview spec（本文档）

后续每个 milestone 启动前单独：
- 1 份 implementation plan（用 `superpowers:writing-plans` skill 生成）
- 实现 → 测试 → review → 合并 → 进入下一个 milestone

## Risks & Mitigations

| 风险 | 缓解 |
|------|------|
| 数值失衡 | "查表写卡 + PR 描述列出关键字-费用-身材"硬性流程，加 1 周观察期 |
| 关键字交互组合爆炸（圣盾+风怒+吸血叠在一张卡上） | 每张新卡最多 1 个关键字（少数 epic/legendary 例外，需在 PR 中说明） |
| 奥秘 PvE 下意义有限 | 接受现状（PvE 玩家把奥秘当"惊喜礼包"），不为 PvE 单独写"AI 假装上当"逻辑 |
| 抉择/发现的 modal UI 阻塞对方 PvP 时序 | M2 plan 里强制写一个"对方等待中"提示 + 选择超时 fallback |
| 实现到一半发现某关键字不适合（例如风怒和现有"驻守"机制冲突） | 接受方案是把那个关键字推迟到 Phase 2，不为兼容现有机制做大重构 |
