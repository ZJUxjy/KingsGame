import type { Card } from '@king-card/shared';
import { onPlay, usa } from '../builders/index.js';

// ─── USA Stratagem Cards (4) ────────────────────────────────────────

export const ARSENAL_OF_DEMOCRACY = usa.stratagem({
  slug: 'arsenal',
  name: 'Arsenal of Democracy',
  rarity: 'COMMON',
  cost: 2,
  description: 'All friendly minions get +1/+1.',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
      healthDelta: 1,
    }),
  ],
});

export const LEND_LEASE = usa.stratagem({
  slug: 'lend_lease',
  name: 'Lend-Lease',
  rarity: 'COMMON',
  cost: 3,
  description: 'Draw 2 cards.',
  effects: [onPlay.draw(2)],
});

export const AIR_SUPERIORITY = usa.stratagem({
  slug: 'air_superiority',
  name: 'Air Superiority',
  rarity: 'RARE',
  cost: 4,
  description: 'Deal 2 damage to all enemy minions.',
  effects: [onPlay.damage('ALL_ENEMY_MINIONS', 2)],
});

export const MARSHALL_PLAN = usa.stratagem({
  slug: 'marshall_plan',
  name: 'Marshall Plan',
  rarity: 'RARE',
  cost: 3,
  description: 'Heal all friendly minions for 3.',
  effects: [onPlay.heal('ALL_FRIENDLY_MINIONS', 3)],
});

export const USA_STRATAGEMS: Card[] = [
  ARSENAL_OF_DEMOCRACY,
  LEND_LEASE,
  AIR_SUPERIORITY,
  MARSHALL_PLAN,
];
