import type { Card } from '@king-card/shared';

// ─── USA Emperor Cards (3) ──────────────────────────────────────────

export const LINCOLN: Card = {
  id: 'usa_lincoln',
  name: '亚伯拉罕·林肯',
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

export const GEORGE_WASHINGTON: Card = {
  id: 'usa_george_washington',
  name: '乔治·华盛顿',
  civilization: 'USA',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: '帝王技能：所有友方生物获得+1攻击。入场时获得3点护甲。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 3 },
    },
  ],
  heroSkill: {
    name: '大陆军号令',
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

export const FRANKLIN_ROOSEVELT: Card = {
  id: 'usa_franklin_roosevelt',
  name: '富兰克林·罗斯福',
  civilization: 'USA',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 0,
  health: 30,
  description: '帝王技能：召唤一个3/3大兵。入场时所有友方生物获得+1生命。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 1 },
    },
  ],
  heroSkill: {
    name: '民主兵工厂',
    description: '召唤一个3/3大兵',
    cost: 2,
    cooldown: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'SUMMON',
      params: { cardId: 'usa_gi' },
    },
  },
};

export const USA_EMPERORS: Card[] = [
  LINCOLN,
  GEORGE_WASHINGTON,
  FRANKLIN_ROOSEVELT,
];
