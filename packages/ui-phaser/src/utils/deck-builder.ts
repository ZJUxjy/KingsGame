import type { Card, EmperorData } from '@king-card/shared';
import { CHINA_ALL_CARDS } from '@king-card/core';

/**
 * Build a 30-card deck from CHINA_ALL_CARDS given an EmperorData.
 *
 * Strategy:
 *   1. Start with the emperor's bound generals and sorceries.
 *   2. Fill remaining slots with non-emperor cards from CHINA_ALL_CARDS,
 *      duplicating cards as needed to reach 30.
 *   3. Shuffle the result.
 */
export function buildDeck(emperorData: EmperorData): Card[] {
  const TARGET_SIZE = 30;
  const deck: Card[] = [];

  // 1. Add bound generals and sorceries (these are emperor-specific)
  for (const card of emperorData.boundGenerals) {
    deck.push(card);
  }
  for (const card of emperorData.boundSorceries) {
    deck.push(card);
  }

  // 2. Collect non-emperor cards for filling
  const fillCards = CHINA_ALL_CARDS.filter(
    (c) => c.type !== 'EMPEROR',
  );

  // 3. Fill to 30 by duplicating from fillCards
  let fillIndex = 0;
  while (deck.length < TARGET_SIZE) {
    deck.push(fillCards[fillIndex % fillCards.length]);
    fillIndex++;
  }

  // 4. Shuffle using Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}
