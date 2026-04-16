import type { Minister } from '@king-card/shared';
import { onPlay, usa } from '../builders/index.js';
import {
  LINCOLN,
  GEORGE_WASHINGTON,
  FRANKLIN_ROOSEVELT,
} from './usa-emperors.js';

// ─── Lincoln Ministers (3) ──────────────────────────────────────────

export const FRANKLIN = usa.minister({
  slug: 'franklin',
  emperor: LINCOLN,
  name: 'Benjamin Franklin',
  type: 'STRATEGIST',
  cooldown: 0,
  activeSkill: usa.ministerSkill({
    name: 'Diplomacy',
    description: 'Draw 1 card',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const SHERMAN_MINISTER = usa.minister({
  slug: 'sherman_minister',
  emperor: LINCOLN,
  name: 'William Sherman',
  type: 'WARRIOR',
  cooldown: 0,
  activeSkill: usa.ministerSkill({
    name: 'March to the Sea',
    description: 'Deal 2 damage to a random enemy minion',
    cost: 2,
    effect: onPlay.damage('ENEMY_MINION', 2),
  }),
});

export const HAMILTON = usa.minister({
  slug: 'hamilton',
  emperor: LINCOLN,
  name: 'Alexander Hamilton',
  type: 'ADMINISTRATOR',
  cooldown: 0,
  activeSkill: usa.ministerSkill({
    name: 'National Bank',
    description: 'Gain 1 armor',
    cost: 1,
    effect: onPlay.gainArmor(1),
  }),
});

// ─── George Washington Ministers (3) ───────────────────────────────

export const JOHN_ADAMS = usa.minister({
  slug: 'john_adams',
  emperor: GEORGE_WASHINGTON,
  name: '约翰·亚当斯',
  type: 'STRATEGIST',
  cooldown: 1,
  activeSkill: usa.ministerSkill({
    name: '独立辩论',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const THOMAS_PAINE = usa.minister({
  slug: 'thomas_paine',
  emperor: GEORGE_WASHINGTON,
  name: '托马斯·潘恩',
  type: 'ENVOY',
  cooldown: 2,
  activeSkill: usa.ministerSkill({
    name: '常识',
    description: '对手随机弃一张牌',
    cost: 2,
    effect: onPlay.randomDiscard({ targetPlayer: 'OPPONENT', count: 1 }),
  }),
});

export const HENRY_LAURENS = usa.minister({
  slug: 'henry_laurens',
  emperor: GEORGE_WASHINGTON,
  name: '亨利·劳伦斯',
  type: 'ADMINISTRATOR',
  cooldown: 1,
  activeSkill: usa.ministerSkill({
    name: '大陆后勤',
    description: '获得2点护甲',
    cost: 1,
    effect: onPlay.gainArmor(2),
  }),
});

// ─── Franklin Roosevelt Ministers (3) ──────────────────────────────

export const ELEANOR_ROOSEVELT = usa.minister({
  slug: 'eleanor_roosevelt',
  emperor: FRANKLIN_ROOSEVELT,
  name: '埃莉诺·罗斯福',
  type: 'ADMINISTRATOR',
  cooldown: 1,
  activeSkill: usa.ministerSkill({
    name: '民生救济',
    description: '恢复英雄3点生命',
    cost: 1,
    effect: onPlay.heal('HERO', 3),
  }),
});

export const HARRY_HOPKINS = usa.minister({
  slug: 'harry_hopkins',
  emperor: FRANKLIN_ROOSEVELT,
  name: '哈里·霍普金斯',
  type: 'STRATEGIST',
  cooldown: 1,
  activeSkill: usa.ministerSkill({
    name: '租借法案',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const GEORGE_MARSHALL = usa.minister({
  slug: 'george_marshall',
  emperor: FRANKLIN_ROOSEVELT,
  name: '乔治·马歇尔',
  type: 'WARRIOR',
  cooldown: 2,
  activeSkill: usa.ministerSkill({
    name: '参谋联席',
    description: '所有友方生物获得+1/+1',
    cost: 2,
    effect: onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
      healthDelta: 1,
    }),
  }),
});

export const LINCOLN_MINISTERS: Minister[] = [
  FRANKLIN,
  SHERMAN_MINISTER,
  HAMILTON,
];
export const WASHINGTON_MINISTERS: Minister[] = [
  JOHN_ADAMS,
  THOMAS_PAINE,
  HENRY_LAURENS,
];
export const ROOSEVELT_MINISTERS: Minister[] = [
  ELEANOR_ROOSEVELT,
  HARRY_HOPKINS,
  GEORGE_MARSHALL,
];

export const USA_MINISTERS: Minister[] = [
  ...LINCOLN_MINISTERS,
  ...WASHINGTON_MINISTERS,
  ...ROOSEVELT_MINISTERS,
];
