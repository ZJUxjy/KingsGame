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

export function resolveDeckBuilderEmperorCardId(
  editingEmperorCardId: string | null,
  decksByEmperorId: Readonly<Record<string, DeckDefinition>>,
): string | null {
  if (
    editingEmperorCardId
    && ALL_EMPEROR_DATA_LIST.some((emperorData) => emperorData.emperorCard.id === editingEmperorCardId)
  ) {
    return editingEmperorCardId;
  }

  const deckBackedEmperor = ALL_EMPEROR_DATA_LIST.find(
    (emperorData) => decksByEmperorId[emperorData.emperorCard.id],
  );

  return deckBackedEmperor?.emperorCard.id ?? ALL_EMPEROR_DATA_LIST[0]?.emperorCard.id ?? null;
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

export function getDeckBuilderIssueText(
  issue: DeckValidationIssue,
  locale: string,
  cardById: ReadonlyMap<string, Card>,
): string {
  const cardName = issue.cardId ? cardById.get(issue.cardId)?.name ?? issue.cardId : null;

  switch (issue.code) {
    case 'MAIN_DECK_SIZE':
      return locale === 'en-US'
        ? `Main deck needs ${issue.limit ?? 0} cards and currently has ${issue.actual ?? 0}.`
        : `主套牌需要 ${issue.limit ?? 0} 张，当前为 ${issue.actual ?? 0} 张。`;
    case 'UNKNOWN_CARD':
      return locale === 'en-US'
        ? `Card ${cardName ?? issue.cardId ?? 'unknown'} is stale or missing from the catalog.`
        : `卡牌 ${cardName ?? issue.cardId ?? '未知卡牌'} 已失效或不在卡牌库中。`;
    case 'EMPEROR_MISMATCH':
      return locale === 'en-US'
        ? 'This saved deck belongs to a different emperor than the current slot.'
        : '该已保存套牌所属帝王与当前槽位不一致。';
    case 'CIVILIZATION_MISMATCH':
      return locale === 'en-US'
        ? 'This saved deck belongs to a different civilization than the selected emperor.'
        : '该已保存套牌所属文明与当前帝王不一致。';
    case 'CROSS_CIVILIZATION':
      return locale === 'en-US'
        ? `Card ${cardName ?? issue.cardId ?? 'unknown'} does not match this deck's civilization.`
        : `卡牌 ${cardName ?? issue.cardId ?? '未知卡牌'} 不属于当前套牌文明。`;
    case 'BOUND_CARD_IN_MAIN_DECK':
      return locale === 'en-US'
        ? `Card ${cardName ?? issue.cardId ?? 'unknown'} is already bound to this emperor and cannot be added again.`
        : `卡牌 ${cardName ?? issue.cardId ?? '未知卡牌'} 已由该帝王绑定，不能重复加入主套牌。`;
    case 'COPY_LIMIT':
      return locale === 'en-US'
        ? `Card ${cardName ?? issue.cardId ?? 'unknown'} exceeds its copy limit of ${issue.limit ?? 0}.`
        : `卡牌 ${cardName ?? issue.cardId ?? '未知卡牌'} 超过数量上限 ${issue.limit ?? 0}。`;
    case 'GENERAL_LIMIT':
      return locale === 'en-US'
        ? `The deck has ${issue.actual ?? 0} free generals, above the limit of ${issue.limit ?? 0}.`
        : `自由武将数量为 ${issue.actual ?? 0}，超过上限 ${issue.limit ?? 0}。`;
    case 'SORCERY_LIMIT':
      return locale === 'en-US'
        ? `The deck has ${issue.actual ?? 0} free sorceries, above the limit of ${issue.limit ?? 0}.`
        : `自由法术数量为 ${issue.actual ?? 0}，超过上限 ${issue.limit ?? 0}。`;
    case 'EMPEROR_LIMIT':
      return locale === 'en-US'
        ? `The deck has ${issue.actual ?? 0} emperors, above the limit of ${issue.limit ?? 0}.`
        : `皇帝卡数量为 ${issue.actual ?? 0}，超过上限 ${issue.limit ?? 0}。`;
    default:
      return issue.message;
  }
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