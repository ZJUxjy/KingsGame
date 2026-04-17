# Content Expansion & Card Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 8 civilization-exclusive keyword mechanics, add new effect types (Discover, Freeze, Sacrifice, Cost Reduction), expand deathrattle cards, and upgrade card artwork from placeholder glyphs to enhanced SVG with textures and civilization emblems.

**Architecture:** New keywords follow the existing effect pipeline: register a handler via `registerEffectHandler()` with lifecycle hooks, add cards via the builder DSL. New effect types extend the `executeCardEffects` switch-case. Card visuals are purely in `CardArtwork.tsx` SVG.

**Tech Stack:** TypeScript, Vitest, @king-card/shared types, @king-card/core effect system

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `packages/shared/src/types.ts` | Add missing EffectType entries |
| Modify | `packages/shared/src/engine-types.ts` | Add `frozenTurns` to CardInstance, `costReduction` to Player |
| Create | `packages/core/src/cards/effects/combo-strike.ts` | COMBO_STRIKE keyword handler |
| Create | `packages/core/src/cards/effects/blockade.ts` | BLOCKADE keyword handler |
| Create | `packages/core/src/cards/effects/colony.ts` | COLONY keyword handler |
| Create | `packages/core/src/cards/effects/iron-fist.ts` | IRON_FIST keyword handler |
| Create | `packages/core/src/cards/effects/blitz.ts` | BLITZ keyword handler |
| Create | `packages/core/src/cards/effects/mobilization-order.ts` | MOBILIZATION_ORDER keyword handler |
| Create | `packages/core/src/cards/effects/research.ts` | RESEARCH keyword handler |
| Modify | `packages/core/src/cards/effects/assassin.ts` | Implement actual ASSASSIN onKill logic |
| Modify | `packages/core/src/cards/effects/execute-card-effects.ts` | Add FREEZE, SACRIFICE, COST_REDUCTION cases |
| Modify | `packages/core/src/engine/game-loop.ts` | Decrement frozenTurns, apply costReduction |
| Modify | `packages/core/src/engine/action-executor.ts` | Check frozenTurns for attack validation, apply costReduction |
| Modify | `packages/core/src/cards/definitions/japan-minions.ts` | Add ASSASSIN / COMBO_STRIKE cards |
| Modify | `packages/core/src/cards/definitions/usa-minions.ts` | Add RESEARCH cards |
| Modify | `packages/core/src/cards/definitions/usa-sorceries.ts` | Add MOBILIZATION_ORDER card |
| Modify | `packages/core/src/cards/definitions/uk-minions.ts` | Add BLOCKADE / COLONY cards |
| Modify | `packages/core/src/cards/definitions/germany-minions.ts` | Add IRON_FIST / BLITZ cards |
| Modify | Various `*-minions.ts` files | Add deathrattle cards per civilization |
| Modify | `packages/client/src/components/board/CardArtwork.tsx` | Full visual overhaul |
| Create | Tests per keyword handler | One test file per new keyword |

---

### Task 1: Add missing types to shared

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/engine-types.ts`

- [ ] **Step 1: Add new EffectType entries**

In `packages/shared/src/types.ts`, replace the EffectType union (lines 13-19):

```ts
export type EffectType =
  | 'DAMAGE' | 'HEAL' | 'DRAW' | 'DISCARD' | 'SUMMON' | 'DESTROY'
  | 'MODIFY_STAT' | 'APPLY_BUFF' | 'REMOVE_BUFF' | 'GAIN_ARMOR' | 'SPEND_ENERGY'
  | 'ACTIVATE_STRATAGEM' | 'SET_DRAW_LOCK' | 'GRANT_EXTRA_ATTACK'
  | 'EMPEROR_SWITCH' | 'MINISTER_SWITCH' | 'RANDOM_DESTROY' | 'RANDOM_DISCARD'
  | 'CONDITIONAL_BUFF' | 'GARRISON_MARK' | 'AURA' | 'GARRISON' | 'MOBILIZE'
  | 'COST_MODIFIER'
  | 'FREEZE' | 'SACRIFICE' | 'COST_REDUCTION' | 'DISCOVER';
