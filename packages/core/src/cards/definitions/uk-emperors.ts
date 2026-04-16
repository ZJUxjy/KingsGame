import type { Card } from '@king-card/shared';

// ─── UK Emperor Cards (3) ───────────────────────────────────────────

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

export const ELIZABETH_I: Card = {
  id: 'uk_elizabeth_i',
  name: '伊丽莎白一世',
  civilization: 'UK',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: '帝王技能：抽一张牌。入场时获得2点护甲。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 2 },
    },
  ],
  heroSkill: {
    name: '黄金时代',
    description: '抽一张牌',
    cost: 1,
    cooldown: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  },
};

export const WINSTON_CHURCHILL: Card = {
  id: 'uk_winston_churchill',
  name: '温斯顿·丘吉尔',
  civilization: 'UK',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 0,
  health: 30,
  description: '帝王技能：所有友方生物获得+1攻击。入场时获得5点护甲。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 5 },
    },
  ],
  heroSkill: {
    name: '最光辉时刻',
    description: '所有友方生物获得+1攻击',
    cost: 2,
    cooldown: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 },
    },
  },
};

export const UK_EMPERORS: Card[] = [
  VICTORIA,
  ELIZABETH_I,
  WINSTON_CHURCHILL,
];
