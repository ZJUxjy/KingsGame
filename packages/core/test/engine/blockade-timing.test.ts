import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import { createCardInstance } from '../../src/models/card-instance.js';
import { IdCounter } from '../../src/engine/id-counter.js';
import type { Card, GameEvent } from '@king-card/shared';

const blockader: Card = {
  id: 'blockader',
  name: 'Blockader',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 5,
  description: '',
  keywords: ['BLOCKADE'],
  effects: [],
};

const filler: Card = {
  id: 'filler',
  name: 'Filler',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 1,
  description: '',
  keywords: [],
  effects: [],
};

/**
 * Advance turns until it's player 1's turn AND their maxEnergy is at least
 * `minMaxEnergy`. Stops early on game over. Returns nothing; caller asserts
 * on `state` afterwards.
 *
 * Needed because ENERGY_PER_TURN = 1 and maxEnergy starts at 0, so on
 * player 1's first turn maxEnergy = 1 — at that point even 5 BLOCKADEs
 * clamp to a 1-point reduction, which makes "reduce by 2" indistinguishable
 * from "reduce by 1". Push to a turn where the difference is observable.
 */
function advanceToPlayer1WithMaxEnergy(
  engine: GameEngine,
  minMaxEnergy: number,
): void {
  const state = engine.getGameState();
  while (!state.isGameOver) {
    if (
      state.currentPlayerIndex === 1 &&
      state.players[1].maxEnergy >= minMaxEnergy
    ) {
      return;
    }
    engine.endTurn();
  }
}

describe('BLOCKADE reduces opponent effective energy each turn', () => {
  it('opponent has maxEnergy - 1 at the start of their turn while a BLOCKADE is alive', () => {
    const deck = Array.from({ length: 30 }, () => filler);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    const counter = new IdCounter();
    const minion = createCardInstance(blockader, 0, counter);
    state.players[0].battlefield.push(minion);

    advanceToPlayer1WithMaxEnergy(engine, 2);

    expect(state.currentPlayerIndex).toBe(1);
    expect(state.players[1].maxEnergy).toBeGreaterThanOrEqual(2);
    expect(state.players[1].energyCrystal).toBe(state.players[1].maxEnergy - 1);
  });

  it('two BLOCKADE minions reduce by 2 (when maxEnergy >= 2)', () => {
    const deck = Array.from({ length: 30 }, () => filler);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    const counter = new IdCounter();
    state.players[0].battlefield.push(createCardInstance(blockader, 0, counter));
    state.players[0].battlefield.push(createCardInstance(blockader, 0, counter));

    // Need maxEnergy >= 2 so a "buggy single-counted" reduction (=1)
    // would leave energyCrystal = 1, distinguishable from the correct
    // double reduction (=0). Push to maxEnergy >= 3 to make the
    // assertion non-trivially > 0.
    advanceToPlayer1WithMaxEnergy(engine, 3);

    expect(state.currentPlayerIndex).toBe(1);
    expect(state.players[1].maxEnergy).toBeGreaterThanOrEqual(3);
    expect(state.players[1].energyCrystal).toBe(state.players[1].maxEnergy - 2);
  });

  it('emits ENERGY_SPENT with reason: BLOCKADE on the penalty', () => {
    const deck = Array.from({ length: 30 }, () => filler);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    const counter = new IdCounter();
    state.players[0].battlefield.push(createCardInstance(blockader, 0, counter));

    const events: GameEvent[] = [];
    engine.onEvent('ENERGY_SPENT', (e) => events.push(e));

    advanceToPlayer1WithMaxEnergy(engine, 2);

    const blockadeSpend = events.find(
      (e) => e.type === 'ENERGY_SPENT' && (e as { reason?: string }).reason === 'BLOCKADE',
    );
    expect(blockadeSpend).toBeDefined();
    expect((blockadeSpend as { reason?: string }).reason).toBe('BLOCKADE');
    expect((blockadeSpend as { playerIndex: number }).playerIndex).toBe(1);
  });

  it('clamps reduction at 0 when blockaders > maxEnergy', () => {
    const deck = Array.from({ length: 30 }, () => filler);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    const counter = new IdCounter();
    for (let i = 0; i < 5; i++) {
      state.players[0].battlefield.push(createCardInstance(blockader, 0, counter));
    }

    // First switch to player 1 → their first turn, maxEnergy = 1.
    // 5 BLOCKADEs would over-reduce to -4; clamping must yield 0.
    engine.endTurn();

    expect(state.currentPlayerIndex).toBe(1);
    expect(state.players[1].maxEnergy).toBe(1);
    expect(state.players[1].energyCrystal).toBe(0);
  });
});
