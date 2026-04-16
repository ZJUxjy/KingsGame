import type { Card } from '@king-card/shared';
import { japan, onPlay } from '../builders/index.js';

// ─── Japan General Cards (6) ────────────────────────────────────────

export const SANADA_YUKIMURA = japan.general({
  slug: 'sanada_yukimura',
  name: '真田幸村',
  cost: 6,
  attack: 5,
  health: 5,
  description:
    '突袭、冲锋。技能①十文字槍：对一个敌方生物造成4点伤害。技能②赤備え：获得+2/+2。技能③六文銭：所有友方生物获得突袭（本回合）。',
  keywords: ['RUSH', 'CHARGE'],
  generalSkills: [
    japan.generalSkill({
      name: '十文字槍',
      description: '对一个敌方生物造成4点伤害',
      effect: onPlay.damage('ENEMY_MINION', 4),
    }),
    japan.generalSkill({
      name: '赤備え',
      description: '获得+2/+2',
      effect: onPlay.modifyStat({ attackDelta: 2, healthDelta: 2 }),
    }),
    japan.generalSkill({
      name: '六文銭',
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

export const BENKEI = japan.general({
  slug: 'benkei',
  name: '武蔵坊弁慶',
  cost: 5,
  attack: 3,
  health: 8,
  description:
    '嘲讽。技能①七つ道具：获得+2生命值。技能②仁王立ち：所有友方生物获得嘲讽（本回合）。技能③立往生：对所有敌方生物造成3点伤害。',
  keywords: ['TAUNT'],
  generalSkills: [
    japan.generalSkill({
      name: '七つ道具',
      description: '获得+2生命值',
      effect: onPlay.modifyStat({ healthDelta: 2 }),
    }),
    japan.generalSkill({
      name: '仁王立ち',
      description: '所有友方生物获得嘲讽（本回合）',
      effect: onPlay.applyBuff({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['TAUNT'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      }),
    }),
    japan.generalSkill({
      name: '立往生',
      description: '对所有敌方生物造成3点伤害',
      effect: onPlay.damage('ALL_ENEMY_MINIONS', 3),
    }),
  ],
});

export const HONDA_TADAKATSU = japan.general({
  slug: 'honda_tadakatsu',
  name: '本多忠胜',
  cost: 6,
  attack: 4,
  health: 7,
  description:
    '嘲讽。技能①蜻蛉切：对一个敌方生物造成4点伤害。技能②不败之将：获得+1/+2。技能③三河武备：所有友方生物获得+1生命。',
  keywords: ['TAUNT'],
  generalSkills: [
    japan.generalSkill({
      name: '蜻蛉切',
      description: '对一个敌方生物造成4点伤害',
      effect: onPlay.damage('ENEMY_MINION', 4),
    }),
    japan.generalSkill({
      name: '不败之将',
      description: '获得+1/+2',
      effect: onPlay.modifyStat({ attackDelta: 1, healthDelta: 2 }),
    }),
    japan.generalSkill({
      name: '三河武备',
      description: '所有友方生物获得+1生命',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        healthDelta: 1,
      }),
    }),
  ],
});

export const II_NAOMASA = japan.general({
  slug: 'ii_naomasa',
  name: '井伊直政',
  cost: 5,
  attack: 5,
  health: 4,
  description:
    '突袭、冲锋。技能①赤备突击：对一个敌方生物造成3点伤害。技能②德川先锋：所有友方生物获得+1攻击。技能③赤甲军：召唤一个1/1足轻。',
  keywords: ['RUSH', 'CHARGE'],
  generalSkills: [
    japan.generalSkill({
      name: '赤备突击',
      description: '对一个敌方生物造成3点伤害',
      effect: onPlay.damage('ENEMY_MINION', 3),
    }),
    japan.generalSkill({
      name: '德川先锋',
      description: '所有友方生物获得+1攻击',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 1,
      }),
    }),
    japan.generalSkill({
      name: '赤甲军',
      description: '召唤一个1/1足轻',
      effect: onPlay.summon('japan_ashigaru'),
    }),
  ],
});

export const SAIGO_TAKAMORI = japan.general({
  slug: 'saigo_takamori',
  name: '西乡隆盛',
  cost: 6,
  attack: 5,
  health: 5,
  description:
    '冲锋。技能①维新先锋：所有友方生物获得+1/+1。技能②鹿儿岛义军：召唤一个3/3武者。技能③决死突贯：对一个敌方生物造成4点伤害。',
  keywords: ['CHARGE'],
  generalSkills: [
    japan.generalSkill({
      name: '维新先锋',
      description: '所有友方生物获得+1/+1',
      effect: onPlay.modifyStat({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        attackDelta: 1,
        healthDelta: 1,
      }),
    }),
    japan.generalSkill({
      name: '鹿儿岛义军',
      description: '召唤一个3/3武者',
      effect: onPlay.summon('japan_musha'),
    }),
    japan.generalSkill({
      name: '决死突贯',
      description: '对一个敌方生物造成4点伤害',
      effect: onPlay.damage('ENEMY_MINION', 4),
    }),
  ],
});

export const YAMAGATA_ARITOMO = japan.general({
  slug: 'yamagata_aritomo',
  name: '山县有朋',
  cost: 5,
  attack: 4,
  health: 6,
  description:
    '嘲讽。技能①征兵令：召唤一个2/2铁炮兵。技能②陆军整训：所有友方生物获得突袭（本回合）。技能③军制改革：获得3点护甲。',
  keywords: ['TAUNT'],
  generalSkills: [
    japan.generalSkill({
      name: '征兵令',
      description: '召唤一个2/2铁炮兵',
      effect: onPlay.summon('japan_teppo'),
    }),
    japan.generalSkill({
      name: '陆军整训',
      description: '所有友方生物获得突袭（本回合）',
      effect: onPlay.applyBuff({
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['RUSH'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      }),
    }),
    japan.generalSkill({
      name: '军制改革',
      description: '获得3点护甲',
      effect: onPlay.gainArmor(3),
    }),
  ],
});

export const JAPAN_GENERALS: Card[] = [
  SANADA_YUKIMURA,
  BENKEI,
  HONDA_TADAKATSU,
  II_NAOMASA,
  SAIGO_TAKAMORI,
  YAMAGATA_ARITOMO,
];
