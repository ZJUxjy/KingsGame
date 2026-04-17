import type { Card } from '@king-card/shared';
import { onPlay, uk } from '../builders/index.js';

// ─── UK Minion Cards (8) ────────────────────────────────────────────

export const REDCOAT = uk.minion({
  slug: 'redcoat',
  name: 'Redcoat',
  rarity: 'COMMON',
  cost: 1,
  attack: 1,
  health: 2,
  description: 'A basic British infantry soldier.',
});

export const LONGBOWMAN = uk.minion({
  slug: 'longbowman',
  name: 'Longbowman',
  rarity: 'COMMON',
  cost: 2,
  attack: 2,
  health: 2,
  description: 'Rush.',
  keywords: ['RUSH'],
});

export const KNIGHT = uk.minion({
  slug: 'knight',
  name: 'Knight',
  rarity: 'COMMON',
  cost: 3,
  attack: 3,
  health: 3,
  description: 'Charge.',
  keywords: ['CHARGE'],
});

export const ROYAL_GUARD = uk.minion({
  slug: 'royal_guard',
  name: 'Royal Guard',
  rarity: 'RARE',
  cost: 4,
  attack: 2,
  health: 6,
  description: 'Taunt.',
  keywords: ['TAUNT'],
});

export const PRIVATEER = uk.minion({
  slug: 'privateer',
  name: 'Privateer',
  rarity: 'RARE',
  cost: 3,
  attack: 3,
  health: 2,
  description: 'Battlecry: Draw a card.',
  keywords: ['BATTLECRY'],
  effects: [onPlay.draw(1)],
});

export const MAN_OF_WAR = uk.minion({
  slug: 'man_of_war',
  name: 'Man-of-War',
  rarity: 'RARE',
  cost: 5,
  attack: 5,
  health: 5,
  description: 'Battlecry: Deal 2 damage to an enemy minion.',
  keywords: ['BATTLECRY'],
  effects: [onPlay.damage('ENEMY_MINION', 2)],
});

export const NAVAL_BLOCKADER = uk.minion({
  slug: 'naval_blockader',
  name: 'Naval Blockader',
  rarity: 'RARE',
  cost: 4,
  attack: 2,
  health: 5,
  description: 'Blockade: While alive, opponent gains 1 less energy per turn.',
  keywords: ['BLOCKADE', 'TAUNT'],
});

export const COLONIAL_GOVERNOR = uk.minion({
  slug: 'colonial_governor',
  name: 'Colonial Governor',
  rarity: 'EPIC',
  cost: 3,
  attack: 2,
  health: 4,
  description: 'Colony: At turn end, if you control ≥3 minions with different costs, draw a card.',
  keywords: ['COLONY'],
});

export const UK_MINIONS: Card[] = [
  REDCOAT,
  LONGBOWMAN,
  KNIGHT,
  ROYAL_GUARD,
  PRIVATEER,
  MAN_OF_WAR,
  NAVAL_BLOCKADER,
  COLONIAL_GOVERNOR,
];
