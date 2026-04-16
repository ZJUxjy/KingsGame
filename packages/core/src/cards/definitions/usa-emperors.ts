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
  description: '帝王技能：所有友方生物恢复2点生命。入场时所有友方生物获得+1生命。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 1 },
    },
  ],
  heroSkill: {
    name: '解放宣言',
    description: '所有友方生物恢复2点生命',
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
