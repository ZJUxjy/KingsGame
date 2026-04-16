import type { Card } from '@king-card/shared';

// ─── UK Sorcery Cards (6) ───────────────────────────────────────────

export const GREAT_FIRE: Card = {
  id: 'uk_great_fire',
  name: 'Great Fire',
  civilization: 'UK',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 5,
  description: 'Deal 3 damage to all minions.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_MINIONS', amount: 3 },
    },
  ],
};

export const ENCLOSURE_ACT: Card = {
  id: 'uk_enclosure',
  name: 'Enclosure Act',
  civilization: 'UK',
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

export const SPANISH_ARMADA: Card = {
  id: 'uk_spanish_armada',
  name: '击溃无敌舰队',
  civilization: 'UK',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: '对所有敌方生物造成2点伤害。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 2 },
    },
  ],
};

export const ROYAL_CHARTER: Card = {
  id: 'uk_royal_charter',
  name: '皇家特许',
  civilization: 'UK',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 3,
  description: '抽一张牌并获得2点护甲。',
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
      params: { amount: 2 },
    },
  ],
};

export const FINEST_HOUR: Card = {
  id: 'uk_finest_hour',
  name: '最光辉时刻',
  civilization: 'UK',
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

export const RADAR_NETWORK: Card = {
  id: 'uk_radar_network',
  name: '雷达网络',
  civilization: 'UK',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: '抽一张牌，并对一个随机敌方生物造成3点伤害。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'RANDOM_ENEMY_MINION', amount: 3 },
    },
  ],
};

export const UK_SORCERIES: Card[] = [
  GREAT_FIRE,
  ENCLOSURE_ACT,
  SPANISH_ARMADA,
  ROYAL_CHARTER,
  FINEST_HOUR,
  RADAR_NETWORK,
];
