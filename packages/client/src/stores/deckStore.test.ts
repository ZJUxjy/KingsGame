import { ALL_CARDS, EMPEROR_QIN } from '@king-card/core';
import { getDeckCopyLimit, validateDeckDefinition, type EmperorData } from '@king-card/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DECK_STORAGE_KEY, useDeckStore } from './deckStore.js';

function resetDeckStore() {
  useDeckStore.setState({
    decksByEmperorId: {},
    editingEmperorCardId: null,
  });
}

function countCopies(mainCardIds: readonly string[]): Map<string, number> {
  const copyCounts = new Map<string, number>();

  for (const cardId of mainCardIds) {
    copyCounts.set(cardId, (copyCounts.get(cardId) ?? 0) + 1);
  }

  return copyCounts;
}

describe('deckStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    resetDeckStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    resetDeckStore();
  });

  it('hydrates a legal starter deck for Qin and persists it', () => {
    const deck = useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN);
    const validation = validateDeckDefinition(deck, ALL_CARDS, EMPEROR_QIN);
    const cardById = new Map(ALL_CARDS.map((card) => [card.id, card]));

    expect(deck).toMatchObject({
      id: EMPEROR_QIN.emperorCard.id,
      name: `${EMPEROR_QIN.emperorCard.name} 默认套牌`,
      civilization: EMPEROR_QIN.emperorCard.civilization,
      emperorCardId: EMPEROR_QIN.emperorCard.id,
    });
    expect(deck.mainCardIds).toHaveLength(26);
    expect(validation).toEqual({
      ok: true,
      issues: [],
    });

    for (const [cardId, copyCount] of countCopies(deck.mainCardIds)) {
      const card = cardById.get(cardId);
      expect(card).toBeDefined();
      expect(copyCount).toBeLessThanOrEqual(getDeckCopyLimit(card!));
    }

    const storedDecks = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? '{}') as Record<string, typeof deck>;
    expect(storedDecks[EMPEROR_QIN.emperorCard.id]).toEqual(deck);
  });

  it('throws instead of padding beyond copy limits when the legal starter pool is too small', async () => {
    const tinyPoolEmperor: EmperorData = {
      emperorCard: {
        id: 'tiny-emperor',
        slug: 'tiny_emperor',
        name: 'Tiny Emperor',
        civilization: 'CHINA',
        type: 'EMPEROR',
        rarity: 'LEGENDARY',
        cost: 0,
        description: 'Tiny emperor for starter-deck tests.',
      },
      ministers: [],
      boundGenerals: [],
      boundSorceries: [
        {
          id: 'tiny-bound-1',
          slug: 'tiny_bound_1',
          name: 'Tiny Bound 1',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 1.',
        },
        {
          id: 'tiny-bound-2',
          slug: 'tiny_bound_2',
          name: 'Tiny Bound 2',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 2.',
        },
        {
          id: 'tiny-bound-3',
          slug: 'tiny_bound_3',
          name: 'Tiny Bound 3',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 3.',
        },
        {
          id: 'tiny-bound-4',
          slug: 'tiny_bound_4',
          name: 'Tiny Bound 4',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 4.',
        },
        {
          id: 'tiny-bound-5',
          slug: 'tiny_bound_5',
          name: 'Tiny Bound 5',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 5.',
        },
        {
          id: 'tiny-bound-6',
          slug: 'tiny_bound_6',
          name: 'Tiny Bound 6',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 6.',
        },
        {
          id: 'tiny-bound-7',
          slug: 'tiny_bound_7',
          name: 'Tiny Bound 7',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 7.',
        },
        {
          id: 'tiny-bound-8',
          slug: 'tiny_bound_8',
          name: 'Tiny Bound 8',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 8.',
        },
        {
          id: 'tiny-bound-9',
          slug: 'tiny_bound_9',
          name: 'Tiny Bound 9',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 9.',
        },
        {
          id: 'tiny-bound-10',
          slug: 'tiny_bound_10',
          name: 'Tiny Bound 10',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 10.',
        },
        {
          id: 'tiny-bound-11',
          slug: 'tiny_bound_11',
          name: 'Tiny Bound 11',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 11.',
        },
        {
          id: 'tiny-bound-12',
          slug: 'tiny_bound_12',
          name: 'Tiny Bound 12',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 12.',
        },
        {
          id: 'tiny-bound-13',
          slug: 'tiny_bound_13',
          name: 'Tiny Bound 13',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 13.',
        },
        {
          id: 'tiny-bound-14',
          slug: 'tiny_bound_14',
          name: 'Tiny Bound 14',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 14.',
        },
        {
          id: 'tiny-bound-15',
          slug: 'tiny_bound_15',
          name: 'Tiny Bound 15',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 15.',
        },
        {
          id: 'tiny-bound-16',
          slug: 'tiny_bound_16',
          name: 'Tiny Bound 16',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 16.',
        },
        {
          id: 'tiny-bound-17',
          slug: 'tiny_bound_17',
          name: 'Tiny Bound 17',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 17.',
        },
        {
          id: 'tiny-bound-18',
          slug: 'tiny_bound_18',
          name: 'Tiny Bound 18',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 18.',
        },
        {
          id: 'tiny-bound-19',
          slug: 'tiny_bound_19',
          name: 'Tiny Bound 19',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 19.',
        },
        {
          id: 'tiny-bound-20',
          slug: 'tiny_bound_20',
          name: 'Tiny Bound 20',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 20.',
        },
        {
          id: 'tiny-bound-21',
          slug: 'tiny_bound_21',
          name: 'Tiny Bound 21',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 21.',
        },
        {
          id: 'tiny-bound-22',
          slug: 'tiny_bound_22',
          name: 'Tiny Bound 22',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 22.',
        },
        {
          id: 'tiny-bound-23',
          slug: 'tiny_bound_23',
          name: 'Tiny Bound 23',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 23.',
        },
        {
          id: 'tiny-bound-24',
          slug: 'tiny_bound_24',
          name: 'Tiny Bound 24',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 24.',
        },
        {
          id: 'tiny-bound-25',
          slug: 'tiny_bound_25',
          name: 'Tiny Bound 25',
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: 'Bound sorcery 25.',
        },
      ],
    };

    vi.resetModules();
    vi.doMock('@king-card/core', () => ({
      ALL_EMPEROR_DATA_LIST: [],
      ALL_CARDS: [
        {
          id: 'tiny-minion',
          slug: 'tiny_minion',
          name: 'Tiny Minion',
          civilization: 'CHINA',
          type: 'MINION',
          rarity: 'COMMON',
          cost: 1,
          attack: 1,
          health: 1,
          description: 'Tiny minion.',
        },
        {
          id: 'tiny-stratagem',
          slug: 'tiny_stratagem',
          name: 'Tiny Stratagem',
          civilization: 'CHINA',
          type: 'STRATAGEM',
          rarity: 'COMMON',
          cost: 1,
          description: 'Tiny stratagem.',
        },
      ],
    }));

    const { useDeckStore: isolatedDeckStore } = await import('./deckStore.js');

    expect(() => isolatedDeckStore.getState().getOrCreateDeck(tinyPoolEmperor)).toThrow(
      /Unable to create starter deck/,
    );

    vi.doUnmock('@king-card/core');
    vi.resetModules();
  });

  it('hydrates a persisted Qin deck from localStorage instead of creating a new starter deck', () => {
    const persistedDeck = {
      id: `${EMPEROR_QIN.emperorCard.id}-persisted`,
      name: '秦始皇 已保存套牌',
      civilization: EMPEROR_QIN.emperorCard.civilization,
      emperorCardId: EMPEROR_QIN.emperorCard.id,
      mainCardIds: Array.from({ length: 26 }, (_, index) => `persisted-${index}`),
    };

    window.localStorage.setItem(
      DECK_STORAGE_KEY,
      JSON.stringify({
        [EMPEROR_QIN.emperorCard.id]: persistedDeck,
      }),
    );

    const deck = useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN);

    expect(deck).toEqual(persistedDeck);
    expect(useDeckStore.getState().getDeck(EMPEROR_QIN.emperorCard.id)).toEqual(persistedDeck);
  });

  it('normalizes persisted deck metadata to the emperor slot during hydration', () => {
    const starterDeck = useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN);

    resetDeckStore();
    window.localStorage.setItem(
      DECK_STORAGE_KEY,
      JSON.stringify({
        [EMPEROR_QIN.emperorCard.id]: {
          ...starterDeck,
          civilization: 'JAPAN',
          emperorCardId: 'japan_oda_nobunaga',
        },
      }),
    );

    const deck = useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN);

    expect(deck).toEqual({
      ...starterDeck,
      civilization: EMPEROR_QIN.emperorCard.civilization,
      emperorCardId: EMPEROR_QIN.emperorCard.id,
    });

    const storedDecks = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? '{}') as Record<string, typeof deck>;
    expect(storedDecks[EMPEROR_QIN.emperorCard.id]).toEqual(deck);
  });

  it('normalizes reused in-memory deck metadata before saving main-card edits', () => {
    const starterDeck = useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN);
    const staleDeck = {
      ...starterDeck,
      civilization: 'JAPAN' as const,
      emperorCardId: 'japan_oda_nobunaga',
    };
    const replacementMainCardIds = [...starterDeck.mainCardIds].reverse();

    useDeckStore.setState({
      decksByEmperorId: {
        [EMPEROR_QIN.emperorCard.id]: staleDeck,
      },
      editingEmperorCardId: null,
    });

    const normalizedDeck = useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN);
    useDeckStore.getState().replaceMainCardIds(EMPEROR_QIN.emperorCard.id, replacementMainCardIds);

    expect(normalizedDeck).toEqual({
      ...starterDeck,
      civilization: EMPEROR_QIN.emperorCard.civilization,
      emperorCardId: EMPEROR_QIN.emperorCard.id,
    });
    expect(useDeckStore.getState().getDeck(EMPEROR_QIN.emperorCard.id)).toEqual({
      ...starterDeck,
      mainCardIds: replacementMainCardIds,
      civilization: EMPEROR_QIN.emperorCard.civilization,
      emperorCardId: EMPEROR_QIN.emperorCard.id,
    });
  });

  it('ignores malformed stored decks and falls back to a starter deck', () => {
    window.localStorage.setItem(
      DECK_STORAGE_KEY,
      JSON.stringify({
        [EMPEROR_QIN.emperorCard.id]: {
          id: EMPEROR_QIN.emperorCard.id,
          emperorCardId: EMPEROR_QIN.emperorCard.id,
          mainCardIds: 'not-an-array',
        },
      }),
    );

    const deck = useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN);

    expect(deck).toMatchObject({
      id: EMPEROR_QIN.emperorCard.id,
      name: `${EMPEROR_QIN.emperorCard.name} 默认套牌`,
      civilization: EMPEROR_QIN.emperorCard.civilization,
      emperorCardId: EMPEROR_QIN.emperorCard.id,
    });
    expect(deck.mainCardIds).toHaveLength(26);
  });

  it('does not throw when localStorage reads fail', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('read failed');
    });

    expect(() => useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN)).not.toThrow();

    getItemSpy.mockRestore();
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

  it('does not throw when localStorage writes fail and still updates store state', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('write failed');
    });

    expect(() => useDeckStore.getState().getOrCreateDeck(EMPEROR_QIN)).not.toThrow();

    const starterDeck = useDeckStore.getState().getDeck(EMPEROR_QIN.emperorCard.id);
    expect(starterDeck).toBeDefined();

    const replacementMainCardIds = Array.from({ length: 26 }, (_, index) => `replacement-${index}`);

    expect(() => {
      useDeckStore.getState().replaceMainCardIds(EMPEROR_QIN.emperorCard.id, replacementMainCardIds);
    }).not.toThrow();

    expect(useDeckStore.getState().getDeck(EMPEROR_QIN.emperorCard.id)).toEqual({
      ...starterDeck,
      mainCardIds: replacementMainCardIds,
    });

    setItemSpy.mockRestore();
  });
});