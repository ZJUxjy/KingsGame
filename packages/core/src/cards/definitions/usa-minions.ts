import type { Card } from '@king-card/shared';
import { onDeath, onPlay, usa } from '../builders/index.js';

// ─── USA Minion Cards (9) ───────────────────────────────────────────

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

export const RESEARCH_SCIENTIST = usa.minion({
  slug: 'research_scientist',
  name: 'Research Scientist',
  rarity: 'RARE',
  cost: 3,
  attack: 2,
  health: 3,
  description: 'R&D: When played, add a random spell from your deck to hand.',
  keywords: ['RESEARCH'],
});

export const MANHATTAN_ENGINEER = usa.minion({
  slug: 'manhattan_engineer',
  name: 'Manhattan Engineer',
  rarity: 'EPIC',
  cost: 5,
  attack: 3,
  health: 4,
  description: 'R&D. Battlecry: Draw a card.',
  keywords: ['RESEARCH', 'BATTLECRY'],
  effects: [onPlay.draw(1)],
});

export const DRILL_SERGEANT = usa.minion({
  slug: 'drill_sergeant',
  name: 'Drill Sergeant',
  rarity: 'RARE',
  cost: 4,
  attack: 3,
  health: 4,
  description: 'Mobilization Order: When ≥3 friendly minions, all get +1 attack at turn start.',
  keywords: ['MOBILIZATION_ORDER'],
});

export const SUPPLY_TRUCK = usa.minion({
  slug: 'supply_truck',
  name: 'Supply Truck',
  rarity: 'COMMON',
  cost: 2,
  attack: 1,
  health: 3,
  description: 'Deathrattle: Draw a card.',
  keywords: ['DEATHRATTLE'],
  effects: [onDeath.draw(1)],
});

export const USA_MINIONS: Card[] = [
  GI,
  MARINE,
  RANGER,
  MEDIC,
  AIRBORNE,
  SHERMAN_TANK,
  RESEARCH_SCIENTIST,
  MANHATTAN_ENGINEER,
  DRILL_SERGEANT,
  SUPPLY_TRUCK,
];
