import type { Card } from '@king-card/shared';

// ─── Germany Sorcery Cards (2) ──────────────────────────────────────

export const V2_ROCKET: Card = {
  id: 'germany_v2',
  name: 'V-2 Rocket',
  civilization: 'GERMANY',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 5,
  description: 'Deal 4 damage to a random enemy minion and 1 damage to all enemy minions.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'RANDOM_ENEMY_MINION', amount: 4 },
    },
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 1 },
    },
  ],
};

export const SCORCHED_EARTH: Card = {
  id: 'germany_scorched_earth',
  name: 'Scorched Earth',
  civilization: 'GERMANY',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: 'Destroy a random enemy minion and a random friendly minion.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'RANDOM_DESTROY',
      params: { targetFilter: 'RANDOM_ENEMY_MINION' },
    },
    {
      trigger: 'ON_PLAY',
      type: 'RANDOM_DESTROY',
      params: { targetFilter: 'RANDOM_FRIENDLY_MINION' },
    },
  ],
};

export const GERMANY_SORCERIES: Card[] = [
  V2_ROCKET,
  SCORCHED_EARTH,
];
