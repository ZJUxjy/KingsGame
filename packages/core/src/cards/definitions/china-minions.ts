import type { Card } from '@king-card/shared';
import { china, onDeath, onPlay } from '../builders/index.js';

// ─── China Minion Cards (8) ─────────────────────────────────────────

export const BINGMAYONG = china.minion({
  slug: 'bingmayong',
  name: '兵马俑',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 1,
  description: '亡语：抽一张牌。',
  keywords: ['DEATHRATTLE'],
  effects: [onDeath.draw(1)],
});

export const QINJUN_BUBING = china.minion({
  slug: 'qinjun_bubing',
  name: '秦军步兵',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 2,
  description: '动员：若你本回合已使用≥2张牌，获得+1/+1。',
  keywords: ['MOBILIZE'],
  effects: [
    onPlay.conditionalBuff({ mobilizeThreshold: 2, attackBonus: 1, healthBonus: 1 }),
  ],
});

export const HANCHAO_QIBING = china.minion({
  slug: 'hanchao_qibing',
  name: '汉朝骑兵',
  rarity: 'COMMON',
  cost: 3,
  attack: 3,
  health: 2,
  description: '冲锋。动员：若你本回合已使用≥3张牌，抽一张牌。',
  keywords: ['CHARGE', 'MOBILIZE'],
  effects: [onPlay.conditionalBuff({ mobilizeThreshold: 3, drawCount: 1 })],
});

export const DATANG_JINGRUI = china.minion({
  slug: 'datang_jingrui',
  name: '大唐精锐',
  rarity: 'RARE',
  cost: 4,
  attack: 4,
  health: 4,
  description: '驻守：入场时获得驻守标记，持续2回合。',
  keywords: ['GARRISON'],
  effects: [onPlay.garrisonMark({ garrisonTurns: 2 })],
});

export const CHANGCHENG_SHOUWEI = china.minion({
  slug: 'changcheng_shouwei',
  name: '长城守卫',
  rarity: 'COMMON',
  cost: 3,
  attack: 1,
  health: 6,
  description: '嘲讽。万里长城永不倒。',
  keywords: ['TAUNT'],
});

export const QINJUN_NUSHOU = china.minion({
  slug: 'qinjun_nushou',
  name: '秦军弩手',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 1,
  description: '列阵齐射的秦军弩手。',
});

export const GUANZHONG_SHUBING = china.minion({
  slug: 'guanzhong_shubing',
  name: '关中戍兵',
  rarity: 'COMMON',
  cost: 4,
  attack: 4,
  health: 3,
  description: '驻守边关的精锐士卒。',
});

export const JINJUN_TONGLING = china.minion({
  slug: 'jinjun_tongling',
  name: '禁军统领',
  rarity: 'RARE',
  cost: 5,
  attack: 5,
  health: 5,
  description: '战吼：所有友方生物获得+1/+1。',
  keywords: ['BATTLECRY'],
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
      healthDelta: 1,
    }),
  ],
});

// ─── M1 sample card (POISONOUS secondary) ───────────────────────────

export const GU_SORCERER = china.minion({
  slug: 'gu_sorcerer',
  name: '蛊师',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 3,
  description: '剧毒。',
  keywords: ['POISONOUS'],
});

export const CHINA_MINIONS: Card[] = [
  BINGMAYONG,
  QINJUN_BUBING,
  HANCHAO_QIBING,
  DATANG_JINGRUI,
  CHANGCHENG_SHOUWEI,
  QINJUN_NUSHOU,
  GUANZHONG_SHUBING,
  JINJUN_TONGLING,
  GU_SORCERER,
];
