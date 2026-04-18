import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../src/cards/definitions/index.js';
import type { Card, GameEvent } from '@king-card/shared';

const blank: Card = {
  id: 'b',
  name: 'B',
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

describe('TURN_END event semantics', () => {
  it('reports the player and turnNumber that just ended (not the next one)', () => {
    const deck = Array.from({ length: 30 }, () => blank);
    const emperor = ALL_EMPEROR_DATA_LIST[0];
    const engine = GameEngine.create(deck, deck, emperor, emperor);

    const events: GameEvent[] = [];
    engine.onEvent('TURN_END', (e) => events.push(e));

    const turnBefore = engine.getGameState().turnNumber;
    const playerBefore = engine.getGameState().currentPlayerIndex;

    engine.endTurn();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'TURN_END',
      playerIndex: playerBefore,
      turnNumber: turnBefore,
    });
  });
});
