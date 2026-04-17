import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import type {
  Card,
  DeckDefinition,
  DeckValidationIssue,
  DeckValidationResult,
  EmperorData,
} from '@king-card/shared';
import { GAME_CONSTANTS, materializeDeckCards, validateDeckDefinition } from '@king-card/shared';

const nonEmperorCards = ALL_CARDS.filter((c) => c.type !== 'EMPEROR');

export type ServerDeckValidationCode =
  | DeckValidationIssue['code']
  | 'EMPEROR_MISMATCH'
  | 'CIVILIZATION_MISMATCH'
  | 'BOUND_CARD_IN_MAIN_DECK';

export interface ServerDeckValidationIssue extends Omit<DeckValidationIssue, 'code'> {
  code: ServerDeckValidationCode;
}

export interface ServerDeckValidationResult extends Omit<DeckValidationResult, 'issues'> {
  issues: ServerDeckValidationIssue[];
}

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

export function validateDeckForEmperor(
  deck: DeckDefinition,
  emperorData: EmperorData,
): ServerDeckValidationResult {
  const issues: ServerDeckValidationIssue[] = [];
  const selectedCivilization = emperorData.emperorCard.civilization;
  const boundCardIds = new Set([
    ...emperorData.boundGenerals.map((card) => card.id),
    ...emperorData.boundSorceries.map((card) => card.id),
  ]);

  if (deck.emperorCardId !== emperorData.emperorCard.id) {
    issues.push({
      code: 'EMPEROR_MISMATCH',
      message: `Deck emperor ${deck.emperorCardId} does not match selected emperor ${emperorData.emperorCard.id}.`,
      cardId: deck.emperorCardId,
    });
  }

  if (deck.civilization !== selectedCivilization) {
    issues.push({
      code: 'CIVILIZATION_MISMATCH',
      message: `Deck civilization ${deck.civilization} does not match selected emperor civilization ${selectedCivilization}.`,
    });
  }

  for (const cardId of deck.mainCardIds) {
    if (!boundCardIds.has(cardId)) {
      continue;
    }

    issues.push({
      code: 'BOUND_CARD_IN_MAIN_DECK',
      message: `Card ${cardId} is already granted by the selected emperor and cannot appear in the main deck.`,
      cardId,
    });
  }

  const sharedValidation = validateDeckDefinition(deck, ALL_CARDS, emperorData);
  return {
    ok: issues.length === 0 && sharedValidation.ok,
    issues: [...issues, ...sharedValidation.issues],
  };
}

export function materializeDeckForEmperor(
  deck: DeckDefinition,
  emperorData: EmperorData,
): Card[] {
  const validation = validateDeckForEmperor(deck, emperorData);
  if (!validation.ok) {
    throw new Error(validation.issues.map((issue) => issue.message).join(' '));
  }

  return materializeDeckCards(deck, ALL_CARDS, emperorData);
}

export function getRandomAiEmperorIndex(): number {
  return Math.floor(Math.random() * ALL_EMPEROR_DATA_LIST.length);
}
