import type { Card, GameState, EmperorData } from '@king-card/shared';
import { createPlayer } from './player.js';

export function createGameState(
  deck1: Card[],
  deck2: Card[],
  emperor1: EmperorData,
  emperor2: EmperorData,
): GameState {
  const player1 = createPlayer(0, 'player_1', 'Player 1', emperor1.emperorCard.civilization, deck1, emperor1);
  const player2 = createPlayer(1, 'player_2', 'Player 2', emperor2.emperorCard.civilization, deck2, emperor2);

  return {
    players: [player1, player2],
    currentPlayerIndex: 0,
    turnNumber: 0,
    phase: 'ENERGY_GAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
  };
}
