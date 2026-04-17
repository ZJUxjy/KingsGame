import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import {
  getDeckCopyLimit,
  getEditableDeckSize,
  validateDeckDefinition,
  type Card,
  type DeckDefinition,
  type DeckValidationIssue,
  type EmperorData,
} from '@king-card/shared';

export interface DeckBuilderStatus {
  boundCardCount: number;
  editableSlotCount: number;
  selectedCount: number;
  remainingSlots: number;
  canAddMoreCards: boolean;
  isLegal: boolean;
  issues: DeckValidationIssue[];
}

function getBoundCardIds(emperorData: EmperorData): Set<string> {
  return new Set([
    ...emperorData.boundGenerals.map((card) => card.id),
    ...emperorData.boundSorceries.map((card) => card.id),
  ]);
}

export function getSafeDeckBuilderEmperor(editingEmperorCardId: string | null): EmperorData {
  return ALL_EMPEROR_DATA_LIST.find((emperorData) => emperorData.emperorCard.id === editingEmperorCardId)
    ?? ALL_EMPEROR_DATA_LIST[0]!;
}

export function getDeckBuilderEligibleCards(emperorData: EmperorData): Card[] {
  const boundCardIds = getBoundCardIds(emperorData);

  return ALL_CARDS
    .filter((card) => card.civilization === emperorData.emperorCard.civilization || card.civilization === 'NEUTRAL')
    .filter((card) => !boundCardIds.has(card.id))
    .sort((left, right) => {
      if (left.cost !== right.cost) {
        return left.cost - right.cost;
      }

      if (left.type !== right.type) {
        return left.type.localeCompare(right.type);
      }

      return left.name.localeCompare(right.name, 'zh-CN');
    });
}

export function getDeckCardCount(mainCardIds: readonly string[], cardId: string): number {
  return mainCardIds.filter((id) => id === cardId).length;
}

export function addCardToMainDeck(
  mainCardIds: readonly string[],
  card: Card,
  emperorData: EmperorData,
): string[] {
  const editableSlotCount = getEditableDeckSize(emperorData);
  if (mainCardIds.length >= editableSlotCount) {
    return [...mainCardIds];
  }

  const copyCount = getDeckCardCount(mainCardIds, card.id);
  if (copyCount >= getDeckCopyLimit(card)) {
    return [...mainCardIds];
  }

  return [...mainCardIds, card.id];
}

export function removeCardFromMainDeck(mainCardIds: readonly string[], index: number): string[] {
  return mainCardIds.filter((_, currentIndex) => currentIndex !== index);
}

export function getDeckBuilderStatus(deck: DeckDefinition, emperorData: EmperorData): DeckBuilderStatus {
  const editableSlotCount = getEditableDeckSize(emperorData);
  const selectedCount = deck.mainCardIds.length;
  const issues = validateDeckDefinition(deck, ALL_CARDS, emperorData).issues;

  return {
    boundCardCount: emperorData.boundGenerals.length + emperorData.boundSorceries.length,
    editableSlotCount,
    selectedCount,
    remainingSlots: Math.max(0, editableSlotCount - selectedCount),
    canAddMoreCards: selectedCount < editableSlotCount,
    isLegal: issues.length === 0,
    issues,
  };
}