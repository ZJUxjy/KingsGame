import { describe, expect, it } from 'vitest';
import { ALL_CARDS, CHINA_EMPEROR_DATA_LIST, JAPAN_EMPEROR_DATA_LIST } from '@king-card/core';
import {
  GAME_CONSTANTS,
  getDeckCopyLimit,
  getEditableDeckSize,
  type DeckDefinition,
  type EmperorData,
} from '@king-card/shared';
import * as deckBuilder from '../src/deckBuilder.js';

function makeCustomDeckDefinition(emperorData: EmperorData): DeckDefinition {
  const excludedCardIds = new Set([
    ...emperorData.boundGenerals.map((card) => card.id),
    ...emperorData.boundSorceries.map((card) => card.id),
  ]);
  const editableDeckSize = getEditableDeckSize(emperorData);
  const pool = ALL_CARDS.filter(
    (card) =>
      (card.civilization === emperorData.emperorCard.civilization || card.civilization === 'NEUTRAL')
      && !excludedCardIds.has(card.id),
  );
  const orderedPool = [
    ...pool.filter((card) => card.type === 'MINION' || card.type === 'STRATAGEM'),
    ...pool.filter((card) => card.type === 'GENERAL'),
    ...pool.filter((card) => card.type === 'SORCERY'),
    ...pool.filter((card) => card.type === 'EMPEROR'),
  ];
  const mainCardIds: string[] = [];
  const copyCounts = new Map<string, number>();
  let generalCount = 0;
  let sorceryCount = 0;
  let emperorCount = 1;

  for (const card of orderedPool) {
    const remainingTypeLimit =
      card.type === 'GENERAL'
        ? GAME_CONSTANTS.GENERAL_DECK_LIMIT - generalCount
        : card.type === 'SORCERY'
          ? GAME_CONSTANTS.SORCERY_DECK_LIMIT - sorceryCount
          : card.type === 'EMPEROR'
            ? GAME_CONSTANTS.EMPEROR_SOFT_LIMIT - emperorCount
            : getDeckCopyLimit(card);
    const allowedCopies = Math.min(getDeckCopyLimit(card), Math.max(remainingTypeLimit, 0));

    for (let count = copyCounts.get(card.id) ?? 0; count < allowedCopies && mainCardIds.length < editableDeckSize; count++) {
      mainCardIds.push(card.id);
      copyCounts.set(card.id, count + 1);

      if (card.type === 'GENERAL') {
        generalCount += 1;
      } else if (card.type === 'SORCERY') {
        sorceryCount += 1;
      } else if (card.type === 'EMPEROR') {
        emperorCount += 1;
      }
    }

    if (mainCardIds.length === editableDeckSize) {
      break;
    }
  }

  return {
    id: `${emperorData.emperorCard.id}-custom`,
    name: `${emperorData.emperorCard.name} 自定义套牌`,
    civilization: emperorData.emperorCard.civilization,
    emperorCardId: emperorData.emperorCard.id,
    mainCardIds: mainCardIds.reverse(),
  };
}

describe('server deck helpers', () => {
  it('validates and materializes a provided custom deck for the selected emperor', () => {
    const emperorData = JAPAN_EMPEROR_DATA_LIST[0];
    const deck = makeCustomDeckDefinition(emperorData);
    const validateDeckForEmperor = (deckBuilder as any).validateDeckForEmperor;
    const materializeDeckForEmperor = (deckBuilder as any).materializeDeckForEmperor;

    expect(validateDeckForEmperor).toBeTypeOf('function');
    expect(materializeDeckForEmperor).toBeTypeOf('function');

    const validation = validateDeckForEmperor(deck, emperorData);
    expect(validation).toEqual({ ok: true, issues: [] });

    const cards = materializeDeckForEmperor(deck, emperorData);
    expect(cards).toHaveLength(30);
    expect(cards.slice(0, emperorData.boundGenerals.length + emperorData.boundSorceries.length)).toEqual([
      ...emperorData.boundGenerals,
      ...emperorData.boundSorceries,
    ]);
    expect(cards.slice(emperorData.boundGenerals.length + emperorData.boundSorceries.length).map((card: { id: string }) => card.id)).toEqual(deck.mainCardIds);
  });

  it('rejects a custom deck whose emperor card does not match the selected emperor', () => {
    const emperorData = JAPAN_EMPEROR_DATA_LIST[0];
    const otherEmperor = CHINA_EMPEROR_DATA_LIST[0];
    const deck = {
      ...makeCustomDeckDefinition(emperorData),
      emperorCardId: otherEmperor.emperorCard.id,
    };
    const validateDeckForEmperor = (deckBuilder as any).validateDeckForEmperor;

    expect(validateDeckForEmperor).toBeTypeOf('function');

    const validation = validateDeckForEmperor(deck, emperorData);
    expect(validation.ok).toBe(false);
    expect(validation.issues).toContainEqual(
      expect.objectContaining({ code: 'EMPEROR_MISMATCH' }),
    );
  });

  it('rejects a custom deck whose civilization does not match the selected emperor', () => {
    const emperorData = CHINA_EMPEROR_DATA_LIST[0];
    const mismatchedDeck = makeCustomDeckDefinition(JAPAN_EMPEROR_DATA_LIST[0]);
    const deck = {
      ...mismatchedDeck,
      emperorCardId: emperorData.emperorCard.id,
    };
    const validateDeckForEmperor = (deckBuilder as any).validateDeckForEmperor;

    expect(validateDeckForEmperor).toBeTypeOf('function');

    const validation = validateDeckForEmperor(deck, emperorData);
    expect(validation.ok).toBe(false);
    expect(validation.issues).toContainEqual(
      expect.objectContaining({ code: 'CIVILIZATION_MISMATCH' }),
    );
  });

  it('rejects a custom deck that repeats a bound card in mainCardIds', () => {
    const emperorData = JAPAN_EMPEROR_DATA_LIST[0];
    const legalDeck = makeCustomDeckDefinition(emperorData);
    const deck = {
      ...legalDeck,
      mainCardIds: [emperorData.boundGenerals[0].id, ...legalDeck.mainCardIds.slice(1)],
    };
    const validateDeckForEmperor = (deckBuilder as any).validateDeckForEmperor;

    expect(validateDeckForEmperor).toBeTypeOf('function');

    const validation = validateDeckForEmperor(deck, emperorData);
    expect(validation.ok).toBe(false);
    expect(validation.issues).toContainEqual(
      expect.objectContaining({
        code: 'BOUND_CARD_IN_MAIN_DECK',
        cardId: emperorData.boundGenerals[0].id,
      }),
    );
  });
});