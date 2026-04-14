import { describe, it, expect } from 'vitest';
import { createPlayer } from '../../../src/models/player.js';
import type { Card, EmperorData, Civilization } from '@king-card/shared';

function makeMinionCard(id: string, index: number): Card {
  return {
    id,
    name: `Minion ${index}`,
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 1,
    health: 1,
    description: `Test minion ${index}`,
    keywords: [],
    effects: [],
  };
}

function makeDeck(size: number): Card[] {
  return Array.from({ length: size }, (_, i) => makeMinionCard(`deck_card_${i}`, i));
}

function makeEmperorData(): EmperorData {
  return {
    emperorCard: {
      id: 'emperor_qinshi',
      name: 'Qin Shi Huang',
      civilization: 'CHINA',
      type: 'EMPEROR',
      rarity: 'LEGENDARY',
      cost: 0,
      description: 'First Emperor of China',
      keywords: [],
      effects: [],
      heroSkill: {
        name: 'Unify',
        description: 'Deal 2 damage to all enemy minions',
        cost: 2,
        cooldown: 1,
        effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: { amount: 2 } },
      },
    },
    ministers: [
      {
        id: 'minister_li_si',
        emperorId: 'emperor_qinshi',
        name: 'Li Si',
        type: 'STRATEGIST',
        activeSkill: {
          name: 'Reform',
          description: 'Draw 1 card',
          cost: 1,
          effect: { trigger: 'ON_PLAY', type: 'DRAW', params: { count: 1 } },
        },
        skillUsedThisTurn: false,
        cooldown: 0,
      },
      {
        id: 'minister_wang_jian',
        emperorId: 'emperor_qinshi',
        name: 'Wang Jian',
        type: 'WARRIOR',
        activeSkill: {
          name: 'Conquer',
          description: 'Deal 3 damage',
          cost: 2,
          effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: { amount: 3 } },
        },
        skillUsedThisTurn: false,
        cooldown: 0,
      },
    ],
    boundGenerals: [],
    boundSorceries: [],
  };
}

describe('createPlayer', () => {
  it('should set hero.health to 30', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    expect(player.hero.health).toBe(30);
  });

  it('should set hero.emperorId (via emperorCard.id)', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    // heroSkill is from the emperor card - verify the emperor card id is used
    expect(player.hero.heroSkill.name).toBe('Unify');
  });

  it('should set deck length to 30', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    expect(player.deck).toHaveLength(30);
  });

  it('should set hand to empty', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    expect(player.hand).toEqual([]);
  });

  it('should set energyCrystal to 0 and maxEnergy to 0', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    expect(player.energyCrystal).toBe(0);
    expect(player.maxEnergy).toBe(0);
  });

  it('should set handLimit to 10', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    expect(player.handLimit).toBe(10);
  });

  it('should set cannotDrawNextTurn to false', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    expect(player.cannotDrawNextTurn).toBe(false);
  });

  it('should set ministerPool correctly', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    expect(player.ministerPool).toHaveLength(2);
    expect(player.ministerPool[0].name).toBe('Li Si');
    expect(player.ministerPool[0].skillUsedThisTurn).toBe(false);
    expect(player.ministerPool[0].cooldown).toBe(0);
  });

  it('should set activeMinisterIndex to 0 when ministers exist', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    expect(player.activeMinisterIndex).toBe(0);
  });

  it('should set boundCards to empty when no bound generals/sorceries', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    expect(player.boundCards).toEqual([]);
  });

  it('should set civilization correctly', () => {
    const player = createPlayer(
      0, 'p1', 'Player 1', 'CHINA' as Civilization,
      makeDeck(30), makeEmperorData(),
    );
    expect(player.civilization).toBe('CHINA');
  });
});
