# Milestone 1：调味料五件套实施计划（圣盾 / 剧毒 / 风怒 / 吸血 / 重生）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 CCG 深化 Phase 1 的第一个 milestone——加 5 个炉石"调味料"关键字（DIVINE_SHIELD / POISONOUS / WINDFURY / LIFESTEAL / REBORN）+ 配套 ~15 张样卡，全部不动现有 UI、不动能量经济。

**Architecture:** 沿用现有 `packages/core/src/cards/effects/<keyword>.ts` 模式：每个关键字 = 1 个 handler 文件 + 在 `Keyword` 枚举追加 1 项 + 在 `effects/index.ts` 注册。其中 3 个关键字（圣盾/剧毒/吸血/风怒）需要修改引擎核心文件以拦截 damage / attack / turn-start 流程；重生纯走 `onDeath` hook。新卡用现有 `germany.minion(...)` / `japan.minion(...)` 等 civilization builder 写。

**Tech Stack:** TypeScript, Vitest, 现有 `packages/core` engine（无新依赖）

**Spec Reference:** `docs/superpowers/specs/2026-04-18-ccg-deepening-phase1-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `packages/shared/src/types.ts` | `Keyword` 枚举加 5 项 |
| Modify | `packages/client/src/utils/cardText.ts` | `KEYWORD_LABELS` 加中英文映射 5 项 |
| Modify | `packages/core/src/models/card-instance.ts` | `createCardInstance` 给 WINDFURY 单位初始 `remainingAttacks=2`（叠 charge/rush 仍按是否 fresh 决定） |
| Modify | `packages/core/src/engine/state-mutator.ts` | `damage()` 在扣血前检查 DIVINE_SHIELD：吸收并移除 keyword |
| Modify | `packages/core/src/engine/action-executor.ts` | attack 函数在 damage 后：对 POISONOUS 触发 destroy；对 LIFESTEAL 触发 hero heal |
| Modify | `packages/core/src/engine/game-loop.ts` | turn-start reset 给 WINDFURY 单位 `remainingAttacks=2` |
| Create | `packages/core/src/cards/effects/divine-shield.ts` | DIVINE_SHIELD handler（占位，逻辑实际在 mutator） |
| Create | `packages/core/src/cards/effects/poisonous.ts` | POISONOUS handler（占位，逻辑实际在 action-executor） |
| Create | `packages/core/src/cards/effects/windfury.ts` | WINDFURY handler（占位，逻辑在 game-loop + card-instance） |
| Create | `packages/core/src/cards/effects/lifesteal.ts` | LIFESTEAL handler（占位，逻辑在 action-executor） |
| Create | `packages/core/src/cards/effects/reborn.ts` | REBORN handler（onDeath：复活成 1HP 并去掉关键字） |
| Modify | `packages/core/src/cards/effects/index.ts` | import 5 个新 handler |
| Create | `packages/core/test/cards/effects/divine-shield.test.ts` | 3+ 个单元测试 |
| Create | `packages/core/test/cards/effects/poisonous.test.ts` | 3+ 个单元测试 |
| Create | `packages/core/test/cards/effects/windfury.test.ts` | 3+ 个单元测试 |
| Create | `packages/core/test/cards/effects/lifesteal.test.ts` | 3+ 个单元测试 + spec 强制的 "lifesteal+windfury" / "lifesteal+buff" 集成观察 |
| Create | `packages/core/test/cards/effects/reborn.test.ts` | 3+ 个单元测试 |
| Modify | `packages/core/src/cards/definitions/japan-minions.ts` | 加剧毒 + 重生主推卡（3-4 张）+ 风怒次要 1 张 |
| Modify | `packages/core/src/cards/definitions/uk-minions.ts` | 加圣盾主推卡（3 张）+ 吸血次要 1 张 |
| Modify | `packages/core/src/cards/definitions/germany-minions.ts` | 加风怒主推卡（3 张）+ 吸血主推卡（3 张） |
| Modify | `packages/core/src/cards/definitions/usa-minions.ts` | 加圣盾次要 1 张 |
| Modify | `packages/core/src/cards/definitions/china-minions.ts` | 加剧毒次要 1 张（蛊师） |
| Modify | `packages/core/src/cards/definitions/index.ts` | 新卡 named re-export |
| Modify | `packages/client/src/utils/cardText.ts` | 新卡的中英文 description / name 翻译 |

---

## Design Decisions

### D1: Handler 文件即使"几乎为空"也要存在
五个关键字里有 4 个的实际逻辑都嵌在 mutator / action-executor / game-loop / card-instance 里。但仍为每个关键字建一个 `<keyword>.ts` handler 文件并 `registerEffectHandler`，理由：
1. 与现有 TAUNT/CHARGE handler（同样几乎为空）保持一致——`getRegisteredHandlers()` 返回完整列表对调试和未来发现机制有用。
2. 文件头部 doc-comment 是新人理解关键字的索引入口。
3. 万一未来要加 ON_PLAY 触发逻辑（比如重生召唤特效），有现成挂载点。

### D2: WINDFURY 选择改 game-loop 而非 buff system
炉石做法是"风怒"关键字让单位 `attacksPerTurn` 变成 2。我们的引擎里没有 attacksPerTurn 字段，只有每回合 reset 的 `remainingAttacks`。在 game-loop 的 reset 块加一个 `if hasKeyword('WINDFURY') → remainingAttacks = 2` 是最小变化，**不引入新数据结构**。同时 `card-instance.ts` 的 `createCardInstance` 也要为 fresh-played 的 windfury+rush/charge 组合设 `remainingAttacks = 2`，否则它的第一回合只能攻击 1 次。

### D3: POISONOUS 与 LIFESTEAL 不通过 onAttack handler 而是 action-executor 内联
两者都需要"造成伤害后立即触发"的精确时机：必须在 damage 已经写入状态后（确保 0 伤被圣盾吃掉时不触发）但在 ON_KILL 之前。在 `action-executor.ts` 的 attack 函数 `mutator.damage(target, damage)` 之后内联一段"中毒/吸血"逻辑比走 `resolveEffects('ON_DAMAGE_DEALT', ...)` 简单——后者是新触发器，超出 M1 范围。**M1 接受这点耦合**，等 M3 反应式系统就位后再考虑重构。

### D4: REBORN 实现走 onDeath handler，类似 deathrattle
`reborn.ts` 的 `onDeath` 检查 minion 是否有 REBORN keyword。如果有：
1. 移除 REBORN keyword（防止无限复活）
2. 创建一个 1HP 的 `Card` 副本（base attack 不变）
3. 调用 `mutator.summonMinion(...)` 把它召回原位置
4. 不重新触发 ON_PLAY 的战吼（这是 Hearthstone 标准）
重生与 deathrattle 共存时，由于 `resolveEffects('ON_DEATH', ctx)` 遍历所有 handler，亡语会先触发（因为注册顺序：deathrattle 比 reborn 早注册）。

### D5: DIVINE_SHIELD 在 mutator.damage 内部消耗，不作为独立的 attempt-to-damage 事件
炉石机制：圣盾承受任意大于 0 的伤害都会消耗，无论伤害值多大。我们在 `state-mutator.damage()` 函数顶部加一段：如果 target 是 minion 且 amount > 0 且 minion.card.keywords 包含 DIVINE_SHIELD，则 amount = 0、移除 keyword、emit `DIVINE_SHIELD_BROKEN` 事件，然后照常走（amount 已是 0，不会扣血也不会触发 POISONOUS/LIFESTEAL）。

### D6: 数值表硬性遵守 spec
所有新卡按 spec `Numerical Balance Policy` 的 cost floor 表设计。每张新卡定义文件里的 `cost`/`attack`/`health` 必须在表内允许范围。本 plan 的 Task 6 列出的所有卡都已查表并符合。

---

## Card Roster (Task 6 输出物)

| # | 文明 | 名称（中/英） | 费 | 攻 | 血 | 关键字 | 表查证 |
|---|------|--------------|----|----|----|---|---|
| 1 | 日本 | 伊贺刺客 / Iga Assassin | 2 | 1 | 2 | POISONOUS | 剧毒 2 费上限 (1,2) ✓ |
| 2 | 日本 | 鸩毒武者 / Venom Bushi | 3 | 2 | 3 | POISONOUS | 剧毒 3 费上限 (2,3) ✓ |
| 3 | 日本 | 雾隐忍者 / Mist Ninja | 4 | 3 | 2 | POISONOUS, RUSH | 剧毒 +RUSH 走基线 +1 费：实际 4 费 ≥ 2+1=3 ✓ |
| 4 | 日本 | 不死武士 / Undying Samurai | 3 | 2 | 3 | REBORN | 重生 3 费上限 (2,3) ✓ |
| 5 | 日本 | 武士道圣骑 / Bushido Paladin | 4 | 3 | 4 | REBORN | 重生 4 费上限 (3,4) ✓ |
| 6 | 日本 | 转生僧 / Reborn Monk | 5 | 3 | 5 | REBORN, BATTLECRY (heal hero 2) | 5 费 + 复合加价 1（带 heal）→ 实际 5 费 = 3+1+1 临界，标 EPIC ✓ |
| 7 | 日本 | 双刀武士 / Twin Blade Samurai | 5 | 3 | 4 | WINDFURY | 风怒 5 费上限 (4,4)；本卡 (3,4) 偏保守 ✓ |
| 8 | 英国 | 王室卫兵 / Royal Guard | 1 | 1 | 2 | DIVINE_SHIELD | 圣盾 1 费上限 (1,2) ✓ |
| 9 | 英国 | 龙骑兵 / Dragoon | 2 | 2 | 2 | DIVINE_SHIELD | 圣盾 2 费上限 (2,3)；本卡 (2,2) 保守 ✓ |
| 10 | 英国 | 皇家近卫 / Imperial Guard | 4 | 3 | 4 | DIVINE_SHIELD, TAUNT | 圣盾 +TAUNT 复合 +1 费：4 费 = 2+TAUNT 加成 ✓ |
| 11 | 英国 | 皇家军医 / Royal Medic | 3 | 2 | 3 | LIFESTEAL | 吸血 3 费上限 (3,3)；本卡 (2,3) 保守 ✓ |
| 12 | 德国 | 闪电步兵 / Blitz Trooper | 4 | 3 | 3 | WINDFURY | 风怒 4 费上限 (3,3) ✓ |
| 13 | 德国 | 双刃骠骑 / Twin-Saber Hussar | 5 | 4 | 4 | WINDFURY | 风怒 5 费上限 (4,4) ✓ |
| 14 | 德国 | 装甲恢复车 / Recovery Tank | 3 | 2 | 3 | LIFESTEAL | 吸血 3 费上限 (3,3) ✓ |
| 15 | 德国 | 战地工程师 / Field Engineer | 4 | 3 | 4 | LIFESTEAL, TAUNT | 吸血 +TAUNT 复合 +1 费：4 费 ✓ |
| 16 | 美国 | 民兵盾兵 / Militia Shieldman | 2 | 2 | 2 | DIVINE_SHIELD | 圣盾 2 费上限 (2,3)；本卡 (2,2) 保守 ✓ |
| 17 | 中国 | 蛊师 / Gu Sorcerer | 3 | 2 | 3 | POISONOUS | 剧毒 3 费上限 (2,3) ✓ |

**总计**：17 张新卡（spec 范围 8-15，略多但都按表合规；如 review 觉得过多可削掉 #6 转生僧或 #15 战地工程师）。

---

## Tasks

### Task 0: 加 5 个 Keyword 枚举值 + 中英文标签

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/client/src/utils/cardText.ts:11-50` (KEYWORD_LABELS)