```

- [ ] **Step 2: Add `frozenTurns` to CardInstance**

In `packages/shared/src/engine-types.ts`, add to the `CardInstance` interface (after `garrisonActivated`):

```ts
frozenTurns: number;
```

- [ ] **Step 3: Add `costReduction` to Player**

In `packages/shared/src/engine-types.ts`, add to the `Player` interface (after `cannotDrawNextTurn`):

```ts
costReduction: number;
```

- [ ] **Step 4: Run type check**

Run: `pnpm --filter @king-card/shared run build:direct`
Expected: Compiles successfully.

- [ ] **Step 5: Fix any downstream compilation issues**

Run: `pnpm build`

The new fields need defaults. In `packages/core/src/models/card-instance.ts`, add `frozenTurns: 0` to the created instance. In `packages/core/src/models/player.ts`, add `costReduction: 0` to the created player.

- [ ] **Step 6: Run all tests**

Run: `pnpm test`
Expected: All tests pass (new fields have sensible defaults).

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/types.ts packages/shared/src/engine-types.ts packages/core/src/models/card-instance.ts packages/core/src/models/player.ts
git commit -m "feat(shared): add Freeze/Sacrifice/CostReduction/Discover effect types and frozenTurns/costReduction fields"
```

---

### Task 2: Implement ASSASSIN keyword (Japan)

**Files:**
- Modify: `packages/core/src/cards/effects/assassin.ts`
- Create: `packages/core/test/effects/assassin.test.ts` (if not exists, update existing)

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/test/effects/assassin.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContext } from '../helpers/test-context.js';

// If test-context helper doesn't exist, create a minimal one:
// It should create a mock EffectContext with mutator, state, source, playerIndex.

describe('ASSASSIN keyword', () => {
  it('grants an extra attack after killing a minion', () => {
    // Setup: attacker with ASSASSIN kills an enemy minion
    const ctx = createTestContext({
      sourceKeywords: ['ASSASSIN'],
      sourceAttack: 3,
      enemyMinions: [{ id: 'target', health: 2, attack: 1 }],
    });

    // Simulate the kill — the onKill handler should grant an extra attack
    // by setting source.remainingAttacks += 1
    const handler = getAssassinHandler();
    handler.onKill?.(ctx);

    expect(ctx.source.remainingAttacks).toBe(1); // was 0 after attack, now 1 again
  });

  it('does not grant extra attack if source lacks ASSASSIN keyword', () => {
    const ctx = createTestContext({
      sourceKeywords: ['RUSH'],
      sourceAttack: 3,
    });
    const handler = getAssassinHandler();
    handler.onKill?.(ctx);
    expect(ctx.source.remainingAttacks).toBe(0);
  });
});
```

Note: Adapt test structure to match existing test patterns in `packages/core/test/effects/`. Read the existing assassin test first.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @king-card/core test -- --run test/effects/assassin.test.ts`
Expected: FAIL — `onKill` doesn't do anything yet.

- [ ] **Step 3: Implement ASSASSIN onKill**

Replace `packages/core/src/cards/effects/assassin.ts`:

```ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * ASSASSIN keyword handler.
 *
 * After killing a minion, the ASSASSIN gains one extra attack
 * (allowing it to attack hero or another minion once more).
 */
const assassinHandler: EffectHandler = {
  keyword: 'ASSASSIN',

  onKill(ctx) {
    if (!ctx.source.card.keywords.includes('ASSASSIN')) return;
    // Grant one extra attack after a kill
    ctx.source.remainingAttacks += 1;
  },
};

registerEffectHandler(assassinHandler);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @king-card/core test -- --run test/effects/assassin.test.ts`
Expected: PASS.

- [ ] **Step 5: Add ASSASSIN cards to Japan**

In `packages/core/src/cards/definitions/japan-minions.ts`, add:

```ts
export const NINJA_ASSASSIN = japan.minion({
  slug: 'ninja_assassin',
  name: '忍者暗杀者',
  rarity: 'RARE',
  cost: 3,
  attack: 3,
  health: 2,
  description: '忍杀：击杀一个随从后，可额外攻击一次。',
  keywords: ['ASSASSIN'],
});

export const KAGE_NO_SHINOBI = japan.minion({
  slug: 'kage_no_shinobi',
  name: '影の忍',
  rarity: 'EPIC',
  cost: 5,
  attack: 4,
  health: 3,
  description: '忍杀。突袭。击杀敌人后隐入暗影再出刃。',
  keywords: ['ASSASSIN', 'RUSH'],
});
```

Add them to the `JAPAN_MINIONS` array export.

- [ ] **Step 6: Run all tests**

