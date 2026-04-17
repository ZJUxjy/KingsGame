import { EMPEROR_QIN } from '@king-card/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DECK_STORAGE_KEY, useDeckStore } from './deckStore.js';

function resetDeckStore() {
  useDeckStore.setState({
    decksByEmperorId: {},
    editingEmperorCardId: null,
  });
}

describe('deckStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDeckStore();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetDeckStore();
  });

  it('hydrates a starter deck for Qin and persists it', () => {
    const deck = useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN);

    expect(deck).toMatchObject({
      id: EMPEROR_QIN.emperorCard.id,
      name: `${EMPEROR_QIN.emperorCard.name} 默认套牌`,
      civilization: EMPEROR_QIN.emperorCard.civilization,
      emperorCardId: EMPEROR_QIN.emperorCard.id,
    });
    expect(deck.mainCardIds).toHaveLength(26);

    const storedDecks = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? '{}') as Record<string, typeof deck>;
    expect(storedDecks[EMPEROR_QIN.emperorCard.id]).toEqual(deck);
  });

  it('persists replaced main-card ids and returns the updated deck', () => {
    const starterDeck = useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN);
    const replacementMainCardIds = [...starterDeck.mainCardIds].reverse();

    useDeckStore.getState().replaceMainCardIds(EMPEROR_QIN.emperorCard.id, replacementMainCardIds);

    expect(useDeckStore.getState().getDeck(EMPEROR_QIN.emperorCard.id)).toEqual({
      ...starterDeck,
      mainCardIds: replacementMainCardIds,
    });

    const storedDecks = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? '{}') as Record<string, typeof starterDeck>;
    expect(storedDecks[EMPEROR_QIN.emperorCard.id]).toEqual({
      ...starterDeck,
      mainCardIds: replacementMainCardIds,
    });
  });
});