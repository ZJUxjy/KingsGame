import type { Card } from '@king-card/shared';

// ─── China Stratagem Cards (4) ──────────────────────────────────────

export const ZHUCHENGLING: Card = {
  id: 'china_zhuchengling',
  name: '筑城令',
  civilization: 'CHINA',
  type: 'STRATAGEM',
  rarity: 'COMMON',
  cost: 2,
  description: '所有友方生物获得+3生命值和嘲讽（本回合）。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 3 },
    },
    {
      trigger: 'ON_PLAY',
      type: 'APPLY_BUFF',
      params: {
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        healthBonus: 0,
        keywordsGranted: ['TAUNT'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      },
    },
  ],
};

export const ZONGDONGYUAN: Card = {
  id: 'china_zongdongyuan',
  name: '总动员',
  civilization: 'CHINA',
  type: 'STRATAGEM',
  rarity: 'RARE',
  cost: 4,
  description: '所有友方生物获得+2/+2。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 2, healthDelta: 2 },
    },
  ],
};

export const BINGFA_SANSHILIUJI: Card = {
  id: 'china_bingfa_sanshliuji',
  name: '兵法三十六计',
  civilization: 'CHINA',
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

export const MINGXIU_ZHANDAO: Card = {
  id: 'china_mingxiu_zhandao',
  name: '明修栈道',
  civilization: 'CHINA',
  type: 'STRATAGEM',
  rarity: 'RARE',
  cost: 2,
  description: '持续妙计（2回合）：所有手牌费用-1。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'ACTIVATE_STRATAGEM',
      params: {
        duration: 2,
        appliedEffects: [
          { type: 'COST_MODIFIER', params: { costReduction: 1 } },
        ],
      },
    },
  ],
};

export const CHINA_STRATAGEMS: Card[] = [
  ZHUCHENGLING,
  ZONGDONGYUAN,
  BINGFA_SANSHILIUJI,
  MINGXIU_ZHANDAO,
];
