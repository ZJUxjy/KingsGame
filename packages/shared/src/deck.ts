import { GAME_CONSTANTS } from './constants.js';
import type { Card, EmperorData } from './engine-types.js';
import type { Civilization } from './types.js';

export type DeckValidationCode =
  | 'MAIN_DECK_SIZE'
  | 'UNKNOWN_CARD'
  | 'EMPEROR_MISMATCH'
  | 'CIVILIZATION_MISMATCH'
  | 'CROSS_CIVILIZATION'
  | 'BOUND_CARD_IN_MAIN_DECK'
  | 'COPY_LIMIT'
  | 'GENERAL_LIMIT'
  | 'SORCERY_LIMIT'
  | 'EMPEROR_LIMIT';

export interface DeckDefinition {
  id: string;
  name: string;
  civilization: Civilization;
  emperorCardId: string;
  mainCardIds: string[];
}

export interface DeckValidationIssue {
  code: DeckValidationCode;
  message: string;
  cardId?: string;
  limit?: number;
  actual?: number;
}

export interface DeckValidationResult {
  ok: boolean;
  issues: DeckValidationIssue[];
}

export function getDeckCopyLimit(card: Card): number {
  return card.type === 'MINION' || card.type === 'STRATAGEM' ? 2 : 1;
}

export function getEditableDeckSize(emperorData: EmperorData): number {
  return (
    GAME_CONSTANTS.DECK_SIZE
    - emperorData.boundGenerals.length
    - emperorData.boundSorceries.length
  );
}

export function materializeDeckCards(
  deck: DeckDefinition,
  cardCatalog: readonly Card[],
  emperorData: EmperorData,
): Card[] {
  const cardById = new Map(cardCatalog.map((card) => [card.id, card]));
  const mainCards = deck.mainCardIds.map((cardId) => {
    const card = cardById.get(cardId);
    if (!card) {
      throw new Error(`Unknown deck card: ${cardId}`);
    }

    return card;
  });

  return [...emperorData.boundGenerals, ...emperorData.boundSorceries, ...mainCards];
}

export function validateDeckDefinition(
  deck: DeckDefinition,
  cardCatalog: readonly Card[],
  emperorData: EmperorData,
): DeckValidationResult {
  const issues: DeckValidationIssue[] = [];
  const cardById = new Map(cardCatalog.map((card) => [card.id, card]));
  const editableDeckSize = getEditableDeckSize(emperorData);
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

  if (deck.mainCardIds.length !== editableDeckSize) {
    issues.push({
      code: 'MAIN_DECK_SIZE',
      message: `Expected ${editableDeckSize} main-deck cards but received ${deck.mainCardIds.length}.`,
      limit: editableDeckSize,
      actual: deck.mainCardIds.length,
    });
  }

  const copyCounts = new Map<string, number>();
  let generalCount = 0;
  let sorceryCount = 0;
  let emperorCount = 1;

  for (const cardId of deck.mainCardIds) {
    const nextCount = (copyCounts.get(cardId) ?? 0) + 1;
    copyCounts.set(cardId, nextCount);

    if (boundCardIds.has(cardId)) {
      issues.push({
        code: 'BOUND_CARD_IN_MAIN_DECK',
        message: `Card ${cardId} is already granted by the selected emperor and cannot appear in the main deck.`,
        cardId,
      });
    }

    const card = cardById.get(cardId);
    if (!card) {
      issues.push({
        code: 'UNKNOWN_CARD',
        message: `Card ${cardId} does not exist in the catalog.`,
        cardId,
      });
      continue;
    }

    if (card.civilization !== selectedCivilization && card.civilization !== 'NEUTRAL') {
      issues.push({
        code: 'CROSS_CIVILIZATION',
        message: `Card ${cardId} does not belong to civilization ${selectedCivilization}.`,
        cardId,
      });
    }

    const copyLimit = getDeckCopyLimit(card);
    if (nextCount > copyLimit) {
      issues.push({
        code: 'COPY_LIMIT',
        message: `Card ${cardId} exceeds the copy limit of ${copyLimit}.`,
        cardId,
        limit: copyLimit,
        actual: nextCount,
      });
    }

    if (card.type === 'GENERAL') {
      generalCount += 1;
    }

    if (card.type === 'SORCERY') {
      sorceryCount += 1;
    }

    if (card.type === 'EMPEROR') {
      emperorCount += 1;
    }
  }

  if (generalCount > GAME_CONSTANTS.GENERAL_DECK_LIMIT) {
    issues.push({
      code: 'GENERAL_LIMIT',
      message: `Deck contains ${generalCount} free generals, above the limit of ${GAME_CONSTANTS.GENERAL_DECK_LIMIT}.`,
      limit: GAME_CONSTANTS.GENERAL_DECK_LIMIT,
      actual: generalCount,
    });
  }

  if (sorceryCount > GAME_CONSTANTS.SORCERY_DECK_LIMIT) {
    issues.push({
      code: 'SORCERY_LIMIT',
      message: `Deck contains ${sorceryCount} free sorceries, above the limit of ${GAME_CONSTANTS.SORCERY_DECK_LIMIT}.`,
      limit: GAME_CONSTANTS.SORCERY_DECK_LIMIT,
      actual: sorceryCount,
    });
  }

  if (emperorCount > GAME_CONSTANTS.EMPEROR_SOFT_LIMIT) {
    issues.push({
      code: 'EMPEROR_LIMIT',
      message: `Deck contains ${emperorCount} emperors including the starter emperor, above the limit of ${GAME_CONSTANTS.EMPEROR_SOFT_LIMIT}.`,
      limit: GAME_CONSTANTS.EMPEROR_SOFT_LIMIT,
      actual: emperorCount,
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}