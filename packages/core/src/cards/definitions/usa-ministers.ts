import type { Minister } from '@king-card/shared';

// ─── Lincoln Ministers (3) ──────────────────────────────────────────

export const FRANKLIN: Minister = {
  id: 'usa_franklin',
  emperorId: 'usa_lincoln',
  name: 'Benjamin Franklin',
  type: 'STRATEGIST',
  activeSkill: {
    name: 'Diplomacy',
    description: 'Draw 1 card',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 0,
};

export const SHERMAN_MINISTER: Minister = {
  id: 'usa_sherman_minister',
  emperorId: 'usa_lincoln',
  name: 'William Sherman',
  type: 'WARRIOR',
  activeSkill: {
    name: 'March to the Sea',
    description: 'Deal 2 damage to a random enemy minion',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 0,
};

export const HAMILTON: Minister = {
  id: 'usa_hamilton',
  emperorId: 'usa_lincoln',
  name: 'Alexander Hamilton',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: 'National Bank',
    description: 'Gain 1 armor',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 0,
};

// ─── George Washington Ministers (3) ───────────────────────────────

export const JOHN_ADAMS: Minister = {
  id: 'usa_john_adams',
  emperorId: 'usa_george_washington',
  name: '约翰·亚当斯',
  type: 'STRATEGIST',
  activeSkill: {
    name: '独立辩论',
    description: '抽一张牌',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

export const THOMAS_PAINE: Minister = {
  id: 'usa_thomas_paine',
  emperorId: 'usa_george_washington',
  name: '托马斯·潘恩',
  type: 'ENVOY',
  activeSkill: {
    name: '常识',
    description: '对手随机弃一张牌',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'RANDOM_DISCARD',
      params: { targetPlayer: 'OPPONENT', count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

export const HENRY_LAURENS: Minister = {
  id: 'usa_henry_laurens',
  emperorId: 'usa_george_washington',
  name: '亨利·劳伦斯',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '大陆后勤',
    description: '获得2点护甲',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

// ─── Franklin Roosevelt Ministers (3) ──────────────────────────────

export const ELEANOR_ROOSEVELT: Minister = {
  id: 'usa_eleanor_roosevelt',
  emperorId: 'usa_franklin_roosevelt',
  name: '埃莉诺·罗斯福',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '民生救济',
    description: '恢复英雄3点生命',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'HEAL',
      params: { target: 'HERO', amount: 3 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

export const HARRY_HOPKINS: Minister = {
  id: 'usa_harry_hopkins',
  emperorId: 'usa_franklin_roosevelt',
  name: '哈里·霍普金斯',
  type: 'STRATEGIST',
  activeSkill: {
    name: '租借法案',
    description: '抽一张牌',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

export const GEORGE_MARSHALL: Minister = {
  id: 'usa_george_marshall',
  emperorId: 'usa_franklin_roosevelt',
  name: '乔治·马歇尔',
  type: 'WARRIOR',
  activeSkill: {
    name: '参谋联席',
    description: '所有友方生物获得+1/+1',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

// ─── Per-emperor minister pools ─────────────────────────────────────

export const LINCOLN_MINISTERS: Minister[] = [FRANKLIN, SHERMAN_MINISTER, HAMILTON];
export const WASHINGTON_MINISTERS: Minister[] = [JOHN_ADAMS, THOMAS_PAINE, HENRY_LAURENS];
export const ROOSEVELT_MINISTERS: Minister[] = [ELEANOR_ROOSEVELT, HARRY_HOPKINS, GEORGE_MARSHALL];

// Aggregate all USA ministers
export const USA_MINISTERS: Minister[] = [
  ...LINCOLN_MINISTERS,
  ...WASHINGTON_MINISTERS,
  ...ROOSEVELT_MINISTERS,
];
