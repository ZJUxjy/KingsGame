import type { Card } from '@king-card/shared';
import { germany, onPlay } from '../builders/index.js';

// ─── Germany General Cards (6) ──────────────────────────────────────

export const BISMARCK = germany.general({
  slug: 'bismarck',
  name: 'Otto von Bismarck',
  cost: 7,
  attack: 5,
  health: 7,
  description: 'Taunt. Skills: Blood and Iron, Realpolitik, Unification.',
  keywords: ['TAUNT'],
  generalSkills: [
    germany.generalSkill({
      name: 'Blood and Iron',
      description: 'Deal 4 damage to an enemy minion',
      effect: onPlay.damage('ENEMY_MINION', 4),
    }),
    germany.generalSkill({
      name: 'Realpolitik',
      description: 'All friendly minions get +1/+2',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 1,
        healthDelta: 2,
      }),
    }),
    germany.generalSkill({
      name: 'Unification',
      description: 'Gain 4 armor',
      effect: onPlay.gainArmor(4),
    }),
  ],
});

export const ROMMEL = germany.general({
  slug: 'rommel',
  name: 'Erwin Rommel',
  cost: 6,
  attack: 6,
  health: 4,
  description: 'Rush, Charge. Skills: Desert Fox, Blitzkrieg, Afrika Korps.',
  keywords: ['RUSH', 'CHARGE'],
  generalSkills: [
    germany.generalSkill({
      name: 'Desert Fox',
      description: 'Deal 3 damage to all enemy minions',
      effect: onPlay.damage('ALL_ENEMY_MINIONS', 3),
    }),
    germany.generalSkill({
      name: 'Blitzkrieg',
      description: 'All friendly minions gain Charge this turn',
      effect: onPlay.applyBuff({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['CHARGE'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      }),
    }),
    germany.generalSkill({
      name: 'Afrika Korps',
      description: 'Summon a 3/3 Panzer',
      effect: onPlay.summon('germany_panzer'),
    }),
  ],
});

export const HELMUTH_VON_MOLTKE = germany.general({
  slug: 'helmuth_von_moltke',
  name: '赫尔穆特·冯·毛奇',
  cost: 6,
  attack: 4,
  health: 6,
  description:
    '嘲讽。技能①总参谋部：抽一张牌。技能②普鲁士军改：所有友方生物获得+1生命。技能③决战规划：对一个敌方生物造成4点伤害。',
  keywords: ['TAUNT'],
  generalSkills: [
    germany.generalSkill({
      name: '总参谋部',
      description: '抽一张牌',
      effect: onPlay.draw(1),
    }),
    germany.generalSkill({
      name: '普鲁士军改',
      description: '所有友方生物获得+1生命',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        healthDelta: 1,
      }),
    }),
    germany.generalSkill({
      name: '决战规划',
      description: '对一个敌方生物造成4点伤害',
      effect: onPlay.damage('ENEMY_MINION', 4),
    }),
  ],
});

export const ALBRECHT_VON_ROON = germany.general({
  slug: 'albrecht_von_roon',
  name: '阿尔布雷希特·冯·鲁恩',
  cost: 5,
  attack: 5,
  health: 4,
  description:
    '冲锋。技能①征兵制：召唤一个3/3掷弹兵。技能②铁血动员：所有友方生物获得+1攻击。技能③炮兵支援：对所有敌方生物造成2点伤害。',
  keywords: ['CHARGE'],
  generalSkills: [
    germany.generalSkill({
      name: '征兵制',
      description: '召唤一个3/3掷弹兵',
      effect: onPlay.summon('germany_grenadier'),
    }),
    germany.generalSkill({
      name: '铁血动员',
      description: '所有友方生物获得+1攻击',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 1,
      }),
    }),
    germany.generalSkill({
      name: '炮兵支援',
      description: '对所有敌方生物造成2点伤害',
      effect: onPlay.damage('ALL_ENEMY_MINIONS', 2),
    }),
  ],
});

export const PAUL_VON_HINDENBURG = germany.general({
  slug: 'paul_von_hindenburg',
  name: '保罗·冯·兴登堡',
  cost: 7,
  attack: 5,
  health: 7,
  description:
    '嘲讽。技能①东线铁壁：获得3点护甲。技能②鲁登道夫协同：所有友方生物获得+1/+1。技能③总动员：召唤一个3/3装甲师。',
  keywords: ['TAUNT'],
  generalSkills: [
    germany.generalSkill({
      name: '东线铁壁',
      description: '获得3点护甲',
      effect: onPlay.gainArmor(3),
    }),
    germany.generalSkill({
      name: '鲁登道夫协同',
      description: '所有友方生物获得+1/+1',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 1,
        healthDelta: 1,
      }),
    }),
    germany.generalSkill({
      name: '总动员',
      description: '召唤一个3/3装甲师',
      effect: onPlay.summon('germany_panzer'),
    }),
  ],
});

export const ALFRED_VON_TIRPITZ = germany.general({
  slug: 'alfred_von_tirpitz',
  name: '阿尔弗雷德·冯·提尔皮茨',
  cost: 6,
  attack: 5,
  health: 5,
  description:
    '突袭。技能①大舰队法案：抽一张牌。技能②远洋威慑：对一个敌方生物造成5点伤害。技能③海军扩张：所有友方生物获得冲锋（本回合）。',
  keywords: ['RUSH'],
  generalSkills: [
    germany.generalSkill({
      name: '大舰队法案',
      description: '抽一张牌',
      effect: onPlay.draw(1),
    }),
    germany.generalSkill({
      name: '远洋威慑',
      description: '对一个敌方生物造成5点伤害',
      effect: onPlay.damage('ENEMY_MINION', 5),
    }),
    germany.generalSkill({
      name: '海军扩张',
      description: '所有友方生物获得冲锋（本回合）',
      effect: onPlay.applyBuff({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['CHARGE'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      }),
    }),
  ],
});

export const GERMANY_GENERALS: Card[] = [
  BISMARCK,
  ROMMEL,
  HELMUTH_VON_MOLTKE,
  ALBRECHT_VON_ROON,
  PAUL_VON_HINDENBURG,
  ALFRED_VON_TIRPITZ,
];
