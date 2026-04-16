import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PvpWaiting from './PvpWaiting.js';
import { useGameStore } from '../../stores/gameStore.js';

const initialState = useGameStore.getState();

const { emit, disconnect, getSocket } = vi.hoisted(() => ({
  emit: vi.fn(),
  disconnect: vi.fn(),
  getSocket: vi.fn(() => ({ emit })),
}));

vi.mock('../../services/socketService.js', () => ({
  socketService: {
    getSocket,
    disconnect,
  },
}));

describe('PvpWaiting', () => {
  beforeEach(() => {
    emit.mockReset();
    disconnect.mockReset();
    getSocket.mockClear();
    useGameStore.setState({
      ...initialState,
      connected: true,
      uiPhase: 'pvp-waiting',
      gameMode: 'pvp',
    });
  });

  afterEach(() => {
    cleanup();
    useGameStore.setState(initialState, true);
  });

  it('returns to the main menu and cancels matchmaking', () => {
    render(<PvpWaiting />);

    fireEvent.click(screen.getByRole('button', { name: '返回主菜单' }));

    expect(getSocket).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('game:pvpCancel');
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(useGameStore.getState().uiPhase).toBe('lobby');
    expect(useGameStore.getState().connected).toBe(false);
    expect(useGameStore.getState().gameMode).toBe('pve');
  });
});