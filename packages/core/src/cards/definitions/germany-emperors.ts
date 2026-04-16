import type { Card } from '@king-card/shared';
import { germany, onPlay } from '../builders/index.js';

// ─── Germany Emperor Cards (3) ──────────────────────────────────────

export const FRIEDRICH = germany.emperor({
  slug: 'friedrich',
  name: '腓特烈大帝',
  cost: 5,
  description: '帝王技能：对一个敌方生物造成2点伤害。入场时所有友方生物获得+1攻击。',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
    }),
  ],
  heroSkill: germany.heroSkill({
    name: '斜线阵',
    description: '对一个敌方生物造成2点伤害',
    cost: 1,
    cooldown: 1,
    effect: onPlay.damage('ENEMY_MINION', 2),
  }),
});

export const WILHELM_I = germany.emperor({
  slug: 'wilhelm_i',
  name: '威廉一世',
  cost: 6,
  description: '帝王技能：所有友方生物获得+1生命。入场时获得4点护甲。',
  effects: [onPlay.gainArmor(4)],
  heroSkill: germany.heroSkill({
    name: '帝国统一',
    description: '所有友方生物获得+1生命',
    cost: 2,
    cooldown: 2,
    effect: onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      healthDelta: 1,
    }),
  }),
});

export const WILHELM_II = germany.emperor({
  slug: 'wilhelm_ii',
  name: '威廉二世',
  cost: 5,
  description:
    '帝王技能：对所有敌方生物造成1点伤害。入场时所有友方生物获得+1攻击。',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
    }),
  ],
  heroSkill: germany.heroSkill({
    name: '世界政策',
    description: '对所有敌方生物造成1点伤害',
    cost: 2,
    cooldown: 1,
    effect: onPlay.damage('ALL_ENEMY_MINIONS', 1),
  }),
});

export const GERMANY_EMPERORS: Card[] = [FRIEDRICH, WILHELM_I, WILHELM_II];
