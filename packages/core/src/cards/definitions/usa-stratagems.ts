import type { Card } from '@king-card/shared';

// ─── USA Stratagem Cards (4) ────────────────────────────────────────

export const ARSENAL_OF_DEMOCRACY: Card = {
  id: 'usa_arsenal',
  name: 'Arsenal of Democracy',
  civilization: 'USA',
  type: 'STRATAGEM',
  rarity: 'COMMON',
  cost: 2,
  description: 'All friendly minions get +1/+1.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 },
    },
  ],
};

export const LEND_LEASE: Card = {
  id: 'usa_lend_lease',
  name: 'Lend-Lease',
  civilization: 'USA',
  type: 'STRATAGEM',
  rarity: 'COMMON',
  cost: 3,
  description: 'Draw 2 cards.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 2 },
    },
  ],
};

export const AIR_SUPERIORITY: Card = {
  id: 'usa_air_superiority',
  name: 'Air Superiority',
  civilization: 'USA',
  type: 'STRATAGEM',
  rarity: 'RARE',
  cost: 4,
  description: 'Deal 2 damage to all enemy minions.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 2 },
    },
  ],
};

export const MARSHALL_PLAN: Card = {
  id: 'usa_marshall_plan',
  name: 'Marshall Plan',
  civilization: 'USA',
  type: 'STRATAGEM',
  rarity: 'RARE',
  cost: 3,
  description: 'Heal all friendly minions for 3.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'HEAL',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', amount: 3 },
    },
  ],
};

export const USA_STRATAGEMS: Card[] = [
  ARSENAL_OF_DEMOCRACY,
  LEND_LEASE,
  AIR_SUPERIORITY,
  MARSHALL_PLAN,
];
