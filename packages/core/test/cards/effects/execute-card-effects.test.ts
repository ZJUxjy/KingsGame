import { describe, it, expect, beforeEach } from 'vitest';
import { executeCardEffects } from '../../../src/cards/effects/index.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import { createStateMutator } from '../../../src/engine/state-mutator.js';
import { createCardInstance } from '../../../src/models/card-instance.js';
import { IdCounter } from '../../../src/engine/id-counter.js';
import type { Card, EffectContext, GameState } from '@king-card/shared';

let counter: IdCounter;

function makeMinionCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    id: overrides.id,
    name: `Minion ${overrides.id}`,
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 2,
    health: 3,
    description: 'A test minion',
    keywords: [],
    effects: [],
    ...overrides,
  };
}

function makeGameState(): GameState {
  return {
    players: [
      {
        id: 'p1',
        name: 'Player 1',
        hero: {
          health: 30,
          maxHealth: 30,
          armor: 0,
          heroSkill: {
            name: 'Skill',
            description: '',
            cost: 0,
            cooldown: 0,
            effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} },
          },
          skillUsedThisTurn: false,
          skillCooldownRemaining: 0,
        },
        civilization: 'CHINA',
        hand: [],
        handLimit: 10,
        deck: [],
        graveyard: [],
        battlefield: [],
        activeStratagems: [],
        costModifiers: [],
        costReduction: 0,
        energyCrystal: 5,
        maxEnergy: 5,
        cannotDrawNextTurn: false,
        ministerPool: [],
        activeMinisterIndex: -1,
        boundCards: [],
      },
      {
        id: 'p2',
        name: 'Player 2',
        hero: {
          health: 30,
          maxHealth: 30,
          armor: 0,
          heroSkill: {
            name: 'Skill',
            description: '',
            cost: 0,
            cooldown: 0,
            effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} },
          },
          skillUsedThisTurn: false,
          skillCooldownRemaining: 0,
        },
        civilization: 'JAPAN',
        hand: [],
        handLimit: 10,
        deck: [],
        graveyard: [],
        battlefield: [],
        activeStratagems: [],
        costModifiers: [],
        costReduction: 0,
        energyCrystal: 5,
        maxEnergy: 5,
        cannotDrawNextTurn: false,
        ministerPool: [],
        activeMinisterIndex: -1,
        boundCards: [],
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
  counter = new IdCounter();
  const bus = new EventBus();
  const state = makeGameState();
  const mutator = createStateMutator(state, bus, undefined, counter);

  return { state, bus, mutator, counter };
}

