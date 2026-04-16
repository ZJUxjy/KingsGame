import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import type { Card, CardType, Civilization, EmperorData, Keyword } from '@king-card/shared';

export type CollectionCardTypeFilter = 'ALL' | Exclude<CardType, 'EMPEROR'>;

export interface CollectionFilters {
  civilization: Civilization;
  type: CollectionCardTypeFilter;
  search: string;
  emperorId: string | null;
  showBoundOnly: boolean;
}

type CollectibleCard = Card & { type: Exclude<CardType, 'EMPEROR'> };

const TYPE_ORDER: Record<Exclude<CardType, 'EMPEROR'>, number> = {
  MINION: 0,
  GENERAL: 1,
  STRATAGEM: 2,
  SORCERY: 3,
};

const COLLECTIBLE_CARDS: CollectibleCard[] = ALL_CARDS.filter(
  (card): card is CollectibleCard => card.type !== 'EMPEROR',
);

function keywordText(keywords: Keyword[]): string {
  return keywords.join(' ');
}

function sortCards(left: CollectibleCard, right: CollectibleCard): number {
  if (left.cost !== right.cost) {
    return left.cost - right.cost;
  }

  if (left.type !== right.type) {
    return TYPE_ORDER[left.type] - TYPE_ORDER[right.type];
  }

  return left.name.localeCompare(right.name, 'zh-CN');
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
    .filter((card) => card.civilization === filters.civilization || card.civilization === 'NEUTRAL')
    .filter((card) => filters.type === 'ALL' || card.type === filters.type)
    .filter((card) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [card.name, card.description, keywordText(card.keywords)]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    })
    .filter((card) => {
      if (!filters.showBoundOnly) {
        return true;
      }

      if (!boundCardIds) {
        return false;
      }

      return boundCardIds.has(card.id);
    })
    .sort(sortCards);
}