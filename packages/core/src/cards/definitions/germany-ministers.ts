import type { Minister } from '@king-card/shared';

// ─── Friedrich Ministers (3) ────────────────────────────────────────

export const CLAUSEWITZ: Minister = {
  id: 'germany_clausewitz',
  emperorId: 'germany_friedrich',
  name: 'Carl von Clausewitz',
  type: 'STRATEGIST',
  activeSkill: {
    name: 'On War',
    description: 'Draw 1 card',
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

export const WALLENSTEIN: Minister = {
  id: 'germany_wallenstein',
  emperorId: 'germany_friedrich',
  name: 'Albrecht von Wallenstein',
  type: 'WARRIOR',
  activeSkill: {
    name: 'Mercenary Captain',
    description: 'Deal 3 damage to an enemy minion',
    cost: 2,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 3 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 2,
};

export const ERHARD: Minister = {
  id: 'germany_erhard',
  emperorId: 'germany_friedrich',
  name: 'Ludwig Erhard',
  type: 'ADMINISTRATOR',
  activeSkill: {
    name: 'Economic Miracle',
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

export const FRIEDRICH_MINISTERS: Minister[] = [CLAUSEWITZ, WALLENSTEIN, ERHARD];

// Aggregate all Germany ministers
export const GERMANY_MINISTERS: Minister[] = [
  ...FRIEDRICH_MINISTERS,
];
