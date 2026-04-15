# Deathrattle Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让亡语效果在引擎中真实触发，并至少接入一张现有中国文明卡牌。

**Architecture:** 在随从销毁路径中触发 `ON_DEATH` 生命周期，使用现有 keyword handler/`CardEffect` 管线承接亡语效果，避免新增平行机制。

**Tech Stack:** TypeScript, Vitest, core effect system

---

### Task 1: 打通亡语生命周期

**Files:**
- Modify: `packages/core/src/engine/state-mutator.ts`
- Modify: `packages/core/src/cards/effects/deathrattle.ts`
- Modify: `packages/core/src/engine/action-executor.ts`

- [ ] 让随从销毁时构造 `EffectContext` 并触发 `ON_DEATH`。
- [ ] 让 `DEATHRATTLE` handler 真正执行 `source.card.effects` 中的 `ON_DEATH` 条目。
- [ ] 保证随机效果有可用 RNG，且不会因为 destroy recursion 丢失上下文。

### Task 2: 接入一张真实亡语卡

**Files:**
- Modify: `packages/core/src/cards/definitions/china-minions.ts`

- [ ] 选择一张中国随从卡改造成带 `DEATHRATTLE` 的真实卡牌。
- [ ] 用现有 effect type 表达其亡语，不新增专用 effect type。

### Task 3: 回归测试

**Files:**
- Modify: `packages/core/test/cards/effects/deathrattle.test.ts`
- Modify: `packages/core/test/engine/state-mutator.test.ts`

- [ ] 增加“销毁带亡语随从会触发效果”的回归测试。
- [ ] 增加“亡语不会在普通销毁路径中丢失”的测试。
- [ ] 跑 `@king-card/core` 受影响测试与构建。
