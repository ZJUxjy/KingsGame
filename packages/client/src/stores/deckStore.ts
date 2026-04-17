import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import {
  getDeckCopyLimit,
  getEditableDeckSize,
  type DeckDefinition,
  type EmperorData,
} from '@king-card/shared';
import { create } from 'zustand';

export const DECK_STORAGE_KEY = 'king-card-decks';

const emperorDataById = new Map(
  ALL_EMPEROR_DATA_LIST.map((emperorData) => [emperorData.emperorCard.id, emperorData]),
);

interface DeckState {
  decksByEmperorId: Record<string, DeckDefinition>;
  editingEmperorCardId: string | null;
  getDeck: (emperorCardId: string) => DeckDefinition | undefined;
  getOrCreateDeck: (emperorData: EmperorData) => DeckDefinition;
  replaceMainCardIds: (emperorCardId: string, mainCardIds: string[]) => void;
  renameDeck: (emperorCardId: string, name: string) => void;
  setEditingEmperorCardId: (emperorCardId: string | null) => void;
}

function getLocalStorageSafely(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isStoredDeckDefinition(value: unknown): value is DeckDefinition {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<DeckDefinition> & {
    mainCardIds?: unknown;
  };

  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.civilization === 'string'
    && typeof candidate.emperorCardId === 'string'
    && Array.isArray(candidate.mainCardIds)
    && candidate.mainCardIds.every((cardId) => typeof cardId === 'string');
}

function normalizeDeckMetadata(deck: DeckDefinition, emperorCardId: string): DeckDefinition {
  const emperorData = emperorDataById.get(emperorCardId);
  if (!emperorData) {
    return deck;
  }

  const normalizedCivilization = emperorData.emperorCard.civilization;
  if (deck.emperorCardId === emperorCardId && deck.civilization === normalizedCivilization) {
    return deck;
  }

  return {
    ...deck,
    emperorCardId,
    civilization: normalizedCivilization,
  };
}

function normalizeDecksBySlot(
  decksByEmperorId: Record<string, DeckDefinition>,
): { decksByEmperorId: Record<string, DeckDefinition>; changed: boolean } {
  let changed = false;
  const normalizedDecks = Object.fromEntries(
    Object.entries(decksByEmperorId).map(([emperorCardId, deck]) => {
      const normalizedDeck = normalizeDeckMetadata(deck, emperorCardId);
      if (normalizedDeck !== deck) {
        changed = true;
      }

      return [emperorCardId, normalizedDeck];
    }),
  );

  return {
    decksByEmperorId: normalizedDecks,
    changed,
  };
}

function readStoredDecks(): Record<string, DeckDefinition> {
  const localStorage = getLocalStorageSafely();
  if (!localStorage) {
    return {};
  }

  try {
    const storedDecks = localStorage.getItem(DECK_STORAGE_KEY);
    if (!storedDecks) {
      return {};
    }

    const parsed = JSON.parse(storedDecks) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    const filteredDecks = Object.fromEntries(
      Object.entries(parsed).filter(([, deck]) => isStoredDeckDefinition(deck)),
    );
    const normalizedDecks = normalizeDecksBySlot(filteredDecks);

    if (normalizedDecks.changed) {
      persistDecks(normalizedDecks.decksByEmperorId);
    }

    return normalizedDecks.decksByEmperorId;
  } catch {
    return {};
  }
}

function persistDecks(decksByEmperorId: Record<string, DeckDefinition>) {
  const localStorage = getLocalStorageSafely();
  if (!localStorage) {
    return;
  }

  try {
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(decksByEmperorId));
  } catch {
    // Ignore storage failures and keep the in-memory deck state usable.
  }
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

  const remainingCopiesByCardId = new Map(
    pool.map((card) => [card.id, getDeckCopyLimit(card)]),
  );
  const mainCardIds: string[] = [];

  while (mainCardIds.length < editableDeckSize) {
    let addedCardThisPass = false;

    for (const card of pool) {
      const remainingCopies = remainingCopiesByCardId.get(card.id) ?? 0;
      if (remainingCopies <= 0) {
        continue;
      }

      mainCardIds.push(card.id);
      remainingCopiesByCardId.set(card.id, remainingCopies - 1);
      addedCardThisPass = true;

      if (mainCardIds.length === editableDeckSize) {
        break;
      }
    }

    if (!addedCardThisPass) {
      throw new Error(`Unable to create starter deck for emperor ${emperorData.emperorCard.id}.`);
    }
  }

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
      const normalizedDeck = normalizeDeckMetadata(existingDeck, emperorData.emperorCard.id);
      if (normalizedDeck !== existingDeck) {
        const nextDecks = {
          ...get().decksByEmperorId,
          [emperorData.emperorCard.id]: normalizedDeck,
        };

        persistDecks(nextDecks);
        set({ decksByEmperorId: nextDecks });
      }

      return normalizedDeck;
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

      const normalizedDeck = normalizeDeckMetadata(deck, emperorCardId);

      const nextDecks = {
        ...state.decksByEmperorId,
        [emperorCardId]: {
          ...normalizedDeck,
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