import type { Card } from '@king-card/shared';

// ─── Germany Emperor Cards (1) ──────────────────────────────────────

export const FRIEDRICH: Card = {
  id: 'germany_friedrich',
  name: 'Friedrich der Große',
  civilization: 'GERMANY',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: 'Hero Skill: Deal 2 damage to an enemy minion. On Play: All friendly minions get +1 attack.',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 },
    },
  ],
  heroSkill: {
    name: 'Oblique Order',
    description: 'Deal 2 damage to an enemy minion',
    cost: 1,
    cooldown: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  },
};

export const GERMANY_EMPERORS: Card[] = [
  FRIEDRICH,
];
