import { ALL_CARDS, ALL_EMPEROR_DATA_LIST, EMPEROR_QIN } from '@king-card/core';
import { getDeckCopyLimit, validateDeckDefinition, type Card, type EmperorData } from '@king-card/shared';
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

function makeTestCard(
  overrides: Partial<Card> & Pick<Card, 'id' | 'name' | 'civilization' | 'type'>,
): Card {
  return {
    id: overrides.id,
    name: overrides.name,
    civilization: overrides.civilization,
    type: overrides.type,
    rarity: overrides.rarity ?? 'COMMON',
    cost: overrides.cost ?? 1,
    attack: overrides.attack,
    health: overrides.health,
    description: overrides.description ?? overrides.name,
    keywords: overrides.keywords ?? [],
    effects: overrides.effects ?? [],
    heroSkill: overrides.heroSkill,
    generalSkills: overrides.generalSkills,
  };
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

  it('creates validator-legal starter decks for every supported emperor', () => {
    for (const emperorData of ALL_EMPEROR_DATA_LIST) {
      const deck = useDeckStore.getState().getOrCreateDeck(emperorData);
      const validation = validateDeckDefinition(deck, ALL_CARDS, emperorData);

      expect(validation, emperorData.emperorCard.id).toEqual({
        ok: true,
        issues: [],
      });
    }
  });

  it('throws instead of padding beyond copy limits when the legal starter pool is too small', async () => {
    const tinyPoolEmperor: EmperorData = {
      emperorCard: makeTestCard({
        id: 'tiny-emperor',
        name: 'Tiny Emperor',
        civilization: 'CHINA',
        type: 'EMPEROR',
        rarity: 'LEGENDARY',
        cost: 0,
        description: 'Tiny emperor for starter-deck tests.',
      }),
      ministers: [],
      boundGenerals: [],
      boundSorceries: Array.from({ length: 25 }, (_, index) =>
        makeTestCard({
          id: `tiny-bound-${index + 1}`,
          name: `Tiny Bound ${index + 1}`,
          civilization: 'CHINA',
          type: 'SORCERY',
          rarity: 'RARE',
          cost: 1,
          description: `Bound sorcery ${index + 1}.`,
        }),
      ),
    };

    vi.resetModules();
    vi.doMock('@king-card/core', () => ({
      ALL_EMPEROR_DATA_LIST: [],
      ALL_CARDS: [
        makeTestCard({
          id: 'tiny-minion',
          name: 'Tiny Minion',
          civilization: 'CHINA',
          type: 'MINION',
          rarity: 'COMMON',
          cost: 1,
          attack: 1,
          health: 1,
          description: 'Tiny minion.',
        }),
        makeTestCard({
          id: 'tiny-stratagem',
          name: 'Tiny Stratagem',
          civilization: 'CHINA',
          type: 'STRATAGEM',
          rarity: 'COMMON',
          cost: 1,
          description: 'Tiny stratagem.',
        }),
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

  it('ensureDefaultDecks creates starter decks for missing emperors without overwriting saved ones', () => {
    const customQinDeck = {
      id: 'custom-qin',
      name: '秦始皇 自定义套牌',
      civilization: EMPEROR_QIN.emperorCard.civilization,
      emperorCardId: EMPEROR_QIN.emperorCard.id,
      mainCardIds: ['kept-by-user'],
    };

    useDeckStore.setState({
      decksByEmperorId: {
        [EMPEROR_QIN.emperorCard.id]: customQinDeck,
      },
      editingEmperorCardId: null,
    });

    useDeckStore.getState().ensureDefaultDecks(ALL_EMPEROR_DATA_LIST);

    const decksByEmperorId = useDeckStore.getState().decksByEmperorId;
    expect(decksByEmperorId[EMPEROR_QIN.emperorCard.id]).toEqual(customQinDeck);

    for (const emperorData of ALL_EMPEROR_DATA_LIST) {
      const deck = decksByEmperorId[emperorData.emperorCard.id];
      expect(deck, emperorData.emperorCard.id).toBeDefined();

      if (emperorData.emperorCard.id !== EMPEROR_QIN.emperorCard.id) {
        const validation = validateDeckDefinition(deck!, ALL_CARDS, emperorData);
        expect(validation, emperorData.emperorCard.id).toEqual({ ok: true, issues: [] });
      }
    }

    const stored = JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY) ?? '{}');
    expect(stored[EMPEROR_QIN.emperorCard.id]).toEqual(customQinDeck);
    for (const emperorData of ALL_EMPEROR_DATA_LIST) {
      expect(stored[emperorData.emperorCard.id], emperorData.emperorCard.id).toBeDefined();
    }
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