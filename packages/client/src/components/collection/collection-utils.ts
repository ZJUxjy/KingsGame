import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import type { Card, CardType, Civilization, EmperorData } from '@king-card/shared';
import { getCardDisplayText, getCardSearchText } from '../../utils/cardText.js';

export type CollectionCardTypeFilter = 'ALL' | Exclude<CardType, 'EMPEROR'>;

export interface CollectionFilters {
  civilization: Civilization;
  type: CollectionCardTypeFilter;
  search: string;
  emperorId: string | null;
  showBoundOnly: boolean;
}

type CollectibleCard = Card & { type: Exclude<CardType, 'EMPEROR'> };
type PreparedCollectibleCard = {
  card: CollectibleCard;
  displayName: string;
  searchText: string;
};

const TYPE_ORDER: Record<Exclude<CardType, 'EMPEROR'>, number> = {
  MINION: 0,
  GENERAL: 1,
  STRATAGEM: 2,
  SORCERY: 3,
};

const COLLECTIBLE_CARDS: PreparedCollectibleCard[] = ALL_CARDS.filter(
  (card): card is CollectibleCard => card.type !== 'EMPEROR',
).map((card) => {
  const displayText = getCardDisplayText(card);

  return {
    card,
    displayName: displayText.name,
    searchText: getCardSearchText(card),
  };
});

function sortCards(left: PreparedCollectibleCard, right: PreparedCollectibleCard): number {
  const leftCard = left.card;
  const rightCard = right.card;

  if (leftCard.cost !== rightCard.cost) {
    return leftCard.cost - rightCard.cost;
  }

  if (leftCard.type !== rightCard.type) {
    return TYPE_ORDER[leftCard.type] - TYPE_ORDER[rightCard.type];
  }

  return left.displayName.localeCompare(right.displayName, 'zh-CN');
}

function getBoundCardIds(emperorId: string | null): Set<string> | null {
  if (!emperorId) {
    return null;
  }

  const emperorData = ALL_EMPEROR_DATA_LIST.find((item) => item.emperorCard.id === emperorId);
  if (!emperorData) {
    return null;
  }

  return new Set([
    ...emperorData.boundGenerals.map((card) => card.id),
    ...emperorData.boundSorceries.map((card) => card.id),
  ]);
}

export function getEmperorsForCivilization(civilization: Civilization): EmperorData[] {
  return ALL_EMPEROR_DATA_LIST.filter((item) => item.emperorCard.civilization === civilization);
}

/**
 * Precondition: caller only passes collectible non-EMPEROR cards.
 * The collection page central grid already filters emperors out.
 */
export function getCopyLimit(card: Card): 1 | 2 {
  return card.type === 'MINION' || card.type === 'STRATAGEM' ? 2 : 1;
}

export function getCollectionCards(filters: CollectionFilters): Card[] {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const boundCardIds = getBoundCardIds(filters.emperorId);

  return COLLECTIBLE_CARDS
    .filter(
      (entry) =>
        entry.card.civilization === filters.civilization || entry.card.civilization === 'NEUTRAL',
    )
    .filter((entry) => filters.type === 'ALL' || entry.card.type === filters.type)
    .filter((entry) => {
      if (!normalizedSearch) {
        return true;
      }

      return entry.searchText.includes(normalizedSearch);
    })
    .filter((entry) => {
      if (!filters.showBoundOnly) {
        return true;
      }

      if (!boundCardIds) {
        return false;
      }

      return boundCardIds.has(entry.card.id);
    })
    .sort(sortCards)
    .map((entry) => entry.card);
}