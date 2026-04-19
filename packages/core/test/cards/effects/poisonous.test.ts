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
 * on the battlefield. We bypass card-play so the attacker is ready to swing
 * this turn regardless of CHARGE/RUSH.
 */
function setupDuel(opts: {
  attacker: Card;
  defender?: Card;
}) {
  const filler = makeMinionCard({ id: 'filler' });
  const deck = Array.from({ length: 30 }, () => filler);
  const emperor = ALL_EMPEROR_DATA_LIST[0];
  const engine = GameEngine.create(deck, deck, emperor, emperor);
  const state = engine.getGameState();

  const attackerInst = createCardInstance(opts.attacker, 0, engine.getCounter());
  attackerInst.remainingAttacks = 1;
  attackerInst.justPlayed = false;
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

describe('POISONOUS keyword', () => {
  it('1/1 poisonous attacker destroys a 5/5 vanilla defender', () => {
    const attacker = makeMinionCard({
      id: 'poison_attacker',
      attack: 1,
      health: 1,
      keywords: ['POISONOUS'],
    });
    const defender = makeMinionCard({
      id: 'big_vanilla',
      attack: 5,
      health: 5,
    });

    const { engine, state, attackerInst, defenderInst } = setupDuel({
      attacker,
      defender,
    });

    const result = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInst!.instanceId,
    });

    expect(result.success).toBe(true);
    expect(state.players[1].battlefield).toHaveLength(0);
    expect(state.players[1].graveyard.map((c) => c.id)).toContain(defender.id);
  });

  it('does not trigger when attacker deals 0 damage (e.g., target had Divine Shield)', () => {
    const attacker = makeMinionCard({
      id: 'poison_attacker',
      attack: 1,
      health: 1,
      keywords: ['POISONOUS'],
    });
    const defender = makeMinionCard({
      id: 'shielded_defender',
      attack: 0,
      health: 1,
      keywords: ['DIVINE_SHIELD'],
    });

    const { engine, state, attackerInst, defenderInst } = setupDuel({
      attacker,
      defender,
    });

    const result = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInst!.instanceId,
    });

    expect(result.success).toBe(true);
    // Defender survived: shield absorbed the hit, POISONOUS did NOT trigger.
    expect(state.players[1].battlefield).toHaveLength(1);
    const survivor = state.players[1].battlefield[0];
    expect(survivor.instanceId).toBe(defenderInst!.instanceId);
    expect(survivor.currentHealth).toBe(1);
    // Shield was consumed.
    expect(survivor.card.keywords).not.toContain('DIVINE_SHIELD');
  });

  it('does not trigger on hero attacks (only minion → minion)', () => {
    const attacker = makeMinionCard({
      id: 'poison_attacker',
      attack: 1,
      health: 1,
      keywords: ['POISONOUS'],
    });

    const { engine, state, attackerInst } = setupDuel({ attacker });

    const heroHpBefore = state.players[1].hero.health;
    const result = engine.attack(attackerInst.instanceId, {
      type: 'HERO',
      playerIndex: 1,
    });

    expect(result.success).toBe(true);
    expect(state.players[1].hero.health).toBe(heroHpBefore - 1);
    expect(state.players[1].hero.health).toBeGreaterThan(0);
  });

  it('triggers from defender side too: vanilla attacker hits poisonous defender → both die', () => {
    const attacker = makeMinionCard({
      id: 'big_vanilla',
      attack: 5,
      health: 5,
    });
    const defender = makeMinionCard({
      id: 'poison_defender',
      attack: 1,
      health: 1,
      keywords: ['POISONOUS'],
    });

    const { engine, state, attackerInst, defenderInst } = setupDuel({
      attacker,
      defender,
    });

    const result = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInst!.instanceId,
    });

    expect(result.success).toBe(true);
    // Defender crushed by 5 damage.
    expect(state.players[1].battlefield).toHaveLength(0);
    // Attacker poisoned by defender's counter-strike.
    expect(state.players[0].battlefield).toHaveLength(0);
    expect(state.players[0].graveyard.map((c) => c.id)).toContain(attacker.id);
  });
});
