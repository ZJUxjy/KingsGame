# Next Phase Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把后续 5 条开发主线拆成可执行子项目，并先启动最高优先级的亡语效果实现。

**Architecture:** 采用“1 份总 roadmap + 5 份独立计划 + 分阶段实施”的方式推进，避免把内容扩展、联网、表现层和规则层耦合成一笔不可执行的大任务。

**Tech Stack:** Markdown planning docs, TypeScript monorepo, Vitest

---

### Task 1: 锁定子项目拆分

**Files:**
- Create: `docs/superpowers/specs/2026-04-15-next-phase-roadmap-design.md`
- Create: `docs/superpowers/plans/2026-04-15-roadmap-overview.md`

- [ ] 写 roadmap spec，固定 5 条主线和优先级。
- [ ] 记录为什么先做亡语效果，再做其余 4 项。

### Task 2: 为每条主线各写一份独立计划

**Files:**
- Create: `docs/superpowers/plans/2026-04-15-deathrattle-effects.md`
- Create: `docs/superpowers/plans/2026-04-15-emperor-specific-ministers.md`
- Create: `docs/superpowers/plans/2026-04-15-civilization-expansion.md`
- Create: `docs/superpowers/plans/2026-04-15-pvp-mode.md`
- Create: `docs/superpowers/plans/2026-04-15-animation-and-audio.md`

- [ ] 每份计划只覆盖一个子项目。
- [ ] 计划写到可以直接执行，不写成空泛大纲。

### Task 3: 启动第 1 优先级项

**Files:**
- Follow: `docs/superpowers/plans/2026-04-15-deathrattle-effects.md`

- [ ] 开始实现 `亡语效果`。
- [ ] 完成后再进入第 2 优先级项。
