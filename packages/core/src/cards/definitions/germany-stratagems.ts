import type { Card } from '@king-card/shared';

// ─── Germany Stratagem Cards (4) ────────────────────────────────────

export const BLITZKRIEG_DOCTRINE: Card = {
  id: 'germany_blitzkrieg_doctrine',
  name: 'Blitzkrieg Doctrine',
  civilization: 'GERMANY',
  type: 'STRATAGEM',
  rarity: 'COMMON',
  cost: 2,
  description: 'All friendly minions get +2 attack.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 2 },
    },
  ],
};

export const ENIGMA: Card = {
  id: 'germany_enigma',
  name: 'Enigma',
  civilization: 'GERMANY',
  type: 'STRATAGEM',
  rarity: 'COMMON',
  cost: 3,
  description: 'Draw 2 cards.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 2 },
    },
  ],
};

export const ARTILLERY_BARRAGE: Card = {
  id: 'germany_artillery',
  name: 'Artillery Barrage',
  civilization: 'GERMANY',
  type: 'STRATAGEM',
  rarity: 'RARE',
  cost: 4,
  description: 'Deal 2 damage to all enemy minions.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 2 },
    },
  ],
};

export const FORTIFICATION: Card = {
  id: 'germany_fortification',
  name: 'Fortification',
  civilization: 'GERMANY',
  type: 'STRATAGEM',
  rarity: 'RARE',
  cost: 3,
  description: 'All friendly minions get +3 health and Taunt this turn.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 3 },
    },
    {
      trigger: 'ON_PLAY',
      type: 'APPLY_BUFF',
      params: {
        targetFilter: 'ALL_FRIENDLY_MINIONS',
        keywordsGranted: ['TAUNT'],
        type: 'TEMPORARY',
        remainingTurns: 1,
      },
    },
  ],
};

export const GERMANY_STRATAGEMS: Card[] = [
  BLITZKRIEG_DOCTRINE,
  ENIGMA,
  ARTILLERY_BARRAGE,
  FORTIFICATION,
];
