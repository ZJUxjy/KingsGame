import type { Card } from '@king-card/shared';

// ─── Japan General Cards (6) ────────────────────────────────────────

export const SANADA_YUKIMURA: Card = {
  id: 'japan_sanada_yukimura',
  name: '真田幸村',
  civilization: 'JAPAN',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 5,
  health: 5,
  description: '突袭、冲锋。技能①十文字槍：对一个敌方生物造成4点伤害。技能②赤備え：获得+2/+2。技能③六文銭：所有友方生物获得突袭（本回合）。',
  keywords: ['RUSH', 'CHARGE'],
  effects: [],
  generalSkills: [
    {
      name: '十文字槍',
      description: '对一个敌方生物造成4点伤害',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { target: 'ENEMY_MINION', amount: 4 },
      },
    },
    {
      name: '赤備え',
      description: '获得+2/+2',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'MODIFY_STAT',
        params: { attackDelta: 2, healthDelta: 2 },
      },
    },
    {
      name: '六文銭',
      description: '所有友方生物获得突袭（本回合）',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'APPLY_BUFF',
        params: {
          targetFilter: 'ALL_FRIENDLY_MINIONS',
          keywordsGranted: ['RUSH'],
          type: 'TEMPORARY',
          remainingTurns: 1,
        },
      },
    },
  ],
};

export const BENKEI: Card = {
  id: 'japan_benkei',
  name: '武蔵坊弁慶',
  civilization: 'JAPAN',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 3,
  health: 8,
  description: '嘲讽。技能①七つ道具：获得+2生命值。技能②仁王立ち：所有友方生物获得嘲讽（本回合）。技能③立往生：对所有敌方生物造成3点伤害。',
  keywords: ['TAUNT'],
  effects: [],
  generalSkills: [
    {
      name: '七つ道具',
      description: '获得+2生命值',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'MODIFY_STAT',
        params: { healthDelta: 2 },
      },
    },
    {
      name: '仁王立ち',
      description: '所有友方生物获得嘲讽（本回合）',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'APPLY_BUFF',
        params: {
          targetFilter: 'ALL_FRIENDLY_MINIONS',
          keywordsGranted: ['TAUNT'],
          type: 'TEMPORARY',
          remainingTurns: 1,
        },
      },
    },
    {
      name: '立往生',
      description: '对所有敌方生物造成3点伤害',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 3 },
      },
    },
  ],
};

export const HONDA_TADAKATSU: Card = {
  id: 'japan_honda_tadakatsu',
  name: '本多忠胜',
  civilization: 'JAPAN',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 4,
  health: 7,
  description: '嘲讽。技能①蜻蛉切：对一个敌方生物造成4点伤害。技能②不败之将：获得+1/+2。技能③三河武备：所有友方生物获得+1生命。',
  keywords: ['TAUNT'],
  effects: [],
  generalSkills: [
    {
      name: '蜻蛉切',
      description: '对一个敌方生物造成4点伤害',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { target: 'ENEMY_MINION', amount: 4 },
      },
    },
    {
      name: '不败之将',
      description: '获得+1/+2',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'MODIFY_STAT',
        params: { attackDelta: 1, healthDelta: 2 },
      },
    },
    {
      name: '三河武备',
      description: '所有友方生物获得+1生命',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'MODIFY_STAT',
        params: { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 1 },
      },
    },
  ],
};

export const II_NAOMASA: Card = {
  id: 'japan_ii_naomasa',
  name: '井伊直政',
  civilization: 'JAPAN',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 5,
  health: 4,
  description: '突袭、冲锋。技能①赤备突击：对一个敌方生物造成3点伤害。技能②德川先锋：所有友方生物获得+1攻击。技能③赤甲军：召唤一个1/1足轻。',
  keywords: ['RUSH', 'CHARGE'],
  effects: [],
  generalSkills: [
    {
      name: '赤备突击',
      description: '对一个敌方生物造成3点伤害',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { target: 'ENEMY_MINION', amount: 3 },
      },
    },
    {
      name: '德川先锋',
      description: '所有友方生物获得+1攻击',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'MODIFY_STAT',
        params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 },
      },
    },
    {
      name: '赤甲军',
      description: '召唤一个1/1足轻',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'SUMMON',
        params: { cardId: 'japan_ashigaru' },
      },
    },
  ],
};

export const SAIGO_TAKAMORI: Card = {
  id: 'japan_saigo_takamori',
  name: '西乡隆盛',
  civilization: 'JAPAN',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 5,
  health: 5,
  description: '冲锋。技能①维新先锋：所有友方生物获得+1/+1。技能②鹿儿岛义军：召唤一个3/3武者。技能③决死突贯：对一个敌方生物造成4点伤害。',
  keywords: ['CHARGE'],
  effects: [],
  generalSkills: [
    {
      name: '维新先锋',
      description: '所有友方生物获得+1/+1',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'MODIFY_STAT',
        params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 },
      },
    },
    {
      name: '鹿儿岛义军',
      description: '召唤一个3/3武者',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'SUMMON',
        params: { cardId: 'japan_musha' },
      },
    },
    {
      name: '决死突贯',
      description: '对一个敌方生物造成4点伤害',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { target: 'ENEMY_MINION', amount: 4 },
      },
    },
  ],
};

export const YAMAGATA_ARITOMO: Card = {
  id: 'japan_yamagata_aritomo',
  name: '山县有朋',
  civilization: 'JAPAN',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 4,
  health: 6,
  description: '嘲讽。技能①征兵令：召唤一个2/2铁炮兵。技能②陆军整训：所有友方生物获得突袭（本回合）。技能③军制改革：获得3点护甲。',
  keywords: ['TAUNT'],
  effects: [],
  generalSkills: [
    {
      name: '征兵令',
      description: '召唤一个2/2铁炮兵',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'SUMMON',
        params: { cardId: 'japan_teppo' },
      },
    },
    {
      name: '陆军整训',
      description: '所有友方生物获得突袭（本回合）',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'APPLY_BUFF',
        params: {
          targetFilter: 'ALL_FRIENDLY_MINIONS',
          keywordsGranted: ['RUSH'],
          type: 'TEMPORARY',
          remainingTurns: 1,
        },
      },
    },
    {
      name: '军制改革',
      description: '获得3点护甲',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'GAIN_ARMOR',
        params: { amount: 3 },
      },
    },
  ],
};

export const JAPAN_GENERALS: Card[] = [
  SANADA_YUKIMURA,
  BENKEI,
  HONDA_TADAKATSU,
  II_NAOMASA,
  SAIGO_TAKAMORI,
  YAMAGATA_ARITOMO,
];
