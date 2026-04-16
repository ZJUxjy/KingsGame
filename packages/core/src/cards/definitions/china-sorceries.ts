import type { Card } from '@king-card/shared';
import { china, onPlay } from '../builders/index.js';

// ─── China Sorcery Cards (2) ────────────────────────────────────────

export const WUGUZHIHUO = china.sorcery({
  slug: 'wuguzhihuo',
  name: '巫蛊之祸',
  cost: 4,
  description: '随机消灭一个敌方生物和一个友方生物。',
  effects: [
    onPlay.randomDestroy('RANDOM_ENEMY_MINION'),
    onPlay.randomDestroy('RANDOM_FRIENDLY_MINION'),
  ],
});

export const FENSHU_KENGRU = china.sorcery({
  slug: 'fenshu_kengru',
  name: '焚书坑儒',
  cost: 3,
  description: '对手随机弃一张牌。你下回合无法抽牌。',
  effects: [
    onPlay.randomDiscard({ targetPlayer: 'OPPONENT', count: 1 }),
    onPlay.setDrawLock({ targetPlayer: 'SELF', locked: true }),
  ],
});

export const CHINA_SORCERIES: Card[] = [WUGUZHIHUO, FENSHU_KENGRU];
