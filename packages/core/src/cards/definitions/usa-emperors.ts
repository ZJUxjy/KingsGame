import type { Card } from '@king-card/shared';

// ─── USA Emperor Cards (1) ──────────────────────────────────────────

export const LINCOLN: Card = {
  id: 'usa_lincoln',
  name: 'Abraham Lincoln',
  civilization: 'USA',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: 'Hero Skill: Heal all friendly minions for 2. On play: all friendly minions gain +1 health.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 1 },
    },
  ],
  heroSkill: {
    name: 'Emancipation',
    description: 'Heal all friendly minions for 2',
    cost: 2,
    cooldown: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'HEAL',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', amount: 2 },
    },
  },
};

export const USA_EMPERORS: Card[] = [
  LINCOLN,
];
