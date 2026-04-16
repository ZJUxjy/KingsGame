import type { Minister } from '@king-card/shared';

// ─── Queen Victoria Ministers (3) ────────────────────────────────────

export const PITT: Minister = {
  id: 'uk_pitt',
  emperorId: 'uk_victoria',
  name: 'William Pitt',
  type: 'STRATEGIST',
  activeSkill: {
    name: 'Parliament Act',
    description: 'Draw a card',
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

export const DRAKE: Minister = {
  id: 'uk_drake',
  emperorId: 'uk_victoria',
  name: 'Francis Drake',
  type: 'WARRIOR',
  activeSkill: {
    name: 'Privateer Raid',
    description: 'Deal 2 damage to a random enemy minion',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'RANDOM_ENEMY_MINION', amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

export const WALPOLE: Minister = {
  id: 'uk_walpole',
  emperorId: 'uk_victoria',
  name: 'Robert Walpole',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: 'Fiscal Policy',
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

// ─── Elizabeth I Ministers (3) ─────────────────────────────────────

export const WALSINGHAM: Minister = {
  id: 'uk_walsingham',
  emperorId: 'uk_elizabeth_i',
  name: '弗朗西斯·沃尔辛厄姆',
  type: 'STRATEGIST',
  activeSkill: {
    name: '王室密探',
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

export const BURGHLEY: Minister = {
  id: 'uk_burghley',
  emperorId: 'uk_elizabeth_i',
  name: '伯利勋爵',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '国库整顿',
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

export const ESSEX: Minister = {
  id: 'uk_essex',
  emperorId: 'uk_elizabeth_i',
  name: '埃塞克斯伯爵',
  type: 'WARRIOR',
  activeSkill: {
    name: '女王宠臣',
    description: '一个友方生物获得+2攻击',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'APPLY_BUFF',
      params: {
        target: 'FRIENDLY_MINION',
        attackBonus: 2,
        type: 'TEMPORARY',
        remainingTurns: 2,
      },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

// ─── Winston Churchill Ministers (3) ───────────────────────────────

export const ATTLEE: Minister = {
  id: 'uk_attlee',
  emperorId: 'uk_winston_churchill',
  name: '克莱门特·艾德礼',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '战时内阁',
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

export const TURING: Minister = {
  id: 'uk_turing',
  emperorId: 'uk_winston_churchill',
  name: '艾伦·图灵',
  type: 'STRATEGIST',
  activeSkill: {
    name: '密码破译',
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

export const EDEN: Minister = {
  id: 'uk_eden',
  emperorId: 'uk_winston_churchill',
  name: '安东尼·艾登',
  type: 'ENVOY',
  activeSkill: {
    name: '盟邦协调',
    description: '所有友方生物获得+1生命',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

// ─── Per-emperor minister pools ─────────────────────────────────────

export const VICTORIA_MINISTERS: Minister[] = [PITT, DRAKE, WALPOLE];
export const ELIZABETH_MINISTERS: Minister[] = [WALSINGHAM, BURGHLEY, ESSEX];
export const CHURCHILL_MINISTERS: Minister[] = [ATTLEE, TURING, EDEN];

// Aggregate all UK ministers
export const UK_MINISTERS: Minister[] = [
  ...VICTORIA_MINISTERS,
  ...ELIZABETH_MINISTERS,
  ...CHURCHILL_MINISTERS,
];
