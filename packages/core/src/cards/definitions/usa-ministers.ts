import type { Minister } from '@king-card/shared';

// ─── Lincoln Ministers (3) ──────────────────────────────────────────

export const FRANKLIN: Minister = {
  id: 'usa_franklin',
  emperorId: 'usa_lincoln',
  name: 'Benjamin Franklin',
  type: 'STRATEGIST',
  activeSkill: {
    name: 'Diplomacy',
    description: 'Draw 1 card',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 0,
};

export const SHERMAN_MINISTER: Minister = {
  id: 'usa_sherman_minister',
  emperorId: 'usa_lincoln',
  name: 'William Sherman',
  type: 'WARRIOR',
  activeSkill: {
    name: 'March to the Sea',
    description: 'Deal 2 damage to a random enemy minion',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 0,
};

export const HAMILTON: Minister = {
  id: 'usa_hamilton',
  emperorId: 'usa_lincoln',
  name: 'Alexander Hamilton',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: 'National Bank',
    description: 'Gain 1 armor',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'GAIN_ARMOR',
      params: { amount: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 0,
};

// ─── Per-emperor minister pools ─────────────────────────────────────

export const LINCOLN_MINISTERS: Minister[] = [FRANKLIN, SHERMAN_MINISTER, HAMILTON];

// Aggregate all USA ministers
export const USA_MINISTERS: Minister[] = [
  ...LINCOLN_MINISTERS,
];
