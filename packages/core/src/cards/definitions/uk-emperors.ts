import type { Card } from '@king-card/shared';

// ─── UK Emperor Cards (1) ───────────────────────────────────────────

export const VICTORIA: Card = {
  id: 'uk_victoria',
  name: 'Queen Victoria',
  civilization: 'UK',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 0,
  health: 30,
  description: 'Hero Skill: All friendly minions gain +1/+1. On play: gain 3 armor.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 3 },
    },
  ],
  heroSkill: {
    name: 'Imperial Command',
    description: 'All friendly minions gain +1/+1',
    cost: 2,
    cooldown: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 },
    },
  },
};

export const UK_EMPERORS: Card[] = [
  VICTORIA,
];
