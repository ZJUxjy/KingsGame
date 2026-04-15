import type { Card } from '@king-card/shared';

// ─── USA Sorcery Cards (2) ──────────────────────────────────────────

export const MANHATTAN_PROJECT: Card = {
  id: 'usa_manhattan',
  name: 'Manhattan Project',
  civilization: 'USA',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 6,
  description: 'Deal 4 damage to all minions.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_MINIONS', amount: 4 },
    },
  ],
};

export const MONROE_DOCTRINE: Card = {
  id: 'usa_monroe',
  name: 'Monroe Doctrine',
  civilization: 'USA',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 3,
  description: 'Opponent discards 1 random card.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'RANDOM_DISCARD',
      params: { targetPlayer: 'OPPONENT', count: 1 },
    },
  ],
};

export const USA_SORCERIES: Card[] = [
  MANHATTAN_PROJECT,
  MONROE_DOCTRINE,
];
