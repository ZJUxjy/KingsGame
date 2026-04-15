import type { Card } from '@king-card/shared';

// ─── UK Minion Cards (6) ────────────────────────────────────────────

export const REDCOAT: Card = {
  id: 'uk_redcoat',
  name: 'Redcoat',
  civilization: 'UK',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 2,
  description: 'A basic British infantry soldier.',
  keywords: [],
  effects: [],
};

export const LONGBOWMAN: Card = {
  id: 'uk_longbowman',
  name: 'Longbowman',
  civilization: 'UK',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 2,
  description: 'Rush.',
  keywords: ['RUSH'],
  effects: [],
};

export const KNIGHT: Card = {
  id: 'uk_knight',
  name: 'Knight',
  civilization: 'UK',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 3,
  attack: 3,
  health: 3,
  description: 'Charge.',
  keywords: ['CHARGE'],
  effects: [],
};

export const ROYAL_GUARD: Card = {
  id: 'uk_royal_guard',
  name: 'Royal Guard',
  civilization: 'UK',
  type: 'MINION',
  rarity: 'RARE',
  cost: 4,
  attack: 2,
  health: 6,
  description: 'Taunt.',
  keywords: ['TAUNT'],
  effects: [],
};

export const PRIVATEER: Card = {
  id: 'uk_privateer',
  name: 'Privateer',
  civilization: 'UK',
  type: 'MINION',
  rarity: 'RARE',
  cost: 3,
  attack: 3,
  health: 2,
  description: 'Battlecry: Draw a card.',
  keywords: ['BATTLECRY'],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  ],
};

export const MAN_OF_WAR: Card = {
  id: 'uk_man_of_war',
  name: 'Man-of-War',
  civilization: 'UK',
  type: 'MINION',
  rarity: 'RARE',
  cost: 5,
  attack: 5,
  health: 5,
  description: 'Battlecry: Deal 2 damage to an enemy minion.',
  keywords: ['BATTLECRY'],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  ],
};

export const UK_MINIONS: Card[] = [
  REDCOAT,
  LONGBOWMAN,
  KNIGHT,
  ROYAL_GUARD,
  PRIVATEER,
  MAN_OF_WAR,
];