Run: `pnpm test`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/cards/effects/assassin.ts packages/core/src/cards/definitions/japan-minions.ts
git add packages/core/test/effects/assassin.test.ts
git commit -m "feat(core): implement ASSASSIN keyword with onKill extra attack"
```

---

### Task 3: Implement COMBO_STRIKE keyword (Japan)

**Files:**
- Create: `packages/core/src/cards/effects/combo-strike.ts`
- Create: `packages/core/test/effects/combo-strike.test.ts`
- Modify: `packages/core/src/cards/definitions/japan-minions.ts`
- Modify: `packages/core/src/cards/definitions/china-generals.ts` (remove COMBO_STRIKE from Huo Qubing)

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/test/effects/combo-strike.test.ts
import { describe, it, expect } from 'vitest';
import { createTestContext } from '../helpers/test-context.js';

describe('COMBO_STRIKE keyword', () => {
  it('grants extra attack after kill, up to 3 total attacks per turn', () => {
    const ctx = createTestContext({
      sourceKeywords: ['COMBO_STRIKE'],
      sourceAttack: 5,
    });
    // After first kill
    const handler = getComboStrikeHandler();
    ctx.source.remainingAttacks = 0;
    handler.onKill?.(ctx);
    expect(ctx.source.remainingAttacks).toBe(1);

    // After second kill
    ctx.source.remainingAttacks = 0;
    handler.onKill?.(ctx);
    expect(ctx.source.remainingAttacks).toBe(1);

    // After third kill — already at max, no more extra
    ctx.source.usedGeneralSkills = 3; // repurpose as attack counter for combo
    // Actually, track kills-this-turn via a counter on the source
  });

  it('does not grant attack if source does not have COMBO_STRIKE', () => {
    const ctx = createTestContext({ sourceKeywords: ['RUSH'] });
    const handler = getComboStrikeHandler();
    handler.onKill?.(ctx);
    expect(ctx.source.remainingAttacks).toBe(0);
  });
});
```

- [ ] **Step 2: Implement COMBO_STRIKE handler**

```ts
// packages/core/src/cards/effects/combo-strike.ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

const MAX_COMBO_ATTACKS = 3;

/**
 * COMBO_STRIKE (连斩): After killing a target, can continue attacking.
 * Maximum 3 attacks per turn.
 */
const comboStrikeHandler: EffectHandler = {
  keyword: 'COMBO_STRIKE',

  onKill(ctx) {
    if (!ctx.source.card.keywords.includes('COMBO_STRIKE')) return;
    // Allow continued attacks up to the max
    if (ctx.source.remainingAttacks < MAX_COMBO_ATTACKS) {
      ctx.source.remainingAttacks += 1;
    }
  },
};

registerEffectHandler(comboStrikeHandler);
```

- [ ] **Step 3: Remove COMBO_STRIKE from China's Huo Qubing**

In `packages/core/src/cards/definitions/china-generals.ts`, find Huo Qubing and remove `'COMBO_STRIKE'` from its keywords array. Replace with just `['CHARGE', 'RUSH']` or whatever other keywords it has.

- [ ] **Step 4: Add COMBO_STRIKE cards to Japan**

In `packages/core/src/cards/definitions/japan-minions.ts`:

```ts
export const KENSEI = japan.minion({
  slug: 'kensei',
  name: '剣聖',
  rarity: 'EPIC',
  cost: 6,
  attack: 5,
  health: 4,
  description: '连斩：击杀后可继续攻击，每回合最多3次。',
  keywords: ['COMBO_STRIKE'],
});

export const RONIN_BLADE = japan.minion({
  slug: 'ronin_blade',
  name: '浪人剑客',
  rarity: 'RARE',
  cost: 4,
  attack: 4,
  health: 3,
  description: '连斩。刃影无双，连斩不止。',
  keywords: ['COMBO_STRIKE'],
});
```

- [ ] **Step 5: Register handler in effects index**

Ensure `combo-strike.ts` is imported in the effects index file (likely `packages/core/src/cards/effects/index.ts`). Add:

```ts
import './combo-strike.js';
```

- [ ] **Step 6: Run all tests**

Run: `pnpm test`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/cards/effects/combo-strike.ts packages/core/test/effects/combo-strike.test.ts
git add packages/core/src/cards/definitions/japan-minions.ts packages/core/src/cards/definitions/china-generals.ts
git add packages/core/src/cards/effects/index.ts
git commit -m "feat(core): implement COMBO_STRIKE keyword for Japan, remove from China"
```

---

### Task 4: Implement BLOCKADE keyword (UK)

**Files:**
- Create: `packages/core/src/cards/effects/blockade.ts`
- Create: `packages/core/test/effects/blockade.test.ts`
- Modify: `packages/core/src/cards/definitions/uk-minions.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/test/effects/blockade.test.ts
import { describe, it, expect } from 'vitest';

