import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import {
  registerEffectHandler,
  clearEffectHandlers,
  getRegisteredHandlers,
} from '../../src/cards/effects/registry.js';
import { createCardInstance } from '../../src/models/card-instance.js';
import { IdCounter } from '../../src/engine/id-counter.js';
import type { EffectHandler, Card } from '@king-card/shared';

const probeCard: Card = {
  id: 'probe', name: 'Probe', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 1, health: 1,
  description: '', keywords: ['BLOCKADE'], effects: [],
};

describe('ON_TURN_END trigger', () => {
  let calls = 0;
  let originalHandlers: readonly EffectHandler[] = [];

  beforeEach(() => {
    originalHandlers = [...getRegisteredHandlers()];
    clearEffectHandlers();
    calls = 0;
    registerEffectHandler({
      keyword: 'BLOCKADE',
      onTurnEnd: () => { calls += 1; },
    });
  });

  afterEach(() => {
    clearEffectHandlers();
    for (const h of originalHandlers) registerEffectHandler(h);
  });

  it('invokes handler.onTurnEnd for each friendly minion when the turn ends', () => {
    const deck = Array.from({ length: 30 }, () => probeCard);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    const counter = new IdCounter();
    const minion = createCardInstance(probeCard, 0, counter);
    state.players[0].battlefield.push(minion);

    calls = 0;
    engine.endTurn();
    expect(calls).toBe(1);
  });
});
