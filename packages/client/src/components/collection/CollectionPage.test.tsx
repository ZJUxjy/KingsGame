import {
  ALL_EMPEROR_DATA_LIST,
  CHINA_ALL_CARDS,
  JAPAN_ALL_CARDS,
} from '@king-card/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import CollectionPage from './CollectionPage.js';
import { useGameStore } from '../../stores/gameStore.js';

const initialState = useGameStore.getState();

describe('CollectionPage', () => {
  beforeEach(() => {
    useGameStore.setState({
      ...initialState,
      uiPhase: 'collection',
    });
  });

  afterEach(() => {
    cleanup();
    useGameStore.setState(initialState, true);
  });

  it('shows China cards by default and switches to the selected civilization', () => {
    const chinaCard = CHINA_ALL_CARDS.find((card) => card.type !== 'EMPEROR')!;
    const japanCard = JAPAN_ALL_CARDS.find((card) => card.type !== 'EMPEROR')!;

    render(<CollectionPage />);

    expect(screen.getByText('收藏')).toBeTruthy();
    expect(screen.getByText(chinaCard.name)).toBeTruthy();
    expect(screen.queryByText(japanCard.name)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /大和/ }));

    expect(screen.getByText(japanCard.name)).toBeTruthy();
    expect(screen.queryByText(chinaCard.name)).toBeNull();
  });

  it('filters to an emperor bound package when toggling bound-only mode', () => {
    const emperor = ALL_EMPEROR_DATA_LIST.find((item) => item.emperorCard.civilization === 'CHINA')!;
    const boundCard = emperor.boundGenerals[0] ?? emperor.boundSorceries[0];
    const boundIds = new Set([
      ...emperor.boundGenerals.map((card) => card.id),
      ...emperor.boundSorceries.map((card) => card.id),
    ]);
    const nonBoundChinaCard = CHINA_ALL_CARDS.find(
      (card) => card.type !== 'EMPEROR' && !boundIds.has(card.id),
    )!;

    render(<CollectionPage />);

    fireEvent.click(screen.getByRole('button', { name: emperor.emperorCard.name }));
    fireEvent.click(screen.getByRole('button', { name: /只看绑定/ }));

    expect(screen.getByText(boundCard.name)).toBeTruthy();
    expect(screen.queryByText(nonBoundChinaCard.name)).toBeNull();
  });

  it('returns to the lobby when clicking the back button', () => {
    render(<CollectionPage />);

    fireEvent.click(screen.getByRole('button', { name: /返回大厅/ }));

    expect(useGameStore.getState().uiPhase).toBe('lobby');
  });
});