import type { Card } from '@king-card/shared';
import { onPlay, usa } from '../builders/index.js';

// ─── USA Minion Cards (6) ───────────────────────────────────────────

export const GI = usa.minion({
  slug: 'gi',
  name: 'GI (American Soldier)',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 2,
  description: 'A standard American soldier.',
});

export const MARINE = usa.minion({
  slug: 'marine',
  name: 'Marine',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 2,
  description: 'Rush.',
  keywords: ['RUSH'],
});

export const RANGER = usa.minion({
  slug: 'ranger',
  name: 'Ranger',
  rarity: 'COMMON',
  cost: 3,
  attack: 3,
  health: 3,
  description: 'Charge.',
  keywords: ['CHARGE'],
});

export const MEDIC = usa.minion({
  slug: 'medic',
  name: 'Medic',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 4,
  description: 'Battlecry: Heal all friendly minions for 1.',
  keywords: ['BATTLECRY'],
  effects: [onPlay.heal('ALL_FRIENDLY_MINIONS', 1)],
});

export const AIRBORNE = usa.minion({
  slug: 'airborne',
  name: 'Airborne',
  rarity: 'RARE',
  cost: 4,
  attack: 4,
  health: 3,
  description: 'Rush. Battlecry: Deal 2 damage to an enemy minion.',
  keywords: ['RUSH', 'BATTLECRY'],
  effects: [onPlay.damage('ENEMY_MINION', 2)],
});

export const SHERMAN_TANK = usa.minion({
  slug: 'sherman',
  name: 'Sherman Tank',
  rarity: 'RARE',
  cost: 5,
  attack: 5,
  health: 5,
  description: 'Taunt.',
  keywords: ['TAUNT'],
});

export const USA_MINIONS: Card[] = [
  GI,
  MARINE,
  RANGER,
  MEDIC,
  AIRBORNE,
  SHERMAN_TANK,
];
