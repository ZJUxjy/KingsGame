import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import type { Card } from '@king-card/shared';

const blank: Card = {
  id: 'b', name: 'B', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 1, health: 1,
  description: '', keywords: [], effects: [],
};

describe('Player.deck after GameEngine.create', () => {
  it('contains CardInstance objects (not plain Card)', () => {
    const deck = Array.from({ length: 30 }, () => blank);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    for (const card of state.players[0].deck) {
      expect((card as any).instanceId).toBeDefined();
      expect((card as any).card).toBeDefined();
      expect((card as any).card.id).toBe('b');
    }
  });

  it('all instanceIds are unique across both players', () => {
    const deck = Array.from({ length: 30 }, () => blank);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);
    const state = engine.getGameState();

    const ids = [
      ...state.players[0].deck.map((c: any) => c.instanceId),
      ...state.players[1].deck.map((c: any) => c.instanceId),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
