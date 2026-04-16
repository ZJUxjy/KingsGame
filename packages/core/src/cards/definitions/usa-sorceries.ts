import type { Card } from '@king-card/shared';

// ─── USA Sorcery Cards (6) ──────────────────────────────────────────

export const MANHATTAN_PROJECT: Card = {
  id: 'usa_manhattan',
  name: 'Manhattan Project',
  civilization: 'USA',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 6,
  description: 'Deal 4 damage to all minions.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_MINIONS', amount: 4 },
    },
  ],
};

export const MONROE_DOCTRINE: Card = {
  id: 'usa_monroe',
  name: 'Monroe Doctrine',
  civilization: 'USA',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 3,
  description: 'Opponent discards 1 random card.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'RANDOM_DISCARD',
      params: { targetPlayer: 'OPPONENT', count: 1 },
    },
  ],
};

export const CONTINENTAL_CONGRESS: Card = {
  id: 'usa_continental_congress',
  name: '大陆会议',
  civilization: 'USA',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 3,
  description: '抽两张牌。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 2 },
    },
  ],
};

export const VALLEY_FORGE: Card = {
  id: 'usa_valley_forge',
  name: '福吉谷冬训',
  civilization: 'USA',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: '所有友方生物获得+1/+1。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 },
    },
  ],
};

export const NEW_DEAL: Card = {
  id: 'usa_new_deal',
  name: '新政',
  civilization: 'USA',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: '抽一张牌并获得4点护甲。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 4 },
    },
  ],
};

export const D_DAY_LANDING: Card = {
  id: 'usa_d_day_landing',
  name: '诺曼底登陆',
  civilization: 'USA',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 5,
  description: '召唤一个3/3空降兵，并对所有敌方生物造成1点伤害。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'SUMMON',
      params: { cardId: 'usa_airborne' },
    },
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 1 },
    },
  ],
};

export const USA_SORCERIES: Card[] = [
  MANHATTAN_PROJECT,
  MONROE_DOCTRINE,
  CONTINENTAL_CONGRESS,
  VALLEY_FORGE,
  NEW_DEAL,
  D_DAY_LANDING,
];
