import { describe, it, expect } from 'vitest';
import { createStateMutator } from '../../../src/engine/state-mutator.js';
import { createCardInstance } from '../../../src/models/card-instance.js';
import { IdCounter } from '../../../src/engine/id-counter.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import type { Buff, Card, GameState, GameEvent } from '@king-card/shared';

// ─── Test Fixtures ───────────────────────────────────────────────

function makeShieldedCard(): Card {
  return {
    id: 'test_shielded_minion',
    name: 'Shielded Minion',
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 1,
    health: 2,
    description: 'A test minion with DIVINE_SHIELD',
    keywords: ['DIVINE_SHIELD'],
    effects: [],
  };
}

function makeVanillaCard(): Card {
  return {
    id: 'test_vanilla_minion',
    name: 'Vanilla Minion',
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 1,
    health: 3,
    description: 'A test minion with no keywords',
    keywords: [],
    effects: [],
  };
}

function makeGameState(): GameState {
  const baseHero = {
    health: 30,
    maxHealth: 30,
    armor: 0,
    heroSkill: {
      name: 'Skill',
      description: '',
      cost: 0,
      cooldown: 0,
      effect: { trigger: 'ON_PLAY' as const, type: 'DAMAGE' as const, params: {} },
    },
    skillUsedThisTurn: false,
    skillCooldownRemaining: 0,
  };
  const basePlayer = {
    hand: [],
    handLimit: 10,
    deck: [],
    graveyard: [],
    battlefield: [],
    activeStratagems: [],
    costModifiers: [],
    costReduction: 0,
    energyCrystal: 5,
    maxEnergy: 10,
    cannotDrawNextTurn: false,
    ministerPool: [],
    activeMinisterIndex: -1,
    boundCards: [],
  };
  return {
    players: [
      {
        id: 'p1',
        name: 'Player 1',
        hero: { ...baseHero },
        civilization: 'CHINA',
        ...basePlayer,
      },
      {
        id: 'p2',
        name: 'Player 2',
        hero: { ...baseHero },
        civilization: 'JAPAN',
        ...basePlayer,
      },
    ],
    currentPlayerIndex: 0,
    turnNumber: 1,
    phase: 'MAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
  };
}

function setup() {
  const counter = new IdCounter();
  const bus = new EventBus();
  const events: GameEvent[] = [];
  // Capture every emitted event for later assertion.
  const originalEmit = bus.emit.bind(bus);
  bus.emit = (event: GameEvent) => {
    events.push(event);
    originalEmit(event);
  };
  const state = makeGameState();
  const mutator = createStateMutator(state, bus, undefined, counter);

  // Place a shielded 1/2 on player 0's battlefield.
  const minion = createCardInstance(makeShieldedCard(), 0, counter);
  state.players[0].battlefield.push(minion);

  return { state, bus, mutator, events, minion };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('DIVINE_SHIELD keyword', () => {
  it('absorbs the first damage instance and removes the keyword', () => {
    const { mutator, events, minion } = setup();

    const result = mutator.damage({ type: 'MINION', instanceId: minion.instanceId }, 5);

    expect(result).toBeNull();
    expect(minion.currentHealth).toBe(2);
    expect(minion.card.keywords).not.toContain('DIVINE_SHIELD');
    const brokenEvents = events.filter((e) => e.type === 'DIVINE_SHIELD_BROKEN');
    expect(brokenEvents).toHaveLength(1);

    // Lock the contract Tasks 2/4 (POISONOUS/LIFESTEAL) depend on:
    // when shield absorbs the hit, a DAMAGE_DEALT { amount: 0 } event is emitted
    // AND DIVINE_SHIELD_BROKEN comes before it, so downstream hooks can observe
    // "shield broke → no real damage was dealt".
    const damageEvents = events.filter((e) => e.type === 'DAMAGE_DEALT');
    expect(damageEvents).toHaveLength(1);
    expect(damageEvents[0]).toMatchObject({ amount: 0 });

    const types = events.map((e) => e.type);
    expect(types.indexOf('DIVINE_SHIELD_BROKEN'))
      .toBeLessThan(types.indexOf('DAMAGE_DEALT'));
  });

  it('does not absorb 0-damage hits (no keyword waste)', () => {
    const { mutator, events, minion } = setup();

    mutator.damage({ type: 'MINION', instanceId: minion.instanceId }, 0);

    expect(minion.card.keywords).toContain('DIVINE_SHIELD');
    expect(minion.currentHealth).toBe(2);
    expect(events.find((e) => e.type === 'DIVINE_SHIELD_BROKEN')).toBeUndefined();
  });

  it('subsequent damage after shield broken hits normally', () => {
    const { mutator, minion } = setup();

    mutator.damage({ type: 'MINION', instanceId: minion.instanceId }, 5);
    expect(minion.card.keywords).not.toContain('DIVINE_SHIELD');
    expect(minion.currentHealth).toBe(2);

    mutator.damage({ type: 'MINION', instanceId: minion.instanceId }, 1);

    expect(minion.currentHealth).toBe(1);
    expect(minion.card.keywords).not.toContain('DIVINE_SHIELD');
  });

  it('absorbs damage when DIVINE_SHIELD was granted by a buff', () => {
    const counter = new IdCounter();
    const bus = new EventBus();
    const events: GameEvent[] = [];
    const originalEmit = bus.emit.bind(bus);
    bus.emit = (event: GameEvent) => {
      events.push(event);
      originalEmit(event);
    };
    const state = makeGameState();
    const mutator = createStateMutator(state, bus, undefined, counter);

    // Vanilla 1/3 with no keywords on the card definition.
    const minion = createCardInstance(makeVanillaCard(), 0, counter);
    state.players[0].battlefield.push(minion);
    expect(minion.card.keywords).not.toContain('DIVINE_SHIELD');

    // Grant DIVINE_SHIELD via a buff (the buff-application path).
    const buff: Buff = {
      id: 'test-buff-1',
      attackBonus: 0,
      healthBonus: 0,
      maxHealthBonus: 0,
      type: 'TEMPORARY',
      keywordsGranted: ['DIVINE_SHIELD'],
    };
    mutator.applyBuff({ type: 'MINION', instanceId: minion.instanceId }, buff);
    expect(minion.card.keywords).toContain('DIVINE_SHIELD');

    // The same state-mutator interception path should fire for buff-granted shields.
    mutator.damage({ type: 'MINION', instanceId: minion.instanceId }, 5);

    expect(minion.currentHealth).toBe(3);
    expect(minion.card.keywords).not.toContain('DIVINE_SHIELD');
    expect(events.filter((e) => e.type === 'DIVINE_SHIELD_BROKEN')).toHaveLength(1);
  });
});
