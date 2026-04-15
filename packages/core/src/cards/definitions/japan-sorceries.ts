import type { Card } from '@king-card/shared';

// ─── Japan Sorcery Cards (2) ────────────────────────────────────────

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

export const JAPAN_SORCERIES: Card[] = [
  KAMIKAZE,
  SEPPUKU,
];
