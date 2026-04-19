import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../../src/cards/definitions/index.js';
import { createCardInstance } from '../../../src/models/card-instance.js';
import type { Card } from '@king-card/shared';

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
 * Build an engine with a vanilla deck and place attacker / defender directly
 * on the battlefield. Per-test code is responsible for tweaking
 * remainingAttacks / justPlayed / etc. to match the scenario.
 */
function setupDuel(opts: { attacker: Card; defender?: Card }) {
  const filler = makeMinionCard({ id: 'filler' });
  const deck = Array.from({ length: 30 }, () => filler);
  const emperor = ALL_EMPEROR_DATA_LIST[0];
  const engine = GameEngine.create(deck, deck, emperor, emperor);
  const state = engine.getGameState();

  const attackerInst = createCardInstance(opts.attacker, 0, engine.getCounter());
  state.players[0].battlefield.push(attackerInst);

  let defenderInst: ReturnType<typeof createCardInstance> | undefined;
  if (opts.defender) {
    defenderInst = createCardInstance(opts.defender, 1, engine.getCounter());
    defenderInst.justPlayed = false;
    state.players[1].battlefield.push(defenderInst);
  }

  return { engine, state, attackerInst, defenderInst };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('WINDFURY keyword', () => {
  it('a windfury minion can attack twice per turn', () => {
    const attacker = makeMinionCard({
      id: 'wf_attacker',
      attack: 2,
      health: 10,
      keywords: ['WINDFURY'],
    });
    // Pillow defender: zero attack so we don't die from counter-strike, plenty
    // of HP so it survives both swings and we can try a third.
    const defender = makeMinionCard({
      id: 'pillow_defender',
      attack: 0,
      health: 20,
    });

    const { engine, state, attackerInst, defenderInst } = setupDuel({
      attacker,
      defender,
    });

    // Reset to a "freshly summoned, not allowed to attack yet" baseline so the
    // Phase-4a turn-start reset path is what hands out the WINDFURY 2 attacks.
    attackerInst.remainingAttacks = 0;
    attackerInst.justPlayed = true;

    // Cycle one full turn (player 0 -> player 1 -> player 0). The player 0
    // turn-start that runs at the second endTurn is the path under test.
    expect(engine.endTurn().success).toBe(true);
    expect(engine.endTurn().success).toBe(true);

    expect(attackerInst.remainingAttacks).toBe(2);

    const target = { type: 'MINION' as const, instanceId: defenderInst!.instanceId };

    const r1 = engine.attack(attackerInst.instanceId, target);
    expect(r1.success).toBe(true);
    expect(attackerInst.remainingAttacks).toBe(1);

    const r2 = engine.attack(attackerInst.instanceId, target);
    expect(r2.success).toBe(true);
    expect(attackerInst.remainingAttacks).toBe(0);

    const r3 = engine.attack(attackerInst.instanceId, target);
    expect(r3.success).toBe(false);
    expect(r3.errorCode).toBe('MINION_CANNOT_ATTACK');
  });

  it('a fresh-played CHARGE+WINDFURY minion attacks twice immediately', () => {
    const attacker = makeMinionCard({
      id: 'charge_wf',
      attack: 1,
      health: 5,
      keywords: ['CHARGE', 'WINDFURY'],
    });
    const defender = makeMinionCard({
      id: 'vanilla_defender',
      attack: 0,
      health: 5,
    });

    const { engine, state, attackerInst, defenderInst } = setupDuel({
      attacker,
      defender,
    });

    // Right out of createCardInstance, CHARGE+WINDFURY should already have 2
    // attacks (no turn-start needed). This is the contract under test.
    expect(attackerInst.remainingAttacks).toBe(2);

    const target = { type: 'MINION' as const, instanceId: defenderInst!.instanceId };

    const r1 = engine.attack(attackerInst.instanceId, target);
    expect(r1.success).toBe(true);

    const r2 = engine.attack(attackerInst.instanceId, target);
    expect(r2.success).toBe(true);

    expect(attackerInst.remainingAttacks).toBe(0);
  });

  it('a fresh-played RUSH+WINDFURY minion attacks twice but not the hero', () => {
    const attacker = makeMinionCard({
      id: 'rush_wf',
      attack: 1,
      health: 5,
      keywords: ['RUSH', 'WINDFURY'],
    });
    const defender = makeMinionCard({
      id: 'vanilla_defender',
      attack: 0,
      health: 5,
    });

    const { engine, state, attackerInst, defenderInst } = setupDuel({
      attacker,
      defender,
    });

    expect(attackerInst.remainingAttacks).toBe(2);

    // First swing: RUSH allows hitting a minion.
    const r1 = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInst!.instanceId,
    });
    expect(r1.success).toBe(true);

    // Second swing: still RUSH on the turn it was played, so hero is illegal.
    const r2 = engine.attack(attackerInst.instanceId, {
      type: 'HERO',
      playerIndex: 1,
    });
    expect(r2.success).toBe(false);
    expect(r2.errorCode).toBe('INVALID_TARGET');
  });

  it('frozen windfury minion attacks 0 times', () => {
    const attacker = makeMinionCard({
      id: 'frozen_wf',
      attack: 2,
      health: 3,
      keywords: ['WINDFURY'],
    });
    const defender = makeMinionCard({
      id: 'vanilla_defender',
      attack: 0,
      health: 5,
    });

    const { engine, state, attackerInst, defenderInst } = setupDuel({
      attacker,
      defender,
    });

    // Pretend turn-start already gave the WINDFURY minion its 2 attacks, but
    // the minion is currently frozen (e.g., from an opposing FREEZE effect).
    attackerInst.remainingAttacks = 2;
    attackerInst.justPlayed = false;
    attackerInst.frozenTurns = 1;

    const result = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInst!.instanceId,
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MINION_CANNOT_ATTACK');
    // The frozen check fires before any attack is consumed.
    expect(attackerInst.remainingAttacks).toBe(2);
  });
});
