import type { Card } from '@king-card/shared';
import { germany, onPlay } from '../builders/index.js';

// ─── Germany Stratagem Cards (4) ────────────────────────────────────

export const BLITZKRIEG_DOCTRINE = germany.stratagem({
  slug: 'blitzkrieg_doctrine',
  name: 'Blitzkrieg Doctrine',
  rarity: 'COMMON',
  cost: 2,
  description: 'All friendly minions get +2 attack.',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 2,
    }),
  ],
});

export const ENIGMA = germany.stratagem({
  slug: 'enigma',
  name: 'Enigma',
  rarity: 'COMMON',
  cost: 3,
  description: 'Draw 2 cards.',
  effects: [onPlay.draw(2)],
});

export const ARTILLERY_BARRAGE = germany.stratagem({
  slug: 'artillery',
  name: 'Artillery Barrage',
  rarity: 'RARE',
  cost: 4,
  description: 'Deal 2 damage to all enemy minions.',
  effects: [onPlay.damage('ALL_ENEMY_MINIONS', 2)],
});

export const FORTIFICATION = germany.stratagem({
  slug: 'fortification',
  name: 'Fortification',
  rarity: 'RARE',
  cost: 3,
  description: 'All friendly minions get +3 health and Taunt this turn.',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      healthDelta: 3,
    }),
    onPlay.applyBuff({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      keywordsGranted: ['TAUNT'],
      type: 'TEMPORARY',
      remainingTurns: 1,
    }),
  ],
});

export const GERMANY_STRATAGEMS: Card[] = [
  BLITZKRIEG_DOCTRINE,
  ENIGMA,
  ARTILLERY_BARRAGE,
  FORTIFICATION,
];
