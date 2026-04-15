import type { Minister } from '@king-card/shared';

// ─── 織田信長 Ministers (3) ──────────────────────────────────────────

export const AKECHI: Minister = {
  id: 'japan_akechi',
  emperorId: 'japan_oda_nobunaga',
  name: '明智光秀',
  type: 'STRATEGIST',
  activeSkill: {
    name: '本能寺の変',
    description: '对一个敌方生物造成3点伤害',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 3 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 0,
};

export const TOYOTOMI: Minister = {
  id: 'japan_toyotomi',
  emperorId: 'japan_oda_nobunaga',
  name: '豊臣秀吉',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '太閤検地',
    description: '抽一张牌',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 0,
};

export const MAEDA: Minister = {
  id: 'japan_maeda',
  emperorId: 'japan_oda_nobunaga',
  name: '前田利家',
  type: 'WARRIOR',
  activeSkill: {
    name: '槍の又左',
    description: '对一个敌方生物造成2点伤害',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 0,
};

// ─── Per-emperor minister pools ─────────────────────────────────────

export const ODA_MINISTERS: Minister[] = [AKECHI, TOYOTOMI, MAEDA];

// Aggregate all Japan ministers
export const JAPAN_MINISTERS: Minister[] = [
  ...ODA_MINISTERS,
];
