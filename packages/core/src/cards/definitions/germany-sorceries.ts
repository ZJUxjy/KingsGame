import type { Card } from '@king-card/shared';

// ─── Germany Sorcery Cards (6) ──────────────────────────────────────

export const V2_ROCKET: Card = {
  id: 'germany_v2',
  name: 'V-2 Rocket',
  civilization: 'GERMANY',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 5,
  description: 'Deal 4 damage to a random enemy minion and 1 damage to all enemy minions.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'RANDOM_ENEMY_MINION', amount: 4 },
    },
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 1 },
    },
  ],
};

export const SCORCHED_EARTH: Card = {
  id: 'germany_scorched_earth',
  name: 'Scorched Earth',
  civilization: 'GERMANY',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: 'Destroy a random enemy minion and a random friendly minion.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'RANDOM_DESTROY',
      params: { targetFilter: 'RANDOM_ENEMY_MINION' },
    },
    {
      trigger: 'ON_PLAY',
      type: 'RANDOM_DESTROY',
      params: { targetFilter: 'RANDOM_FRIENDLY_MINION' },
    },
  ],
};

export const NORTH_GERMAN_CONFEDERATION: Card = {
  id: 'germany_north_german_confederation',
  name: '北德意志邦联',
  civilization: 'GERMANY',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 3,
  description: '抽一张牌并获得3点护甲。',
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
      params: { amount: 3 },
    },
  ],
};

export const FRANCO_PRUSSIAN_WAR: Card = {
  id: 'germany_franco_prussian_war',
  name: '普法战争',
  civilization: 'GERMANY',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: '对所有敌方生物造成2点伤害，并获得2点护甲。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 2 },
    },
    {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 2 },
    },
  ],
};

export const SCHLIEFFEN_PLAN: Card = {
  id: 'germany_schlieffen_plan',
  name: '施里芬计划',
  civilization: 'GERMANY',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: '所有友方生物获得冲锋（本回合）。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'APPLY_BUFF',
      params: {
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['CHARGE'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      },
    },
  ],
};

export const HIGH_SEAS_FLEET: Card = {
  id: 'germany_high_seas_fleet',
  name: '公海舰队',
  civilization: 'GERMANY',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 5,
  description: '对一个随机敌方生物造成4点伤害，并抽一张牌。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'RANDOM_ENEMY_MINION', amount: 4 },
    },
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  ],
};

export const GERMANY_SORCERIES: Card[] = [
  V2_ROCKET,
  SCORCHED_EARTH,
  NORTH_GERMAN_CONFEDERATION,
  FRANCO_PRUSSIAN_WAR,
  SCHLIEFFEN_PLAN,
  HIGH_SEAS_FLEET,
];
