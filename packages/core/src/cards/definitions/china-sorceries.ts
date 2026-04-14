import type { Card } from '@king-card/shared';

// ─── China Sorcery Cards (2) ────────────────────────────────────────

export const WUGUZHIHUO: Card = {
  id: 'china_wuguzhihuo',
  name: '巫蛊之祸',
  civilization: 'CHINA',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 4,
  description: '随机消灭一个敌方生物和一个友方生物。',
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

export const FENSHU_KENGRU: Card = {
  id: 'china_fenshu_kengru',
  name: '焚书坑儒',
  civilization: 'CHINA',
  type: 'SORCERY',
  rarity: 'EPIC',
  cost: 3,
  description: '对手随机弃一张牌。你下回合无法抽牌。',
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
      params: { targetPlayer: 'SELF', locked: true },
    },
  ],
};

export const CHINA_SORCERIES: Card[] = [
  WUGUZHIHUO,
  FENSHU_KENGRU,
];
