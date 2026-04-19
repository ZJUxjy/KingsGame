import { describe, expect, it } from 'vitest';
import { ALL_CARDS } from '../../src/cards/definitions/index.js';

const M1_ROSTER = [
  // Japan poisonous
  'japan_iga_assassin', 'japan_venom_bushi', 'japan_mist_ninja',
  // Japan reborn
  'japan_undying_samurai', 'japan_bushido_paladin', 'japan_reborn_monk',
  // Japan windfury secondary
  'japan_twin_blade_samurai',
  // UK divine shield
  'uk_palace_guard', 'uk_dragoon', 'uk_imperial_guard',
  // UK lifesteal secondary
  'uk_royal_medic',
  // Germany windfury
  'germany_blitz_trooper', 'germany_twin_saber_hussar',
  // Germany lifesteal
  'germany_recovery_tank', 'germany_field_engineer',
  // USA divine shield secondary
  'usa_militia_shieldman',
  // China poisonous secondary
  'china_gu_sorcerer',
];

const FLAVOR_KEYWORDS = ['DIVINE_SHIELD', 'POISONOUS', 'WINDFURY', 'LIFESTEAL', 'REBORN'] as const;

describe('M1 roster catalog', () => {
  it.each(M1_ROSTER)('card %s exists in ALL_CARDS', (cardId) => {
    const card = ALL_CARDS.find((c) => c.id === cardId);
    expect(card, `Missing card: ${cardId}`).toBeDefined();
  });

  it.each(M1_ROSTER)('card %s carries at least one M1 flavor keyword', (cardId) => {
    const card = ALL_CARDS.find((c) => c.id === cardId)!;
    expect(card.keywords.some((k) => FLAVOR_KEYWORDS.includes(k as typeof FLAVOR_KEYWORDS[number]))).toBe(true);
  });
});