describe('executeCardEffects', () => {
  beforeEach(() => {
    counter = new IdCounter();
  });

  it('should apply DAMAGE to a targeted enemy minion', () => {
    const { state, bus, mutator } = setup();

    const source = createCardInstance(
      makeMinionCard({
        id: 'damage_source',
        type: 'GENERAL',
        rarity: 'LEGENDARY',
        cost: 7,
        attack: 6,
        health: 6,
        effects: [
          {
            trigger: 'ON_PLAY',
            type: 'DAMAGE',
            params: { target: 'ENEMY_MINION', amount: 6 },
          },
        ],
      }),
      0,
      counter,
    );

    const target = createCardInstance(
      makeMinionCard({ id: 'enemy_target', health: 5 }),
      1,
      counter,
    );
    state.players[1].battlefield.push(target);

    const damageEvents: Array<{ type: string; amount: number }> = [];
    bus.on('DAMAGE_DEALT', (event) => {
      if (event.type === 'DAMAGE_DEALT') {
        damageEvents.push({ type: event.type, amount: event.amount });
      }
    });

    const ctx: EffectContext = {
      state,
      mutator,
      source,
      target,
      playerIndex: 0,
      eventBus: bus,
      rng: {
        nextInt: (min) => min,
        next: () => 0,
        pick: (arr) => arr[0]!,
        shuffle: (arr) => [...arr],
      },
      counter,
    };

    executeCardEffects('ON_PLAY', ctx);

    expect(state.players[1].battlefield).toHaveLength(0);
    expect(state.players[1].graveyard).toContain(target.card);
    expect(damageEvents).toContainEqual({ type: 'DAMAGE_DEALT', amount: 6 });
  });

  it('should not apply targeted DAMAGE when no explicit target is provided', () => {
    const { state, bus, mutator } = setup();

    const source = createCardInstance(
      makeMinionCard({
        id: 'damage_source_without_target',
        effects: [
          {
            trigger: 'ON_PLAY',
            type: 'DAMAGE',
            params: { target: 'ENEMY_MINION', amount: 3 },
          },
        ],
      }),
      0,
      counter,
    );
    const enemyTarget = createCardInstance(makeMinionCard({ id: 'enemy_target_noop', health: 5 }), 1, counter);

    state.players[0].battlefield.push(source);
    state.players[1].battlefield.push(enemyTarget);

    const ctx: EffectContext = {
      state,
      mutator,
      source,
      playerIndex: 0,
      eventBus: bus,
      rng: {
        nextInt: (min) => min,
        next: () => 0,
        pick: (arr) => arr[0]!,
        shuffle: (arr) => [...arr],
      },
      counter,
    };

    executeCardEffects('ON_PLAY', ctx);

    expect(source.currentHealth).toBe(3);
    expect(state.players[0].battlefield).toContain(source);
    expect(enemyTarget.currentHealth).toBe(5);
    expect(state.players[1].battlefield).toContain(enemyTarget);
  });

  it('should not apply targeted APPLY_BUFF when no explicit target is provided', () => {
    const { state, bus, mutator } = setup();

    const source = createCardInstance(
      makeMinionCard({
        id: 'buff_source_without_target',
        effects: [
          {
            trigger: 'ON_PLAY',
            type: 'APPLY_BUFF',
            params: {
              target: 'FRIENDLY_MINION',
              attackBonus: 2,
              healthBonus: 1,
              type: 'TEMPORARY',
              remainingTurns: 1,
            },
          },
        ],
      }),
      0,
      counter,
    );
    const friendlyTarget = createCardInstance(makeMinionCard({ id: 'friendly_target_noop' }), 0, counter);

    state.players[0].battlefield.push(source, friendlyTarget);

    const ctx: EffectContext = {
      state,
      mutator,
      source,
      playerIndex: 0,
      eventBus: bus,
      rng: {
        nextInt: (min) => min,
        next: () => 0,
        pick: (arr) => arr[0]!,
        shuffle: (arr) => [...arr],
      },
      counter,
    };

    executeCardEffects('ON_PLAY', ctx);

    expect(source.currentAttack).toBe(2);
    expect(source.currentHealth).toBe(3);
    expect(source.buffs).toHaveLength(0);
    expect(friendlyTarget.currentAttack).toBe(2);
    expect(friendlyTarget.currentHealth).toBe(3);
    expect(friendlyTarget.buffs).toHaveLength(0);
  });

  it('should apply CONDITIONAL_BUFF when enough cards were played this turn', () => {
    const { state, bus, mutator } = setup();
    state.players[0].cardsPlayedThisTurn = 2;

    const source = createCardInstance(
      makeMinionCard({
        id: 'mobilize_source',
        effects: [
          {
            trigger: 'ON_PLAY',
            type: 'CONDITIONAL_BUFF',
            params: {
              mobilizeThreshold: 2,
              attackBonus: 1,
              healthBonus: 1,
            },
          },
        ],
      }),
      0,
      counter,
    );
    state.players[0].battlefield.push(source);

    const ctx: EffectContext = {
      state,
      mutator,
      source,
      playerIndex: 0,
      eventBus: bus,
      rng: {
        nextInt: (min) => min,
        next: () => 0,
        pick: (arr) => arr[0]!,
        shuffle: (arr) => [...arr],
      },
      counter,
    };

    executeCardEffects('ON_PLAY', ctx);

    expect(source.currentAttack).toBe(3);
    expect(source.currentHealth).toBe(4);
    expect(source.buffs).toHaveLength(1);
    expect(source.buffs[0].type).toBe('PERMANENT');
  });

  it('should draw from CONDITIONAL_BUFF effects that unlock on threshold', () => {
    const { state, bus, mutator } = setup();
    state.players[0].cardsPlayedThisTurn = 3;
    state.players[0].deck.push(makeMinionCard({ id: 'draw_target' }));

    const source = createCardInstance(
      makeMinionCard({
        id: 'mobilize_draw_source',
        effects: [
          {
            trigger: 'ON_PLAY',
            type: 'CONDITIONAL_BUFF',
            params: {
              mobilizeThreshold: 3,
              drawCount: 1,
            },
          },
        ],
      }),
      0,
      counter,
    );

    const ctx: EffectContext = {
      state,
      mutator,
      source,
      playerIndex: 0,
      eventBus: bus,
      rng: {
        nextInt: (min) => min,
        next: () => 0,
        pick: (arr) => arr[0]!,
        shuffle: (arr) => [...arr],
      },
      counter,
    };

    executeCardEffects('ON_PLAY', ctx);

    expect(state.players[0].hand).toHaveLength(1);
    expect(state.players[0].hand[0].id).toBe('draw_target');
  });

  it('should DAMAGE only one random enemy minion when using RANDOM_ENEMY_MINION', () => {
    const { state, bus, mutator } = setup();

    const source = createCardInstance(
      makeMinionCard({
        id: 'random_damage_source',
        effects: [
          {
            trigger: 'ON_PLAY',
            type: 'DAMAGE',
            params: { targetFilter: 'RANDOM_ENEMY_MINION', amount: 3 },
          },
        ],
      }),
      0,
      counter,
    );
    state.players[0].battlefield.push(source);

    const enemyA = createCardInstance(makeMinionCard({ id: 'enemy_a', health: 8 }), 1, counter);
    const enemyB = createCardInstance(makeMinionCard({ id: 'enemy_b', health: 8 }), 1, counter);
    state.players[1].battlefield.push(enemyA, enemyB);

    const damageEvents: number[] = [];
    bus.on('DAMAGE_DEALT', (event) => {
      if (event.type === 'DAMAGE_DEALT') {
        damageEvents.push(event.amount);
      }
    });

    const ctx: EffectContext = {
      state,
      mutator,
      source,
      playerIndex: 0,
      eventBus: bus,
      rng: {
        nextInt: (min) => min,
        next: () => 0,
        pick: (arr) => arr[0]!,
        shuffle: (arr) => [...arr],
      },
      counter,
    };

    executeCardEffects('ON_PLAY', ctx);

    expect(damageEvents).toEqual([3]);
    expect(enemyA.currentHealth).toBe(5);
    expect(enemyB.currentHealth).toBe(8);
  });

  it('should respect legacy DAMAGE params.target RANDOM_ENEMY_MINION as random pick', () => {
    const { state, bus, mutator } = setup();

    const source = createCardInstance(
      makeMinionCard({
        id: 'legacy_random_source',
        effects: [
          {
            trigger: 'ON_PLAY',
            type: 'DAMAGE',
            params: { target: 'RANDOM_ENEMY_MINION', amount: 2 },
          },
        ],
      }),
      0,
      counter,
    );
    state.players[0].battlefield.push(source);

    const enemyA = createCardInstance(makeMinionCard({ id: 'e1', health: 5 }), 1, counter);
    const enemyB = createCardInstance(makeMinionCard({ id: 'e2', health: 5 }), 1, counter);
    state.players[1].battlefield.push(enemyA, enemyB);

    const ctx: EffectContext = {
      state,
      mutator,
      source,
      playerIndex: 0,
      eventBus: bus,
      rng: {
        nextInt: (min) => min,
        next: () => 0,
        pick: (arr) => arr[0]!,
        shuffle: (arr) => [...arr],
      },
      counter,
    };

    executeCardEffects('ON_PLAY', ctx);

    expect(enemyA.currentHealth).toBe(3);
    expect(enemyB.currentHealth).toBe(5);
  });

  it('should HEAL all friendly minions when targetFilter is ALL_FRIENDLY_MINIONS', () => {
    const { state, bus, mutator } = setup();

    const source = createCardInstance(
      makeMinionCard({
        id: 'medic_like',
        effects: [
          {
            trigger: 'ON_PLAY',
            type: 'HEAL',
            params: { targetFilter: 'ALL_FRIENDLY_MINIONS', amount: 1 },
          },
        ],
      }),
      0,
      counter,
    );
    const allyA = createCardInstance(makeMinionCard({ id: 'ally_a', health: 5 }), 0, counter);
    const allyB = createCardInstance(makeMinionCard({ id: 'ally_b', health: 5 }), 0, counter);
    source.currentHealth = 1;
    allyA.currentHealth = 2;
    allyB.currentHealth = 3;
    state.players[0].battlefield.push(source, allyA, allyB);

    const ctx: EffectContext = {
      state,
      mutator,
      source,
      playerIndex: 0,
      eventBus: bus,
      rng: {
        nextInt: (min) => min,
        next: () => 0,
        pick: (arr) => arr[0]!,
        shuffle: (arr) => [...arr],
      },
      counter,
    };

    executeCardEffects('ON_PLAY', ctx);

    expect(source.currentHealth).toBe(2);
    expect(allyA.currentHealth).toBe(3);
    expect(allyB.currentHealth).toBe(4);
  });

  it('should HEAL friendly hero when HEAL params omit target and targetFilter', () => {
    const { state, bus, mutator } = setup();

    const source = createCardInstance(
      makeMinionCard({
        id: 'heal_hero_source',
        effects: [{ trigger: 'ON_PLAY', type: 'HEAL', params: { amount: 5 } }],
      }),
      0,
      counter,
    );
    state.players[0].battlefield.push(source);
    state.players[0].hero.health = 10;

    const ctx: EffectContext = {
      state,
      mutator,
      source,
      playerIndex: 0,
      eventBus: bus,
      rng: {
        nextInt: (min) => min,
        next: () => 0,
        pick: (arr) => arr[0]!,
        shuffle: (arr) => [...arr],
      },
      counter,
    };

    executeCardEffects('ON_PLAY', ctx);

    expect(state.players[0].hero.health).toBe(15);
  });
});