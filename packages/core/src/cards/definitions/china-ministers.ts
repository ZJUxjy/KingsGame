import type { Minister } from '@king-card/shared';

// ─── China Minister Cards (4) ───────────────────────────────────────

export const LISI: Minister = {
  id: 'china_lisi',
  emperorId: 'china_qin_shihuang',
  name: '李斯',
  type: 'STRATEGIST',
  activeSkill: {
    name: '上书',
    description: '抽一张牌',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

export const HANXIN: Minister = {
  id: 'china_hanxin',
  emperorId: 'china_hanwudi',
  name: '韩信',
  type: 'WARRIOR',
  activeSkill: {
    name: '国士无双',
    description: '使一个友方生物获得+2/+1和突袭',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'APPLY_BUFF',
      params: {
        attackBonus: 2,
        healthBonus: 1,
        keywordsGranted: ['RUSH'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

export const XIAOHE: Minister = {
  id: 'china_xiaohe',
  emperorId: 'china_hanwudi',
  name: '萧何',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '举荐',
    description: '恢复3点生命值',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'HEAL',
      params: { target: 'HERO', amount: 3 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

export const CHENPING: Minister = {
  id: 'china_chenping',
  emperorId: 'china_hanwudi',
  name: '陈平',
  type: 'ENVOY',
  activeSkill: {
    name: '反间',
    description: '使一个敌方生物本回合无法攻击',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'APPLY_BUFF',
      params: {
        attackDelta: -100,
        type: 'TEMPORARY',
        remainingTurns: 1,
      },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

export const CHINA_MINISTERS: Minister[] = [
  LISI,
  HANXIN,
  XIAOHE,
  CHENPING,
];
