import type { Card } from '@king-card/shared';
import { germany, onPlay } from '../builders/index.js';

// ─── Germany Sorcery Cards (6) ──────────────────────────────────────

export const V2_ROCKET = germany.sorcery({
  slug: 'v2',
  name: 'V-2 Rocket',
  cost: 5,
  description:
    'Deal 4 damage to a random enemy minion and 1 damage to all enemy minions.',
  effects: [
    onPlay.damage('RANDOM_ENEMY_MINION', 4),
    onPlay.damage('ALL_ENEMY_MINIONS', 1),
  ],
});

export const SCORCHED_EARTH = germany.sorcery({
  slug: 'scorched_earth',
  name: 'Scorched Earth',
  cost: 4,
  description: 'Destroy a random enemy minion and a random friendly minion.',
  effects: [
    onPlay.randomDestroy('RANDOM_ENEMY_MINION'),
    onPlay.randomDestroy('RANDOM_FRIENDLY_MINION'),
  ],
});

export const NORTH_GERMAN_CONFEDERATION = germany.sorcery({
  slug: 'north_german_confederation',
  name: '北德意志邦联',
  cost: 3,
  description: '抽一张牌并获得3点护甲。',
  effects: [onPlay.draw(1), onPlay.gainArmor(3)],
});

export const FRANCO_PRUSSIAN_WAR = germany.sorcery({
  slug: 'franco_prussian_war',
  name: '普法战争',
  cost: 4,
  description: '对所有敌方生物造成2点伤害，并获得2点护甲。',
  effects: [onPlay.damage('ALL_ENEMY_MINIONS', 2), onPlay.gainArmor(2)],
});

export const SCHLIEFFEN_PLAN = germany.sorcery({
  slug: 'schlieffen_plan',
  name: '施里芬计划',
  cost: 4,
  description: '所有友方生物获得冲锋（本回合）。',
  effects: [
    onPlay.applyBuff({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      keywordsGranted: ['CHARGE'],
      type: 'TEMPORARY',
      remainingTurns: 1,
    }),
  ],
});

export const HIGH_SEAS_FLEET = germany.sorcery({
  slug: 'high_seas_fleet',
  name: '公海舰队',
  cost: 5,
  description: '对一个随机敌方生物造成4点伤害，并抽一张牌。',
  effects: [onPlay.damage('RANDOM_ENEMY_MINION', 4), onPlay.draw(1)],
});

export const GERMANY_SORCERIES: Card[] = [
  V2_ROCKET,
  SCORCHED_EARTH,
  NORTH_GERMAN_CONFEDERATION,
  FRANCO_PRUSSIAN_WAR,
  SCHLIEFFEN_PLAN,
  HIGH_SEAS_FLEET,
];
