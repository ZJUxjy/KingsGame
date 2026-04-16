import type { Card } from '@king-card/shared';

// ─── Japan Sorcery Cards (6) ────────────────────────────────────────

export const KAMIKAZE: Card = {
  id: 'japan_kamikaze',
  name: '神風',
  civilization: 'JAPAN',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 5,
  description: '随机消灭一个敌方生物。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'RANDOM_DESTROY',
      params: { targetFilter: 'RANDOM_ENEMY_MINION' },
    },
  ],
};

export const SEPPUKU: Card = {
  id: 'japan_seppuku',
  name: '切腹',
  civilization: 'JAPAN',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 3,
  description: '消灭一个友方生物，抽两张牌。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DESTROY',
      params: { target: 'FRIENDLY_MINION' },
    },
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 2 },
    },
  ],
};

export const SAKOKU_EDICT: Card = {
  id: 'japan_sakoku_edict',
  name: '锁国令',
  civilization: 'JAPAN',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: '对手随机弃一张牌，并在下回合无法抽牌。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'RANDOM_DISCARD',
      params: { targetPlayer: 'OPPONENT', count: 1 },
    },
    {
      trigger: 'ON_PLAY',
      type: 'SET_DRAW_LOCK',
      params: { targetPlayer: 'OPPONENT', locked: true },
    },
  ],
};

export const SANKIN_KOTAI: Card = {
  id: 'japan_sankin_kotai',
  name: '参勤交代',
  civilization: 'JAPAN',
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

export const MEIJI_RESTORATION: Card = {
  id: 'japan_meiji_restoration',
  name: '明治维新',
  civilization: 'JAPAN',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: '所有友方生物获得+1/+1，并抽一张牌。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 },
    },
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  ],
};

export const CONSCRIPTION_ORDINANCE: Card = {
  id: 'japan_conscription_ordinance',
  name: '征兵令',
  civilization: 'JAPAN',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: '召唤两个1/1足轻。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'SUMMON',
      params: { cardId: 'japan_ashigaru' },
    },
    {
      trigger: 'ON_PLAY',
      type: 'SUMMON',
      params: { cardId: 'japan_ashigaru' },
    },
  ],
};

export const JAPAN_SORCERIES: Card[] = [
  KAMIKAZE,
  SEPPUKU,
  SAKOKU_EDICT,
  SANKIN_KOTAI,
  MEIJI_RESTORATION,
  CONSCRIPTION_ORDINANCE,
];
