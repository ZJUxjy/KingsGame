import type { Minister } from '@king-card/shared';
import { germany, onPlay } from '../builders/index.js';
import {
  FRIEDRICH,
  WILHELM_I,
  WILHELM_II,
} from './germany-emperors.js';

// ─── Friedrich Ministers (3) ────────────────────────────────────────

export const CLAUSEWITZ = germany.minister({
  slug: 'clausewitz',
  emperor: FRIEDRICH,
  name: 'Carl von Clausewitz',
  type: 'STRATEGIST',
  cooldown: 1,
  activeSkill: germany.ministerSkill({
    name: 'On War',
    description: 'Draw 1 card',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const WALLENSTEIN = germany.minister({
  slug: 'wallenstein',
  emperor: FRIEDRICH,
  name: 'Albrecht von Wallenstein',
  type: 'WARRIOR',
  cooldown: 2,
  activeSkill: germany.ministerSkill({
    name: 'Mercenary Captain',
    description: 'Deal 3 damage to an enemy minion',
    cost: 2,
    effect: onPlay.damage('ENEMY_MINION', 3),
  }),
});

export const ERHARD = germany.minister({
  slug: 'erhard',
  emperor: FRIEDRICH,
  name: 'Ludwig Erhard',
  type: 'ADMINISTRATOR',
  cooldown: 2,
  activeSkill: germany.ministerSkill({
    name: 'Economic Miracle',
    description: 'Gain 2 armor',
    cost: 1,
    effect: onPlay.gainArmor(2),
  }),
});

// ─── Wilhelm I Ministers (3) ───────────────────────────────────────

export const DELBRUCK = germany.minister({
  slug: 'delbruck',
  emperor: WILHELM_I,
  name: '鲁道夫·冯·德尔布吕克',
  type: 'ADMINISTRATOR',
  cooldown: 1,
  activeSkill: germany.ministerSkill({
    name: '联邦财政',
    description: '获得2点护甲',
    cost: 1,
    effect: onPlay.gainArmor(2),
  }),
});

export const BENNIGSEN = germany.minister({
  slug: 'bennigsen',
  emperor: WILHELM_I,
  name: '鲁道夫·冯·贝尼希森',
  type: 'STRATEGIST',
  cooldown: 1,
  activeSkill: germany.ministerSkill({
    name: '邦联协商',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const BLUMENTHAL = germany.minister({
  slug: 'blumenthal',
  emperor: WILHELM_I,
  name: '莱昂哈德·冯·布卢门撒尔',
  type: 'WARRIOR',
  cooldown: 2,
  activeSkill: germany.ministerSkill({
    name: '参谋调度',
    description: '一个友方生物获得+1/+2',
    cost: 2,
    effect: onPlay.applyBuff({
      target: 'FRIENDLY_MINION',
      attackBonus: 1,
      healthBonus: 2,
      type: 'TEMPORARY',
      remainingTurns: 2,
    }),
  }),
});

// ─── Wilhelm II Ministers (3) ──────────────────────────────────────

export const BULOW = germany.minister({
  slug: 'bulow',
  emperor: WILHELM_II,
  name: '伯恩哈德·冯·比洛',
  type: 'STRATEGIST',
  cooldown: 2,
  activeSkill: germany.ministerSkill({
    name: '世界政策',
    description: '对手随机弃一张牌',
    cost: 2,
    effect: onPlay.randomDiscard({ targetPlayer: 'OPPONENT', count: 1 }),
  }),
});

export const TIRPITZ_MINISTER = germany.minister({
  slug: 'tirpitz_minister',
  emperor: WILHELM_II,
  name: '海军大臣提尔皮茨',
  type: 'WARRIOR',
  cooldown: 2,
  activeSkill: germany.ministerSkill({
    name: '舰队扩军',
    description: '对一个敌方生物造成3点伤害',
    cost: 2,
    effect: onPlay.damage('ENEMY_MINION', 3),
  }),
});

export const BETHMANN_HOLLWEG = germany.minister({
  slug: 'bethmann_hollweg',
  emperor: WILHELM_II,
  name: '特奥巴尔德·冯·贝特曼-霍尔维格',
  type: 'ADMINISTRATOR',
  cooldown: 1,
  activeSkill: germany.ministerSkill({
    name: '帝国财政',
    description: '获得3点护甲',
    cost: 1,
    effect: onPlay.gainArmor(3),
  }),
});

export const FRIEDRICH_MINISTERS: Minister[] = [CLAUSEWITZ, WALLENSTEIN, ERHARD];
export const WILHELM_I_MINISTERS: Minister[] = [DELBRUCK, BENNIGSEN, BLUMENTHAL];
export const WILHELM_II_MINISTERS: Minister[] = [
  BULOW,
  TIRPITZ_MINISTER,
  BETHMANN_HOLLWEG,
];

export const GERMANY_MINISTERS: Minister[] = [
  ...FRIEDRICH_MINISTERS,
  ...WILHELM_I_MINISTERS,
  ...WILHELM_II_MINISTERS,
];
