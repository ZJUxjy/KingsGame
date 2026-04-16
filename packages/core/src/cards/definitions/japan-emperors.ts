import type { Card } from '@king-card/shared';

// ─── Japan Emperor Cards (3) ────────────────────────────────────────

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

export const TOKUGAWA_IEYASU: Card = {
  id: 'japan_tokugawa_ieyasu',
  name: '德川家康',
  civilization: 'JAPAN',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 0,
  health: 30,
  description: '帝王技能：所有友方生物获得+0/+1。入场时获得4点护甲。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 4 },
    },
  ],
  heroSkill: {
    name: '幕府稳政',
    description: '所有友方生物获得+0/+1',
    cost: 2,
    cooldown: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 1 },
    },
  },
};

export const EMPEROR_MEIJI: Card = {
  id: 'japan_emperor_meiji',
  name: '明治天皇',
  civilization: 'JAPAN',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: '帝王技能：召唤一个1/1足轻。入场时抽一张牌。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  ],
  heroSkill: {
    name: '文明开化',
    description: '召唤一个1/1足轻',
    cost: 1,
    cooldown: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'SUMMON',
      params: { cardId: 'japan_ashigaru' },
    },
  },
};

export const JAPAN_EMPERORS: Card[] = [
  ODA_NOBUNAGA,
  TOKUGAWA_IEYASU,
  EMPEROR_MEIJI,
];
