import type { Minister } from '@king-card/shared';

// ─── Friedrich Ministers (3) ────────────────────────────────────────

export const CLAUSEWITZ: Minister = {
  id: 'germany_clausewitz',
  emperorId: 'germany_friedrich',
  name: 'Carl von Clausewitz',
  type: 'STRATEGIST',
  activeSkill: {
    name: 'On War',
    description: 'Draw 1 card',
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

export const WALLENSTEIN: Minister = {
  id: 'germany_wallenstein',
  emperorId: 'germany_friedrich',
  name: 'Albrecht von Wallenstein',
  type: 'WARRIOR',
  activeSkill: {
    name: 'Mercenary Captain',
    description: 'Deal 3 damage to an enemy minion',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 3 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

export const ERHARD: Minister = {
  id: 'germany_erhard',
  emperorId: 'germany_friedrich',
  name: 'Ludwig Erhard',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: 'Economic Miracle',
    description: 'Gain 2 armor',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

// ─── Wilhelm I Ministers (3) ───────────────────────────────────────

export const DELBRUCK: Minister = {
  id: 'germany_delbruck',
  emperorId: 'germany_wilhelm_i',
  name: '鲁道夫·冯·德尔布吕克',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '联邦财政',
    description: '获得2点护甲',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

export const BENNIGSEN: Minister = {
  id: 'germany_bennigsen',
  emperorId: 'germany_wilhelm_i',
  name: '鲁道夫·冯·贝尼希森',
  type: 'STRATEGIST',
  activeSkill: {
    name: '邦联协商',
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

export const BLUMENTHAL: Minister = {
  id: 'germany_blumenthal',
  emperorId: 'germany_wilhelm_i',
  name: '莱昂哈德·冯·布卢门撒尔',
  type: 'WARRIOR',
  activeSkill: {
    name: '参谋调度',
    description: '一个友方生物获得+1/+2',
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

// ─── Wilhelm II Ministers (3) ──────────────────────────────────────

export const BULOW: Minister = {
  id: 'germany_bulow',
  emperorId: 'germany_wilhelm_ii',
  name: '伯恩哈德·冯·比洛',
  type: 'STRATEGIST',
  activeSkill: {
    name: '世界政策',
    description: '对手随机弃一张牌',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'RANDOM_DISCARD',
      params: { targetPlayer: 'OPPONENT', count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

export const TIRPITZ_MINISTER: Minister = {
  id: 'germany_tirpitz_minister',
  emperorId: 'germany_wilhelm_ii',
  name: '海军大臣提尔皮茨',
  type: 'WARRIOR',
  activeSkill: {
    name: '舰队扩军',
    description: '对一个敌方生物造成3点伤害',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 3 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

export const BETHMANN_HOLLWEG: Minister = {
  id: 'germany_bethmann_hollweg',
  emperorId: 'germany_wilhelm_ii',
  name: '特奥巴尔德·冯·贝特曼-霍尔维格',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '帝国财政',
    description: '获得3点护甲',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 3 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

// ─── Per-emperor minister pools ─────────────────────────────────────

export const FRIEDRICH_MINISTERS: Minister[] = [CLAUSEWITZ, WALLENSTEIN, ERHARD];
export const WILHELM_I_MINISTERS: Minister[] = [DELBRUCK, BENNIGSEN, BLUMENTHAL];
export const WILHELM_II_MINISTERS: Minister[] = [BULOW, TIRPITZ_MINISTER, BETHMANN_HOLLWEG];

// Aggregate all Germany ministers
export const GERMANY_MINISTERS: Minister[] = [
  ...FRIEDRICH_MINISTERS,
  ...WILHELM_I_MINISTERS,
  ...WILHELM_II_MINISTERS,
];
