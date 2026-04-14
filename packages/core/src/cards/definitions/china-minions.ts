import type { Card } from '@king-card/shared';

// ─── China Minion Cards (6) ─────────────────────────────────────────

export const BINGMAYONG: Card = {
  id: 'china_bingmayong',
  name: '兵马俑',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 1,
  description: '秦始皇陵墓中的陶土战士。',
  keywords: [],
  effects: [],
};

export const QINJUN_BUBING: Card = {
  id: 'china_qinjun_bubing',
  name: '秦军步兵',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 2,
  description: '动员：若你本回合已使用≥2张牌，获得+1/+1。',
  keywords: ['MOBILIZE'],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'CONDITIONAL_BUFF',
      params: { mobilizeThreshold: 2, attackBonus: 1, healthBonus: 1 },
    },
  ],
};

export const HANCHAO_QIBING: Card = {
  id: 'china_hanchao_qibing',
  name: '汉朝骑兵',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 3,
  attack: 3,
  health: 2,
  description: '冲锋。动员：若你本回合已使用≥3张牌，抽一张牌。',
  keywords: ['CHARGE', 'MOBILIZE'],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'CONDITIONAL_BUFF',
      params: { mobilizeThreshold: 3, drawCount: 1 },
    },
  ],
};

export const DATANG_JINGRUI: Card = {
  id: 'china_datang_jingrui',
  name: '大唐精锐',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'RARE',
  cost: 4,
  attack: 4,
  health: 4,
  description: '驻守：入场时获得驻守标记，持续2回合。',
  keywords: ['GARRISON'],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'GARRISON_MARK',
      params: { garrisonTurns: 2 },
    },
  ],
};

export const CHANGCHENG_SHOUWEI: Card = {
  id: 'china_changcheng_shouwei',
  name: '长城守卫',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 3,
  attack: 1,
  health: 6,
  description: '嘲讽。万里长城永不倒。',
  keywords: ['TAUNT'],
  effects: [],
};

export const JINJUN_TONGLING: Card = {
  id: 'china_jinjun_tongling',
  name: '禁军统领',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'RARE',
  cost: 5,
  attack: 5,
  health: 5,
  description: '战吼：所有友方生物获得+1/+1。',
  keywords: ['BATTLECRY'],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 },
    },
  ],
};

export const CHINA_MINIONS: Card[] = [
  BINGMAYONG,
  QINJUN_BUBING,
  HANCHAO_QIBING,
  DATANG_JINGRUI,
  CHANGCHENG_SHOUWEI,
  JINJUN_TONGLING,
];
