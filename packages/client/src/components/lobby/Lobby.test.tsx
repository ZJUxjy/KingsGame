import { ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Lobby from './Lobby.js';
import { useDeckStore } from '../../stores/deckStore.js';
import { useGameStore } from '../../stores/gameStore.js';

const initialGameState = useGameStore.getState();
const initialDeckState = useDeckStore.getState();

describe('Lobby', () => {
  const connect = vi.fn();

  beforeEach(() => {
    connect.mockReset();
    useGameStore.setState({
      ...initialGameState,
      connect,
      uiPhase: 'lobby',
    });
    useDeckStore.setState({
      ...initialDeckState,
      decksByEmperorId: {},
      editingEmperorCardId: null,
    });
  });

  afterEach(() => {
    cleanup();
    useGameStore.setState(initialGameState, true);
    useDeckStore.setState(initialDeckState, true);
  });

  it('opens the collection page without connecting to the game server', () => {
    render(<Lobby />);

    fireEvent.click(screen.getByRole('button', { name: /卡牌收藏/ }));

    expect(connect).not.toHaveBeenCalled();
    expect(useGameStore.getState().uiPhase).toBe('collection');
  });

  it('opens the deck builder with a deterministic editing emperor selection', () => {
    render(<Lobby />);

    fireEvent.click(screen.getByRole('button', { name: /套牌构筑/ }));

    expect(useGameStore.getState().uiPhase).toBe('deck-builder');
    expect(useDeckStore.getState().editingEmperorCardId).toBe(
      ALL_EMPEROR_DATA_LIST[0]!.emperorCard.id,
    );
  });
});