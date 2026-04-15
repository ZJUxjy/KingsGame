import type { Card } from '@king-card/shared';

// ─── UK Stratagem Cards (4) ─────────────────────────────────────────

export const RULE_BRITANNIA: Card = {
  id: 'uk_rule_britannia',
  name: 'Rule Britannia',
  civilization: 'UK',
  type: 'STRATAGEM',
  rarity: 'COMMON',
  cost: 2,
  description: 'All friendly minions gain +1/+1.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 },
    },
  ],
};

export const TEA_TIME: Card = {
  id: 'uk_tea_time',
  name: 'Tea Time',
  civilization: 'UK',
  type: 'STRATAGEM',
  rarity: 'COMMON',
  cost: 2,
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

export const NAVAL_BLOCKADE: Card = {
  id: 'uk_naval_blockade',
  name: 'Naval Blockade',
  civilization: 'UK',
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

export const COLONIAL_EXPANSION: Card = {
  id: 'uk_colonial',
  name: 'Colonial Expansion',
  civilization: 'UK',
  type: 'STRATAGEM',
  rarity: 'RARE',
  cost: 3,
  description: 'Summon a 2/2 Redcoat.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'SUMMON',
      params: { cardId: 'uk_redcoat' },
    },
  ],
};

export const UK_STRATAGEMS: Card[] = [
  RULE_BRITANNIA,
  TEA_TIME,
  NAVAL_BLOCKADE,
  COLONIAL_EXPANSION,
];
