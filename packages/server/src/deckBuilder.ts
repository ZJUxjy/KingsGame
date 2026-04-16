import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import type { Card, EmperorData } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';

const nonEmperorCards = ALL_CARDS.filter((c) => c.type !== 'EMPEROR');

export function buildDeck(emperorData: EmperorData): Card[] {
  const deck: Card[] = [
    ...emperorData.boundGenerals,
    ...emperorData.boundSorceries,
  ];
  const fillPool = nonEmperorCards.filter(
    (card) => card.civilization === emperorData.emperorCard.civilization || card.civilization === 'NEUTRAL',
  );

  if (fillPool.length === 0) {
    throw new Error(`No fill cards available for civilization ${emperorData.emperorCard.civilization}`);
  }

  let fillIdx = 0;
  while (deck.length < GAME_CONSTANTS.DECK_SIZE) {
    deck.push(fillPool[fillIdx % fillPool.length]);
    fillIdx++;
  }

  return deck;
}

export function getRandomAiEmperorIndex(): number {
  return Math.floor(Math.random() * ALL_EMPEROR_DATA_LIST.length);
}
