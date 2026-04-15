# Emperor-Specific Ministers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让每位帝王拥有独立的大臣池，增强帝王切换与构筑差异化。

**Architecture:** 主要修改卡牌定义数据和 `EmperorData` 装配，让 player 初始化和切换帝王逻辑消费差异化 minister pool，而不改大臣系统的基本模型。

**Tech Stack:** TypeScript, Vitest, core models

---

### Task 1: 定义专属大臣数据

**Files:**
- Modify: `packages/core/src/cards/definitions/china-ministers.ts`
- Modify: `packages/core/src/cards/definitions/index.ts`

- [ ] 为秦始皇、汉武帝、唐太宗拆分各自大臣池。
- [ ] 保留共享大臣时只复用卡牌定义，不共享运行时状态。

### Task 2: 调整帝王装配与切换

**Files:**
- Modify: `packages/core/src/models/player.ts`
- Modify: `packages/core/src/engine/action-executor.ts`

- [ ] 初始化玩家时装入对应帝王的大臣池。
- [ ] 切换帝王时替换为新帝王的大臣池，并保持现有冷却规则。

### Task 3: 验证与测试

**Files:**
- Modify: `packages/core/test/engine/emperor-switch.test.ts`
- Modify: `packages/core/test/models/player.test.ts`

- [ ] 增加帝王初始化大臣池差异测试。
- [ ] 增加切换帝王后大臣池替换测试。
