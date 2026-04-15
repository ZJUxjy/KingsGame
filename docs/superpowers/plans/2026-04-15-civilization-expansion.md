# Civilization Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为日本、美国、英国、德国补齐最小可玩的基础卡池与帝王装配。

**Architecture:** 每个文明先做一套最小 playable slice：帝王、数张随从、将领、法术/计策及绑定装配。优先复用现有效果类型，只有在确实必要时新增 keyword/effect。

**Tech Stack:** TypeScript, Vitest, card definition system

---

### Task 1: 日本文明最小卡池

**Files:**
- Create/Modify: `packages/core/src/cards/definitions/japan-*.ts`
- Modify: `packages/core/src/cards/definitions/index.ts`

- [ ] 补日本帝王/随从/将领/法术的最小卡池。
- [ ] 仅在现有效果不够时新增最小机制实现。

### Task 2: 美国、英国、德国按相同模式扩展

**Files:**
- Create/Modify: `packages/core/src/cards/definitions/usa-*.ts`
- Create/Modify: `packages/core/src/cards/definitions/uk-*.ts`
- Create/Modify: `packages/core/src/cards/definitions/germany-*.ts`

- [ ] 每个文明至少形成一个可初始化 `EmperorData` 的完整切片。
- [ ] 确保 deck builder 可消费这些数据。

### Task 3: 测试与构建

**Files:**
- Create/Modify: `packages/core/test/cards/definitions/*.test.ts`
- Modify: `packages/server/test/gameManager.test.ts`

- [ ] 增加定义完整性测试。
- [ ] 增加多文明初始化和 deck 构建测试。
