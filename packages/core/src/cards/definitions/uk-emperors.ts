import type { Card } from '@king-card/shared';
import { onPlay, uk } from '../builders/index.js';

// ─── UK Emperor Cards (3) ───────────────────────────────────────────

export const VICTORIA = uk.emperor({
  slug: 'victoria',
  name: '维多利亚女王',
  cost: 6,
  description: '帝王技能：所有友方生物获得+1/+1。入场时获得3点护甲。',
  effects: [onPlay.gainArmor(3)],
  heroSkill: uk.heroSkill({
    name: '帝国号令',
    description: '所有友方生物获得+1/+1',
    cost: 2,
    cooldown: 2,
    effect: onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
      healthDelta: 1,
    }),
  }),
});

export const ELIZABETH_I = uk.emperor({
  slug: 'elizabeth_i',
  name: '伊丽莎白一世',
  cost: 5,
  description: '帝王技能：抽一张牌。入场时获得2点护甲。',
  effects: [onPlay.gainArmor(2)],
  heroSkill: uk.heroSkill({
    name: '黄金时代',
    description: '抽一张牌',
    cost: 1,
    cooldown: 1,
    effect: onPlay.draw(1),
  }),
});

export const WINSTON_CHURCHILL = uk.emperor({
  slug: 'winston_churchill',
  name: '温斯顿·丘吉尔',
  cost: 6,
  description: '帝王技能：所有友方生物获得+1攻击。入场时获得5点护甲。',
  effects: [onPlay.gainArmor(5)],
  heroSkill: uk.heroSkill({
    name: '最光辉时刻',
    description: '所有友方生物获得+1攻击',
    cost: 2,
    cooldown: 2,
    effect: onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
    }),
  }),
});

export const UK_EMPERORS: Card[] = [
  VICTORIA,
  ELIZABETH_I,
  WINSTON_CHURCHILL,
];
