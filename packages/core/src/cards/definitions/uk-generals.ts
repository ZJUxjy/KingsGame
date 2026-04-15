import type { Card } from '@king-card/shared';

// ─── UK General Cards (2) ───────────────────────────────────────────

export const WELLINGTON: Card = {
  id: 'uk_wellington',
  name: 'Duke of Wellington',
  civilization: 'UK',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 7,
  attack: 5,
  health: 7,
  description: 'Taunt. Skill①Waterloo: Deal 5 damage to an enemy minion. Skill②Iron Duke: Gain +0/+3. Skill③Thin Red Line: All friendly minions gain Taunt this turn.',
  keywords: ['TAUNT'],
  effects: [],
  generalSkills: [
    {
      name: 'Waterloo',
      description: 'Deal 5 damage to an enemy minion',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { target: 'ENEMY_MINION', amount: 5 },
      },
    },
    {
      name: 'Iron Duke',
      description: 'Gain +0/+3',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'MODIFY_STAT',
        params: { healthDelta: 3 },
      },
    },
    {
      name: 'Thin Red Line',
      description: 'All friendly minions gain Taunt this turn',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'APPLY_BUFF',
        params: {
          targetFilter: 'ALL_FRIENDLY_MINIONS',
          keywordsGranted: ['TAUNT'],
          type: 'TEMPORARY',
          remainingTurns: 1,
        },
      },
    },
  ],
};

export const NELSON: Card = {
  id: 'uk_nelson',
  name: 'Admiral Nelson',
  civilization: 'UK',
  type: 'GENERAL',
  rarity: 'LEGENDARY',
  cost: 6,
  attack: 6,
  health: 4,
  description: 'Charge. Skill①Trafalgar: Deal 3 damage to all enemy minions. Skill②England Expects: All friendly minions gain +2 attack. Skill③Broadside: Deal 6 damage to an enemy minion.',
  keywords: ['CHARGE'],
  effects: [],
  generalSkills: [
    {
      name: 'Trafalgar',
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
      name: 'England Expects',
      description: 'All friendly minions gain +2 attack',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'MODIFY_STAT',
        params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 2 },
      },
    },
    {
      name: 'Broadside',
      description: 'Deal 6 damage to an enemy minion',
      cost: 0,
      usesPerTurn: 1,
      effect: {
        trigger: 'ON_PLAY',
        type: 'DAMAGE',
        params: { target: 'ENEMY_MINION', amount: 6 },
      },
    },
  ],
};

export const UK_GENERALS: Card[] = [
  WELLINGTON,
  NELSON,
];
