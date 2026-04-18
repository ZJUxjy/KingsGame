import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import {
  registerEffectHandler, clearEffectHandlers, getRegisteredHandlers,
} from '../../src/cards/effects/registry.js';
import { createCardInstance } from '../../src/models/card-instance.js';
import { IdCounter } from '../../src/engine/id-counter.js';
import type { EffectHandler, Card, EffectContext } from '@king-card/shared';

const attackerCard: Card = {
  id: 'striker', name: 'Striker', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 3, health: 3,
  description: '', keywords: ['CHARGE'], effects: [],
};

describe('ON_ATTACK trigger', () => {
  let captured: EffectContext[] = [];
  let saved: readonly EffectHandler[] = [];

  beforeEach(() => {
    saved = [...getRegisteredHandlers()];
    clearEffectHandlers();
    captured = [];
    registerEffectHandler({
      keyword: 'CHARGE',
      onAttack: (ctx) => { captured.push(ctx); },
    });
  });

  afterEach(() => {
    clearEffectHandlers();
    for (const h of saved) registerEffectHandler(h);
  });

  it('invokes handler.onAttack with the attacker as source', () => {
    const deck = Array.from({ length: 30 }, () => attackerCard);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    const counter = new IdCounter();
    const inst = createCardInstance(attackerCard, 0, counter);
    inst.remainingAttacks = 1;
    inst.justPlayed = false;
    state.players[0].battlefield.push(inst);

    captured.length = 0;
    engine.attack(inst.instanceId, { type: 'HERO', playerIndex: 1 });
    expect(captured).toHaveLength(1);
    expect(captured[0].source.instanceId).toBe(inst.instanceId);
  });
});
