import type { Card } from '@king-card/shared';

// ─── Japan Stratagem Cards (4) ──────────────────────────────────────

export const BUSHIDO: Card = {
  id: 'japan_bushido',
  name: '武士道',
  civilization: 'JAPAN',
  type: 'STRATAGEM',
  rarity: 'COMMON',
  cost: 2,
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

export const NINJUTSU: Card = {
  id: 'japan_ninjutsu',
  name: '忍術',
  civilization: 'JAPAN',
  type: 'STRATAGEM',
  rarity: 'COMMON',
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

export const HYOUROU: Card = {
  id: 'japan_hyourou',
  name: '兵糧攻め',
  civilization: 'JAPAN',
  type: 'STRATAGEM',
  rarity: 'RARE',
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

export const ISSHO_KENMEI: Card = {
  id: 'japan_issho_kenmei',
  name: '一所懸命',
  civilization: 'JAPAN',
  type: 'STRATAGEM',
  rarity: 'RARE',
  cost: 2,
  description: '使一个友方生物获得+3/+3。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { target: 'FRIENDLY_MINION', attackDelta: 3, healthDelta: 3 },
    },
  ],
};

export const JAPAN_STRATAGEMS: Card[] = [
  BUSHIDO,
  NINJUTSU,
  HYOUROU,
  ISSHO_KENMEI,
];
