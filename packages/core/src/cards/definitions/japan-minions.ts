import type { Card } from '@king-card/shared';

// ─── Japan Minion Cards (6) ─────────────────────────────────────────

export const ASHIGARU: Card = {
  id: 'japan_ashigaru',
  name: '足軽',
  civilization: 'JAPAN',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 2,
  description: '步兵基础兵种。',
  keywords: [],
  effects: [],
};

export const NINJA: Card = {
  id: 'japan_ninja',
  name: '忍者',
  civilization: 'JAPAN',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 1,
  description: '冲锋。隐秘的刺客。',
  keywords: ['CHARGE'],
  effects: [],
};

export const SAMURAI: Card = {
  id: 'japan_samurai',
  name: '侍',
  civilization: 'JAPAN',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 3,
  attack: 3,
  health: 3,
  description: '战吼：抽一张牌。',
  keywords: ['BATTLECRY'],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  ],
};

export const SOUHEI: Card = {
  id: 'japan_souhei',
  name: '僧兵',
  civilization: 'JAPAN',
  type: 'MINION',
  rarity: 'RARE',
  cost: 4,
  attack: 3,
  health: 5,
  description: '嘲讽。寺院的守护者。',
  keywords: ['TAUNT'],
  effects: [],
};

export const TEPPO: Card = {
  id: 'japan_teppo',
  name: '鉄砲隊',
  civilization: 'JAPAN',
  type: 'MINION',
  rarity: 'RARE',
  cost: 3,
  attack: 4,
  health: 2,
  description: '突袭。火绳枪之力。',
  keywords: ['RUSH'],
  effects: [],
};

export const MUSHA: Card = {
  id: 'japan_musha',
  name: '武者',
  civilization: 'JAPAN',
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

export const JAPAN_MINIONS: Card[] = [
  ASHIGARU,
  NINJA,
  SAMURAI,
  SOUHEI,
  TEPPO,
  MUSHA,
];
