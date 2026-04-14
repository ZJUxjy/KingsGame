import type { Card } from '@king-card/shared';

// ─── China Emperor Cards (3) ────────────────────────────────────────

export const QIN_SHIHUANG: Card = {
  id: 'china_qin_shihuang',
  name: '秦始皇',
  civilization: 'CHINA',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 4,
  attack: 0,
  health: 30,
  description: '帝王技能：召唤一个1/1兵马俑。入场时召唤一个兵马俑。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'SUMMON',
      params: { cardId: 'china_bingmayong' },
    },
  ],
  heroSkill: {
    name: '召唤兵马俑',
    description: '召唤一个1/1兵马俑',
    cost: 1,
    cooldown: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'SUMMON',
      params: { cardId: 'china_bingmayong' },
    },
  },
};

export const HAN_WUDI: Card = {
  id: 'china_hanwudi',
  name: '汉武帝',
  civilization: 'CHINA',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 0,
  health: 30,
  description: '帝王技能：所有友方生物获得+1/+1。入场时所有友方生物获得+1攻击力。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 },
    },
  ],
  heroSkill: {
    name: '天威浩荡',
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

export const TANG_TAIZONG: Card = {
  id: 'china_tangtaizong',
  name: '唐太宗',
  civilization: 'CHINA',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 8,
  attack: 0,
  health: 30,
  description: '帝王技能：选择一个友方生物，召唤其1/1复制体。入场时所有友方生物获得驻守2回合。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GARRISON_MARK',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', garrisonTurns: 2 },
    },
  ],
  heroSkill: {
    name: '天可汗',
    description: '选择一个友方生物，召唤其1/1复制体',
    cost: 3,
    cooldown: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'SUMMON',
      params: { cloneOfInstanceId: 'TARGET' },
    },
  },
};

export const CHINA_EMPERORS: Card[] = [
  QIN_SHIHUANG,
  HAN_WUDI,
  TANG_TAIZONG,
];