describe('BLOCKADE keyword', () => {
  it('reduces opponent energy gain by 1 at turn start when BLOCKADE minion is alive', () => {
    // Create a game state with a BLOCKADE minion on the friendly battlefield
    // Simulate opponent's turn start
    // Opponent should gain (turnEnergy - 1) instead of turnEnergy
  });

  it('does not reduce energy if no BLOCKADE minion is alive', () => {
    // Standard energy gain
  });
});
```

- [ ] **Step 2: Implement BLOCKADE handler**

```ts
// packages/core/src/cards/effects/blockade.ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * BLOCKADE (封锁): While this minion is alive, opponent gains 1 less energy per turn.
 * Implemented as onTurnStart: if the opponent's turn starts and our side has a BLOCKADE minion,
 * deduct 1 energy from the opponent (minimum 0).
 */
const blockadeHandler: EffectHandler = {
  keyword: 'BLOCKADE',

  onTurnStart(ctx) {
    if (!ctx.source.card.keywords.includes('BLOCKADE')) return;
    // This fires for the source's owner's turn start, but BLOCKADE affects the opponent.
    // We need to reduce opponent's energy at their turn start.
    // The handler fires for every minion at the owner's turn start.
    // So we reduce opponent energy during OUR turn start (opponent just finished gaining energy).
    const opponentIndex = (1 - ctx.playerIndex) as 0 | 1;
    const opponent = ctx.state.players[opponentIndex];
    if (opponent.energyCrystal > 0) {
      ctx.mutator.modifyEnergy(opponentIndex, -1);
    }
  },
};

registerEffectHandler(blockadeHandler);
```

Note: Check if `mutator.modifyEnergy` exists. If not, use the appropriate mutator method to reduce energy. May need to add one — check `state-mutator.ts`.

- [ ] **Step 3: Add BLOCKADE cards to UK**

```ts
export const NAVAL_BLOCKADER = uk.minion({
  slug: 'naval_blockader',
  name: '海军封锁舰',
  rarity: 'RARE',
  cost: 4,
  attack: 2,
  health: 5,
  description: '封锁：存活时，对手每回合少获得1点能量。',
  keywords: ['BLOCKADE', 'TAUNT'],
});
```

- [ ] **Step 4: Register, run tests, commit**

```bash
git add packages/core/src/cards/effects/blockade.ts packages/core/test/effects/blockade.test.ts
git add packages/core/src/cards/definitions/uk-minions.ts packages/core/src/cards/effects/index.ts
git commit -m "feat(core): implement BLOCKADE keyword for UK"
```

---

### Task 5: Implement COLONY keyword (UK)

**Files:**
- Create: `packages/core/src/cards/effects/colony.ts`
- Create: `packages/core/test/effects/colony.test.ts`
- Modify: `packages/core/src/cards/definitions/uk-minions.ts`

- [ ] **Step 1: Write test**

```ts
describe('COLONY keyword', () => {
  it('draws a card at turn end if controller has ≥3 minions with different costs', () => {
    // Setup: 3 friendly minions with costs 2, 3, 5 + a COLONY minion
    // At turn end, COLONY triggers → draw 1
  });

  it('does not draw if fewer than 3 distinct costs', () => {
    // 2 minions with the same cost → no draw
  });
});
```

- [ ] **Step 2: Implement COLONY handler**

```ts
// packages/core/src/cards/effects/colony.ts
import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

const colonyHandler: EffectHandler = {
  keyword: 'COLONY',

  onTurnEnd(ctx) {
    if (!ctx.source.card.keywords.includes('COLONY')) return;
    const battlefield = ctx.state.players[ctx.playerIndex].battlefield;
    const distinctCosts = new Set(battlefield.map((m) => m.card.cost));
    if (distinctCosts.size >= 3) {
      ctx.mutator.drawCards(ctx.playerIndex, 1);
    }
  },
};

