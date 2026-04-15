# Animation And Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把已定义的关键帧动画和基础音效接入到主要对战交互中。

**Architecture:** 以事件驱动方式把 `game:state` 变更和本地选择状态映射到 UI 动画类名与音频播放，不把表现逻辑耦合进规则执行。

**Tech Stack:** React, CSS animations, HTMLAudioElement or lightweight audio wrapper

---

### Task 1: 动画接入

**Files:**
- Modify: `packages/client/src/components/board/GameBoard.tsx`
- Modify: `packages/client/src/components/board/CardComponent.tsx`
- Modify: `packages/client/src/index.css`

- [ ] 把打牌、攻击、死亡、治疗等关键帧真正接入组件。
- [ ] 由状态变化决定动画触发，而不是硬编码超时堆叠。

### Task 2: 音效接入

**Files:**
- Create: `packages/client/src/services/audioService.ts`
- Modify: `packages/client/src/components/board/GameBoard.tsx`

- [ ] 加入基础音效管理。
- [ ] 为出牌、攻击、受伤、回合开始接入最小音效集。

### Task 3: 体验验证

**Files:**
- Modify/Create: `packages/client/src/components/board/*.test.tsx`

- [ ] 补最关键交互的表现层测试。
- [ ] 手动验证重复触发、静音、安全降级。
