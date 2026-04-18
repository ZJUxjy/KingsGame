import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import { createCardInstance } from '../../src/models/card-instance.js';
import type { Card } from '@king-card/shared';

const trooper: Card = {
  id: 'trooper',
  name: 'Trooper',
  civilization: 'USA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 5,
  description: '',
  keywords: ['MOBILIZATION_ORDER'],
  effects: [],
};

const filler: Card = {
  id: 'filler',
  name: 'Filler',
  civilization: 'USA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 1,
  description: '',
  keywords: [],
  effects: [],
};

describe('MOBILIZATION_ORDER applies a TEMPORARY buff, not stacking', () => {
  it('does not stack +1 attack across multiple turns', () => {
    const deck = Array.from({ length: 30 }, () => filler);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    const counter = engine.getCounter();
    const insts = [
      createCardInstance(trooper, 0, counter),
      createCardInstance(trooper, 0, counter),
      createCardInstance(trooper, 0, counter),
    ];
    state.players[0].battlefield.push(...insts);

    // End player 0's turn -> goes through end + start of player 1
    engine.endTurn();
    // End player 1's turn -> back to player 0, MOBILIZATION_ORDER fires for the first time
    engine.endTurn();

    const after1 = state.players[0].battlefield.map((m) => m.currentAttack);
    expect(after1.every((a) => a === 2)).toBe(true);

    // Two more endTurn() -> back to player 0 again, MOBILIZATION_ORDER fires again
    engine.endTurn();
    engine.endTurn();

    const after2 = state.players[0].battlefield.map((m) => m.currentAttack);
    // If buff is properly TEMPORARY (expired before re-application): still 2 (1 base + 1 fresh buff)
    // If buggy (stacking permanently): would be 3
    expect(after2.every((a) => a === 2)).toBe(true);

    // One more full round, still 2
    engine.endTurn();
    engine.endTurn();

    const after3 = state.players[0].battlefield.map((m) => m.currentAttack);
    expect(after3.every((a) => a === 2)).toBe(true);
  });

  it('does not trigger with <3 minions on the battlefield', () => {
    const deck = Array.from({ length: 30 }, () => filler);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    const counter = engine.getCounter();
    const insts = [
      createCardInstance(trooper, 0, counter),
      createCardInstance(trooper, 0, counter),
    ];
    state.players[0].battlefield.push(...insts);

    engine.endTurn();
    engine.endTurn();

    const attacks = state.players[0].battlefield.map((m) => m.currentAttack);
    expect(attacks.every((a) => a === 1)).toBe(true);
  });
});