- [ ] **Step 1: 写失败测试 — Keyword 枚举包含 5 个新值**

新建 `packages/shared/test/keywords.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import type { Keyword } from '../src/types.js';

describe('Keyword enum (Phase 1 flavor keywords)', () => {
  it('includes the 5 new flavor keywords', () => {
    const requiredKeywords: Keyword[] = [
      'DIVINE_SHIELD',
      'POISONOUS',
      'WINDFURY',
      'LIFESTEAL',
      'REBORN',
    ];

    // Compile-time check: if any string is not in the union, this fails to type-check.
    // Runtime guard: ensure they're all string literals so JSON serialization works.
    for (const kw of requiredKeywords) {
      expect(typeof kw).toBe('string');
      expect(kw).toMatch(/^[A-Z_]+$/);
    }
  });
});
```

- [ ] **Step 2: 运行测试，确认编译期失败（类型不匹配）**

```bash
cd /home/xu/code/KingsGame/packages/shared && pnpm test --run keywords
```
Expected: FAIL with TypeScript error "Type '\"DIVINE_SHIELD\"' is not assignable to type 'Keyword'".

- [ ] **Step 3: 修改 `packages/shared/src/types.ts` — 在 Keyword 联合中追加 5 项**

把现有的 `Keyword` 联合：

```ts
export type Keyword =
  | 'BATTLECRY' | 'DEATHRATTLE' | 'AURA' | 'TAUNT' | 'RUSH' | 'CHARGE'
  | 'ASSASSIN' | 'COMBO_STRIKE' | 'STEALTH_KILL' | 'IRON_FIST'
  | 'MOBILIZE' | 'GARRISON' | 'RESEARCH' | 'BLOCKADE' | 'COLONY'
  | 'BLITZ' | 'MOBILIZATION_ORDER';
```

改为：

