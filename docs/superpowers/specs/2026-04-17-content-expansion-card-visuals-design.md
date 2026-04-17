# Spec B — 内容扩展与卡牌视觉重制

**Date**: 2026-04-17
**Status**: Approved for planning

## Goal

实现设计文档中规定的 8 个文明专属关键词机制、补充新效果类型、并将卡牌视觉从占位符升级为增强型 SVG。

## Scope

### 1. 文明专属关键词实现

设计文档 (detailed_design.md) 规定每个文明有 2 个专属关键词。当前仅中国的 GARRISON 和 MOBILIZE 已实现。需补齐以下 8 个：

| 文明 | 关键词 | 机制描述 |
|------|--------|----------|
| **日本** | ASSASSIN (忍杀) | 攻击并杀死一个随从后，可以对英雄发动一次额外攻击 |
| **日本** | COMBO_STRIKE (连斩) | 每回合攻击杀死目标后，可以继续攻击（最多 3 次） |
| **美国** | R_AND_D (研发) | 打出法术牌后，随机将一张同文明法术加入手牌 |
| **美国** | MOBILIZE_ORDER (动员令) | 当友方随从数量 ≥3 时，所有友方随从获得 +1 攻击力 |
| **英国** | BLOCKADE (封锁) | 该随从存活时，对手每回合少获得 1 点能量 |
| **英国** | COLONY (殖民地) | 回合结束时，如果你控制 ≥3 个不同费用的随从，抽一张牌 |
| **德国** | IRON_FIST (铁腕) | 当你的英雄生命值 ≤15 时，该随从获得 +2/+2 |
| **德国** | BLITZKRIEG (闪电战) | 该随从进入战场时，对随机一个敌方随从造成 2 点伤害 |

**实现方式：**
- 在 `packages/shared/src/types.ts` 的 `Keyword` 枚举中添加缺失的关键词
- 在 `packages/core/src/cards/effects/` 下为每个关键词创建 handler
- handler 注册到 `registry.ts`，遵循现有 `onPlay`/`onDeath`/`onAttack`/`onTurnStart`/`onTurnEnd` 生命周期
- 为每个关键词至少添加 2 张使用该关键词的卡牌到对应文明

**修复 COMBO_STRIKE 归属：**
- 从中国的霍去病将军移除 COMBO_STRIKE，替换为 CHARGE（已有）
- 将 COMBO_STRIKE 添加到日本的 2+ 张卡牌上

### 2. 新效果类型

**Discover (发现)**
- 从卡池中随机展示 3 张卡牌，玩家选择 1 张加入手牌
- 需要 client-server 交互：服务端发送 3 个选项，客户端展示选择 UI，玩家选择后回传
- 添加 `DISCOVER` 到 `EffectType` 枚举
- 在 `execute-card-effects.ts` 中添加 DISCOVER 分支

**Freeze (冻结)**
- 使目标随从下回合无法攻击
- 在 `CardInstance` 上添加 `frozenTurns: number` 字段
- 回合开始时递减，为 0 时恢复
- 添加 `FREEZE` 到 `EffectType`

**Sacrifice (献祭)**
- 消灭己方最弱随从（最低攻击力），获得增益效果
- 添加 `SACRIFICE` 到 `EffectType`
- 在 `execute-card-effects.ts` 中实现目标选择逻辑

**Cost Reduction (费用减免)**
- 使下一张打出的牌费用降低 N 点
- 在 `Player` 上添加 `costReduction: number` 字段
- 出牌时应用减免并重置

**更多亡语卡牌**
- 当前仅兵马俑 (BINGMAYONG) 有亡语
- 为每个文明至少添加 1-2 张亡语随从，使用不同的 ON_DEATH 效果（召唤、伤害、抽牌、buff）

### 3. 卡牌视觉重制

当前卡牌美术为占位符：单个汉字（术/兵/将/帝/计）在椭圆内。升级为增强型 SVG：

**卡牌类型视觉差异化：**

| 卡牌类型 | 背景纹理 | 边框风格 | 标志 |
|----------|----------|----------|------|
| EMPEROR (帝) | 深紫渐变 + 龙纹/皇冠纹理 | 金色双层边框 | 皇冠图标 |
| GENERAL (将) | 深红渐变 + 盔甲纹理 | 铜色浮雕边框 | 剑盾图标 |
| MINION (兵) | 深蓝渐变 + 盾牌纹理 | 银色简洁边框 | — |
| SORCERY (术) | 深紫渐变 + 魔法阵纹理 | 紫色发光边框 | 魔法符号 |
| STRATAGEM (计) | 深绿渐变 + 竹简纹理 | 墨绿编织边框 | 卷轴图标 |

**文明标志系统：**
- 每个文明有独特的背景色调和角标图案
- 中国：红/金色调，龙纹角标
- 日本：红/黑色调，樱花角标
- 美国：蓝/白色调，星纹角标
- 英国：蓝/金色调，狮纹角标
- 德国：黑/红/金色调，铁十字角标

**关键词图标：**
- 常用关键词（TAUNT、RUSH、CHARGE 等）添加小图标显示在卡牌上
- 图标为简约 SVG，不超过 16x16px

**实现约束：**
- 所有美术通过 `CardArtwork.tsx` 程序化 SVG 生成，不使用外部图片资源
- 保持卡牌整体尺寸不变（120x172px）
- 确保费用/攻击/生命值数字清晰可读
- 文明色调可通过 CSS 变量或 Tailwind 主题统一管理

## Architecture Direction

- 关键词 handler 遵循现有 effect pipeline 架构（声明式 CardEffect + 关键词 handler + StateMutator）
- 新效果类型通过 `execute-card-effects.ts` 的 switch-case 扩展
- Discover 需要新的 client-server 交互协议（socket event）
- 卡牌视觉改动限于 `CardArtwork.tsx`，不影响 `CardComponent.tsx` 的逻辑

## Testing

- 每个新关键词 handler 需要独立测试文件
- 每个新效果类型需要测试覆盖（正常路径 + 边界情况）
- Discover 的 client-server 交互需要集成测试
- 卡牌视觉变更通过 snapshot 测试或人工检查确认
