import type { Card } from '@king-card/shared';
import { onPlay, usa } from '../builders/index.js';

// ─── USA General Cards (6) ──────────────────────────────────────────

export const GRANT = usa.general({
  slug: 'grant',
  name: 'Ulysses S. Grant',
  cost: 7,
  attack: 6,
  health: 6,
  description:
    'Charge. Skill 1: Total War — deal 3 damage to all enemy minions. Skill 2: Siege — deal 5 damage to an enemy minion. Skill 3: March to the Sea — all friendly minions gain Charge this turn.',
  keywords: ['CHARGE'],
  generalSkills: [
    usa.generalSkill({
      name: 'Total War',
      description: 'Deal 3 damage to all enemy minions',
      effect: onPlay.damage('ALL_ENEMY_MINIONS', 3),
    }),
    usa.generalSkill({
      name: 'Siege',
      description: 'Deal 5 damage to an enemy minion',
      effect: onPlay.damage('ENEMY_MINION', 5),
    }),
    usa.generalSkill({
      name: 'March to the Sea',
      description: 'All friendly minions gain Charge this turn',
      effect: onPlay.applyBuff({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['CHARGE'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      }),
    }),
  ],
});

export const PATTON = usa.general({
  slug: 'patton',
  name: 'George Patton',
  cost: 6,
  attack: 5,
  health: 5,
  description:
    'Rush. Skill 1: Blitzkrieg Counter — deal 4 damage to an enemy minion. Skill 2: Rally the Troops — all friendly minions get +2/+1. Skill 3: Third Army — summon a 3/3 GI.',
  keywords: ['RUSH'],
  generalSkills: [
    usa.generalSkill({
      name: 'Blitzkrieg Counter',
      description: 'Deal 4 damage to an enemy minion',
      effect: onPlay.damage('ENEMY_MINION', 4),
    }),
    usa.generalSkill({
      name: 'Rally the Troops',
      description: 'All friendly minions get +2/+1',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 2,
        healthDelta: 1,
      }),
    }),
    usa.generalSkill({
      name: 'Third Army',
      description: 'Summon a 3/3 GI',
      effect: onPlay.summon('usa_gi'),
    }),
  ],
});

export const NATHANAEL_GREENE = usa.general({
  slug: 'nathanael_greene',
  name: '纳撒尼尔·格林',
  cost: 6,
  attack: 4,
  health: 6,
  description:
    '嘲讽。技能①南方机动：对一个敌方生物造成4点伤害。技能②拖延战术：获得+0/+3。技能③坚守福吉谷：所有友方生物获得+1生命。',
  keywords: ['TAUNT'],
  generalSkills: [
    usa.generalSkill({
      name: '南方机动',
      description: '对一个敌方生物造成4点伤害',
      effect: onPlay.damage('ENEMY_MINION', 4),
    }),
    usa.generalSkill({
      name: '拖延战术',
      description: '获得+0/+3',
      effect: onPlay.modifyStat({ healthDelta: 3 }),
    }),
    usa.generalSkill({
      name: '坚守福吉谷',
      description: '所有友方生物获得+1生命',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        healthDelta: 1,
      }),
    }),
  ],
});

export const HENRY_KNOX = usa.general({
  slug: 'henry_knox',
  name: '亨利·诺克斯',
  cost: 5,
  attack: 4,
  health: 5,
  description:
    '冲锋。技能①炮兵统率：对所有敌方生物造成2点伤害。技能②大陆军整编：所有友方生物获得+1攻击。技能③火炮援护：召唤一个3/3大兵。',
  keywords: ['CHARGE'],
  generalSkills: [
    usa.generalSkill({
      name: '炮兵统率',
      description: '对所有敌方生物造成2点伤害',
      effect: onPlay.damage('ALL_ENEMY_MINIONS', 2),
    }),
    usa.generalSkill({
      name: '大陆军整编',
      description: '所有友方生物获得+1攻击',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 1,
      }),
    }),
    usa.generalSkill({
      name: '火炮援护',
      description: '召唤一个3/3大兵',
      effect: onPlay.summon('usa_gi'),
    }),
  ],
});

export const DOUGLAS_MACARTHUR = usa.general({
  slug: 'douglas_macarthur',
  name: '道格拉斯·麦克阿瑟',
  cost: 6,
  attack: 5,
  health: 5,
  description:
    '突袭。技能①跳岛战术：对一个敌方生物造成4点伤害。技能②我将归来：召唤一个3/3空降兵。技能③远东统帅：所有友方生物获得突袭（本回合）。',
  keywords: ['RUSH'],
  generalSkills: [
    usa.generalSkill({
      name: '跳岛战术',
      description: '对一个敌方生物造成4点伤害',
      effect: onPlay.damage('ENEMY_MINION', 4),
    }),
    usa.generalSkill({
      name: '我将归来',
      description: '召唤一个3/3空降兵',
      effect: onPlay.summon('usa_airborne'),
    }),
    usa.generalSkill({
      name: '远东统帅',
      description: '所有友方生物获得突袭（本回合）',
      effect: onPlay.applyBuff({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['RUSH'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      }),
    }),
  ],
});

export const DWIGHT_EISENHOWER = usa.general({
  slug: 'dwight_eisenhower',
  name: '德怀特·艾森豪威尔',
  cost: 7,
  attack: 5,
  health: 7,
  description:
    '嘲讽。技能①霸王行动：对所有敌方生物造成3点伤害。技能②盟军总司令：所有友方生物获得+1/+1。技能③后勤大师：抽一张牌。',
  keywords: ['TAUNT'],
  generalSkills: [
    usa.generalSkill({
      name: '霸王行动',
      description: '对所有敌方生物造成3点伤害',
      effect: onPlay.damage('ALL_ENEMY_MINIONS', 3),
    }),
    usa.generalSkill({
      name: '盟军总司令',
      description: '所有友方生物获得+1/+1',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 1,
        healthDelta: 1,
      }),
    }),
    usa.generalSkill({
      name: '后勤大师',
      description: '抽一张牌',
      effect: onPlay.draw(1),
    }),
  ],
});

export const USA_GENERALS: Card[] = [
  GRANT,
  PATTON,
  NATHANAEL_GREENE,
  HENRY_KNOX,
  DOUGLAS_MACARTHUR,
  DWIGHT_EISENHOWER,
];
