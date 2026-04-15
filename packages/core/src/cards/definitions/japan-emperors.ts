import type { Card } from '@king-card/shared';

// ─── Japan Emperor Cards (1) ────────────────────────────────────────

export const ODA_NOBUNAGA: Card = {
  id: 'japan_oda_nobunaga',
  name: '織田信長',
  civilization: 'JAPAN',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: '帝王技能：对一个随机敌方生物造成2点伤害。入场时对所有敌方生物造成1点伤害。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 1 },
    },
  ],
  heroSkill: {
    name: '天下布武',
    description: '对一个随机敌方生物造成2点伤害',
    cost: 2,
    cooldown: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'RANDOM_ENEMY_MINION', amount: 2 },
    },
  },
};

export const JAPAN_EMPERORS: Card[] = [
  ODA_NOBUNAGA,
];
