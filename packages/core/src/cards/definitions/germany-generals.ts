import type { Card } from '@king-card/shared';

// ─── Germany General Cards (2) ──────────────────────────────────────

export const BISMARCK: Card = {
  id: 'germany_bismarck',
  name: 'Otto von Bismarck',
  civilization: 'GERMANY',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 7,
  attack: 5,
  health: 7,
  description: 'Taunt. Skills: Blood and Iron, Realpolitik, Unification.',
  keywords: ['TAUNT'],
  effects: [],
  generalSkills: [
    {
      name: 'Blood and Iron',
      description: 'Deal 4 damage to an enemy minion',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { target: 'ENEMY_MINION', amount: 4 },
      },
    },
    {
      name: 'Realpolitik',
      description: 'All friendly minions get +1/+2',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'MODIFY_STAT',
        params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1, healthDelta: 2 },
      },
    },
    {
      name: 'Unification',
      description: 'Gain 4 armor',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'GAIN_ARMOR',
        params: { amount: 4 },
      },
    },
  ],
};

export const ROMMEL: Card = {
  id: 'germany_rommel',
  name: 'Erwin Rommel',
  civilization: 'GERMANY',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 6,
  health: 4,
  description: 'Rush, Charge. Skills: Desert Fox, Blitzkrieg, Afrika Korps.',
  keywords: ['RUSH', 'CHARGE'],
  effects: [],
  generalSkills: [
    {
      name: 'Desert Fox',
      description: 'Deal 3 damage to all enemy minions',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { targetFilter: 'ALL_ENEMY_MINIONS', amount: 3 },
      },
    },
    {
      name: 'Blitzkrieg',
      description: 'All friendly minions gain Charge this turn',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'APPLY_BUFF',
        params: {
          targetFilter: 'ALL_FRIENDLY_MINIONS',
          keywordsGranted: ['CHARGE'],
          type: 'TEMPORARY',
          remainingTurns: 1,
        },
      },
    },
    {
      name: 'Afrika Korps',
      description: 'Summon a 3/3 Panzer',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'SUMMON',
        params: { cardId: 'germany_panzer' },
      },
    },
  ],
};

export const GERMANY_GENERALS: Card[] = [
  BISMARCK,
  ROMMEL,
];