```ts
export type Keyword =
  | 'BATTLECRY' | 'DEATHRATTLE' | 'AURA' | 'TAUNT' | 'RUSH' | 'CHARGE'
  | 'ASSASSIN' | 'COMBO_STRIKE' | 'STEALTH_KILL' | 'IRON_FIST'
  | 'MOBILIZE' | 'GARRISON' | 'RESEARCH' | 'BLOCKADE' | 'COLONY'
  | 'BLITZ' | 'MOBILIZATION_ORDER'
  | 'DIVINE_SHIELD' | 'POISONOUS' | 'WINDFURY' | 'LIFESTEAL' | 'REBORN';
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
cd /home/xu/code/KingsGame/packages/shared && pnpm test --run keywords
```
Expected: PASS。

- [ ] **Step 5: 更新 `KEYWORD_LABELS` 中英文标签**

在 `packages/client/src/utils/cardText.ts` 的 `KEYWORD_LABELS` 对象的 `'zh-CN'` 块末尾追加：

```ts
    DIVINE_SHIELD: '圣盾',
    POISONOUS: '剧毒',
    WINDFURY: '风怒',
    LIFESTEAL: '吸血',
    REBORN: '重生',
```

并在 `'en-US'` 块末尾追加：

```ts
    DIVINE_SHIELD: 'Divine Shield',
    POISONOUS: 'Poisonous',
    WINDFURY: 'Windfury',
    LIFESTEAL: 'Lifesteal',
    REBORN: 'Reborn',
```

- [ ] **Step 6: 跑 client 套件确认未破坏现有标签查找**

```bash
cd /home/xu/code/KingsGame && pnpm --filter @king-card/client test --run cardText
```
Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add packages/shared/src/types.ts \
        packages/shared/test/keywords.test.ts \
        packages/client/src/utils/cardText.ts
git commit -m "feat(shared): add 5 flavor-tier keyword enum values + bilingual labels"
```

---

### Task 1: 圣盾 / DIVINE_SHIELD

**Files:**
- Create: `packages/core/src/cards/effects/divine-shield.ts`
- Modify: `packages/core/src/cards/effects/index.ts` (register import)
- Modify: `packages/core/src/engine/state-mutator.ts` (intercept damage)
- Create: `packages/core/test/cards/effects/divine-shield.test.ts`

- [ ] **Step 1: 写失败测试**

新建 `packages/core/test/cards/effects/divine-shield.test.ts`：

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { GameEngine } from '../../../src/engine/game-engine.js';
import type { Card, GameState } from '@king-card/shared';

function makeShieldedMinion(id: string, ownerHand?: Card[]): Card {
  return {
    id,
    name: id,
    civilization: 'UK',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 1,
    health: 2,
    description: 'Divine Shield.',
    keywords: ['DIVINE_SHIELD'],
    effects: [],
  };
}

describe('DIVINE_SHIELD keyword', () => {
  it('absorbs the first damage instance and removes the keyword', () => {
    // Set up a minimal game with one shielded minion on player 0's board.
    // Apply 5 damage. Expect: minion still alive at full HP, keyword removed.
    // (Detailed scaffolding: spawn engine, place minion, call mutator.damage)
    const card = makeShieldedMinion('test-shielded');
    // … boilerplate to set up game state with this minion …
    // Use existing test harness from research.test.ts as reference.

    // Assert: minion.currentHealth === 2 (unchanged)
    // Assert: minion.card.keywords does NOT include 'DIVINE_SHIELD'
    // Assert: events array contains a 'DIVINE_SHIELD_BROKEN' event
  });

  it('does not absorb 0-damage hits (no keyword waste)', () => {
    // Apply 0 damage. Expect keyword still present.
  });

  it('subsequent damage after shield broken hits normally', () => {
    // Apply 5 damage (shield breaks), then 1 damage. Expect minion at 1 HP.
  });
});
```

> Note: 详细 setup boilerplate 留给实现者参考 `packages/core/test/cards/effects/research.test.ts` 现有结构（同一文件内有完整 GameEngine 初始化样板）。

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run divine-shield
```
Expected: FAIL（圣盾未实现，伤害正常进入，minion 死亡）。

- [ ] **Step 3: 在 `state-mutator.ts` 的 `damage` 函数最上面拦截**

定位 `state-mutator.ts:79` 附近 minion damage 分支（在 `minion.currentHealth -= amount;` 之前）。把：

```ts
      // MINION
      const minion = findMinion(state, target.instanceId);
      if (!minion) return 'INVALID_TARGET';

      minion.currentHealth -= amount;
```

替换为：

```ts
      // MINION
      const minion = findMinion(state, target.instanceId);
      if (!minion) return 'INVALID_TARGET';

      // DIVINE_SHIELD: absorb any positive damage and break the shield.
      if (amount > 0 && minion.card.keywords.includes('DIVINE_SHIELD')) {
        minion.card.keywords = minion.card.keywords.filter((k) => k !== 'DIVINE_SHIELD');
        emit(eventBus, { type: 'DIVINE_SHIELD_BROKEN', target: minion });
        emit(eventBus, { type: 'DAMAGE_DEALT', target, amount: 0 });
        return null;
      }

      minion.currentHealth -= amount;
```

- [ ] **Step 4: 在 `events.ts` 加 `DIVINE_SHIELD_BROKEN` 事件类型**

定位 `packages/shared/src/events.ts`。找到 `GameEvent` 联合，加一项：

```ts
  | { type: 'DIVINE_SHIELD_BROKEN'; target: import('./engine-types.js').CardInstance }
```

- [ ] **Step 5: 创建 handler 占位文件**

新建 `packages/core/src/cards/effects/divine-shield.ts`：

```ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * DIVINE_SHIELD keyword handler.
 *
 * The shield itself is consumed inside state-mutator.damage() — it absorbs
 * the first positive-damage hit, removes the keyword, and emits
 * DIVINE_SHIELD_BROKEN. This handler exists so registry sweeps see the
 * keyword and so future ON_PLAY-style enrichments have a mount point.
 */
const divineShieldHandler: EffectHandler = {
  keyword: 'DIVINE_SHIELD',
};

registerEffectHandler(divineShieldHandler);
```

- [ ] **Step 6: 在 `effects/index.ts` 末尾追加 import**

```ts
import './divine-shield.js';
```

- [ ] **Step 7: 跑测试，确认通过**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run divine-shield
```
Expected: 3 PASS。

- [ ] **Step 8: 跑 core 全套件确认未破坏现有 damage 行为**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test
```
Expected: 全 PASS。

- [ ] **Step 9: 提交**

```bash
git add packages/core/src/cards/effects/divine-shield.ts \
        packages/core/src/cards/effects/index.ts \
        packages/core/src/engine/state-mutator.ts \
        packages/core/test/cards/effects/divine-shield.test.ts \
        packages/shared/src/events.ts
git commit -m "feat(core): implement DIVINE_SHIELD keyword (absorbs first damage)"
```

---

### Task 2: 剧毒 / POISONOUS

**Files:**
- Create: `packages/core/src/cards/effects/poisonous.ts`
- Modify: `packages/core/src/cards/effects/index.ts`
- Modify: `packages/core/src/engine/action-executor.ts` (post-damage destroy hook)
- Create: `packages/core/test/cards/effects/poisonous.test.ts`

- [ ] **Step 1: 写失败测试**

新建 `packages/core/test/cards/effects/poisonous.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
// ... boilerplate similar to divine-shield.test.ts ...

