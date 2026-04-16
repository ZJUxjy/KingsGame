import type { Card } from '@king-card/shared';
import { createGeneralSkill, onPlay } from './builders';

// ─── China General Cards (2) ────────────────────────────────────────

export const HUOQUBING: Card = {
  id: 'china_huoqubing',
  name: '霍去病',
  civilization: 'CHINA',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 7,
  attack: 6,
  health: 6,
  description: '突袭、冲锋、连击。技能①长驱直入：对一个敌方生物造成6点伤害。技能②封狼居胥：+3/+3并获得连击。技能③冠军侯：所有友方生物获得冲锋（本回合）。',
  keywords: ['RUSH', 'CHARGE', 'COMBO_STRIKE'],
  effects: [],
  generalSkills: [
    createGeneralSkill({
      name: '长驱直入',
      description: '对一个敌方生物造成6点伤害',
      effect: onPlay('DAMAGE', { target: 'ENEMY_MINION', amount: 6 }),
    }),
    createGeneralSkill({
      name: '封狼居胥',
      description: '获得+3/+3和连击',
      effect: onPlay('MODIFY_STAT', { attackDelta: 3, healthDelta: 3 }),
    }),
    createGeneralSkill({
      name: '冠军侯',
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

export const WEIQING: Card = {
  id: 'china_weiqing',
  name: '卫青',
  civilization: 'CHINA',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 5,
  health: 7,
  description: '嘲讽。技能①漠北之战：召唤两个汉朝骑兵。技能②河套筑垒：所有友方生物+3生命。技能③龙城飞将：所有敌方生物-2攻击力。',
  keywords: ['TAUNT'],
  effects: [],
  generalSkills: [
    createGeneralSkill({
      name: '漠北之战',
      description: '召唤两个汉朝骑兵',
      effect: onPlay('SUMMON', { cardId: 'china_hanchao_qibing', count: 2 }),
    }),
    createGeneralSkill({
      name: '河套筑垒',
      description: '所有友方生物获得+3生命值',
      effect: onPlay('MODIFY_STAT', { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 3 }),
    }),
    createGeneralSkill({
      name: '龙城飞将',
      description: '所有敌方生物-2攻击力',
      effect: onPlay('MODIFY_STAT', { targetFilter: 'ALL_ENEMY_MINIONS', attackDelta: -2 }),
    }),
  ],
};

export const CHINA_GENERALS: Card[] = [
  HUOQUBING,
  WEIQING,
];
