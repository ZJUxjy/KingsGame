# 帝王牌下一阶段 Roadmap Design

**Date**: 2026-04-15
**Status**: Approved for planning and execution

## Goal

把当前约 60-65% 完成度的原型，推进到“单文明内容更完整、核心效果闭环、后续可持续扩展”的状态，并把后续 5 条主线拆成独立可执行子项目。

## Scope Split

下一阶段拆成 5 个独立子项目：

1. 亡语效果落地
2. 帝王专属大臣池
3. 其余四个文明扩展
4. PvP 双人对战
5. 动画与音效接入

这些子项目共享同一产品方向，但工程依赖关系不同，不应塞进一份巨型实现计划。

## Priority Order

### 1. 亡语效果

优先级最高。原因：
- 当前是明确的机制空洞，且 `deathrattle.ts` 仍为空占位。
- 范围集中在 `core`，可先补强效果系统闭环。
- 能直接提升现有中国文明卡池的设计空间。

### 2. 帝王专属大臣池

优先级中高。原因：
- 当前 3 个帝王共用 4 个大臣，削弱了帝王切换与构筑差异。
- 主要集中在数据装配、模型创建、切帝王后的资源替换逻辑。

### 3. 其余四个文明扩展

优先级中高，但应放在机制闭环之后。原因：
- 内容量最大。
- 若先扩文明，会把尚未闭环的机制缺陷成倍放大。

### 4. PvP 双人对战

优先级中。原因：
- 基础 client/server 架构已具备，但缺少房间配对、第二玩家接入与生命周期管理。
- 是独立系统工作，适合在规则层更稳后推进。

### 5. 动画与音效

优先级中。原因：
- 主要提升体验，不改变游戏规则。
- 应在核心交互与网络流稳定后接入，避免动画层掩盖逻辑缺陷。

## Architecture Direction

### Effect System First

`core` 继续沿用“声明式 `CardEffect` + 关键字 handler + `StateMutator`”的组合。新增机制优先复用现有 effect pipeline，而不是为单一关键词写特例。

### Data-Driven Expansion

帝王专属大臣池和其余文明扩展都应保持数据驱动，尽量把差异放在卡牌定义与 `EmperorData` 装配层，而不是散落在执行逻辑里。

### Server-Authoritative Multiplayer

PvP 仍然坚持 server-authoritative，不让 client 直接持有规则执行权。客户端只发意图，服务端广播裁定后的状态。

### Presentation Layer Separation

动画/音效只消费事件与 UI 状态，不反向决定规则结果。规则层与表现层继续解耦。

## Deliverables

本轮先交付：
- 1 份 roadmap spec
- 5 份独立 implementation plan
- 启动并完成第 1 优先级项 `亡语效果`

后续第 2-5 项按计划继续推进。
