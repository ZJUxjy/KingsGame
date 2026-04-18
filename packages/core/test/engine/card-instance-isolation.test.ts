import { describe, it, expect, beforeEach } from 'vitest';
import { createCardInstance } from '../../src/models/card-instance.js';
import { IdCounter } from '../../src/engine/id-counter.js';
import type { Card, GameState } from '@king-card/shared';
import { createStateMutator } from '../../src/engine/state-mutator.js';

let counter: IdCounter;

const BASE_CARD: Card = {
  id: 'test_minion', name: 'Test', civilization: 'CHINA',
  type: 'MINION', rarity: 'COMMON', cost: 2, attack: 2, health: 2,
  description: '', keywords: [], effects: [],
};

function makeGameState(): GameState {
  return {
    players: [
      {
        id: 'p0', name: 'P0', civilization: 'CHINA',
        hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: { name: 'X', description: 'X', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } }, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        hand: [], handLimit: 10, deck: [], graveyard: [],
        battlefield: [], activeStratagems: [], costModifiers: [], costReduction: 0,
        energyCrystal: 10, maxEnergy: 10, cannotDrawNextTurn: false,
        ministerPool: [], activeMinisterIndex: -1, boundCards: [],
      },
      {
        id: 'p1', name: 'P1', civilization: 'CHINA',
        hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: { name: 'X', description: 'X', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } }, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        hand: [], handLimit: 10, deck: [], graveyard: [],
        battlefield: [], activeStratagems: [], costModifiers: [], costReduction: 0,
        energyCrystal: 10, maxEnergy: 10, cannotDrawNextTurn: false,
        ministerPool: [], activeMinisterIndex: -1, boundCards: [],
      },
    ],
    currentPlayerIndex: 0, turnNumber: 1, phase: 'MAIN',
    isGameOver: false, winnerIndex: null, winReason: null,
  };
}

describe('Card instance isolation', () => {
  beforeEach(() => { counter = new IdCounter(); });

  it('two instances from the same Card share no mutable state', () => {
    const a = createCardInstance(BASE_CARD, 0, counter);
    const b = createCardInstance(BASE_CARD, 0, counter);
    expect(a.card).not.toBe(b.card);
    expect(a.card.keywords).not.toBe(b.card.keywords);
  });

  it('applyBuff does not mutate the original Card definition', () => {
    const state = makeGameState();
    const instance = createCardInstance(BASE_CARD, 0, counter);
    state.players[0].battlefield.push(instance);
    const bus = { emit: () => {} };
    const mutator = createStateMutator(state, bus, undefined, counter);

    mutator.applyBuff(
      { type: 'MINION', instanceId: instance.instanceId },
      {
        id: 'buff_1', attackBonus: 1, healthBonus: 1, maxHealthBonus: 1,
        keywordsGranted: ['TAUNT'], type: 'TEMPORARY', remainingTurns: 1,
      },
    );

    expect(instance.card.keywords).toContain('TAUNT');
    expect(BASE_CARD.keywords).not.toContain('TAUNT');
  });

  it('applyBuff on one instance does not leak to another', () => {
    const state = makeGameState();
    const a = createCardInstance(BASE_CARD, 0, counter);
    const b = createCardInstance(BASE_CARD, 0, counter);
    state.players[0].battlefield.push(a, b);
    const bus = { emit: () => {} };
    const mutator = createStateMutator(state, bus, undefined, counter);

    mutator.applyBuff(
      { type: 'MINION', instanceId: a.instanceId },
      {
        id: 'buff_1', attackBonus: 0, healthBonus: 0, maxHealthBonus: 0,
        keywordsGranted: ['CHARGE'], type: 'TEMPORARY', remainingTurns: 1,
      },
    );

    expect(a.card.keywords).toContain('CHARGE');
    expect(b.card.keywords).not.toContain('CHARGE');
  });

  it('removeBuff reverses keywords without affecting other instances', () => {
    const state = makeGameState();
    const a = createCardInstance(BASE_CARD, 0, counter);
    const b = createCardInstance(BASE_CARD, 0, counter);
    state.players[0].battlefield.push(a, b);
    const bus = { emit: () => {} };
    const mutator = createStateMutator(state, bus, undefined, counter);

    mutator.applyBuff(
      { type: 'MINION', instanceId: a.instanceId },
      {
        id: 'buff_1', attackBonus: 2, healthBonus: 2, maxHealthBonus: 2,
        keywordsGranted: ['RUSH'], type: 'TEMPORARY', remainingTurns: 1,
      },
    );

    mutator.applyBuff(
      { type: 'MINION', instanceId: b.instanceId },
      {
        id: 'buff_2', attackBonus: 0, healthBonus: 0, maxHealthBonus: 0,
        keywordsGranted: ['RUSH'], type: 'TEMPORARY', remainingTurns: 1,
      },
    );

    mutator.removeBuff({ type: 'MINION', instanceId: a.instanceId }, 'buff_1');
    expect(a.card.keywords).not.toContain('RUSH');
    expect(b.card.keywords).toContain('RUSH');
  });
});
