import type { Card } from '@king-card/shared';
import { createGeneralSkill, onPlay } from './builders';

// ─── Germany General Cards (6) ──────────────────────────────────────

export const BISMARCK: Card = {
  id: 'germany_bismarck',
  name: 'Otto von Bismarck',
  civilization: 'GERMANY',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 7,
  attack: 5,
  health: 7,
  description: 'Taunt. Skills: Blood and Iron, Realpolitik, Unification.',
  keywords: ['TAUNT'],
  effects: [],
  generalSkills: [
    createGeneralSkill({
      name: 'Blood and Iron',
      description: 'Deal 4 damage to an enemy minion',
      effect: onPlay('DAMAGE', { target: 'ENEMY_MINION', amount: 4 }),
    }),
    createGeneralSkill({
      name: 'Realpolitik',
      description: 'All friendly minions get +1/+2',
      effect: onPlay('MODIFY_STAT', { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 2 }),
    }),
    createGeneralSkill({
      name: 'Unification',
      description: 'Gain 4 armor',
      effect: onPlay('GAIN_ARMOR', { amount: 4 }),
    }),
  ],
};

export const ROMMEL: Card = {
  id: 'germany_rommel',
  name: 'Erwin Rommel',
  civilization: 'GERMANY',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 6,
  health: 4,
  description: 'Rush, Charge. Skills: Desert Fox, Blitzkrieg, Afrika Korps.',
  keywords: ['RUSH', 'CHARGE'],
  effects: [],
  generalSkills: [
    createGeneralSkill({
      name: 'Desert Fox',
      description: 'Deal 3 damage to all enemy minions',
      effect: onPlay('DAMAGE', { targetFilter: 'ALL_ENEMY_MINIONS', amount: 3 }),
    }),
    createGeneralSkill({
      name: 'Blitzkrieg',
      description: 'All friendly minions gain Charge this turn',
      effect: onPlay('APPLY_BUFF', {
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['CHARGE'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      }),
    }),
    createGeneralSkill({
      name: 'Afrika Korps',
      description: 'Summon a 3/3 Panzer',
      effect: onPlay('SUMMON', { cardId: 'germany_panzer' }),
    }),
  ],
};

export const HELMUTH_VON_MOLTKE: Card = {
  id: 'germany_helmuth_von_moltke',
  name: '赫尔穆特·冯·毛奇',
  civilization: 'GERMANY',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 4,
  health: 6,
  description: '嘲讽。技能①总参谋部：抽一张牌。技能②普鲁士军改：所有友方生物获得+1生命。技能③决战规划：对一个敌方生物造成4点伤害。',
  keywords: ['TAUNT'],
  effects: [],
  generalSkills: [
    createGeneralSkill({
      name: '总参谋部',
      description: '抽一张牌',
      effect: onPlay('DRAW', { count: 1 }),
    }),
    createGeneralSkill({
      name: '普鲁士军改',
      description: '所有友方生物获得+1生命',
      effect: onPlay('MODIFY_STAT', { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 1 }),
    }),
    createGeneralSkill({
      name: '决战规划',
      description: '对一个敌方生物造成4点伤害',
      effect: onPlay('DAMAGE', { target: 'ENEMY_MINION', amount: 4 }),
    }),
  ],
};

export const ALBRECHT_VON_ROON: Card = {
  id: 'germany_albrecht_von_roon',
  name: '阿尔布雷希特·冯·鲁恩',
  civilization: 'GERMANY',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 5,
  health: 4,
  description: '冲锋。技能①征兵制：召唤一个3/3掷弹兵。技能②铁血动员：所有友方生物获得+1攻击。技能③炮兵支援：对所有敌方生物造成2点伤害。',
  keywords: ['CHARGE'],
  effects: [],
  generalSkills: [
    createGeneralSkill({
      name: '征兵制',
      description: '召唤一个3/3掷弹兵',
      effect: onPlay('SUMMON', { cardId: 'germany_grenadier' }),
    }),
    createGeneralSkill({
      name: '铁血动员',
      description: '所有友方生物获得+1攻击',
      effect: onPlay('MODIFY_STAT', { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 }),
    }),
    createGeneralSkill({
      name: '炮兵支援',
      description: '对所有敌方生物造成2点伤害',
      effect: onPlay('DAMAGE', { targetFilter: 'ALL_ENEMY_MINIONS', amount: 2 }),
    }),
  ],
};

export const PAUL_VON_HINDENBURG: Card = {
  id: 'germany_paul_von_hindenburg',
  name: '保罗·冯·兴登堡',
  civilization: 'GERMANY',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 7,
  attack: 5,
  health: 7,
  description: '嘲讽。技能①东线铁壁：获得3点护甲。技能②鲁登道夫协同：所有友方生物获得+1/+1。技能③总动员：召唤一个3/3装甲师。',
  keywords: ['TAUNT'],
  effects: [],
  generalSkills: [
    createGeneralSkill({
      name: '东线铁壁',
      description: '获得3点护甲',
      effect: onPlay('GAIN_ARMOR', { amount: 3 }),
    }),
    createGeneralSkill({
      name: '鲁登道夫协同',
      description: '所有友方生物获得+1/+1',
      effect: onPlay('MODIFY_STAT', { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 1 }),
    }),
    createGeneralSkill({
      name: '总动员',
      description: '召唤一个3/3装甲师',
      effect: onPlay('SUMMON', { cardId: 'germany_panzer' }),
    }),
  ],
};

export const ALFRED_VON_TIRPITZ: Card = {
  id: 'germany_alfred_von_tirpitz',
  name: '阿尔弗雷德·冯·提尔皮茨',
  civilization: 'GERMANY',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 5,
  health: 5,
  description: '突袭。技能①大舰队法案：抽一张牌。技能②远洋威慑：对一个敌方生物造成5点伤害。技能③海军扩张：所有友方生物获得冲锋（本回合）。',
  keywords: ['RUSH'],
  effects: [],
  generalSkills: [
    createGeneralSkill({
      name: '大舰队法案',
      description: '抽一张牌',
      effect: onPlay('DRAW', { count: 1 }),
    }),
    createGeneralSkill({
      name: '远洋威慑',
      description: '对一个敌方生物造成5点伤害',
      effect: onPlay('DAMAGE', { target: 'ENEMY_MINION', amount: 5 }),
    }),
    createGeneralSkill({
      name: '海军扩张',
      description: '所有友方生物获得冲锋（本回合）',
      effect: onPlay('APPLY_BUFF', {
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['CHARGE'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      }),
    }),
  ],
};

export const GERMANY_GENERALS: Card[] = [
  BISMARCK,
  ROMMEL,
  HELMUTH_VON_MOLTKE,
  ALBRECHT_VON_ROON,
  PAUL_VON_HINDENBURG,
  ALFRED_VON_TIRPITZ,
];
