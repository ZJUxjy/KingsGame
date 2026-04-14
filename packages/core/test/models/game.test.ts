import { describe, it, expect } from 'vitest';
import { createGameState } from '../../../src/models/game.js';
import type { Card, EmperorData } from '@king-card/shared';

function makeMinionCard(id: string): Card {
  return {
    id,
    name: `Minion ${id}`,
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 1,
    health: 1,
    description: `Test minion ${id}`,
    keywords: [],
    effects: [],
  };
}

function makeDeck(size: number, prefix: string): Card[] {
  return Array.from({ length: size }, (_, i) => makeMinionCard(`${prefix}_${i}`));
}

function makeEmperorData(id: string, civ: string): EmperorData {
  return {
    emperorCard: {
      id,
      name: `Emperor ${id}`,
      civilization: civ as Card['civilization'],
      type: 'EMPEROR',
      rarity: 'LEGENDARY',
      cost: 0,
      description: `Emperor ${id}`,
      keywords: [],
      effects: [],
      heroSkill: {
        name: 'Skill',
        description: 'A hero skill',
        cost: 1,
        cooldown: 1,
        effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: { amount: 1 } },
      },
    },
    ministers: [
      {
        id: `minister_${id}`,
        emperorId: id,
        name: `Minister ${id}`,
        type: 'STRATEGIST',
        activeSkill: {
          name: 'Minister Skill',
          description: 'A minister skill',
          cost: 1,
          effect: { trigger: 'ON_PLAY', type: 'DRAW', params: { count: 1 } },
        },
        skillUsedThisTurn: false,
        cooldown: 0,
      },
    ],
    boundGenerals: [],
    boundSorceries: [],
  };
}

describe('createGameState', () => {
  it('should have two players', () => {
    const state = createGameState(
      makeDeck(30, 'p1'),
      makeDeck(30, 'p2'),
      makeEmperorData('emp1', 'CHINA'),
      makeEmperorData('emp2', 'JAPAN'),
    );
    expect(state.players).toHaveLength(2);
  });

  it('should set currentPlayerIndex to 0', () => {
    const state = createGameState(
      makeDeck(30, 'p1'),
      makeDeck(30, 'p2'),
      makeEmperorData('emp1', 'CHINA'),
      makeEmperorData('emp2', 'JAPAN'),
    );
    expect(state.currentPlayerIndex).toBe(0);
  });

  it('should set turnNumber to 0', () => {
    const state = createGameState(
      makeDeck(30, 'p1'),
      makeDeck(30, 'p2'),
      makeEmperorData('emp1', 'CHINA'),
      makeEmperorData('emp2', 'JAPAN'),
    );
    expect(state.turnNumber).toBe(0);
  });

  it('should set phase to ENERGY_GAIN', () => {
    const state = createGameState(
      makeDeck(30, 'p1'),
      makeDeck(30, 'p2'),
      makeEmperorData('emp1', 'CHINA'),
      makeEmperorData('emp2', 'JAPAN'),
    );
    expect(state.phase).toBe('ENERGY_GAIN');
  });

  it('should set isGameOver to false', () => {
    const state = createGameState(
      makeDeck(30, 'p1'),
      makeDeck(30, 'p2'),
      makeEmperorData('emp1', 'CHINA'),
      makeEmperorData('emp2', 'JAPAN'),
    );
    expect(state.isGameOver).toBe(false);
  });

  it('should have both players with 30 HP', () => {
    const state = createGameState(
      makeDeck(30, 'p1'),
      makeDeck(30, 'p2'),
      makeEmperorData('emp1', 'CHINA'),
      makeEmperorData('emp2', 'JAPAN'),
    );
    expect(state.players[0].hero.health).toBe(30);
    expect(state.players[1].hero.health).toBe(30);
  });

  it('should have both players with 30 cards in deck', () => {
    const state = createGameState(
      makeDeck(30, 'p1'),
      makeDeck(30, 'p2'),
      makeEmperorData('emp1', 'CHINA'),
      makeEmperorData('emp2', 'JAPAN'),
    );
    expect(state.players[0].deck).toHaveLength(30);
    expect(state.players[1].deck).toHaveLength(30);
  });
});
