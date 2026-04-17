import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App.js';
import { useDeckStore } from '../../stores/deckStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useLocaleStore } from '../../stores/localeStore.js';

vi.mock('../../hooks/useGameSocket.js', () => ({
  useGameSocket: () => undefined,
}));

const initialGameState = useGameStore.getState();
const initialDeckState = useDeckStore.getState();
const fallbackEmperor = ALL_EMPEROR_DATA_LIST[0]!;
const fallbackBoundCardCount = fallbackEmperor.boundGenerals.length + fallbackEmperor.boundSorceries.length;

function resetStores() {
  useGameStore.setState(initialGameState, true);
  useDeckStore.setState(initialDeckState, true);
  useLocaleStore.setState({ locale: 'zh-CN' });
  window.localStorage.clear();
}

describe('DeckBuilderPage', () => {
  beforeEach(() => {
    resetStores();
  });

  afterEach(() => {
    cleanup();
    resetStores();
  });

  it('opens from the lobby and returns to the lobby', () => {
    useGameStore.setState({
      ...initialGameState,
      uiPhase: 'lobby',
    });

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /套牌构筑/ }));

    expect(useGameStore.getState().uiPhase).toBe('deck-builder');
    expect(screen.getByRole('heading', { name: '套牌构筑' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '返回大厅' }));

    expect(useGameStore.getState().uiPhase).toBe('lobby');
    expect(screen.getByRole('button', { name: /单人模式/ })).toBeTruthy();
  });

  it('falls back to a safe emperor when no editing emperor is selected', () => {
    useDeckStore.setState({
      decksByEmperorId: {},
      editingEmperorCardId: null,
    });
    useGameStore.setState({
      ...initialGameState,
      uiPhase: 'deck-builder',
    });

    render(<App />);

    expect(screen.getAllByText(fallbackEmperor.emperorCard.name).length).toBeGreaterThan(0);
    expect(screen.getByText(`绑定卡牌：${fallbackBoundCardCount}`)).toBeTruthy();
    expect(screen.getByText('可编辑槽位：26')).toBeTruthy();
  });

  it('supports add or remove within deck limits for the selected editing emperor', () => {
    const interactionCandidate = ALL_EMPEROR_DATA_LIST.find((emperorData) => {
      const eligibleCards = ALL_CARDS.filter((card) => {
        const isEligibleCivilization =
          card.civilization === emperorData.emperorCard.civilization || card.civilization === 'NEUTRAL';
        const isBoundCard = emperorData.boundGenerals.some((boundCard) => boundCard.id === card.id)
          || emperorData.boundSorceries.some((boundCard) => boundCard.id === card.id);

        return isEligibleCivilization && !isBoundCard;
      });
      return eligibleCards.some((candidateCard) => {
        if (candidateCard.type !== 'MINION' && candidateCard.type !== 'STRATAGEM') {
          return false;
        }

        const remainingCapacity = eligibleCards
          .filter((card) => card.id !== candidateCard.id)
          .reduce((total, card) => total + (card.type === 'MINION' || card.type === 'STRATAGEM' ? 2 : 1), 0);

        return remainingCapacity >= 24;
      });
    });
    expect(interactionCandidate).toBeTruthy();

    const interactionEmperor = interactionCandidate!;
    const starterDeck = useDeckStore.getState().getOrCreateDeck(interactionEmperor);
    const eligibleCards = ALL_CARDS.filter((card) => {
      const isEligibleCivilization =
        card.civilization === interactionEmperor.emperorCard.civilization || card.civilization === 'NEUTRAL';
      const isBoundCard = interactionEmperor.boundGenerals.some((boundCard) => boundCard.id === card.id)
        || interactionEmperor.boundSorceries.some((boundCard) => boundCard.id === card.id);

      return isEligibleCivilization && !isBoundCard;
    });
    const addableCard = eligibleCards.find((candidateCard) => {
      if (candidateCard.type !== 'MINION' && candidateCard.type !== 'STRATAGEM') {
        return false;
      }

      const remainingCapacity = eligibleCards
        .filter((card) => card.id !== candidateCard.id)
        .reduce((total, card) => total + (card.type === 'MINION' || card.type === 'STRATAGEM' ? 2 : 1), 0);

      return remainingCapacity >= 24;
    });
    expect(addableCard).toBeTruthy();

    const reducedMainDeck = eligibleCards
      .filter((card) => card.id !== addableCard!.id)
      .reduce<string[]>((mainCardIds, card) => {
      const copyLimit = card.type === 'MINION' || card.type === 'STRATAGEM' ? 2 : 1;

      for (let index = 0; index < copyLimit && mainCardIds.length < 24; index += 1) {
        mainCardIds.push(card.id);
      }

      return mainCardIds;
    }, []);
    expect(reducedMainDeck).toHaveLength(24);

    useDeckStore.setState({
      decksByEmperorId: {
        [interactionEmperor.emperorCard.id]: {
          ...starterDeck,
          name: '测试套牌',
          mainCardIds: reducedMainDeck,
        },
      },
      editingEmperorCardId: interactionEmperor.emperorCard.id,
    });
    useGameStore.setState({
      ...initialGameState,
      uiPhase: 'deck-builder',
    });

    render(<App />);

    const boundCardCount = interactionEmperor.boundGenerals.length + interactionEmperor.boundSorceries.length;

    expect(screen.getAllByText(interactionEmperor.emperorCard.name).length).toBeGreaterThan(0);
    expect(screen.getByText(`绑定卡牌：${boundCardCount}`)).toBeTruthy();
    expect(screen.getByText(`可编辑槽位：${30 - boundCardCount}`)).toBeTruthy();
    expect(screen.getByText('主套牌：24 / 26')).toBeTruthy();
    expect(screen.getByText('状态：未完成')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: `加入 ${addableCard!.name}` }));

    expect(screen.getByText('主套牌：25 / 26')).toBeTruthy();
    expect(screen.getByText('状态：未完成')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: `加入 ${addableCard!.name}` }));

    expect(screen.getByText('主套牌：26 / 26')).toBeTruthy();
    expect(screen.getByText('状态：合法')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: `加入 ${addableCard!.name}` }));

    expect(screen.getByText('主套牌：26 / 26')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: `移除 ${addableCard!.name}` })).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: `移除 ${addableCard!.name}` })[0]!);

    expect(screen.getByText('主套牌：25 / 26')).toBeTruthy();
    expect(screen.getByText('状态：未完成')).toBeTruthy();
  });
});