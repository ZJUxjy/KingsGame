import type { Card } from '@king-card/shared';
import { germany, onDeath, onPlay } from '../builders/index.js';

// ─── Germany Minion Cards (6) ───────────────────────────────────────

export const LANDSKNECHT = germany.minion({
  slug: 'landsknecht',
  name: 'Landsknecht',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 2,
  description: 'A basic German infantry unit.',
});

export const HUSSAR = germany.minion({
  slug: 'hussar',
  name: 'Hussar',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 2,
  description: 'Charge.',
  keywords: ['CHARGE'],
});

export const GRENADIER = germany.minion({
  slug: 'grenadier',
  name: 'Grenadier',
  rarity: 'COMMON',
  cost: 3,
  attack: 3,
  health: 3,
  description: 'Rush.',
  keywords: ['RUSH'],
});

export const PANZER = germany.minion({
  slug: 'panzer',
  name: 'Panzer',
  rarity: 'RARE',
  cost: 4,
  attack: 4,
  health: 4,
  description: 'Taunt.',
  keywords: ['TAUNT'],
});

export const TEUTONIC_KNIGHT = germany.minion({
  slug: 'teutonic',
  name: 'Teutonic Knight',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 4,
  description: 'Taunt. Battlecry: Gain 2 armor.',
  keywords: ['TAUNT', 'BATTLECRY'],
  effects: [onPlay.gainArmor(2)],
});

export const STORMTROOPER = germany.minion({
  slug: 'stormtrooper',
  name: 'Stormtrooper',
  rarity: 'RARE',
  cost: 5,
  attack: 5,
  health: 4,
  description: 'Rush. Battlecry: Deal 2 damage to an enemy minion.',
  keywords: ['RUSH', 'BATTLECRY'],
  effects: [onPlay.damage('ENEMY_MINION', 2)],
});

export const IRON_CHANCELLOR = germany.minion({
  slug: 'iron_chancellor',
  name: 'Iron Chancellor',
  rarity: 'EPIC',
  cost: 4,
  attack: 3,
  health: 5,
  description: 'Iron Fist: Gets +2/+2 when your hero health is ≤15.',
  keywords: ['IRON_FIST'],
});

export const BERSERKER_GUARD = germany.minion({
  slug: 'berserker_guard',
  name: 'Berserker Guard',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 4,
  description: 'Iron Fist. Taunt.',
  keywords: ['IRON_FIST', 'TAUNT'],
});

export const BLITZ_PANZER = germany.minion({
  slug: 'blitz_panzer',
  name: 'Blitz Panzer',
  rarity: 'RARE',
  cost: 5,
  attack: 4,
  health: 4,
  description: 'Blitzkrieg: Deals 2 damage to a random enemy minion when played.',
  keywords: ['BLITZ'],
});

export const VOLKSSTURM = germany.minion({
  slug: 'volkssturm',
  name: 'Volkssturm',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 1,
  description: 'Deathrattle: Give all friendly minions +1 attack.',
  keywords: ['DEATHRATTLE'],
  effects: [onDeath.modifyStat({ targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 })],
});

export const GERMANY_MINIONS: Card[] = [
  LANDSKNECHT,
  HUSSAR,
  GRENADIER,
  PANZER,
  TEUTONIC_KNIGHT,
  STORMTROOPER,
  IRON_CHANCELLOR,
  BERSERKER_GUARD,
  BLITZ_PANZER,
  VOLKSSTURM,
];
