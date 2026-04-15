import type { Card } from '@king-card/shared';

// ─── USA Minion Cards (6) ───────────────────────────────────────────

export const GI: Card = {
  id: 'usa_gi',
  name: 'GI (American Soldier)',
  civilization: 'USA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 2,
  description: 'A standard American soldier.',
  keywords: [],
  effects: [],
};

export const MARINE: Card = {
  id: 'usa_marine',
  name: 'Marine',
  civilization: 'USA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 2,
  description: 'Rush.',
  keywords: ['RUSH'],
  effects: [],
};

export const RANGER: Card = {
  id: 'usa_ranger',
  name: 'Ranger',
  civilization: 'USA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 3,
  attack: 3,
  health: 3,
  description: 'Charge.',
  keywords: ['CHARGE'],
  effects: [],
};

export const MEDIC: Card = {
  id: 'usa_medic',
  name: 'Medic',
  civilization: 'USA',
  type: 'MINION',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 4,
  description: 'Battlecry: Heal all friendly minions for 1.',
  keywords: ['BATTLECRY'],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'HEAL',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', amount: 1 },
    },
  ],
};

export const AIRBORNE: Card = {
  id: 'usa_airborne',
  name: 'Airborne',
  civilization: 'USA',
  type: 'MINION',
  rarity: 'RARE',
  cost: 4,
  attack: 4,
  health: 3,
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

export const SHERMAN_TANK: Card = {
  id: 'usa_sherman',
  name: 'Sherman Tank',
  civilization: 'USA',
  type: 'MINION',
  rarity: 'RARE',
  cost: 5,
  attack: 5,
  health: 5,
  description: 'Taunt.',
  keywords: ['TAUNT'],
  effects: [],
};

export const USA_MINIONS: Card[] = [
  GI,
  MARINE,
  RANGER,
  MEDIC,
  AIRBORNE,
  SHERMAN_TANK,
];
