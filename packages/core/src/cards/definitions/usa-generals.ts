import type { Card } from '@king-card/shared';

// ─── USA General Cards (2) ──────────────────────────────────────────

export const GRANT: Card = {
  id: 'usa_grant',
  name: 'Ulysses S. Grant',
  civilization: 'USA',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 7,
  attack: 6,
  health: 6,
  description: 'Charge. Skill 1: Total War — deal 3 damage to all enemy minions. Skill 2: Siege — deal 5 damage to an enemy minion. Skill 3: March to the Sea — all friendly minions gain Charge this turn.',
  keywords: ['CHARGE'],
  effects: [],
  generalSkills: [
    {
      name: 'Total War',
      description: 'Deal 3 damage to all enemy minions',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 3 },
      },
    },
    {
      name: 'Siege',
      description: 'Deal 5 damage to an enemy minion',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { target: 'ENEMY_MINION', amount: 5 },
      },
    },
    {
      name: 'March to the Sea',
      description: 'All friendly minions gain Charge this turn',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'APPLY_BUFF',
        params: {
          targetFilter: 'ALL_FRIENDLY_MINIONS',
          keywordsGranted: ['CHARGE'],
          type: 'TEMPORARY',
          remainingTurns: 1,
        },
      },
    },
  ],
};

export const PATTON: Card = {
  id: 'usa_patton',
  name: 'George Patton',
  civilization: 'USA',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 5,
  health: 5,
  description: 'Rush. Skill 1: Blitzkrieg Counter — deal 4 damage to an enemy minion. Skill 2: Rally the Troops — all friendly minions get +2/+1. Skill 3: Third Army — summon a 3/3 GI.',
  keywords: ['RUSH'],
  effects: [],
  generalSkills: [
    {
      name: 'Blitzkrieg Counter',
      description: 'Deal 4 damage to an enemy minion',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { target: 'ENEMY_MINION', amount: 4 },
      },
    },
    {
      name: 'Rally the Troops',
      description: 'All friendly minions get +2/+1',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'MODIFY_STAT',
        params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 2, healthDelta: 1 },
      },
    },
    {
      name: 'Third Army',
      description: 'Summon a 3/3 GI',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'SUMMON',
        params: { cardId: 'usa_gi' },
      },
    },
  ],
};

export const USA_GENERALS: Card[] = [
  GRANT,
  PATTON,
];
