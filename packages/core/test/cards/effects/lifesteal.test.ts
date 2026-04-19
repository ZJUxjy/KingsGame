import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../../src/cards/definitions/index.js';
import { createCardInstance } from '../../../src/models/card-instance.js';
import { createStateMutator } from '../../../src/engine/state-mutator.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import type { Buff, Card } from '@king-card/shared';

// ─── Test Fixtures ───────────────────────────────────────────────

function makeMinionCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    id: overrides.id,
    name: `Minion ${overrides.id}`,
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 1,
    health: 1,
    description: 'A test minion',
    keywords: [],
    effects: [],
    ...overrides,
  };
}

/**
 * Build an engine with a vanilla deck and place attacker / defender(s) directly
 * on the battlefield. We bypass card-play so the attacker is ready to swing
 * this turn regardless of CHARGE/RUSH. Multiple defenders are supported for
 * WINDFURY scenarios.
 */
function setupDuel(opts: { attacker: Card; defenders?: Card[] }) {
  const filler = makeMinionCard({ id: 'filler' });
  const deck = Array.from({ length: 30 }, () => filler);
  const emperor = ALL_EMPEROR_DATA_LIST[0];
  const engine = GameEngine.create(deck, deck, emperor, emperor);
  const state = engine.getGameState();

  const attackerInst = createCardInstance(opts.attacker, 0, engine.getCounter());
  attackerInst.remainingAttacks = 1;
  attackerInst.justPlayed = false;
  state.players[0].battlefield.push(attackerInst);

  const defenderInsts: ReturnType<typeof createCardInstance>[] = [];
  for (const def of opts.defenders ?? []) {
    const inst = createCardInstance(def, 1, engine.getCounter());
    inst.justPlayed = false;
    state.players[1].battlefield.push(inst);
    defenderInsts.push(inst);
  }

  return { engine, state, attackerInst, defenderInsts };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('LIFESTEAL keyword', () => {
  it('attacker with lifesteal heals owner hero by damage dealt', () => {
    const attacker = makeMinionCard({
      id: 'lifesteal_attacker',
      attack: 3,
      health: 3,
      keywords: ['LIFESTEAL'],
    });
    const defender = makeMinionCard({
      id: 'big_vanilla',
      attack: 5,
      health: 5,
    });

    const { engine, state, attackerInst, defenderInsts } = setupDuel({
      attacker,
      defenders: [defender],
    });
    state.players[0].hero.health = 20;

    const result = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInsts[0].instanceId,
    });

    expect(result.success).toBe(true);
    expect(state.players[0].hero.health).toBe(23);
  });

  it('lifesteal does not exceed maxHealth', () => {
    const attacker = makeMinionCard({
      id: 'lifesteal_attacker',
      attack: 5,
      health: 5,
      keywords: ['LIFESTEAL'],
    });
    const defender = makeMinionCard({
      id: 'tiny_vanilla',
      attack: 1,
      health: 1,
    });

    const { engine, state, attackerInst, defenderInsts } = setupDuel({
      attacker,
      defenders: [defender],
    });
    state.players[0].hero.health = 29;
    const maxHp = state.players[0].hero.maxHealth;

    const result = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInsts[0].instanceId,
    });

    expect(result.success).toBe(true);
    expect(state.players[0].hero.health).toBe(maxHp);
  });

  it('lifesteal heals 0 when target had Divine Shield (no damage dealt)', () => {
    const attacker = makeMinionCard({
      id: 'lifesteal_attacker',
      attack: 3,
      health: 3,
      keywords: ['LIFESTEAL'],
    });
    const defender = makeMinionCard({
      id: 'shielded_defender',
      attack: 0,
      health: 1,
      keywords: ['DIVINE_SHIELD'],
    });

    const { engine, state, attackerInst, defenderInsts } = setupDuel({
      attacker,
      defenders: [defender],
    });
    state.players[0].hero.health = 20;

    const result = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInsts[0].instanceId,
    });

    expect(result.success).toBe(true);
    // Shield broke
    expect(defenderInsts[0].card.keywords).not.toContain('DIVINE_SHIELD');
    // No actual HP damage → no heal
    expect(state.players[0].hero.health).toBe(20);
  });

  it('lifesteal works against hero target (direct face)', () => {
    const attacker = makeMinionCard({
      id: 'lifesteal_attacker',
      attack: 3,
      health: 3,
      keywords: ['LIFESTEAL'],
    });

    const { engine, state, attackerInst } = setupDuel({ attacker });
    state.players[0].hero.health = 20;
    const opponentHpBefore = state.players[1].hero.health;

    const result = engine.attack(attackerInst.instanceId, {
      type: 'HERO',
      playerIndex: 1,
    });

    expect(result.success).toBe(true);
    expect(state.players[1].hero.health).toBe(opponentHpBefore - 3);
    expect(state.players[0].hero.health).toBe(23);
  });

  it('lifesteal + windfury double-heals across two attacks in one turn', () => {
    const attacker = makeMinionCard({
      id: 'lifesteal_wf_attacker',
      attack: 3,
      health: 10,
      keywords: ['LIFESTEAL', 'WINDFURY'],
    });
    const defender1 = makeMinionCard({
      id: 'big_vanilla_a',
      attack: 0,
      health: 5,
    });
    const defender2 = makeMinionCard({
      id: 'big_vanilla_b',
      attack: 0,
      health: 5,
    });

    const { engine, state, attackerInst, defenderInsts } = setupDuel({
      attacker,
      defenders: [defender1, defender2],
    });
    // Simulate post-turn-start: WINDFURY grants 2 attacks.
    attackerInst.remainingAttacks = 2;
    attackerInst.justPlayed = false;
    state.players[0].hero.health = 10;

    const r1 = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInsts[0].instanceId,
    });
    expect(r1.success).toBe(true);

    const r2 = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInsts[1].instanceId,
    });
    expect(r2.success).toBe(true);

    expect(state.players[0].hero.health).toBe(16);
  });

  it('lifesteal + buff: a 2/3 lifesteal +2 attack buff heals 4 per swing', () => {
    const attacker = makeMinionCard({
      id: 'lifesteal_buffable',
      attack: 2,
      health: 3,
      keywords: ['LIFESTEAL'],
    });
    const defender = makeMinionCard({
      id: 'tank_vanilla',
      attack: 0,
      health: 10,
    });

    const { engine, state, attackerInst, defenderInsts } = setupDuel({
      attacker,
      defenders: [defender],
    });
    state.players[0].hero.health = 20;

    // Apply +2 attack buff via mutator.applyBuff. The buff mutates the
    // engine's shared state (we attach a side-channel EventBus because the
    // engine doesn't expose its bus; the buff doesn't depend on subscribers).
    const sideBus = new EventBus();
    const sideMutator = createStateMutator(
      state,
      sideBus,
      undefined,
      engine.getCounter(),
    );
    const buff: Buff = {
      id: 'test-attack-buff',
      attackBonus: 2,
      healthBonus: 0,
      maxHealthBonus: 0,
      type: 'TEMPORARY',
      keywordsGranted: [],
    };
    sideMutator.applyBuff(
      { type: 'MINION', instanceId: attackerInst.instanceId },
      buff,
    );
    expect(attackerInst.currentAttack).toBe(4);

    const result = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInsts[0].instanceId,
    });

    expect(result.success).toBe(true);
    expect(state.players[0].hero.health).toBe(24);
  });
});

