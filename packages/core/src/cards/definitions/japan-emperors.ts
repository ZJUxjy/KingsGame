import type { Card } from '@king-card/shared';
import { japan, onPlay } from '../builders/index.js';

// ─── Japan Emperor Cards (3) ────────────────────────────────────────

export const ODA_NOBUNAGA = japan.emperor({
  slug: 'oda_nobunaga',
  name: '織田信長',
  cost: 5,
  description:
    '帝王技能：对一个随机敌方生物造成2点伤害。入场时对所有敌方生物造成1点伤害。',
  effects: [onPlay.damage('ALL_ENEMY_MINIONS', 1)],
  heroSkill: japan.heroSkill({
    name: '天下布武',
    description: '对一个随机敌方生物造成2点伤害',
    cost: 2,
    cooldown: 1,
    effect: onPlay.damage('RANDOM_ENEMY_MINION', 2),
  }),
});

export const TOKUGAWA_IEYASU = japan.emperor({
  slug: 'tokugawa_ieyasu',
  name: '德川家康',
  cost: 6,
  description: '帝王技能：所有友方生物获得+0/+1。入场时获得4点护甲。',
  effects: [onPlay.gainArmor(4)],
  heroSkill: japan.heroSkill({
    name: '幕府稳政',
    description: '所有友方生物获得+0/+1',
    cost: 2,
    cooldown: 2,
    effect: onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      healthDelta: 1,
    }),
  }),
});

export const EMPEROR_MEIJI = japan.emperor({
  slug: 'emperor_meiji',
  name: '明治天皇',
  cost: 5,
  description: '帝王技能：召唤一个1/1足轻。入场时抽一张牌。',
  effects: [onPlay.draw(1)],
  heroSkill: japan.heroSkill({
    name: '文明开化',
    description: '召唤一个1/1足轻',
    cost: 1,
    cooldown: 1,
    effect: onPlay.summon('japan_ashigaru'),
  }),
});

export const JAPAN_EMPERORS: Card[] = [
  ODA_NOBUNAGA,
  TOKUGAWA_IEYASU,
  EMPEROR_MEIJI,
];
