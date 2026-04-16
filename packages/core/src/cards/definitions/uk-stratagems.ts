import type { Card } from '@king-card/shared';
import { onPlay, uk } from '../builders/index.js';

// ─── UK Stratagem Cards (4) ─────────────────────────────────────────

export const RULE_BRITANNIA = uk.stratagem({
  slug: 'rule_britannia',
  name: 'Rule Britannia',
  rarity: 'COMMON',
  cost: 2,
  description: 'All friendly minions gain +1/+1.',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
      healthDelta: 1,
    }),
  ],
});

export const TEA_TIME = uk.stratagem({
  slug: 'tea_time',
  name: 'Tea Time',
  rarity: 'COMMON',
  cost: 2,
  description: 'Draw 2 cards.',
  effects: [onPlay.draw(2)],
});

export const NAVAL_BLOCKADE = uk.stratagem({
  slug: 'naval_blockade',
  name: 'Naval Blockade',
  rarity: 'RARE',
  cost: 4,
  description: 'Deal 2 damage to all enemy minions.',
  effects: [onPlay.damage('ALL_ENEMY_MINIONS', 2)],
});

export const COLONIAL_EXPANSION = uk.stratagem({
  slug: 'colonial',
  name: 'Colonial Expansion',
  rarity: 'RARE',
  cost: 3,
  description: 'Summon a 2/2 Redcoat.',
  effects: [onPlay.summon('uk_redcoat')],
});

export const UK_STRATAGEMS: Card[] = [
  RULE_BRITANNIA,
  TEA_TIME,
  NAVAL_BLOCKADE,
  COLONIAL_EXPANSION,
];
