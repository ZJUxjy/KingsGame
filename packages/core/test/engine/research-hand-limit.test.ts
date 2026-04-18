import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import { createCardInstance } from '../../src/models/card-instance.js';
import { IdCounter } from '../../src/engine/id-counter.js';
import { resolveEffects } from '../../src/cards/effects/registry.js';
import { createStateMutator } from '../../src/engine/state-mutator.js';
import { DefaultRNG } from '../../src/engine/rng.js';
import { GAME_CONSTANTS } from '@king-card/shared';
import type { Card, GameEvent } from '@king-card/shared';

const sorcery: Card = {
  id: 'spell',
  name: 'Spell',
  civilization: 'CHINA',
  type: 'SORCERY',
  rarity: 'COMMON',
  cost: 1,
  description: '',
  keywords: [],
  effects: [{ trigger: 'ON_PLAY', type: 'DAMAGE', params: { amount: 1, target: 'ENEMY_HERO' } }],
};

const researcher: Card = {
  id: 'researcher',
  name: 'Researcher',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 2,
  attack: 1,
  health: 1,
  description: '',
  keywords: ['RESEARCH'],
  effects: [],
};

function buildScenario() {
  const counter = new IdCounter();
  const engine = GameEngine.create(
    [researcher, sorcery, sorcery, sorcery],
    [researcher, sorcery, sorcery, sorcery],
    ALL_EMPEROR_DATA_LIST[0],
    ALL_EMPEROR_DATA_LIST[0],
  );
  const state = engine.getGameState() as ReturnType<typeof engine.getGameState> & {
    players: Array<{ deck: Card[]; hand: Card[]; graveyard: Card[]; handLimit: number }>;
  };
  return { counter, state };
}

describe('RESEARCH respects handLimit and emits events through mutator', () => {
  it('emits CARD_DRAWN and adds the card when hand has room', () => {
    const { counter, state } = buildScenario();
    state.players[0].deck = [sorcery];
    state.players[0].hand = [];
    const handBefore = state.players[0].hand.length;

    const events: GameEvent[] = [];
    const collectingBus = { emit: (e: GameEvent) => events.push(e) };
    const mutator = createStateMutator(state, collectingBus, new DefaultRNG(), counter);
    const minion = createCardInstance(researcher, 0, counter);

    resolveEffects('ON_PLAY', {
      state,
      mutator,
      source: minion,
      playerIndex: 0,
      eventBus: {
        emit: (e: unknown) => collectingBus.emit(e as GameEvent),
        on: () => () => {},
        removeAllListeners: () => {},
      },
      rng: new DefaultRNG(),
      counter,
    });

    expect(state.players[0].hand.length).toBe(handBefore + 1);
    expect(events.some((e) => e.type === 'CARD_DRAWN')).toBe(true);
  });

  it('does NOT exceed handLimit and emits CARD_DISCARDED instead', () => {
    const { counter, state } = buildScenario();
    state.players[0].deck = [sorcery];
    state.players[0].hand = Array.from(
      { length: GAME_CONSTANTS.MAX_HAND_SIZE },
      () => ({ ...sorcery }),
    );
    const handBefore = state.players[0].hand.length;
    const graveBefore = state.players[0].graveyard.length;

    const events: GameEvent[] = [];
    const collectingBus = { emit: (e: GameEvent) => events.push(e) };
    const mutator = createStateMutator(state, collectingBus, new DefaultRNG(), counter);
    const minion = createCardInstance(researcher, 0, counter);

    resolveEffects('ON_PLAY', {
      state,
      mutator,
      source: minion,
      playerIndex: 0,
      eventBus: {
        emit: (e: unknown) => collectingBus.emit(e as GameEvent),
        on: () => () => {},
        removeAllListeners: () => {},
      },
      rng: new DefaultRNG(),
      counter,
    });

    expect(state.players[0].hand.length).toBe(handBefore);
    expect(state.players[0].graveyard.length).toBe(graveBefore + 1);
    expect(events.some((e) => e.type === 'CARD_DISCARDED')).toBe(true);
    expect(events.some((e) => e.type === 'CARD_DRAWN')).toBe(false);
  });
});