describe('LIFESTEAL watch list (spec-mandated)', () => {
  it('a 5/4 lifesteal+windfury, even with +2 attack buff, does not exceed maxHealth healing in one turn', () => {
    const attacker = makeMinionCard({
      id: 'lifesteal_wf_buffed',
      attack: 5,
      health: 4,
      keywords: ['LIFESTEAL', 'WINDFURY'],
    });
    // Two pillow defenders with 0 attack so the attacker takes no counter
    // damage and survives both swings; ample HP so each absorbs a 7-damage hit.
    const defender1 = makeMinionCard({
      id: 'wf_pillow_a',
      attack: 0,
      health: 10,
    });
    const defender2 = makeMinionCard({
      id: 'wf_pillow_b',
      attack: 0,
      health: 10,
    });

    const { engine, state, attackerInst, defenderInsts } = setupDuel({
      attacker,
      defenders: [defender1, defender2],
    });
    // Simulate post-turn-start: WINDFURY grants 2 attacks.
    attackerInst.remainingAttacks = 2;
    attackerInst.justPlayed = false;

    // Apply a +2 attack buff via mutator.applyBuff (same pattern as the
    // single-turn lifesteal+buff test above). 5 + 2 = 7 attack per swing.
    const sideBus = new EventBus();
    const sideMutator = createStateMutator(
      state,
      sideBus,
      undefined,
      engine.getCounter(),
    );
    const buff: Buff = {
      id: 'watchlist-attack-buff',
      attackBonus: 2,
      healthBonus: 0,
      maxHealthBonus: 0,
      type: 'TEMPORARY',
      keywordsGranted: [],
    };
    sideMutator.applyBuff(
      { type: 'MINION', instanceId: attackerInst.instanceId },
      buff,
    );
    expect(attackerInst.currentAttack).toBe(7);

    // Hero is already at full HP so any heal would attempt to overflow.
    const maxHp = state.players[0].hero.maxHealth;
    expect(state.players[0].hero.health).toBe(maxHp);

    const r1 = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInsts[0].instanceId,
    });
    expect(r1.success).toBe(true);

    const r2 = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInsts[1].instanceId,
    });
    expect(r2.success).toBe(true);

    // Watch-list assertion: 14 raw heal attempts (7 + 7) MUST clamp to maxHealth,
    // so the hero never sits above 30 even with WINDFURY × buff stacking.
    expect(state.players[0].hero.health).toBe(maxHp);
    expect(state.players[0].hero.health).toBeLessThanOrEqual(maxHp);
  });

  it('over 3 turns, a 3/3 lifesteal cannot keep hero topped if opponent deals ≥6 damage per turn', () => {
    const attacker = makeMinionCard({
      id: 'lifesteal_3_3',
      attack: 3,
      health: 3,
      keywords: ['LIFESTEAL'],
    });
    // Opponent's "face-hitter": 6 attack, fat HP so it survives no-counter swings
    // (it will only attack our hero, never trade, so HP just needs to be > 0).
    const opponentBruiser = makeMinionCard({
      id: 'opp_bruiser_6',
      attack: 6,
      health: 20,
    });
    // Opponent pillow: 0 attack, fat HP so our 3-attack lifesteal can chip it
    // for 3 damage every turn for 3 turns without killing it (and without
    // taking any counter damage that would kill our 3/3).
    const opponentPillow = makeMinionCard({
      id: 'opp_pillow',
      attack: 0,
      health: 100,
    });

    const { engine, state, attackerInst, defenderInsts } = setupDuel({
      attacker,
      defenders: [opponentBruiser, opponentPillow],
    });
    const [bruiserInst, pillowInst] = defenderInsts;

    // Sanity: hero starts at full.
    const startHp = state.players[0].hero.health;
    expect(startHp).toBe(state.players[0].hero.maxHealth);
    expect(startHp).toBe(30);

    // Drive 3 full turn cycles. Each cycle:
    //   P0: our 3/3 lifesteal hits the pillow → deals 3, heals 3 (capped).
    //   endTurn → P1: opponent's 6-atk hits our hero face → -6.
    //   endTurn → back to P0 with remainingAttacks reset.
    for (let turn = 0; turn < 3; turn++) {
      // Our swing: pillow has 0 attack so no counter damage to our 3/3.
      const ourAttack = engine.attack(attackerInst.instanceId, {
        type: 'MINION',
        instanceId: pillowInst.instanceId,
      });
      expect(ourAttack.success).toBe(true);

      // Hand the turn to the opponent.
      expect(engine.endTurn().success).toBe(true);

      // Opponent's bruiser was placed with justPlayed=false; the turn-start
      // reset (Phase 4a) restores its 1 attack. Slam our hero for 6.
      const oppAttack = engine.attack(bruiserInst.instanceId, {
        type: 'HERO',
        playerIndex: 0,
      });
      expect(oppAttack.success).toBe(true);

      // Hand the turn back to us so our lifesteal refreshes for next cycle.
      expect(engine.endTurn().success).toBe(true);
    }

    // Watch-list assertion: lifesteal is NOT unbounded sustain. Three rounds of
    // a 6-for-3 trade must leave the hero strictly below 22 (we modeled net
    // -3/turn after the first wasted-cap heal, so hero ≤ 21 by spec).
    expect(state.players[0].hero.health).toBeLessThanOrEqual(21);
    expect(state.players[0].hero.health).toBeLessThan(startHp);
  });
});
