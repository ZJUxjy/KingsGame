import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import type { Card, CardType, Civilization, EmperorData } from '@king-card/shared';
import { getCardDisplayText, getKeywordText } from '../../utils/cardText.js';
import { DEFAULT_LOCALE, type SupportedLocale } from '../../utils/locale.js';

export type CollectionCardTypeFilter = 'ALL' | Exclude<CardType, 'EMPEROR'>;

export interface CollectionFilters {
  civilization: Civilization;
  type: CollectionCardTypeFilter;
  search: string;
  emperorId: string | null;
  showBoundOnly: boolean;
}

type CollectibleCard = Card & { type: Exclude<CardType, 'EMPEROR'> };
interface LocalizedCollectibleCard {
  card: CollectibleCard;
  displayCard: CollectibleCard;
  searchText: string;
}

const TYPE_ORDER: Record<Exclude<CardType, 'EMPEROR'>, number> = {
  MINION: 0,
  GENERAL: 1,
  STRATAGEM: 2,
  SORCERY: 3,
};

const COLLECTIBLE_CARDS: CollectibleCard[] = ALL_CARDS.filter(
  (card): card is CollectibleCard => card.type !== 'EMPEROR',
);

function sortCards(left: LocalizedCollectibleCard, right: LocalizedCollectibleCard, locale: SupportedLocale): number {
  if (left.card.cost !== right.card.cost) {
    return left.card.cost - right.card.cost;
  }

  if (left.card.type !== right.card.type) {
    return TYPE_ORDER[left.card.type] - TYPE_ORDER[right.card.type];
  }

  return left.displayCard.name.localeCompare(right.displayCard.name, locale);
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

export function getCollectionCards(
  filters: CollectionFilters,
  locale: SupportedLocale = DEFAULT_LOCALE,
): Card[] {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const boundCardIds = getBoundCardIds(filters.emperorId);

  return COLLECTIBLE_CARDS
    .filter((card) => card.civilization === filters.civilization || card.civilization === 'NEUTRAL')
    .filter((card) => filters.type === 'ALL' || card.type === filters.type)
    .map((card) => {
      const displayCard = getCardDisplayText(card, locale);

      return {
        card,
        displayCard,
        searchText: [displayCard.name, displayCard.description, getKeywordText(displayCard.keywords, locale)]
          .join(' ')
          .toLowerCase(),
      };
    })
    .filter((card) => {
      if (!normalizedSearch) {
        return true;
      }

      return card.searchText.includes(normalizedSearch);
    })
    .filter((card) => {
      if (!filters.showBoundOnly) {
        return true;
      }

      if (!boundCardIds) {
        return false;
      }

      return boundCardIds.has(card.card.id);
    })
    .sort((left, right) => sortCards(left, right, locale))
    .map((entry) => entry.card);
}