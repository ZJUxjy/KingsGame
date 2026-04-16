import type { Card } from '@king-card/shared';
import { onPlay, usa } from '../builders/index.js';

// ─── USA Emperor Cards (3) ──────────────────────────────────────────

export const LINCOLN = usa.emperor({
  slug: 'lincoln',
  name: '亚伯拉罕·林肯',
  cost: 5,
  description: '帝王技能：所有友方生物恢复2点生命。入场时所有友方生物获得+1生命。',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      healthDelta: 1,
    }),
  ],
  heroSkill: usa.heroSkill({
    name: '解放宣言',
    description: '所有友方生物恢复2点生命',
    cost: 2,
    cooldown: 2,
    effect: onPlay.heal('ALL_FRIENDLY_MINIONS', 2),
  }),
});

export const GEORGE_WASHINGTON = usa.emperor({
  slug: 'george_washington',
  name: '乔治·华盛顿',
  cost: 5,
  description: '帝王技能：所有友方生物获得+1攻击。入场时获得3点护甲。',
  effects: [onPlay.gainArmor(3)],
  heroSkill: usa.heroSkill({
    name: '大陆军号令',
    description: '所有友方生物获得+1攻击',
    cost: 2,
    cooldown: 2,
    effect: onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
    }),
  }),
});

export const FRANKLIN_ROOSEVELT = usa.emperor({
  slug: 'franklin_roosevelt',
  name: '富兰克林·罗斯福',
  cost: 6,
  description: '帝王技能：召唤一个3/3大兵。入场时所有友方生物获得+1生命。',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      healthDelta: 1,
    }),
  ],
  heroSkill: usa.heroSkill({
    name: '民主兵工厂',
    description: '召唤一个3/3大兵',
    cost: 2,
    cooldown: 1,
    effect: onPlay.summon('usa_gi'),
  }),
});

export const USA_EMPERORS: Card[] = [
  LINCOLN,
  GEORGE_WASHINGTON,
  FRANKLIN_ROOSEVELT,
];
