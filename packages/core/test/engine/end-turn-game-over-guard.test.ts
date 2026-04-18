import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import {
  registerEffectHandler,
  clearEffectHandlers,
  getRegisteredHandlers,
} from '../../src/cards/effects/registry.js';
import { createCardInstance } from '../../src/models/card-instance.js';
import type { Card, EffectHandler, GameEvent } from '@king-card/shared';

const colonyCard: Card = {
  id: 'colony_probe',
  name: 'ColonyProbe',
  civilization: 'UK',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 1,
  description: '',
  keywords: ['COLONY'],
  effects: [],
};

const filler: Card = {
  id: 'filler',
  name: 'Filler',
  civilization: 'UK',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 1,
  description: '',
  keywords: [],
  effects: [],
};

describe('executeEndTurn must not advance state after ON_TURN_END causes GAME_OVER', () => {
  let saved: readonly EffectHandler[] = [];

  beforeEach(() => {
    saved = [...getRegisteredHandlers()];
  });

  afterEach(() => {
    clearEffectHandlers();
    for (const h of saved) registerEffectHandler(h);
  });

  it('does not emit TURN_END or switch player when ON_TURN_END drains the deck', () => {
    const deck = Array.from({ length: 30 }, () => filler);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();
    const counter = engine.getCounter();

    state.players[0].battlefield.push(
      createCardInstance({ ...colonyCard, cost: 1 }, 0, counter),
      createCardInstance({ ...colonyCard, cost: 2 }, 0, counter),
      createCardInstance({ ...colonyCard, cost: 3 }, 0, counter),
    );
    state.players[0].deck = [];

    const events: GameEvent[] = [];
    engine.onEvent('TURN_END', (e) => events.push(e));
    engine.onEvent('GAME_OVER', (e) => events.push(e));

    const playerBefore = state.currentPlayerIndex;
    const turnBefore = state.turnNumber;

    engine.endTurn();

    expect(events.some((e) => e.type === 'GAME_OVER')).toBe(true);
    expect(events.some((e) => e.type === 'TURN_END')).toBe(false);
    expect(state.currentPlayerIndex).toBe(playerBefore);
    expect(state.turnNumber).toBe(turnBefore);
    expect(state.isGameOver).toBe(true);
  });
});