registerEffectHandler(colonyHandler);
```

- [ ] **Step 3: Add card, register, test, commit**

```bash
git commit -m "feat(core): implement COLONY keyword for UK"
```

---

### Task 6: Implement IRON_FIST keyword (Germany)

- [ ] **Step 1-4: Test, implement, add cards, commit**

```ts
// packages/core/src/cards/effects/iron-fist.ts
const ironFistHandler: EffectHandler = {
  keyword: 'IRON_FIST',

  onTurnStart(ctx) {
    if (!ctx.source.card.keywords.includes('IRON_FIST')) return;
    const hero = ctx.state.players[ctx.playerIndex].hero;
    if (hero.health <= 15) {
      ctx.mutator.modifyStat({ type: 'MINION', instanceId: ctx.source.instanceId }, 'attack', 2);
      ctx.mutator.modifyStat({ type: 'MINION', instanceId: ctx.source.instanceId }, 'health', 2);
    }
  },
};
```

```bash
git commit -m "feat(core): implement IRON_FIST keyword for Germany"
```

---

### Task 7: Implement BLITZ keyword (Germany)

- [ ] **Step 1-4: Test, implement, add cards, commit**

```ts
// packages/core/src/cards/effects/blitz.ts
const blitzHandler: EffectHandler = {
  keyword: 'BLITZ',

  onPlay(ctx) {
    if (!ctx.source.card.keywords.includes('BLITZ')) return;
    // Deal 2 damage to a random enemy minion on entering the battlefield
    const opponentIndex = (1 - ctx.playerIndex) as 0 | 1;
    const enemies = ctx.state.players[opponentIndex].battlefield;
    if (enemies.length === 0) return;
    const randomTarget = enemies[ctx.rng.nextInt(enemies.length)];
    ctx.mutator.dealDamage({ type: 'MINION', instanceId: randomTarget.instanceId }, 2);
  },
};
```

```bash
git commit -m "feat(core): implement BLITZ keyword for Germany"
```

---

### Task 8: Implement RESEARCH keyword (USA)

- [ ] **Step 1-4: Test, implement, add cards, commit**

```ts
// packages/core/src/cards/effects/research.ts
const researchHandler: EffectHandler = {
  keyword: 'RESEARCH',

  onPlay(ctx) {
    // After playing a sorcery/stratagem, add a random same-civilization spell to hand
    if (!ctx.source.card.keywords.includes('RESEARCH')) return;
    // This triggers when a card WITH RESEARCH is played (not when any spell is played)
    // Find a random sorcery/stratagem from the same civilization
    const civ = ctx.source.card.civilization;
    const spells = ALL_CARDS.filter(
      (c) => c.civilization === civ && (c.type === 'SORCERY' || c.type === 'STRATAGEM') && c.id !== ctx.source.card.id,
    );
    if (spells.length === 0) return;
    const randomSpell = spells[ctx.rng.nextInt(spells.length)];
    ctx.mutator.addToHand(ctx.playerIndex, randomSpell);
  },
};
```

Note: Check if `mutator.addToHand` exists; if not, implement it or use existing card-adding mechanism.

```bash
git commit -m "feat(core): implement RESEARCH keyword for USA"
```

---

### Task 9: Implement MOBILIZATION_ORDER keyword (USA)

- [ ] **Step 1-4: Test, implement, add cards, commit**

```ts
// packages/core/src/cards/effects/mobilization-order.ts
const mobilizationOrderHandler: EffectHandler = {
  keyword: 'MOBILIZATION_ORDER',

  // Aura-like: when ≥3 friendly minions, all get +1 attack
  onTurnStart(ctx) {
    if (!ctx.source.card.keywords.includes('MOBILIZATION_ORDER')) return;
    const battlefield = ctx.state.players[ctx.playerIndex].battlefield;
    if (battlefield.length >= 3) {
      for (const minion of battlefield) {
        ctx.mutator.modifyStat({ type: 'MINION', instanceId: minion.instanceId }, 'attack', 1);
      }
    }
  },
};
```

```bash
git commit -m "feat(core): implement MOBILIZATION_ORDER keyword for USA"
```

---

### Task 10: Implement Freeze effect type

**Files:**
- Modify: `packages/core/src/cards/effects/execute-card-effects.ts`
- Modify: `packages/core/src/engine/game-loop.ts`
- Modify: `packages/core/src/engine/action-executor.ts`
- Create: `packages/core/test/effects/freeze.test.ts`

- [ ] **Step 1: Write test**

```ts
describe('FREEZE effect', () => {
  it('sets frozenTurns on target minion', () => {
    // Play a card with FREEZE effect targeting enemy minion
    // Target's frozenTurns should be 1
  });

  it('frozen minion cannot attack', () => {
    // A minion with frozenTurns > 0 should not appear in valid attack actions
  });

  it('frozenTurns decrements at turn start', () => {
    // After a turn, frozenTurns goes from 1 to 0
  });
});
```

- [ ] **Step 2: Add FREEZE case to `executeCardEffects`**

In the switch-case in `executeCardEffects`:

```ts
case 'FREEZE': {
  const targetRef = ctx.target;
  if (targetRef && targetRef.type === 'MINION') {
    const target = findMinionByInstanceId(ctx, targetRef.instanceId);
    if (target) {
      target.frozenTurns = getNumericParam(effect.params, 'turns', 1);
    }
  }
  break;
}
```

- [ ] **Step 3: Block attack for frozen minions**

In `action-executor.ts`, in the attack validation section, add:

```ts
if (attacker.frozenTurns > 0) {
  return { error: 'MINION_CANNOT_ATTACK' };
}
```

- [ ] **Step 4: Decrement frozenTurns at turn start**

In `game-loop.ts`, in the turn-start minion processing loop:

```ts
for (const minion of player.battlefield) {
  if (minion.frozenTurns > 0) {
    minion.frozenTurns -= 1;
  }
  // ... existing processing
}
```

- [ ] **Step 5: Run all tests, commit**

```bash
git commit -m "feat(core): implement FREEZE effect type"
```

---

### Task 11: Implement Cost Reduction effect type

**Files:**
- Modify: `packages/core/src/cards/effects/execute-card-effects.ts`
- Modify: `packages/core/src/engine/action-executor.ts`

- [ ] **Step 1: Add COST_REDUCTION case**

```ts
case 'COST_REDUCTION': {
  const amount = getNumericParam(effect.params, 'amount', 1);
  ctx.state.players[ctx.playerIndex].costReduction += amount;
  break;
}
```

- [ ] **Step 2: Apply reduction when playing a card**

In `action-executor.ts`, in the play-card section where energy is deducted:

```ts
const costReduction = player.costReduction;
const finalCost = Math.max(0, card.cost - costReduction);
if (costReduction > 0) {
  player.costReduction = 0; // single-use reduction
}
// Use finalCost instead of card.cost for energy check
```

- [ ] **Step 3: Test and commit**

```bash
git commit -m "feat(core): implement COST_REDUCTION effect type"
```

---

### Task 12: Implement Sacrifice effect type

- [ ] **Step 1-3: Similar pattern**

```ts
case 'SACRIFICE': {
  const battlefield = ctx.state.players[ctx.playerIndex].battlefield;
  if (battlefield.length === 0) break;
  // Find weakest minion (lowest attack)
  const weakest = battlefield.reduce((min, m) =>
    m.currentAttack < min.currentAttack ? m : min, battlefield[0]);
  ctx.mutator.destroyMinion({ type: 'MINION', instanceId: weakest.instanceId });
  // Apply bonus from params
  const attackBonus = getNumericParam(effect.params, 'attackBonus', 0);
  const healthBonus = getNumericParam(effect.params, 'healthBonus', 0);
  if (attackBonus || healthBonus) {
    const source = findSourceOnBattlefield(ctx);
    if (source) {
      if (attackBonus) ctx.mutator.modifyStat({ type: 'MINION', instanceId: source.instanceId }, 'attack', attackBonus);
      if (healthBonus) ctx.mutator.modifyStat({ type: 'MINION', instanceId: source.instanceId }, 'health', healthBonus);
    }
  }
  break;
}
```

```bash
git commit -m "feat(core): implement SACRIFICE effect type"
```

---

### Task 13: Add deathrattle cards across civilizations

**Files:**
- Modify: `packages/core/src/cards/definitions/japan-minions.ts`
- Modify: `packages/core/src/cards/definitions/usa-minions.ts`
- Modify: `packages/core/src/cards/definitions/uk-minions.ts`
- Modify: `packages/core/src/cards/definitions/germany-minions.ts`

- [ ] **Step 1: Add 1-2 deathrattle minions per civilization**

**Japan:**
```ts
export const KAMIKAZE_PILOT = japan.minion({
  slug: 'kamikaze_pilot',
  name: '神風特攻隊',
  rarity: 'RARE',
  cost: 3,
  attack: 4,
  health: 1,
  description: '亡语：对随机一个敌方随从造成3点伤害。',
  keywords: ['DEATHRATTLE'],
  effects: [onDeath.damage({ target: 'RANDOM_ENEMY_MINION', amount: 3 })],
});
```

**USA:**
```ts
export const SUPPLY_TRUCK = usa.minion({
  slug: 'supply_truck',
  name: '补给卡车',
  rarity: 'COMMON',
  cost: 2,
  attack: 1,
  health: 3,
  description: '亡语：抽一张牌。',
  keywords: ['DEATHRATTLE'],
  effects: [onDeath.draw(1)],
});
```

**UK:**
```ts
export const ROYAL_MARTYR = uk.minion({
  slug: 'royal_martyr',
  name: '皇家殉道者',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 4,
  description: '亡语：为你的英雄恢复3点生命值。',
  keywords: ['DEATHRATTLE'],
  effects: [onDeath.heal({ target: 'HERO', amount: 3 })],
});
```

**Germany:**
```ts
export const VOLKSSTURM = germany.minion({
  slug: 'volkssturm',
  name: '国民突击队',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 1,
  description: '亡语：召唤一个1/1的民兵。',
  keywords: ['DEATHRATTLE'],
  effects: [onDeath.summon({ cardId: 'militia_token', count: 1 })],
});
```

- [ ] **Step 2: Add to civilization card arrays, run tests**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(core): add deathrattle cards across all civilizations"
```

