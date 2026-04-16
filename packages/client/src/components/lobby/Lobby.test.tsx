import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Lobby from './Lobby.js';
import { useGameStore } from '../../stores/gameStore.js';

const initialState = useGameStore.getState();

describe('Lobby', () => {
  const connect = vi.fn();

  beforeEach(() => {
    connect.mockReset();
    useGameStore.setState({
      ...initialState,
      connect,
      uiPhase: 'lobby',
    });
  });

  afterEach(() => {
    cleanup();
    useGameStore.setState(initialState, true);
  });

  it('opens the collection page without connecting to the game server', () => {
    render(<Lobby />);

    fireEvent.click(screen.getByRole('button', { name: /卡牌收藏/ }));

    expect(connect).not.toHaveBeenCalled();
    expect(useGameStore.getState().uiPhase).toBe('collection');
  });
});