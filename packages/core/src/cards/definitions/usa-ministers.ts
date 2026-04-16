import type { Minister } from '@king-card/shared';
import { createMinister, createMinisterSkill, onPlay } from './builders';

// ─── Lincoln Ministers (3) ──────────────────────────────────────────

export const FRANKLIN = createMinister({
  id: 'usa_franklin',
  emperorId: 'usa_lincoln',
  name: 'Benjamin Franklin',
  type: 'STRATEGIST',
  activeSkill: createMinisterSkill({
    name: 'Diplomacy',
    description: 'Draw 1 card',
    cost: 1,
    effect: onPlay('DRAW', { count: 1 }),
  }),
  cooldown: 0,
});

export const SHERMAN_MINISTER = createMinister({
  id: 'usa_sherman_minister',
  emperorId: 'usa_lincoln',
  name: 'William Sherman',
  type: 'WARRIOR',
  activeSkill: createMinisterSkill({
    name: 'March to the Sea',
    description: 'Deal 2 damage to a random enemy minion',
    cost: 2,
    effect: onPlay('DAMAGE', { target: 'ENEMY_MINION', amount: 2 }),
  }),
  cooldown: 0,
});

export const HAMILTON = createMinister({
  id: 'usa_hamilton',
  emperorId: 'usa_lincoln',
  name: 'Alexander Hamilton',
  type: 'ADMINISTRATOR',
  activeSkill: createMinisterSkill({
    name: 'National Bank',
    description: 'Gain 1 armor',
    cost: 1,
    effect: onPlay('GAIN_ARMOR', { amount: 1 }),
  }),
  cooldown: 0,
});

// ─── George Washington Ministers (3) ───────────────────────────────

export const JOHN_ADAMS = createMinister({
  id: 'usa_john_adams',
  emperorId: 'usa_george_washington',
  name: '约翰·亚当斯',
  type: 'STRATEGIST',
  activeSkill: createMinisterSkill({
    name: '独立辩论',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay('DRAW', { count: 1 }),
  }),
  cooldown: 1,
});

export const THOMAS_PAINE = createMinister({
  id: 'usa_thomas_paine',
  emperorId: 'usa_george_washington',
  name: '托马斯·潘恩',
  type: 'ENVOY',
  activeSkill: createMinisterSkill({
    name: '常识',
    description: '对手随机弃一张牌',
    cost: 2,
    effect: onPlay('RANDOM_DISCARD', { targetPlayer: 'OPPONENT', count: 1 }),
  }),
  cooldown: 2,
});

export const HENRY_LAURENS = createMinister({
  id: 'usa_henry_laurens',
  emperorId: 'usa_george_washington',
  name: '亨利·劳伦斯',
  type: 'ADMINISTRATOR',
  activeSkill: createMinisterSkill({
    name: '大陆后勤',
    description: '获得2点护甲',
    cost: 1,
    effect: onPlay('GAIN_ARMOR', { amount: 2 }),
  }),
  cooldown: 1,
});

// ─── Franklin Roosevelt Ministers (3) ──────────────────────────────

export const ELEANOR_ROOSEVELT = createMinister({
  id: 'usa_eleanor_roosevelt',
  emperorId: 'usa_franklin_roosevelt',
  name: '埃莉诺·罗斯福',
  type: 'ADMINISTRATOR',
  activeSkill: createMinisterSkill({
    name: '民生救济',
    description: '恢复英雄3点生命',
    cost: 1,
    effect: onPlay('HEAL', { target: 'HERO', amount: 3 }),
  }),
  cooldown: 1,
});

export const HARRY_HOPKINS = createMinister({
  id: 'usa_harry_hopkins',
  emperorId: 'usa_franklin_roosevelt',
  name: '哈里·霍普金斯',
  type: 'STRATEGIST',
  activeSkill: createMinisterSkill({
    name: '租借法案',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay('DRAW', { count: 1 }),
  }),
  cooldown: 1,
});

export const GEORGE_MARSHALL = createMinister({
  id: 'usa_george_marshall',
  emperorId: 'usa_franklin_roosevelt',
  name: '乔治·马歇尔',
  type: 'WARRIOR',
  activeSkill: createMinisterSkill({
    name: '参谋联席',
    description: '所有友方生物获得+1/+1',
    cost: 2,
    effect: onPlay('MODIFY_STAT', { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 }),
  }),
  cooldown: 2,
});

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
