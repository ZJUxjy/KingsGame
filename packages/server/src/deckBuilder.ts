import { ALL_CARDS } from '@king-card/core';
import type { Card, EmperorData } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';

export const AI_DECK_EMPEROR_INDEX = 1;

const nonEmperorCards = ALL_CARDS.filter((c) => c.type !== 'EMPEROR');

export function buildDeck(emperorData: EmperorData): Card[] {
  const deck: Card[] = [
    ...emperorData.boundGenerals,
    ...emperorData.boundSorceries,
  ];

  let fillIdx = 0;
  while (deck.length < GAME_CONSTANTS.DECK_SIZE) {
    deck.push(nonEmperorCards[fillIdx % nonEmperorCards.length]);
    fillIdx++;
  }

  return deck;
}
