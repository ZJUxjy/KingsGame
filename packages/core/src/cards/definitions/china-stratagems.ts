import type { Card } from '@king-card/shared';
import { applied, china, onPlay } from '../builders/index.js';

// ─── China Stratagem Cards (4) ──────────────────────────────────────

export const ZHUCHENGLING = china.stratagem({
  slug: 'zhuchengling',
  name: '筑城令',
  rarity: 'COMMON',
  cost: 2,
  description: '所有友方生物获得+3生命值和嘲讽（本回合）。',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      healthDelta: 3,
    }),
    onPlay.applyBuff({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      healthBonus: 0,
      keywordsGranted: ['TAUNT'],
      type: 'TEMPORARY',
      remainingTurns: 1,
    }),
  ],
});

export const ZONGDONGYUAN = china.stratagem({
  slug: 'zongdongyuan',
  name: '总动员',
  rarity: 'RARE',
  cost: 4,
  description: '所有友方生物获得+2/+2。',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 2,
      healthDelta: 2,
    }),
  ],
});

export const BINGFA_SANSHILIUJI = china.stratagem({
  slug: 'bingfa_sanshiliuji',
  name: '兵法三十六计',
  rarity: 'COMMON',
  cost: 3,
  description: '抽两张牌。',
  effects: [onPlay.draw(2)],
});

export const MINGXIU_ZHANDAO = china.stratagem({
  slug: 'mingxiu_zhandao',
  name: '明修栈道',
  rarity: 'RARE',
  cost: 2,
  description: '持续妙计（2回合）：所有手牌费用-1。',
  effects: [
    onPlay.activateStratagem({
      duration: 2,
      appliedEffects: [applied.costModifier(1)],
    }),
  ],
});

export const CHINA_STRATAGEMS: Card[] = [
  ZHUCHENGLING,
  ZONGDONGYUAN,
  BINGFA_SANSHILIUJI,
  MINGXIU_ZHANDAO,
];