---

### Task 14: Card visual overhaul — enhanced SVG artwork

**Files:**
- Modify: `packages/client/src/components/board/CardArtwork.tsx`

This is a large visual task. The approach: replace the simple glyph-in-ellipse with layered SVG:
1. Textured backgrounds per card type
2. Civilization-specific color tinting
3. Decorative borders per card type
4. Keyword icons below the name

- [ ] **Step 1: Define civilization color palettes**

Add at the top of `CardArtwork.tsx`:

```ts
const CIV_COLORS: Record<string, { primary: string; secondary: string; accent: string; emblem: string }> = {
  CHINA: { primary: '#8B0000', secondary: '#FFD700', accent: '#DC143C', emblem: '龙' },
  JAPAN: { primary: '#1a1a2e', secondary: '#C41E3A', accent: '#E8000D', emblem: '桜' },
  USA: { primary: '#002868', secondary: '#BF0A30', accent: '#FFFFFF', emblem: '★' },
  UK: { primary: '#003478', secondary: '#C8A951', accent: '#012169', emblem: '♛' },
  GERMANY: { primary: '#1a1a1a', secondary: '#DD0000', accent: '#FFCC00', emblem: '✠' },
  NEUTRAL: { primary: '#374151', secondary: '#6B7280', accent: '#9CA3AF', emblem: '◆' },
};

const TYPE_TEXTURES: Record<string, { pattern: string; borderColor: string; glowColor: string }> = {
  EMPEROR: { pattern: 'imperial', borderColor: '#FFD700', glowColor: 'rgba(255,215,0,0.3)' },
  GENERAL: { pattern: 'armor', borderColor: '#CD7F32', glowColor: 'rgba(205,127,50,0.3)' },
  MINION: { pattern: 'shield', borderColor: '#C0C0C0', glowColor: 'rgba(192,192,192,0.2)' },
  SORCERY: { pattern: 'magic', borderColor: '#9B59B6', glowColor: 'rgba(155,89,182,0.3)' },
  STRATAGEM: { pattern: 'scroll', borderColor: '#2E8B57', glowColor: 'rgba(46,139,87,0.3)' },
};
```

