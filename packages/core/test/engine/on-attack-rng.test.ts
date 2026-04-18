import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import {
  registerEffectHandler, clearEffectHandlers, getRegisteredHandlers,
} from '../../src/cards/effects/registry.js';
import { createCardInstance } from '../../src/models/card-instance.js';
import { SeededRNG } from '../../src/engine/rng.js';
import type { EffectHandler, Card, EffectContext } from '@king-card/shared';

const attackerCard: Card = {
  id: 'rng_striker', name: 'RNG Striker', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 3, health: 3,
  description: '', keywords: ['CHARGE'], effects: [],
};

describe('ON_ATTACK EffectContext.rng (Followup #8)', () => {
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

  it('passes the engine RNG (not a hardcoded zero stub) to ON_ATTACK handlers', () => {
    const deck = Array.from({ length: 30 }, () => attackerCard);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    // Use a SeededRNG so we get a deterministic, *non-zero* sequence.
    const rng = new SeededRNG(123);
    const engine = GameEngine.create(deck, deck, emperor, emperor, rng);
    const state = engine.getGameState();

    const inst = createCardInstance(attackerCard, 0, engine.getCounter());
    inst.remainingAttacks = 1;
    inst.justPlayed = false;
    state.players[0].battlefield.push(inst);

    captured.length = 0;
    engine.attack(inst.instanceId, { type: 'HERO', playerIndex: 1 });
    expect(captured).toHaveLength(1);

    // The old code used `{ nextInt: () => 0, ... }`, so any nextInt
    // call would always return the lower bound. With the real
    // SeededRNG threaded through, calling nextInt(1, 100) repeatedly
    // produces values that vary and are not pinned to 1.
    const samples = Array.from({ length: 8 }, () => captured[0].rng.nextInt(1, 100));
    expect(samples.every((n) => n >= 1 && n <= 100)).toBe(true);
    expect(new Set(samples).size).toBeGreaterThan(1);
    expect(samples.some((n) => n !== 1)).toBe(true);
  });
});
