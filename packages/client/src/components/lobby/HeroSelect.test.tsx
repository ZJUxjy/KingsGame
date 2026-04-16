import { ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HeroSelect from './HeroSelect.js';
import { useGameStore } from '../../stores/gameStore.js';

const initialState = useGameStore.getState();
const lincolnIndex = ALL_EMPEROR_DATA_LIST.findIndex(
  (emperorData) => emperorData.emperorCard.id === 'usa_lincoln',
);

describe('HeroSelect', () => {
  const joinGame = vi.fn();
  const joinPvp = vi.fn();

  beforeEach(() => {
    joinGame.mockReset();
    joinPvp.mockReset();
    useGameStore.setState({
      ...initialState,
      connected: true,
      error: null,
      gameMode: 'pve',
      joinGame,
      joinPvp,
    });
  });

  afterEach(() => {
    cleanup();
    useGameStore.setState(initialState, true);
  });

  it('shows all civilizations and reveals emperors only for the selected civilization', () => {
    render(<HeroSelect />);

    expect(screen.getByRole('button', { name: /华夏/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /大和/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /美利坚/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /亚伯拉罕·林肯/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /美利坚/ }));

    expect(screen.getByRole('button', { name: /亚伯拉罕·林肯/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /秦始皇/ })).toBeNull();
  });

  it('starts a pve game with the selected emperor index from the global emperor list', () => {
    render(<HeroSelect />);

    fireEvent.click(screen.getByRole('button', { name: /美利坚/ }));
    fireEvent.click(screen.getByRole('button', { name: /亚伯拉罕·林肯/ }));
    fireEvent.click(screen.getByRole('button', { name: '开始对战' }));

    expect(joinGame).toHaveBeenCalledWith(lincolnIndex);
    expect(joinPvp).not.toHaveBeenCalled();
  });

  it('starts pvp matching with the selected emperor index', () => {
    useGameStore.setState({ gameMode: 'pvp', joinGame, joinPvp });

    render(<HeroSelect />);

    fireEvent.click(screen.getByRole('button', { name: /普鲁士/ }));
    fireEvent.click(screen.getByRole('button', { name: /腓特烈大帝/ }));
    fireEvent.click(screen.getByRole('button', { name: '匹配对手' }));

    expect(joinPvp).toHaveBeenCalledWith(ALL_EMPEROR_DATA_LIST.length - 1);
    expect(joinGame).not.toHaveBeenCalled();
  });

  it('preserves connection feedback and disables the start button while disconnected', () => {
    useGameStore.setState({ connected: false, error: null, joinGame, joinPvp });

    render(<HeroSelect />);

    fireEvent.click(screen.getByRole('button', { name: /华夏/ }));
    fireEvent.click(screen.getByRole('button', { name: /秦始皇/ }));

    expect(screen.getByText('正在连接服务器...')).toBeTruthy();
    expect(screen.getByRole('button', { name: '开始对战' }).hasAttribute('disabled')).toBe(true);
  });
});