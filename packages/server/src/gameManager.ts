import { GameEngine, CHINA_EMPEROR_DATA_LIST } from '@king-card/core';
import { buildDeck, AI_DECK_EMPEROR_INDEX } from './deckBuilder.js';

export interface GameSession {
  id: string;
  engine: GameEngine;
  players: [string | null, string | null];
  state: 'waiting' | 'playing' | 'finished';
  mode: 'pve' | 'pvp';
  playerEmperorIndices: [number, number];
}

export class GameManager {
  private games: Map<string, GameSession> = new Map();

  createGame(mode: 'pve' | 'pvp', playerEmperorIndex: number): GameSession {
    const id = crypto.randomUUID();

    const emperor1 = CHINA_EMPEROR_DATA_LIST[playerEmperorIndex];
    const emperor2Index = mode === 'pve' ? AI_DECK_EMPEROR_INDEX : 0;
    const emperor2 = CHINA_EMPEROR_DATA_LIST[emperor2Index];

    const deck1 = buildDeck(emperor1);
    const deck2 = buildDeck(emperor2);

    const engine = GameEngine.create(deck1, deck2, emperor1, emperor2);

    const session: GameSession = {
      id,
      engine,
      players: [null, null],
      state: 'waiting',
      mode,
      playerEmperorIndices: [playerEmperorIndex, emperor2Index],
    };

    this.games.set(id, session);
    return session;
  }

  getGame(gameId: string): GameSession | undefined {
    return this.games.get(gameId);
  }

  destroyGame(gameId: string): void {
    this.games.delete(gameId);
  }

  setPlayerSocket(gameId: string, playerIndex: 0 | 1, socketId: string): void {
    const session = this.games.get(gameId);
    if (session) {
      session.players[playerIndex] = socketId;
    }
  }

  getAllGames(): GameSession[] {
    return Array.from(this.games.values());
  }
}
