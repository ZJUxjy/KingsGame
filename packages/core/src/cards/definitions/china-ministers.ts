import type { Minister } from '@king-card/shared';

// ─── 秦始皇 Ministers (3) ───────────────────────────────────────────

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

export const MENGTIAN: Minister = {
  id: 'china_mengtian',
  emperorId: 'china_qin_shihuang',
  name: '蒙恬',
  type: 'WARRIOR',
  activeSkill: {
    name: '北击匈奴',
    description: '对一个敌方生物造成2点伤害',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

export const ZHAOGAO: Minister = {
  id: 'china_zhaogao',
  emperorId: 'china_qin_shihuang',
  name: '赵高',
  type: 'ENVOY',
  activeSkill: {
    name: '指鹿为马',
    description: '使一个敌方生物的攻击力变为1',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { target: 'ENEMY_MINION', attackSet: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

// ─── 汉武帝 Ministers (3) ───────────────────────────────────────────

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
        target: 'FRIENDLY_MINION',
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
        target: 'ENEMY_MINION',
        attackDelta: -100,
        type: 'TEMPORARY',
        remainingTurns: 1,
      },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

// ─── 唐太宗 Ministers (3) ───────────────────────────────────────────

export const WEIZHI: Minister = {
  id: 'china_weizhi',
  emperorId: 'china_tangtaizong',
  name: '魏征',
  type: 'STRATEGIST',
  activeSkill: {
    name: '直谏',
    description: '抽一张牌',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

export const FANGXUANLING: Minister = {
  id: 'china_fangxuanling',
  emperorId: 'china_tangtaizong',
  name: '房玄龄',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '贞观之策',
    description: '获得2点护甲',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

export const LIJING: Minister = {
  id: 'china_lijing',
  emperorId: 'china_tangtaizong',
  name: '李靖',
  type: 'WARRIOR',
  activeSkill: {
    name: '灭国之功',
    description: '使一个友方生物获得+1/+2',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'APPLY_BUFF',
      params: {
        target: 'FRIENDLY_MINION',
        attackBonus: 1,
        healthBonus: 2,
        type: 'TEMPORARY',
        remainingTurns: 2,
      },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

// ─── Per-emperor minister pools ─────────────────────────────────────

export const QIN_MINISTERS: Minister[] = [LISI, MENGTIAN, ZHAOGAO];
export const HAN_MINISTERS: Minister[] = [HANXIN, XIAOHE, CHENPING];
export const TANG_MINISTERS: Minister[] = [WEIZHI, FANGXUANLING, LIJING];

// Aggregate all China ministers
export const CHINA_MINISTERS: Minister[] = [
  ...QIN_MINISTERS,
  ...HAN_MINISTERS,
  ...TANG_MINISTERS,
];