- [ ] **Step 2: Replace the art area SVG**

Replace the simple ellipse art (lines 153-169) with a layered composition:

```tsx
{/* Art area with textured background */}
<g data-testid="card-art">
  {/* Background gradient with civilization tint */}
  <defs>
    <linearGradient id={`${svgIdBase}-civ-bg`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={civColors.primary} />
      <stop offset="100%" stopColor={`${civColors.primary}CC`} />
    </linearGradient>
    <pattern id={`${svgIdBase}-texture`} width="12" height="12" patternUnits="userSpaceOnUse">
      {renderTexturePattern(card.type)}
    </pattern>
  </defs>
  <rect x="0" y="0" width="120" height="104" fill={`url(#${svgIdBase}-civ-bg)`} />
  <rect x="0" y="0" width="120" height="104" fill={`url(#${svgIdBase}-texture)`} opacity="0.15" />

  {/* Central art frame — double border */}
  <ellipse cx="60" cy="52" rx="36" ry="38"
    fill="rgba(0,0,0,0.45)" stroke={typeTexture.borderColor} strokeWidth="2" />
  <ellipse cx="60" cy="52" rx="33" ry="35"
    fill="none" stroke={`${typeTexture.borderColor}66`} strokeWidth="0.5" />

  {/* Type icon — larger, with glow */}
  <text x="60" y="58" textAnchor="middle" fill="white" fontSize="22" opacity="0.7" fontWeight="700"
    filter={`drop-shadow(0 0 4px ${typeTexture.glowColor})`}>
    {typeBadgeLabel(card.type, locale)}
  </text>

  {/* Civilization emblem in corner */}
  <text x="100" y="20" textAnchor="middle" fill={civColors.secondary} fontSize="14" opacity="0.5">
    {civColors.emblem}
  </text>
</g>
```

- [ ] **Step 3: Add texture pattern renderer**

```ts
function renderTexturePattern(cardType: string): JSX.Element {
  switch (cardType) {
    case 'EMPEROR':
      // Crown/dragon scale pattern
      return <><circle cx="6" cy="6" r="2" fill="rgba(255,215,0,0.3)" /><line x1="0" y1="0" x2="12" y2="12" stroke="rgba(255,215,0,0.15)" strokeWidth="0.5" /></>;
    case 'GENERAL':
      // Armor plate pattern
      return <><rect x="1" y="1" width="10" height="10" rx="1" fill="none" stroke="rgba(205,127,50,0.2)" strokeWidth="0.5" /></>;
    case 'SORCERY':
      // Magic sigil pattern
      return <><circle cx="6" cy="6" r="4" fill="none" stroke="rgba(155,89,182,0.2)" strokeWidth="0.5" /><line x1="2" y1="6" x2="10" y2="6" stroke="rgba(155,89,182,0.15)" strokeWidth="0.3" /></>;
    case 'STRATAGEM':
      // Bamboo/scroll horizontal lines
      return <><line x1="0" y1="3" x2="12" y2="3" stroke="rgba(46,139,87,0.2)" strokeWidth="0.5" /><line x1="0" y1="9" x2="12" y2="9" stroke="rgba(46,139,87,0.2)" strokeWidth="0.5" /></>;
    default:
      // Shield dots
      return <><circle cx="3" cy="3" r="1" fill="rgba(192,192,192,0.15)" /><circle cx="9" cy="9" r="1" fill="rgba(192,192,192,0.15)" /></>;
  }
}
```

- [ ] **Step 4: Upgrade border to match card type**

Replace the card frame border (rendered by CardComponent.tsx, not CardArtwork) with type-specific styling. In `CardComponent.tsx`, the border color is already driven by rarity. Enhance by adding a card-type border glow:

```tsx
// In CardComponent, add a type-based shadow:
const typeGlow = TYPE_TEXTURES[card.type]?.glowColor ?? 'transparent';
// Add to the card wrapper: boxShadow: `inset 0 0 8px ${typeGlow}`
```

- [ ] **Step 5: Add keyword icons**

Below the keyword text in CardArtwork, render small icons for recognized keywords:

```ts
const KEYWORD_ICONS: Partial<Record<string, string>> = {
  TAUNT: '🛡',
  RUSH: '⚡',
  CHARGE: '🗡',
  DEATHRATTLE: '💀',
  BATTLECRY: '📯',
  ASSASSIN: '🗡',
  GARRISON: '🏰',
};
```

Render as SVG text with small font-size alongside keyword labels. Note: This uses emoji as placeholder — for production, replace with SVG path icons.

- [ ] **Step 6: Update CardBackArtwork**

Replace the simple circle-and-glyph back with a richer design:

```tsx
export function CardBackArtwork({ svgIdBase, locale }: CardBackArtworkProps) {
  return (
    <svg viewBox="0 0 120 172" width="100%" height="100%">
      <defs>
        <radialGradient id={`${svgIdBase}-back`}>
          <stop offset="0%" stopColor="rgba(99,102,241,0.2)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <pattern id={`${svgIdBase}-back-tex`} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="16" height="16" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="120" height="172" fill="#1e1b4b" rx="8" />
      <rect x="0" y="0" width="120" height="172" fill={`url(#${svgIdBase}-back-tex)`} rx="8" />
      <circle cx="60" cy="86" r="35" fill={`url(#${svgIdBase}-back)`} stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />
      <text x="60" y="95" textAnchor="middle" fill="rgba(165,163,255,0.5)" fontSize="28" fontWeight="bold">
        {locale === 'en-US' ? 'K' : '帝'}
      </text>
    </svg>
  );
}
```

- [ ] **Step 7: Run tests and visually verify**

Run: `pnpm test`
Run: `pnpm dev:client` — open browser and check card visuals in collection page.

- [ ] **Step 8: Commit**

```bash
git add packages/client/src/components/board/CardArtwork.tsx
git commit -m "feat(client): upgrade card artwork to enhanced SVG with textures and civilization emblems"
```

---

### Task 15: Final verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: Clean build.

- [ ] **Step 3: Verify new keywords are registered**

Run: `pnpm --filter @king-card/core test -- --run` and check that all new keyword handler tests pass.

- [ ] **Step 4: Commit any cleanup**

```bash
git add -u
git commit -m "chore: final cleanup after content expansion and card visual overhaul"
```
