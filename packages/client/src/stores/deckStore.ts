import { ALL_CARDS } from '@king-card/core';
import {
  getDeckCopyLimit,
  getEditableDeckSize,
  type DeckDefinition,
  type EmperorData,
} from '@king-card/shared';
import { create } from 'zustand';

export const DECK_STORAGE_KEY = 'king-card-decks';

interface DeckState {
  decksByEmperorId: Record<string, DeckDefinition>;
  editingEmperorCardId: string | null;
  getDeck: (emperorCardId: string) => DeckDefinition | undefined;
  getOrCreateDeck: (emperorData: EmperorData) => DeckDefinition;
  replaceMainCardIds: (emperorCardId: string, mainCardIds: string[]) => void;
  renameDeck: (emperorCardId: string, name: string) => void;
  setEditingEmperorCardId: (emperorCardId: string | null) => void;
}

function readStoredDecks(): Record<string, DeckDefinition> {
  if (typeof window === 'undefined') {
    return {};
  }

  const storedDecks = window.localStorage.getItem(DECK_STORAGE_KEY);
  if (!storedDecks) {
    return {};
  }

  try {
    const parsed = JSON.parse(storedDecks) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return parsed as Record<string, DeckDefinition>;
  } catch {
    return {};
  }
}

function persistDecks(decksByEmperorId: Record<string, DeckDefinition>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(decksByEmperorId));
}

function createStarterDeck(emperorData: EmperorData): DeckDefinition {
  const editableDeckSize = getEditableDeckSize(emperorData);
  const excludedCardIds = new Set([
    ...emperorData.boundGenerals.map((card) => card.id),
    ...emperorData.boundSorceries.map((card) => card.id),
  ]);
  const pool = ALL_CARDS.filter(
    (card) =>
      (card.civilization === emperorData.emperorCard.civilization || card.civilization === 'NEUTRAL')
      && !excludedCardIds.has(card.id),
  );

  if (pool.length === 0) {
    throw new Error(`Unable to create starter deck for emperor ${emperorData.emperorCard.id}.`);
  }

  const starterPool = pool.flatMap((card) => Array.from({ length: getDeckCopyLimit(card) }, () => card.id));
  const mainCardIds = Array.from(
    { length: editableDeckSize },
    (_, index) => starterPool[index % starterPool.length],
  );

  return {
    id: emperorData.emperorCard.id,
    name: `${emperorData.emperorCard.name} 默认套牌`,
    civilization: emperorData.emperorCard.civilization,
    emperorCardId: emperorData.emperorCard.id,
    mainCardIds,
  };
}

export const useDeckStore = create<DeckState>((set, get) => ({
  decksByEmperorId: readStoredDecks(),
  editingEmperorCardId: null,
  getDeck: (emperorCardId) => get().decksByEmperorId[emperorCardId],
  getOrCreateDeck: (emperorData) => {
    const existingDeck = get().decksByEmperorId[emperorData.emperorCard.id];
    if (existingDeck) {
      return existingDeck;
    }

    const storedDecks = readStoredDecks();
    const hydratedDeck = storedDecks[emperorData.emperorCard.id];
    if (hydratedDeck) {
      set({ decksByEmperorId: storedDecks });
      return hydratedDeck;
    }

    const starterDeck = createStarterDeck(emperorData);
    const nextDecks = {
      ...get().decksByEmperorId,
      [emperorData.emperorCard.id]: starterDeck,
    };

    persistDecks(nextDecks);
    set({ decksByEmperorId: nextDecks });
    return starterDeck;
  },
  replaceMainCardIds: (emperorCardId, mainCardIds) => {
    set((state) => {
      const deck = state.decksByEmperorId[emperorCardId];
      if (!deck) {
        return state;
      }

      const nextDecks = {
        ...state.decksByEmperorId,
        [emperorCardId]: {
          ...deck,
          mainCardIds,
        },
      };

      persistDecks(nextDecks);
      return { decksByEmperorId: nextDecks };
    });
  },
  renameDeck: (emperorCardId, name) => {
    set((state) => {
      const deck = state.decksByEmperorId[emperorCardId];
      if (!deck) {
        return state;
      }

      const nextDecks = {
        ...state.decksByEmperorId,
        [emperorCardId]: {
          ...deck,
          name,
        },
      };

      persistDecks(nextDecks);
      return { decksByEmperorId: nextDecks };
    });
  },
  setEditingEmperorCardId: (editingEmperorCardId) => {
    set({ editingEmperorCardId });
  },
}));