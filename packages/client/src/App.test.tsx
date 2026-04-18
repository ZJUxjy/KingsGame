import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App.js';
import { useGameStore } from './stores/gameStore.js';
import { useLocaleStore } from './stores/localeStore.js';

const initialGameState = useGameStore.getState();
const initialLocaleState = useLocaleStore.getState();

describe('GameOver screen — Play Again vs Back To Main Menu', () => {
  beforeEach(() => {
    useGameStore.setState({
      ...initialGameState,
      gameState: {
        isGameOver: true,
        winnerIndex: 0,
        winReason: 'HERO_KILLED',
      } as never,
      playerIndex: 0,
      uiPhase: 'game-over',
      lastEmperorIndex: 2,
      lastDeckDefinition: null,
    });
    useLocaleStore.setState({ ...initialLocaleState, locale: 'zh-CN' });
  });

  afterEach(() => {
    cleanup();
    useGameStore.setState(initialGameState, true);
    useLocaleStore.setState(initialLocaleState, true);
  });

  it('Play Again calls restartGame, Back To Main Menu calls backToMainMenu', () => {
    const restartGame = vi.fn();
    const backToMainMenu = vi.fn();
    useGameStore.setState({ restartGame, backToMainMenu });

    render(<App />);

    fireEvent.click(screen.getByText(/再来一局|Play Again/));
    expect(restartGame).toHaveBeenCalledTimes(1);
    expect(backToMainMenu).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(/返回主菜单|Back To Main Menu/));
    expect(backToMainMenu).toHaveBeenCalledTimes(1);
    expect(restartGame).toHaveBeenCalledTimes(1);
  });
});
