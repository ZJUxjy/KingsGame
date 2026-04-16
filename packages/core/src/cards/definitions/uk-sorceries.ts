import type { Card } from '@king-card/shared';
import { onPlay, uk } from '../builders/index.js';

// ─── UK Sorcery Cards (6) ───────────────────────────────────────────

export const GREAT_FIRE = uk.sorcery({
  slug: 'great_fire',
  name: 'Great Fire',
  cost: 5,
  description: 'Deal 3 damage to all minions.',
  effects: [onPlay.damage('ALL_MINIONS', 3)],
});

export const ENCLOSURE_ACT = uk.sorcery({
  slug: 'enclosure',
  name: 'Enclosure Act',
  cost: 3,
  description: 'Opponent discards 1 random card.',
  effects: [onPlay.randomDiscard({ targetPlayer: 'OPPONENT', count: 1 })],
});

export const SPANISH_ARMADA = uk.sorcery({
  slug: 'spanish_armada',
  name: '击溃无敌舰队',
  cost: 4,
  description: '对所有敌方生物造成2点伤害。',
  effects: [onPlay.damage('ALL_ENEMY_MINIONS', 2)],
});

export const ROYAL_CHARTER = uk.sorcery({
  slug: 'royal_charter',
  name: '皇家特许',
  cost: 3,
  description: '抽一张牌并获得2点护甲。',
  effects: [onPlay.draw(1), onPlay.gainArmor(2)],
});

export const FINEST_HOUR = uk.sorcery({
  slug: 'finest_hour',
  name: '最光辉时刻',
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

export const RADAR_NETWORK = uk.sorcery({
  slug: 'radar_network',
  name: '雷达网络',
  cost: 4,
  description: '抽一张牌，并对一个随机敌方生物造成3点伤害。',
  effects: [
    onPlay.draw(1),
    // 原定义使用 `target: 'RANDOM_ENEMY_MINION'`（非标准 SingleTarget），
    // 走 custom 逃生舱原样保留既有引擎行为。
    onPlay.custom('DAMAGE', {
      target: 'RANDOM_ENEMY_MINION',
      amount: 3,
    }),
  ],
});

export const UK_SORCERIES: Card[] = [
  GREAT_FIRE,
  ENCLOSURE_ACT,
  SPANISH_ARMADA,
  ROYAL_CHARTER,
  FINEST_HOUR,
  RADAR_NETWORK,
];