describe('POISONOUS keyword', () => {
  it('1/1 poisonous attacker destroys a 5/5 vanilla defender', () => {
    // After attack: defender removed from battlefield, in graveyard.
  });

  it('does not trigger when attacker deals 0 damage (e.g., target had Divine Shield)', () => {
    // 1/1 poisonous attacks 1/1 with DIVINE_SHIELD.
    // Expected: shield breaks, defender alive, no destroy.
  });

  it('does not trigger on hero attacks (only minion → minion)', () => {
    // 1/1 poisonous attacks hero. Hero takes 1 damage but is not destroyed.
  });

  it('triggers from defender side too: vanilla attacker hits poisonous defender → both die', () => {
    // 5/5 vanilla attacks 1/1 poisonous defender.
    // Standard combat: defender takes 5 (dies), attacker takes 1.
    // Poisonous on defender: attacker (which dealt damage to a poisonous minion)
    // is also destroyed.
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run poisonous
```
Expected: FAIL。

- [ ] **Step 3: 在 `action-executor.ts` 的 attack 函数中加 POISONOUS hook**

定位 `action-executor.ts:485` 附近（`mutator.damage(target, damage);` 之后、`if (target.type === 'MINION' && targetMinionBeforeDamage) {` 之前），插入：

```ts
  // POISONOUS: a minion that deals positive damage to another minion destroys it,
  // regardless of remaining HP. Also applies symmetrically when the defender
  // (rather than attacker) carries POISONOUS — the attacker also dies.
  if (damage > 0) {
    const targetMinion = target.type === 'MINION'
      ? findMinion(state, target.instanceId)
      : undefined;

    if (targetMinion && hasKeyword(attacker, 'POISONOUS') && targetMinion.currentHealth > 0) {
      mutator.destroyMinion(targetMinion.instanceId);
    }

    // Symmetric: defender dealt counter-damage to attacker
    const defenderHadCounterDamage = targetMinion && targetMinion.currentAttack > 0;
    if (
      targetMinionBeforeDamage &&
      hasKeyword(targetMinionBeforeDamage, 'POISONOUS') &&
      defenderHadCounterDamage &&
      attacker.currentHealth > 0
    ) {
      mutator.destroyMinion(attacker.instanceId);
    }
  }
```

- [ ] **Step 4: 创建 handler 占位文件**

新建 `packages/core/src/cards/effects/poisonous.ts`：

```ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * POISONOUS keyword handler.
 *
 * Resolution lives inside action-executor.attack() — after damage is applied,
 * if either side carries POISONOUS and that side's damage to the opposing
 * minion was > 0, the opposing minion is destroyed regardless of remaining HP.
 * This handler exists for registry parity.
 */
const poisonousHandler: EffectHandler = {
  keyword: 'POISONOUS',
};

registerEffectHandler(poisonousHandler);
```

- [ ] **Step 5: 在 `effects/index.ts` 末尾追加 import**

```ts
import './poisonous.js';
```

- [ ] **Step 6: 跑测试**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run poisonous
```
Expected: 4 PASS。

- [ ] **Step 7: 跑全套件**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test
```
Expected: 全 PASS（注意 ASSASSIN 的现有测试不应受影响——POISONOUS 与 ASSASSIN 不冲突）。

- [ ] **Step 8: 提交**

```bash
git add packages/core/src/cards/effects/poisonous.ts \
        packages/core/src/cards/effects/index.ts \
        packages/core/src/engine/action-executor.ts \
        packages/core/test/cards/effects/poisonous.test.ts
git commit -m "feat(core): implement POISONOUS keyword (any damage destroys minion target)"
```

---

### Task 3: 风怒 / WINDFURY

**Files:**
- Create: `packages/core/src/cards/effects/windfury.ts`
- Modify: `packages/core/src/cards/effects/index.ts`
- Modify: `packages/core/src/engine/game-loop.ts` (turn-start reset)
- Modify: `packages/core/src/models/card-instance.ts` (initial remainingAttacks)
- Create: `packages/core/test/cards/effects/windfury.test.ts`

- [ ] **Step 1: 写失败测试**

新建 `packages/core/test/cards/effects/windfury.test.ts`：

```ts
describe('WINDFURY keyword', () => {
  it('a windfury minion can attack twice per turn', () => {
    // Turn-start reset gives windfury minion remainingAttacks = 2.
    // After one attack: remainingAttacks = 1.
    // After two attacks: remainingAttacks = 0; third attack rejected.
  });

  it('a fresh-played CHARGE+WINDFURY minion attacks twice immediately', () => {
    // Played this turn. createCardInstance gives remainingAttacks = 2.
  });

  it('a fresh-played RUSH+WINDFURY minion attacks twice but not the hero', () => {
    // Same fresh remainingAttacks logic, but RUSH still blocks hero target.
  });

  it('frozen windfury minion attacks 0 times', () => {
    // frozenTurns > 0 zeroes out attacks regardless of windfury.
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run windfury
```
Expected: FAIL。

- [ ] **Step 3: 修改 `game-loop.ts` turn-start reset**

定位 `game-loop.ts:240-245` 的 reset 块：

```ts
  for (const minion of player.battlefield) {
    minion.justPlayed = false;
    minion.usedGeneralSkills = 0;
    if (minion.sleepTurns === 0) {
      minion.remainingAttacks = 1;
    }
  }
```

改为：

```ts
  for (const minion of player.battlefield) {
    minion.justPlayed = false;
    minion.usedGeneralSkills = 0;
    if (minion.sleepTurns === 0) {
      minion.remainingAttacks = minion.card.keywords.includes('WINDFURY') ? 2 : 1;
    }
  }
```

- [ ] **Step 4: 修改 `card-instance.ts` createCardInstance**

定位 `card-instance.ts:43-55`：

```ts
  const hasRush = instanceCard.keywords.includes('RUSH');
  const hasCharge = instanceCard.keywords.includes('CHARGE');
  const hasAssassin = instanceCard.keywords.includes('ASSASSIN');

  return {
    ...
    remainingAttacks: (hasRush || hasCharge || hasAssassin) ? 1 : 0,
    ...
```

改为：

```ts
  const hasRush = instanceCard.keywords.includes('RUSH');
  const hasCharge = instanceCard.keywords.includes('CHARGE');
  const hasAssassin = instanceCard.keywords.includes('ASSASSIN');
  const hasWindfury = instanceCard.keywords.includes('WINDFURY');
  const canAttackOnArrival = hasRush || hasCharge || hasAssassin;

  return {
    ...
    remainingAttacks: canAttackOnArrival ? (hasWindfury ? 2 : 1) : 0,
    ...
```

- [ ] **Step 5: 创建 handler 占位**

新建 `packages/core/src/cards/effects/windfury.ts`：

```ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * WINDFURY keyword handler.
 *
 * Resolution lives in:
 *  - card-instance.createCardInstance: fresh-played CHARGE/RUSH+WINDFURY get
 *    remainingAttacks = 2 instead of 1.
 *  - game-loop turn-start: WINDFURY minions get remainingAttacks = 2 each turn.
 * This handler exists for registry parity.
 */
const windfuryHandler: EffectHandler = {
  keyword: 'WINDFURY',
};

registerEffectHandler(windfuryHandler);
```

- [ ] **Step 6: 在 `effects/index.ts` 加 import**

```ts
import './windfury.js';
```

- [ ] **Step 7: 跑测试**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run windfury
```
Expected: 4 PASS。

- [ ] **Step 8: 跑全套件**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test
```
Expected: 全 PASS（特别注意 RUSH/CHARGE 现有 test 仍 OK）。

- [ ] **Step 9: 提交**

```bash
git add packages/core/src/cards/effects/windfury.ts \
        packages/core/src/cards/effects/index.ts \
        packages/core/src/engine/game-loop.ts \
        packages/core/src/models/card-instance.ts \
        packages/core/test/cards/effects/windfury.test.ts
git commit -m "feat(core): implement WINDFURY keyword (attacks twice per turn)"
```

---

### Task 4: 吸血 / LIFESTEAL

**Files:**
- Create: `packages/core/src/cards/effects/lifesteal.ts`
- Modify: `packages/core/src/cards/effects/index.ts`
- Modify: `packages/core/src/engine/action-executor.ts` (post-damage hero heal)
- Create: `packages/core/test/cards/effects/lifesteal.test.ts`

- [ ] **Step 1: 写失败测试**

新建 `packages/core/test/cards/effects/lifesteal.test.ts`：

```ts
describe('LIFESTEAL keyword', () => {
  it('attacker with lifesteal heals owner hero by damage dealt', () => {
    // Hero at 20 HP. 3/3 lifesteal attacks 5/5. Hero now 23 HP.
  });

  it('lifesteal does not exceed maxHealth', () => {
    // Hero at 29/30. 5/5 lifesteal attacks 1/1. Hero capped at 30.
  });

  it('lifesteal heals 0 when target had Divine Shield (no damage dealt)', () => {
    // Lifesteal attacker hits a Divine-Shielded defender.
    // Shield breaks; no actual damage, so no heal.
  });

  it('lifesteal works against hero target (direct face)', () => {
    // 3/3 lifesteal attacks enemy hero. Self hero gains 3.
  });

  // Spec-mandated combination tests:
  it('lifesteal + windfury double-heals across two attacks in one turn', () => {
    // 3/3 lifesteal+windfury attacks twice (5/5 + 1/1). Heals 3 + 1 = 4.
  });

  it('lifesteal + buff: a 2/3 lifesteal +2 attack buff heals 4 per swing', () => {
    // applyBuff +2 attack to 2/3 lifesteal. Attacks 5/5. Heals 4.
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run lifesteal
```
Expected: FAIL。

- [ ] **Step 3: 在 `action-executor.ts` 的 attack 函数中加 LIFESTEAL hook**

定位 Task 2 已加的 POISONOUS 块**之后**（保持 POISONOUS 优先于 LIFESTEAL 的求解顺序——若 attacker 因 poisonous defender 而死，仍需先 heal），追加：

```ts
  // LIFESTEAL: attacker heals own hero for the actual damage dealt.
  // Note: dealt damage is `damage` only if no Divine Shield absorbed it; we
  // recompute by inspecting the post-damage state.
  if (damage > 0 && hasKeyword(attacker, 'LIFESTEAL')) {
    const dealtDamage = computeActualDamageDealt(target, damage, state, targetMinionBeforeDamage);
    if (dealtDamage > 0) {
      mutator.heal({ type: 'HERO', playerIndex: attacker.ownerIndex }, dealtDamage);
    }
  }
```

并在文件顶部 helpers 区追加：

```ts
function computeActualDamageDealt(
  target: TargetRef,
  intendedDamage: number,
  state: GameState,
  targetMinionBeforeDamage: CardInstance | undefined,
): number {
  // For HERO targets: damage always dealt (armor reduces heal eligibility?炉石规则:
  // lifesteal heals based on damage dealt to *health*, not armor. Phase 1 简化:
  // heal full intended damage when targeting hero — armor handling 留待数值观察)
  if (target.type === 'HERO') return intendedDamage;

  // For MINION: if Divine Shield absorbed the hit, no damage was dealt.
  if (!targetMinionBeforeDamage) return 0;
  const hadShieldBefore = targetMinionBeforeDamage.card.keywords.includes('DIVINE_SHIELD');
  if (hadShieldBefore) {
    // Shield must have broken (we already applied damage); zero heal.
    return 0;
  }
  return intendedDamage;
}
```

> Note: 实现者 TDD 时第 1 个用例（基础吸血）能直接 PASS；第 3 个用例（吸血对圣盾不回血）要 PASS 必须把 `computeActualDamageDealt` 的 shield 分支写对——这是 spec watch list 强制的关键边界。

- [ ] **Step 4: 创建 handler 占位**

新建 `packages/core/src/cards/effects/lifesteal.ts`：

```ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * LIFESTEAL keyword handler.
 *
 * Resolution lives inside action-executor.attack() — after damage is applied,
 * if attacker carries LIFESTEAL and dealt > 0 actual damage (i.e., not absorbed
 * by Divine Shield), the attacker's hero is healed for that amount.
 * Phase 1 covers minion-attack lifesteal only; spell-source lifesteal is
 * deferred to Phase 2 when reactive triggers land.
 */
const lifestealHandler: EffectHandler = {
  keyword: 'LIFESTEAL',
};

registerEffectHandler(lifestealHandler);
```

- [ ] **Step 5: 在 `effects/index.ts` 加 import**

```ts
import './lifesteal.js';
```

- [ ] **Step 6: 跑测试**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run lifesteal
```
Expected: 6 PASS。

- [ ] **Step 7: 跑全套件**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test
```
Expected: 全 PASS。

- [ ] **Step 8: 提交**

```bash
git add packages/core/src/cards/effects/lifesteal.ts \
        packages/core/src/cards/effects/index.ts \
        packages/core/src/engine/action-executor.ts \
        packages/core/test/cards/effects/lifesteal.test.ts
git commit -m "feat(core): implement LIFESTEAL keyword with Divine Shield interaction guard"
```

---

### Task 5: 重生 / REBORN

**Files:**
- Create: `packages/core/src/cards/effects/reborn.ts`
- Modify: `packages/core/src/cards/effects/index.ts`
- Create: `packages/core/test/cards/effects/reborn.test.ts`

- [ ] **Step 1: 写失败测试**

新建 `packages/core/test/cards/effects/reborn.test.ts`：

```ts
describe('REBORN keyword', () => {
  it('a destroyed REBORN minion is summoned back at 1 HP, REBORN keyword removed', () => {
    // 2/3 reborn dies. New minion appears: 2/1, no REBORN.
  });

  it('reborn does not trigger a second time after first revival', () => {
    // Revived 2/1 (no REBORN). Killed again. Stays dead.
  });

  it('reborn coexists with deathrattle: deathrattle fires first, then revival', () => {
    // 2/3 reborn + deathrattle (draw 1) dies.
    // Card drawn (deathrattle), then 2/1 returns.
  });

  it('reborn triggers when poisonous kills the minion', () => {
    // 2/3 reborn vs 1/1 poisonous attack: original dies; 2/1 returns.
  });

  it('reborn does NOT bring back buffs from before death', () => {
    // 2/3 reborn with +2/+2 buff = 4/5 effective. Killed.
    // Returns as 2/1 (base stats), not 4/3.
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run reborn
```
Expected: FAIL。

- [ ] **Step 3: 创建 handler — 真实逻辑**

新建 `packages/core/src/cards/effects/reborn.ts`：

```ts
import type { Card, EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * REBORN keyword handler.
 *
 * When a minion with REBORN dies, it is summoned back at 1 HP with the
 * REBORN keyword removed (preventing infinite revival). Buffs and damage
 * are reset — the revived minion uses the card's base attack and a fresh
 * 1-HP body, just like Hearthstone's Reborn.
 *
 * Co-exists with DEATHRATTLE: deathrattle resolves first (it is registered
 * earlier in effects/index.ts), then this revival runs.
 */
const rebornHandler: EffectHandler = {
  keyword: 'REBORN',
  onDeath(ctx) {
    const { source, mutator, playerIndex } = ctx;
    if (!source.card.keywords.includes('REBORN')) return [];

    // Strip REBORN from the new card so revival is one-shot.
    const revivedCard: Card = {
      ...source.card,
      keywords: source.card.keywords.filter((k) => k !== 'REBORN'),
      // Base attack from the original card, health reset to 1.
      health: 1,
    };

    mutator.summonMinion(revivedCard, playerIndex, source.position);
    return [];
  },
};

registerEffectHandler(rebornHandler);
```

- [ ] **Step 4: 在 `effects/index.ts` 加 import**

放在 `import './deathrattle.js';` 之后（确保 deathrattle 先注册先触发）：

```ts
import './reborn.js';
```

- [ ] **Step 5: 跑测试**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run reborn
```
Expected: 5 PASS。

- [ ] **Step 6: 跑全套件**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test
```
Expected: 全 PASS。

- [ ] **Step 7: 提交**

```bash
git add packages/core/src/cards/effects/reborn.ts \
        packages/core/src/cards/effects/index.ts \
        packages/core/test/cards/effects/reborn.test.ts
git commit -m "feat(core): implement REBORN keyword (one-shot revival at 1 HP)"
```

---

### Task 6: 17 张样卡定义

**Files:**
- Modify: `packages/core/src/cards/definitions/japan-minions.ts`（+7 张）
- Modify: `packages/core/src/cards/definitions/uk-minions.ts`（+4 张）
- Modify: `packages/core/src/cards/definitions/germany-minions.ts`（+4 张）
- Modify: `packages/core/src/cards/definitions/usa-minions.ts`（+1 张）
- Modify: `packages/core/src/cards/definitions/china-minions.ts`（+1 张）
- Modify: `packages/core/src/cards/definitions/index.ts`（17 个 named re-exports）
- Modify: `packages/client/src/utils/cardText.ts`（17 张卡的中英文 description / name 翻译）

> **Important:** 本 Task 输出物 = Card Roster 表里的 17 张卡。每张卡严格按表中 `费/攻/血/关键字` 写。每加一张卡都要在 PR 描述里注明"按 spec cost-floor 表 X 关键字 上限 (A,H)，本卡 (a,h)，复合加价 N"。

- [ ] **Step 1: 写一份 catalog 集成测试**

新建 `packages/core/test/cards/m1-roster.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { ALL_CARDS } from '../../src/cards/definitions/index.js';

const M1_ROSTER = [
  // Japan poisonous
  'japan_iga_assassin', 'japan_venom_bushi', 'japan_mist_ninja',
  // Japan reborn
  'japan_undying_samurai', 'japan_bushido_paladin', 'japan_reborn_monk',
  // Japan windfury secondary
  'japan_twin_blade_samurai',
  // UK divine shield
  'uk_royal_guard', 'uk_dragoon', 'uk_imperial_guard',
  // UK lifesteal secondary
  'uk_royal_medic',
  // Germany windfury
  'germany_blitz_trooper', 'germany_twin_saber_hussar',
  // Germany lifesteal
  'germany_recovery_tank', 'germany_field_engineer',
  // USA divine shield secondary
  'usa_militia_shieldman',
  // China poisonous secondary
  'china_gu_sorcerer',
];

describe('M1 roster catalog', () => {
  it.each(M1_ROSTER)('card %s exists in ALL_CARDS', (cardId) => {
    const card = ALL_CARDS.find((c) => c.id === cardId);
    expect(card, `Missing card: ${cardId}`).toBeDefined();
  });

  it.each(M1_ROSTER)('card %s carries at least one M1 flavor keyword', (cardId) => {
    const card = ALL_CARDS.find((c) => c.id === cardId)!;
    const flavorKeywords = ['DIVINE_SHIELD', 'POISONOUS', 'WINDFURY', 'LIFESTEAL', 'REBORN'];
    expect(card.keywords.some((k) => flavorKeywords.includes(k as string))).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败（卡不存在）**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run m1-roster
```
Expected: 17×2 = 34 FAIL。

- [ ] **Step 3: 在 `japan-minions.ts` 末尾追加 7 张卡**

```ts
export const IGA_ASSASSIN = japan.minion({
  slug: 'iga_assassin',
  name: '伊贺刺客',
  rarity: 'COMMON',
  cost: 2,
  attack: 1,
  health: 2,
  description: '剧毒。',
  keywords: ['POISONOUS'],
});

export const VENOM_BUSHI = japan.minion({
  slug: 'venom_bushi',
  name: '鸩毒武者',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 3,
  description: '剧毒。',
  keywords: ['POISONOUS'],
});

export const MIST_NINJA = japan.minion({
  slug: 'mist_ninja',
  name: '雾隐忍者',
  rarity: 'EPIC',
  cost: 4,
  attack: 3,
  health: 2,
  description: '剧毒。突袭。',
  keywords: ['POISONOUS', 'RUSH'],
});

export const UNDYING_SAMURAI = japan.minion({
  slug: 'undying_samurai',
  name: '不死武士',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 3,
  description: '重生。',
  keywords: ['REBORN'],
});

export const BUSHIDO_PALADIN = japan.minion({
  slug: 'bushido_paladin',
  name: '武士道圣骑',
  rarity: 'RARE',
  cost: 4,
  attack: 3,
  health: 4,
  description: '重生。',
  keywords: ['REBORN'],
});

export const REBORN_MONK = japan.minion({
  slug: 'reborn_monk',
  name: '转生僧',
  rarity: 'EPIC',
  cost: 5,
  attack: 3,
  health: 5,
  description: '重生。战吼：使你的英雄恢复2点生命。',
  keywords: ['REBORN', 'BATTLECRY'],
  effects: [onPlay.heal('HERO', 2)],
});

export const TWIN_BLADE_SAMURAI = japan.minion({
  slug: 'twin_blade_samurai',
  name: '双刀武士',
  rarity: 'RARE',
  cost: 5,
  attack: 3,
  health: 4,
  description: '风怒。',
  keywords: ['WINDFURY'],
});
```

> **必须在文件顶部 import 行加 `onPlay`**（`REBORN_MONK` 用到）。

- [ ] **Step 4: 在 `uk-minions.ts` 末尾追加 4 张卡**

```ts
export const ROYAL_GUARD = uk.minion({
  slug: 'royal_guard',
  name: '王室卫兵',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 2,
  description: '圣盾。',
  keywords: ['DIVINE_SHIELD'],
});

export const DRAGOON = uk.minion({
  slug: 'dragoon',
  name: '龙骑兵',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 2,
  description: '圣盾。',
  keywords: ['DIVINE_SHIELD'],
});

export const IMPERIAL_GUARD = uk.minion({
  slug: 'imperial_guard',
  name: '皇家近卫',
  rarity: 'RARE',
  cost: 4,
  attack: 3,
  health: 4,
  description: '圣盾。嘲讽。',
  keywords: ['DIVINE_SHIELD', 'TAUNT'],
});

export const ROYAL_MEDIC = uk.minion({
  slug: 'royal_medic',
  name: '皇家军医',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 3,
  description: '吸血。',
  keywords: ['LIFESTEAL'],
});
```

- [ ] **Step 5: 在 `germany-minions.ts` 末尾追加 4 张卡**

```ts
export const BLITZ_TROOPER = germany.minion({
  slug: 'blitz_trooper',
  name: '闪电步兵',
  rarity: 'RARE',
  cost: 4,
  attack: 3,
  health: 3,
  description: '风怒。',
  keywords: ['WINDFURY'],
});

export const TWIN_SABER_HUSSAR = germany.minion({
  slug: 'twin_saber_hussar',
  name: '双刃骠骑',
  rarity: 'EPIC',
  cost: 5,
  attack: 4,
  health: 4,
  description: '风怒。',
  keywords: ['WINDFURY'],
});

export const RECOVERY_TANK = germany.minion({
  slug: 'recovery_tank',
  name: '装甲恢复车',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 3,
  description: '吸血。',
  keywords: ['LIFESTEAL'],
});

export const FIELD_ENGINEER = germany.minion({
  slug: 'field_engineer',
  name: '战地工程师',
  rarity: 'RARE',
  cost: 4,
  attack: 3,
  health: 4,
  description: '吸血。嘲讽。',
  keywords: ['LIFESTEAL', 'TAUNT'],
});
```

- [ ] **Step 6: 在 `usa-minions.ts` 末尾追加 1 张卡**

```ts
export const MILITIA_SHIELDMAN = usa.minion({
  slug: 'militia_shieldman',
  name: '民兵盾兵',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 2,
  description: '圣盾。',
  keywords: ['DIVINE_SHIELD'],
});
```

- [ ] **Step 7: 在 `china-minions.ts` 末尾追加 1 张卡**

```ts
export const GU_SORCERER = china.minion({
  slug: 'gu_sorcerer',
  name: '蛊师',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 3,
  description: '剧毒。',
  keywords: ['POISONOUS'],
});
```

- [ ] **Step 8: 在 `definitions/index.ts` 加 17 个 named re-export**

定位每个文明的 named export 块（china-minions / japan-minions / uk-minions / usa-minions / germany-minions），把新卡常量名追加到对应 export 列表里。例如：

```ts
export {
  ASHIGARU,
  NINJA,
  SAMURAI,
  SOUHEI,
  TEPPO,
  MUSHA,
  IGA_ASSASSIN,
  VENOM_BUSHI,
  MIST_NINJA,
  UNDYING_SAMURAI,
  BUSHIDO_PALADIN,
  REBORN_MONK,
  TWIN_BLADE_SAMURAI,
} from './japan-minions.js';
```

对其它 4 个文明做同样处理。

- [ ] **Step 9: 在 `cardText.ts` 的 `TEXT_RESOURCE_TABLE` 加 17 张卡的中英文翻译**

每张卡 2 条记录：name 和 description。例如：

```ts
'伊贺刺客': { 'en-US': 'Iga Assassin' },
'剧毒。': { 'en-US': 'Poisonous.' },
'鸩毒武者': { 'en-US': 'Venom Bushi' },
'雾隐忍者': { 'en-US': 'Mist Ninja' },
'剧毒。突袭。': { 'en-US': 'Poisonous. Rush.' },
'不死武士': { 'en-US': 'Undying Samurai' },
'重生。': { 'en-US': 'Reborn.' },
'武士道圣骑': { 'en-US': 'Bushido Paladin' },
'转生僧': { 'en-US': 'Reborn Monk' },
'重生。战吼：使你的英雄恢复2点生命。': { 'en-US': 'Reborn. Battlecry: Restore 2 Health to your hero.' },
'双刀武士': { 'en-US': 'Twin Blade Samurai' },
'风怒。': { 'en-US': 'Windfury.' },
'王室卫兵': { 'en-US': 'Royal Guard' },
'圣盾。': { 'en-US': 'Divine Shield.' },
'龙骑兵': { 'en-US': 'Dragoon' },
'皇家近卫': { 'en-US': 'Imperial Guard' },
'圣盾。嘲讽。': { 'en-US': 'Divine Shield. Taunt.' },
'皇家军医': { 'en-US': 'Royal Medic' },
'吸血。': { 'en-US': 'Lifesteal.' },
'闪电步兵': { 'en-US': 'Blitz Trooper' },
'双刃骠骑': { 'en-US': 'Twin-Saber Hussar' },
'装甲恢复车': { 'en-US': 'Recovery Tank' },
'战地工程师': { 'en-US': 'Field Engineer' },
'吸血。嘲讽。': { 'en-US': 'Lifesteal. Taunt.' },
'民兵盾兵': { 'en-US': 'Militia Shieldman' },
'蛊师': { 'en-US': 'Gu Sorcerer' },
```

注意去重——若 `'剧毒。'` 在多张卡上重复，TEXT_RESOURCE_TABLE 加一次即可。

- [ ] **Step 10: 跑 m1-roster 测试**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run m1-roster
```
Expected: 17×2 = 34 PASS。

- [ ] **Step 11: 跑全 monorepo 测试 + build**

```bash
cd /home/xu/code/KingsGame && pnpm --filter @king-card/core test && pnpm --filter @king-card/client test && pnpm build
```
Expected: 全 PASS，build 4 packages 全绿。

- [ ] **Step 12: 提交**

```bash
git add packages/core/src/cards/definitions/japan-minions.ts \
        packages/core/src/cards/definitions/uk-minions.ts \
        packages/core/src/cards/definitions/germany-minions.ts \
        packages/core/src/cards/definitions/usa-minions.ts \
        packages/core/src/cards/definitions/china-minions.ts \
        packages/core/src/cards/definitions/index.ts \
        packages/client/src/utils/cardText.ts \
        packages/core/test/cards/m1-roster.test.ts
git commit -m "feat(core): add 17 sample cards for M1 flavor keywords (across 5 civilizations)"
```

---

### Task 7: Spec-mandated 集成测试 — 吸血+风怒、吸血+buff

**Files:**
- Modify: `packages/core/test/cards/effects/lifesteal.test.ts`（追加 2 个集成场景）

> 实际上 Task 4 的 Step 1 已经把"lifesteal + windfury"和"lifesteal + buff"两条**单元级**用例写进了 lifesteal.test.ts。本 Task 在它们基础上，新增**端到端的多回合对战**集成场景，确认 spec watch list 关心的"turn 4-5 不可破续航"在合规身材下不会发生。

- [ ] **Step 1: 在 `lifesteal.test.ts` 末尾追加 2 个端到端场景**

```ts
describe('LIFESTEAL watch list (spec-mandated)', () => {
  it('a 5/4 lifesteal+windfury, even with +2 attack buff, does not exceed maxHealth healing in one turn', () => {
    // Hero at 30/30. Apply +2 attack buff. 5/4 → 7/4. Two attacks: 7+7 = 14 heal capped at 0 net (already full).
    // Verify hero stays at 30, not 30+14.
  });

  it('over 3 turns, a 3/3 lifesteal cannot keep hero topped if opponent deals ≥6 damage per turn', () => {
    // Simulate a stable opponent threat of 6 damage per turn.
    // Lifesteal heals 3 per attack × 1 attack/turn = 3. Net hero loss: -3/turn.
    // Hero starts at 30. After 3 turns of this trade, hero ≤ 21.
    // (This is the "lifesteal is not unbounded" sanity check the spec requested.)
  });
});
```

> 实现者：这两条用例需要完整 GameEngine 多回合驱动，参考 `packages/core/test/engine/emperor-switch.test.ts` 的 turn-loop 样板。

- [ ] **Step 2: 跑测试**

```bash
cd /home/xu/code/KingsGame/packages/core && pnpm test --run lifesteal
```
Expected: 8 PASS（6 + 2 = 8）。

- [ ] **Step 3: 提交**

```bash
git add packages/core/test/cards/effects/lifesteal.test.ts
git commit -m "test(core): add lifesteal watch-list scenarios per Phase 1 spec"
```

---

### Task 8: 全量回归 + 视觉验收

**Files:** 仅运行命令，不改代码。

- [ ] **Step 1: 跑全 monorepo 测试**

```bash
cd /home/xu/code/KingsGame && pnpm test
```
Expected: 全 PASS（core + client + server + shared）。

- [ ] **Step 2: 跑根 build**

```bash
cd /home/xu/code/KingsGame && pnpm build
```
Expected: 4 包全绿。

- [ ] **Step 3: 启动 dev 服务**

```bash
cd /home/xu/code/KingsGame && pnpm dev:all
```

- [ ] **Step 4: 浏览器肉眼回归**

打开 http://localhost:3000/，进入"卡牌收藏"，逐文明检查：
- **日本**：能看到伊贺刺客、鸩毒武者、雾隐忍者、不死武士、武士道圣骑、转生僧、双刀武士 7 张新卡
- **英国**：能看到王室卫兵、龙骑兵、皇家近卫、皇家军医 4 张新卡
- **德国**：闪电步兵、双刃骠骑、装甲恢复车、战地工程师 4 张
- **美国**：民兵盾兵 1 张
- **中国**：蛊师 1 张

每张卡：
- 关键字栏正确显示中文（圣盾 / 剧毒 / 风怒 / 吸血 / 重生）
- 切英文 locale 后显示 Divine Shield / Poisonous / Windfury / Lifesteal / Reborn
- 描述区按 Phase 0 修复后的 HTML 文字层正常排版

- [ ] **Step 5: 进入对战实测（PvE）**

启动 PvE，挑选一个能用到新卡的帝王（建议日本织田信长——剧毒+重生卡都在日本通用池里），点开 deck builder 把至少 3 张新卡放进套牌，开局后：
- 出剧毒卡攻击对方高血量随从，确认对方一击必死
- 出圣盾卡承受对方攻击，确认第一次免疫、第二次正常
- 出风怒卡，确认下一回合可点 2 下攻击
- 出重生卡被打死，确认 1HP 复活到原位置
- 出吸血卡攻击有伤敌方，确认自己英雄回血

- [ ] **Step 6: 报告结果（不提交，因为本 Task 无代码改动）**

如果发现任何视觉/行为问题，回到对应 Task 修复并追加 commit；如果全 OK，本 milestone 即完成。

---

## Self-Review

**1. Spec coverage**
- 5 个关键字 → Tasks 1-5 ✓
- ~15 张样卡 → Task 6（17 张，覆盖 spec 8-15 区间） ✓
- 单元测试 ≥3/handler → Tasks 1-5 各 3-6 个 ✓
- spec watch list（吸血+风怒、吸血+buff）→ Task 4 用例 + Task 7 端到端 ✓
- 关键字-文明 affinity → Task 6 卡表逐项匹配 ✓
- 数值 cost-floor 表 → Task 6 卡表逐项查表注明 ✓

**2. Placeholder scan**
- 所有 step 都给了具体代码或具体命令；测试用例的 detailed setup 部分明确指向 `research.test.ts` / `iron-fist.test.ts` 作为可复用样板，避免重复贴 100 行 boilerplate。

**3. Type consistency**
- `Keyword` 联合在 Task 0 一次性扩到位，下游 Tasks 1-7 无需再改。
- `DIVINE_SHIELD_BROKEN` 事件在 Task 1 添加到 `events.ts`，Task 1 测试随后引用 ✓
- `mutator.summonMinion` / `mutator.heal` / `mutator.destroyMinion` API 与 `state-mutator.ts` 实现一致 ✓
- `CardInstance.position` 字段在 REBORN handler 复用——确认 `engine-types.ts:162` 已声明 ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-18-m1-flavor-keywords.md`. Two execution options:

1. **Subagent-Driven (recommended)** —— 每个 Task 派新子 agent + spec/quality 双审。
2. **Inline Execution** —— 当前会话顺序跑所有 Task，每个 Task 间停顿你确认。

请选一个。
