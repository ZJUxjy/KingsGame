import type { Card } from '@king-card/shared';
import { onPlay, usa } from '../builders/index.js';

// ─── USA Sorcery Cards (6) ──────────────────────────────────────────

export const MANHATTAN_PROJECT = usa.sorcery({
  slug: 'manhattan',
  name: 'Manhattan Project',
  cost: 6,
  description: 'Deal 4 damage to all minions.',
  effects: [onPlay.damage('ALL_MINIONS', 4)],
});

export const MONROE_DOCTRINE = usa.sorcery({
  slug: 'monroe',
  name: 'Monroe Doctrine',
  cost: 3,
  description: 'Opponent discards 1 random card.',
  effects: [onPlay.randomDiscard({ targetPlayer: 'OPPONENT', count: 1 })],
});

export const CONTINENTAL_CONGRESS = usa.sorcery({
  slug: 'continental_congress',
  name: '大陆会议',
  cost: 3,
  description: '抽两张牌。',
  effects: [onPlay.draw(2)],
});

export const VALLEY_FORGE = usa.sorcery({
  slug: 'valley_forge',
  name: '福吉谷冬训',
  cost: 4,
  description: '所有友方生物获得+1/+1。',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
      healthDelta: 1,
    }),
  ],
});

export const NEW_DEAL = usa.sorcery({
  slug: 'new_deal',
  name: '新政',
  cost: 4,
  description: '抽一张牌并获得4点护甲。',
  effects: [onPlay.draw(1), onPlay.gainArmor(4)],
});

export const D_DAY_LANDING = usa.sorcery({
  slug: 'd_day_landing',
  name: '诺曼底登陆',
  cost: 5,
  description: '召唤一个3/3空降兵，并对所有敌方生物造成1点伤害。',
  effects: [
    onPlay.summon('usa_airborne'),
    onPlay.damage('ALL_ENEMY_MINIONS', 1),
  ],
});

export const USA_SORCERIES: Card[] = [
  MANHATTAN_PROJECT,
  MONROE_DOCTRINE,
  CONTINENTAL_CONGRESS,
  VALLEY_FORGE,
  NEW_DEAL,
  D_DAY_LANDING,
];
