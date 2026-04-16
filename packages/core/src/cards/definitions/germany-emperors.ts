import type { Card } from '@king-card/shared';

// ─── Germany Emperor Cards (3) ──────────────────────────────────────

export const FRIEDRICH: Card = {
  id: 'germany_friedrich',
  name: '腓特烈大帝',
  civilization: 'GERMANY',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: '帝王技能：对一个敌方生物造成2点伤害。入场时所有友方生物获得+1攻击。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 },
    },
  ],
  heroSkill: {
    name: '斜线阵',
    description: '对一个敌方生物造成2点伤害',
    cost: 1,
    cooldown: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  },
};

export const WILHELM_I: Card = {
  id: 'germany_wilhelm_i',
  name: '威廉一世',
  civilization: 'GERMANY',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 0,
  health: 30,
  description: '帝王技能：所有友方生物获得+1生命。入场时获得4点护甲。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 4 },
    },
  ],
  heroSkill: {
    name: '帝国统一',
    description: '所有友方生物获得+1生命',
    cost: 2,
    cooldown: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 1 },
    },
  },
};

export const WILHELM_II: Card = {
  id: 'germany_wilhelm_ii',
  name: '威廉二世',
  civilization: 'GERMANY',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: '帝王技能：对所有敌方生物造成1点伤害。入场时所有友方生物获得+1攻击。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 },
    },
  ],
  heroSkill: {
    name: '世界政策',
    description: '对所有敌方生物造成1点伤害',
    cost: 2,
    cooldown: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 1 },
    },
  },
};

export const GERMANY_EMPERORS: Card[] = [
  FRIEDRICH,
  WILHELM_I,
  WILHELM_II,
];
