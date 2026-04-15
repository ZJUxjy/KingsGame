import type { Card } from '@king-card/shared';

// ─── Japan General Cards (2) ────────────────────────────────────────

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

export const JAPAN_GENERALS: Card[] = [
  SANADA_YUKIMURA,
  BENKEI,
];
