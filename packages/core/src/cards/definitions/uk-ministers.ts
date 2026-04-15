import type { Minister } from '@king-card/shared';

// ─── Queen Victoria Ministers (3) ────────────────────────────────────

export const PITT: Minister = {
  id: 'uk_pitt',
  emperorId: 'uk_victoria',
  name: 'William Pitt',
  type: 'STRATEGIST',
  activeSkill: {
    name: 'Parliament Act',
    description: 'Draw a card',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};

export const DRAKE: Minister = {
  id: 'uk_drake',
  emperorId: 'uk_victoria',
  name: 'Francis Drake',
  type: 'WARRIOR',
  activeSkill: {
    name: 'Privateer Raid',
    description: 'Deal 2 damage to a random enemy minion',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'RANDOM_ENEMY_MINION', amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

export const WALPOLE: Minister = {
  id: 'uk_walpole',
  emperorId: 'uk_victoria',
  name: 'Robert Walpole',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: 'Fiscal Policy',
    description: 'Gain 2 armor',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

// ─── Per-emperor minister pools ─────────────────────────────────────

export const VICTORIA_MINISTERS: Minister[] = [PITT, DRAKE, WALPOLE];

// Aggregate all UK ministers
export const UK_MINISTERS: Minister[] = [
  ...VICTORIA_MINISTERS,
];
