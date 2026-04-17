import { ALL_CARDS } from '@king-card/core';
import { useEffect } from 'react';
import { useDeckStore } from '../../stores/deckStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useLocaleStore } from '../../stores/localeStore.js';
import { getCardDisplayText } from '../../utils/cardText.js';
import {
  addCardToMainDeck,
  getDeckBuilderEligibleCards,
  getDeckBuilderIssueText,
  getDeckBuilderStatus,
  getDeckCardCount,
  getSafeDeckBuilderEmperor,
  removeCardFromMainDeck,
  resolveDeckBuilderEmperorCardId,
} from './deck-builder-utils.js';

export default function DeckBuilderPage() {
  const setUiPhase = useGameStore((state) => state.setUiPhase);
  const decksByEmperorId = useDeckStore((state) => state.decksByEmperorId);
  const editingEmperorCardId = useDeckStore((state) => state.editingEmperorCardId);
  const getOrCreateDeck = useDeckStore((state) => state.getOrCreateDeck);
  const replaceMainCardIds = useDeckStore((state) => state.replaceMainCardIds);
  const setEditingEmperorCardId = useDeckStore((state) => state.setEditingEmperorCardId);
  const locale = useLocaleStore((state) => state.locale);

  const resolvedEmperorCardId = resolveDeckBuilderEmperorCardId(editingEmperorCardId, decksByEmperorId);
  const emperorData = getSafeDeckBuilderEmperor(resolvedEmperorCardId);
  const deck = decksByEmperorId[emperorData.emperorCard.id];
  const eligibleCards = getDeckBuilderEligibleCards(emperorData);
  const displayEmperor = getCardDisplayText(emperorData.emperorCard, locale);
  const cardById = new Map(ALL_CARDS.map((card) => [card.id, card]));

  useEffect(() => {
    if (resolvedEmperorCardId && editingEmperorCardId !== resolvedEmperorCardId) {
      setEditingEmperorCardId(resolvedEmperorCardId);
    }
  }, [editingEmperorCardId, resolvedEmperorCardId, setEditingEmperorCardId]);

  useEffect(() => {
    if (!deck) {
      getOrCreateDeck(emperorData);
    }
  }, [deck, emperorData, getOrCreateDeck]);

  if (!deck) {
    return (
      <div className="min-h-screen bg-board-gradient px-6 py-10 text-stone-100">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-3 text-sm uppercase tracking-[0.45em] text-emerald-200/70">Deck</p>
              <h1 className="text-4xl font-bold text-emerald-300">{locale === 'en-US' ? 'Deck Builder' : '套牌构筑'}</h1>
              <p className="mt-3 text-lg text-stone-200">{displayEmperor.name}</p>
            </div>

            <button
              type="button"
              onClick={() => setUiPhase('lobby')}
              className="rounded-xl border border-stone-500/80 bg-stone-950/60 px-5 py-3 text-sm font-bold text-stone-100 transition hover:border-emerald-400/70 hover:text-emerald-100"
            >
              {locale === 'en-US' ? 'Back To Lobby' : '返回大厅'}
            </button>
          </div>

          <div className="rounded-[28px] border border-stone-700/80 bg-stone-950/70 p-6 text-sm text-stone-300">
            {locale === 'en-US' ? 'Loading deck...' : '正在加载套牌...'}
          </div>
        </div>
      </div>
    );
  }

  const status = getDeckBuilderStatus(deck, emperorData);

  const heading = locale === 'en-US' ? 'Deck Builder' : '套牌构筑';
  const backLabel = locale === 'en-US' ? 'Back To Lobby' : '返回大厅';
  const legalLabel = locale === 'en-US' ? 'Legal' : '合法';
  const incompleteLabel = locale === 'en-US' ? 'Incomplete' : '未完成';
  const invalidLabel = locale === 'en-US' ? 'Invalid' : '不合法';
  const addLabel = locale === 'en-US' ? 'Add' : '加入';
  const removeLabel = locale === 'en-US' ? 'Remove' : '移除';
  const staleCardDescription = locale === 'en-US' ? 'Stale or unknown card entry.' : '失效或未知的卡牌条目。';
  const staleCardMetaLabel = locale === 'en-US' ? 'Invalid entry' : '无效条目';
  const primaryIssue = status.isLegal
    ? null
    : getDeckBuilderIssueText(
      status.issues.find((issue) => issue.code !== 'MAIN_DECK_SIZE') ?? status.issues[0]!,
      locale,
      cardById,
    );
  const isIncompleteOnly = status.issues.length > 0
    && status.selectedCount < status.editableSlotCount
    && status.issues.every((issue) => issue.code === 'MAIN_DECK_SIZE');
  const currentStatusLabel = status.isLegal
    ? legalLabel
    : isIncompleteOnly
      ? incompleteLabel
      : invalidLabel;

  return (
    <div className="min-h-screen bg-board-gradient px-6 py-10 text-stone-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.45em] text-emerald-200/70">Deck</p>
            <h1 className="text-4xl font-bold text-emerald-300">{heading}</h1>
            <p className="mt-3 text-lg text-stone-200">{displayEmperor.name}</p>
            <p className="mt-1 text-sm text-stone-400">{deck.name}</p>
          </div>

          <button
            type="button"
            onClick={() => setUiPhase('lobby')}
            className="rounded-xl border border-stone-500/80 bg-stone-950/60 px-5 py-3 text-sm font-bold text-stone-100 transition hover:border-emerald-400/70 hover:text-emerald-100"
          >
            {backLabel}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-stone-700/80 bg-stone-950/65 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-stone-500">{locale === 'en-US' ? 'Bound Cards' : '绑定卡牌'}</div>
            <div className="mt-3 text-2xl font-bold text-emerald-100">{status.boundCardCount}</div>
            <div className="mt-2 text-sm text-stone-400">{locale === 'en-US' ? `Bound Cards: ${status.boundCardCount}` : `绑定卡牌：${status.boundCardCount}`}</div>
          </div>

          <div className="rounded-3xl border border-stone-700/80 bg-stone-950/65 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-stone-500">{locale === 'en-US' ? 'Editable Slots' : '可编辑槽位'}</div>
            <div className="mt-3 text-2xl font-bold text-emerald-100">{status.editableSlotCount}</div>
            <div className="mt-2 text-sm text-stone-400">{locale === 'en-US' ? `Editable Slots: ${status.editableSlotCount}` : `可编辑槽位：${status.editableSlotCount}`}</div>
          </div>

          <div className="rounded-3xl border border-stone-700/80 bg-stone-950/65 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-stone-500">{locale === 'en-US' ? 'Main Deck' : '主套牌'}</div>
            <div className="mt-3 text-2xl font-bold text-emerald-100">{status.selectedCount} / {status.editableSlotCount}</div>
            <div className="mt-2 text-sm text-stone-400">{locale === 'en-US' ? `Main Deck: ${status.selectedCount} / ${status.editableSlotCount}` : `主套牌：${status.selectedCount} / ${status.editableSlotCount}`}</div>
          </div>

          <div className="rounded-3xl border border-stone-700/80 bg-stone-950/65 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-stone-500">{locale === 'en-US' ? 'Status' : '状态'}</div>
            <div className="mt-3 text-2xl font-bold text-emerald-100">{currentStatusLabel}</div>
            <div className="mt-2 text-sm text-stone-400">{locale === 'en-US' ? `Status: ${currentStatusLabel}` : `状态：${currentStatusLabel}`}</div>
            {primaryIssue ? <div className="mt-2 text-sm text-rose-200">{primaryIssue}</div> : null}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="rounded-[28px] border border-stone-700/80 bg-stone-950/70 p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-emerald-100">{locale === 'en-US' ? 'Eligible Cards' : '可加入卡牌'}</h2>
                <p className="mt-2 text-sm text-stone-400">
                  {locale === 'en-US'
                    ? 'Add same-civilization or neutral cards until the main deck reaches its slot and copy limits.'
                    : '只能加入同文明或中立卡牌，且必须遵守槽位与拷贝上限。'}
                </p>
              </div>
              <div className="rounded-full border border-stone-700 px-4 py-2 text-sm text-stone-300">
                {locale === 'en-US' ? `Remaining: ${status.remainingSlots}` : `剩余槽位：${status.remainingSlots}`}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {eligibleCards.map((card) => {
                const displayCard = getCardDisplayText(card, locale);
                const copyCount = getDeckCardCount(deck.mainCardIds, card.id);
                const copyLimit = card.type === 'MINION' || card.type === 'STRATAGEM' ? 2 : 1;
                const canAddCard = status.selectedCount < status.editableSlotCount && copyCount < copyLimit;

                return (
                  <div
                    key={card.id}
                    className="rounded-2xl border border-stone-800 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-stone-100">{displayCard.name}</div>
                        <div className="mt-1 text-sm text-stone-400">{displayCard.description}</div>
                      </div>
                      <div className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-300">
                        {locale === 'en-US' ? `Cost ${card.cost}` : `费用 ${card.cost}`}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-stone-400">
                      <span>{locale === 'en-US' ? `Copies ${copyCount} / ${copyLimit}` : `数量 ${copyCount} / ${copyLimit}`}</span>
                      <button
                        type="button"
                        aria-label={`${addLabel} ${displayCard.name}`}
                        disabled={!canAddCard}
                        onClick={() => replaceMainCardIds(
                          emperorData.emperorCard.id,
                          addCardToMainDeck(deck.mainCardIds, card, emperorData),
                        )}
                        className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                          canAddCard
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'cursor-not-allowed bg-stone-800 text-stone-500'
                        }`}
                      >
                        {addLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-stone-700/80 bg-stone-950/70 p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-emerald-100">{locale === 'en-US' ? 'Current Main Deck' : '当前主套牌'}</h2>
              <p className="mt-2 text-sm text-stone-400">
                {locale === 'en-US'
                  ? 'Remove cards here to free slots before changing the deck composition.'
                  : '从这里移除卡牌即可腾出可编辑槽位。'}
              </p>
            </div>

            <div className="max-h-[40rem] space-y-3 overflow-y-auto pr-1">
              {deck.mainCardIds.map((cardId, index) => {
                const card = cardById.get(cardId);
                const displayCard = card ? getCardDisplayText(card, locale) : { name: cardId, description: staleCardDescription };
                const issue = status.issues.find((currentIssue) => currentIssue.cardId === cardId);
                const issueText = issue ? getDeckBuilderIssueText(issue, locale, cardById) : null;

                return (
                  <div
                    key={`${cardId}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-black/20 px-4 py-3"
                  >
                    <div>
                      <div className="font-semibold text-stone-100">{displayCard.name}</div>
                      <div className="text-sm text-stone-400">
                        {card
                          ? locale === 'en-US'
                            ? `${card.type} · Cost ${card.cost}`
                            : `${card.type} · 费用 ${card.cost}`
                          : staleCardMetaLabel}
                      </div>
                      {issueText ? <div className="mt-1 text-sm text-rose-200">{issueText}</div> : null}
                    </div>

                    <button
                      type="button"
                      aria-label={`${removeLabel} ${displayCard.name}`}
                      onClick={() => replaceMainCardIds(
                        emperorData.emperorCard.id,
                        removeCardFromMainDeck(deck.mainCardIds, index),
                      )}
                      className="rounded-xl border border-rose-500/60 px-4 py-2 text-sm font-bold text-rose-200 transition hover:border-rose-400 hover:text-rose-100"
                    >
                      {removeLabel}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}