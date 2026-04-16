import type { Card } from '@king-card/shared';
import { japan, onPlay } from '../builders/index.js';

// ─── Japan Stratagem Cards (4) ──────────────────────────────────────

export const BUSHIDO = japan.stratagem({
  slug: 'bushido',
  name: '武士道',
  rarity: 'COMMON',
  cost: 2,
  description: '所有友方生物获得+1/+1。',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
      healthDelta: 1,
    }),
  ],
});

export const NINJUTSU = japan.stratagem({
  slug: 'ninjutsu',
  name: '忍術',
  rarity: 'COMMON',
  cost: 3,
  description: '抽两张牌。',
  effects: [onPlay.draw(2)],
});

export const HYOUROU = japan.stratagem({
  slug: 'hyourou',
  name: '兵糧攻め',
  rarity: 'RARE',
  cost: 4,
  description: '对所有敌方生物造成2点伤害。',
  effects: [onPlay.damage('ALL_ENEMY_MINIONS', 2)],
});

export const ISSHO_KENMEI = japan.stratagem({
  slug: 'issho_kenmei',
  name: '一所懸命',
  rarity: 'RARE',
  cost: 2,
  description: '使一个友方生物获得+3/+3。',
  effects: [
    onPlay.modifyStat({
      target: 'FRIENDLY_MINION',
      attackDelta: 3,
      healthDelta: 3,
    }),
  ],
});

export const JAPAN_STRATAGEMS: Card[] = [BUSHIDO, NINJUTSU, HYOUROU, ISSHO_KENMEI];
