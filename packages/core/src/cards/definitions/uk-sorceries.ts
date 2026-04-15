import type { Card } from '@king-card/shared';

// ─── UK Sorcery Cards (2) ───────────────────────────────────────────

export const GREAT_FIRE: Card = {
  id: 'uk_great_fire',
  name: 'Great Fire',
  civilization: 'UK',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 5,
  description: 'Deal 3 damage to all minions.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_MINIONS', amount: 3 },
    },
  ],
};

export const ENCLOSURE_ACT: Card = {
  id: 'uk_enclosure',
  name: 'Enclosure Act',
  civilization: 'UK',
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

export const UK_SORCERIES: Card[] = [
  GREAT_FIRE,
  ENCLOSURE_ACT,
];
