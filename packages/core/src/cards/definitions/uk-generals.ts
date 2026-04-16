import type { Card } from '@king-card/shared';
import { onPlay, uk } from '../builders/index.js';

// ─── UK General Cards (6) ───────────────────────────────────────────

export const WELLINGTON = uk.general({
  slug: 'wellington',
  name: 'Duke of Wellington',
  cost: 7,
  attack: 5,
  health: 7,
  description:
    'Taunt. Skill①Waterloo: Deal 5 damage to an enemy minion. Skill②Iron Duke: Gain +0/+3. Skill③Thin Red Line: All friendly minions gain Taunt this turn.',
  keywords: ['TAUNT'],
  generalSkills: [
    uk.generalSkill({
      name: 'Waterloo',
      description: 'Deal 5 damage to an enemy minion',
      effect: onPlay.damage('ENEMY_MINION', 5),
    }),
    uk.generalSkill({
      name: 'Iron Duke',
      description: 'Gain +0/+3',
      effect: onPlay.modifyStat({ healthDelta: 3 }),
    }),
    uk.generalSkill({
      name: 'Thin Red Line',
      description: 'All friendly minions gain Taunt this turn',
      effect: onPlay.applyBuff({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['TAUNT'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      }),
    }),
  ],
});

export const NELSON = uk.general({
  slug: 'nelson',
  name: 'Admiral Nelson',
  cost: 6,
  attack: 6,
  health: 4,
  description:
    'Charge. Skill①Trafalgar: Deal 3 damage to all enemy minions. Skill②England Expects: All friendly minions gain +2 attack. Skill③Broadside: Deal 6 damage to an enemy minion.',
  keywords: ['CHARGE'],
  generalSkills: [
    uk.generalSkill({
      name: 'Trafalgar',
      description: 'Deal 3 damage to all enemy minions',
      effect: onPlay.damage('ALL_ENEMY_MINIONS', 3),
    }),
    uk.generalSkill({
      name: 'England Expects',
      description: 'All friendly minions gain +2 attack',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 2,
      }),
    }),
    uk.generalSkill({
      name: 'Broadside',
      description: 'Deal 6 damage to an enemy minion',
      effect: onPlay.damage('ENEMY_MINION', 6),
    }),
  ],
});

export const ROBERT_DUDLEY = uk.general({
  slug: 'robert_dudley',
  name: '罗伯特·达德利',
  cost: 5,
  attack: 4,
  health: 5,
  description:
    '冲锋。技能①宫廷集结：召唤一个2/2皇家卫队。技能②宠臣策动：一个友方生物获得+2攻击。技能③海权筹备：抽一张牌。',
  keywords: ['CHARGE'],
  generalSkills: [
    uk.generalSkill({
      name: '宫廷集结',
      description: '召唤一个2/2皇家卫队',
      effect: onPlay.summon('uk_royal_guard'),
    }),
    uk.generalSkill({
      name: '宠臣策动',
      description: '一个友方生物获得+2攻击',
      effect: onPlay.applyBuff({
        target: 'FRIENDLY_MINION',
        attackBonus: 2,
        type: 'TEMPORARY',
        remainingTurns: 2,
      }),
    }),
    uk.generalSkill({
      name: '海权筹备',
      description: '抽一张牌',
      effect: onPlay.draw(1),
    }),
  ],
});

export const WILLIAM_CECIL = uk.general({
  slug: 'william_cecil',
  name: '威廉·塞西尔',
  cost: 6,
  attack: 3,
  health: 7,
  description:
    '嘲讽。技能①王国理财：获得3点护甲。技能②情报网络：对手随机弃一张牌。技能③女王亲军：所有友方生物获得+1生命。',
  keywords: ['TAUNT'],
  generalSkills: [
    uk.generalSkill({
      name: '王国理财',
      description: '获得3点护甲',
      effect: onPlay.gainArmor(3),
    }),
    uk.generalSkill({
      name: '情报网络',
      description: '对手随机弃一张牌',
      effect: onPlay.randomDiscard({ targetPlayer: 'OPPONENT', count: 1 }),
    }),
    uk.generalSkill({
      name: '女王亲军',
      description: '所有友方生物获得+1生命',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        healthDelta: 1,
      }),
    }),
  ],
});

export const BERNARD_MONTGOMERY = uk.general({
  slug: 'bernard_montgomery',
  name: '伯纳德·蒙哥马利',
  cost: 6,
  attack: 5,
  health: 5,
  description:
    '突袭。技能①阿拉曼战役：对所有敌方生物造成2点伤害。技能②沙漠反攻：所有友方生物获得+1攻击。技能③步坦协同：召唤一个3/3皇家卫队。',
  keywords: ['RUSH'],
  generalSkills: [
    uk.generalSkill({
      name: '阿拉曼战役',
      description: '对所有敌方生物造成2点伤害',
      effect: onPlay.damage('ALL_ENEMY_MINIONS', 2),
    }),
    uk.generalSkill({
      name: '沙漠反攻',
      description: '所有友方生物获得+1攻击',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 1,
      }),
    }),
    uk.generalSkill({
      name: '步坦协同',
      description: '召唤一个3/3皇家卫队',
      effect: onPlay.summon('uk_royal_guard'),
    }),
  ],
});

export const ALAN_BROOKE = uk.general({
  slug: 'alan_brooke',
  name: '艾伦·布鲁克',
  cost: 7,
  attack: 4,
  health: 7,
  description:
    '嘲讽。技能①帝国参谋本部：抽一张牌。技能②本土防御：所有友方生物获得+1/+1。技能③联合作战：对一个敌方生物造成5点伤害。',
  keywords: ['TAUNT'],
  generalSkills: [
    uk.generalSkill({
      name: '帝国参谋本部',
      description: '抽一张牌',
      effect: onPlay.draw(1),
    }),
    uk.generalSkill({
      name: '本土防御',
      description: '所有友方生物获得+1/+1',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 1,
        healthDelta: 1,
      }),
    }),
    uk.generalSkill({
      name: '联合作战',
      description: '对一个敌方生物造成5点伤害',
      effect: onPlay.damage('ENEMY_MINION', 5),
    }),
  ],
});

export const UK_GENERALS: Card[] = [
  WELLINGTON,
  NELSON,
  ROBERT_DUDLEY,
  WILLIAM_CECIL,
  BERNARD_MONTGOMERY,
  ALAN_BROOKE,
];
