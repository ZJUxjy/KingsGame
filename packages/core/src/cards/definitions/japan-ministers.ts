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

// ─── 德川家康 Ministers (3) ──────────────────────────────────────────

export const HATTORI_HANZO: Minister = {
  id: 'japan_hattori_hanzo',
  emperorId: 'japan_tokugawa_ieyasu',
  name: '服部半藏',
  type: 'STRATEGIST',
  activeSkill: {
    name: '伊贺密令',
    description: '对一个敌方生物造成2点伤害',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

export const HONDA_MASANOBU: Minister = {
  id: 'japan_honda_masanobu',
  emperorId: 'japan_tokugawa_ieyasu',
  name: '本多正信',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '幕政整饬',
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

export const SAKAI_TADATSUGU: Minister = {
  id: 'japan_sakai_tadatsugu',
  emperorId: 'japan_tokugawa_ieyasu',
  name: '酒井忠次',
  type: 'WARRIOR',
  activeSkill: {
    name: '东海先锋',
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

// ─── 明治天皇 Ministers (3) ─────────────────────────────────────────

export const ITO_HIROBUMI: Minister = {
  id: 'japan_ito_hirobumi',
  emperorId: 'japan_emperor_meiji',
  name: '伊藤博文',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: '内阁制度',
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

export const OKUBO_TOSHIMICHI: Minister = {
  id: 'japan_okubo_toshimichi',
  emperorId: 'japan_emperor_meiji',
  name: '大久保利通',
  type: 'STRATEGIST',
  activeSkill: {
    name: '版籍奉还',
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

export const KIDO_TAKAYOSHI: Minister = {
  id: 'japan_kido_takayoshi',
  emperorId: 'japan_emperor_meiji',
  name: '木户孝允',
  type: 'ENVOY',
  activeSkill: {
    name: '五条誓文',
    description: '所有友方生物获得+1攻击',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

// ─── Per-emperor minister pools ─────────────────────────────────────

export const ODA_MINISTERS: Minister[] = [AKECHI, TOYOTOMI, MAEDA];
export const TOKUGAWA_MINISTERS: Minister[] = [HATTORI_HANZO, HONDA_MASANOBU, SAKAI_TADATSUGU];
export const MEIJI_MINISTERS: Minister[] = [ITO_HIROBUMI, OKUBO_TOSHIMICHI, KIDO_TAKAYOSHI];

// Aggregate all Japan ministers
export const JAPAN_MINISTERS: Minister[] = [
  ...ODA_MINISTERS,
  ...TOKUGAWA_MINISTERS,
  ...MEIJI_MINISTERS,
];
