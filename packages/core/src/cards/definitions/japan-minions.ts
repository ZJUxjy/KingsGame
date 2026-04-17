import type { Card } from '@king-card/shared';
import { japan, onPlay } from '../builders/index.js';

// ─── Japan Minion Cards (6) ─────────────────────────────────────────

export const ASHIGARU = japan.minion({
  slug: 'ashigaru',
  name: '足軽',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 2,
  description: '步兵基础兵种。',
});

export const NINJA = japan.minion({
  slug: 'ninja',
  name: '忍者',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 1,
  description: '冲锋。隐秘的刺客。',
  keywords: ['CHARGE'],
});

export const SAMURAI = japan.minion({
  slug: 'samurai',
  name: '侍',
  rarity: 'COMMON',
  cost: 3,
  attack: 3,
  health: 3,
  description: '战吼：抽一张牌。',
  keywords: ['BATTLECRY'],
  effects: [onPlay.draw(1)],
});

export const SOUHEI = japan.minion({
  slug: 'souhei',
  name: '僧兵',
  rarity: 'RARE',
  cost: 4,
  attack: 3,
  health: 5,
  description: '嘲讽。寺院的守护者。',
  keywords: ['TAUNT'],
});

export const TEPPO = japan.minion({
  slug: 'teppo',
  name: '鉄砲隊',
  rarity: 'RARE',
  cost: 3,
  attack: 4,
  health: 2,
  description: '突袭。火绳枪之力。',
  keywords: ['RUSH'],
});

export const MUSHA = japan.minion({
  slug: 'musha',
  name: '武者',
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

export const NINJA_ASSASSIN = japan.minion({
  slug: 'ninja_assassin',
  name: '忍者暗杀者',
  rarity: 'RARE',
  cost: 3,
  attack: 3,
  health: 2,
  description: '忍杀：击杀随从后可额外攻击一次。',
  keywords: ['ASSASSIN'],
});

export const KAGE_NO_SHINOBI = japan.minion({
  slug: 'kage_no_shinobi',
  name: '影の忍',
  rarity: 'EPIC',
  cost: 5,
  attack: 4,
  health: 3,
  description: '忍杀。突袭。',
  keywords: ['ASSASSIN', 'RUSH'],
});

export const KENSEI = japan.minion({
  slug: 'kensei',
  name: '剣聖',
  rarity: 'EPIC',
  cost: 6,
  attack: 5,
  health: 4,
  description: '连斩：击杀后可继续攻击。',
  keywords: ['COMBO_STRIKE'],
});

export const RONIN_BLADE = japan.minion({
  slug: 'ronin_blade',
  name: '浪人剣客',
  rarity: 'RARE',
  cost: 4,
  attack: 4,
  health: 3,
  description: '连斩。',
  keywords: ['COMBO_STRIKE'],
});

export const JAPAN_MINIONS: Card[] = [
  ASHIGARU,
  NINJA,
  SAMURAI,
  SOUHEI,
  TEPPO,
  MUSHA,
  NINJA_ASSASSIN,
  KAGE_NO_SHINOBI,
  KENSEI,
  RONIN_BLADE,
];
