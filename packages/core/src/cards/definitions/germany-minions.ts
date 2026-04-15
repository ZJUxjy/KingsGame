import type { Card } from '@king-card/shared';

// ─── Germany Minion Cards (6) ───────────────────────────────────────

export const LANDSKNECHT: Card = {
  id: 'germany_landsknecht',
  name: 'Landsknecht',
  civilization: 'GERMANY',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 2,
  description: 'A basic German infantry unit.',
  keywords: [],
  effects: [],
};

export const HUSSAR: Card = {
  id: 'germany_hussar',
  name: 'Hussar',
  civilization: 'GERMANY',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 2,
  description: 'Charge.',
  keywords: ['CHARGE'],
  effects: [],
};

export const GRENADIER: Card = {
  id: 'germany_grenadier',
  name: 'Grenadier',
  civilization: 'GERMANY',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 3,
  attack: 3,
  health: 3,
  description: 'Rush.',
  keywords: ['RUSH'],
  effects: [],
};

export const PANZER: Card = {
  id: 'germany_panzer',
  name: 'Panzer',
  civilization: 'GERMANY',
  type: 'MINION',
  rarity: 'RARE',
  cost: 4,
  attack: 4,
  health: 4,
  description: 'Taunt.',
  keywords: ['TAUNT'],
  effects: [],
};

export const TEUTONIC_KNIGHT: Card = {
  id: 'germany_teutonic',
  name: 'Teutonic Knight',
  civilization: 'GERMANY',
  type: 'MINION',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 4,
  description: 'Taunt. Battlecry: Gain 2 armor.',
  keywords: ['TAUNT', 'BATTLECRY'],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 2 },
    },
  ],
};

export const STORMTROOPER: Card = {
  id: 'germany_stormtrooper',
  name: 'Stormtrooper',
  civilization: 'GERMANY',
  type: 'MINION',
  rarity: 'RARE',
  cost: 5,
  attack: 5,
  health: 4,
  description: 'Rush. Battlecry: Deal 2 damage to an enemy minion.',
  keywords: ['RUSH', 'BATTLECRY'],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  ],
};

export const GERMANY_MINIONS: Card[] = [
  LANDSKNECHT,
  HUSSAR,
  GRENADIER,
  PANZER,
  TEUTONIC_KNIGHT,
  STORMTROOPER,
];
