import type { Card } from '@king-card/shared';

// ─── UK Emperor Cards (1) ───────────────────────────────────────────

export const VICTORIA: Card = {
  id: 'uk_victoria',
  name: '维多利亚女王',
  civilization: 'UK',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 0,
  health: 30,
  description: '帝王技能：所有友方生物获得+1/+1。入场时获得3点护甲。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 3 },
    },
  ],
  heroSkill: {
    name: '帝国号令',
    description: '所有友方生物获得+1/+1',
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
