import { GameEngine, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import type { DeckDefinition } from '@king-card/shared';
import { buildDeck, getRandomAiEmperorIndex, materializeDeckForEmperor } from './deckBuilder.js';

export interface GameSession {
  id: string;
  engine: GameEngine | null;
  players: [string | null, string | null];
  state: 'waiting' | 'playing' | 'finished';
  mode: 'pve' | 'pvp';
  playerEmperorIndices: [number, number];
  playerDeckDefinitions?: [DeckDefinition | null, DeckDefinition | null];
}

export class GameManager {
  private games: Map<string, GameSession> = new Map();

  createGame(
    mode: 'pve' | 'pvp',
    playerEmperorIndex: number,
    playerDeckDefinition?: DeckDefinition,
  ): GameSession {
    const id = crypto.randomUUID();

    const emperor1 = ALL_EMPEROR_DATA_LIST[playerEmperorIndex];
    const emperor2Index = mode === 'pve' ? getRandomAiEmperorIndex() : 0;
    const emperor2 = ALL_EMPEROR_DATA_LIST[emperor2Index];

    const deck1 = playerDeckDefinition
      ? materializeDeckForEmperor(playerDeckDefinition, emperor1)
      : buildDeck(emperor1);
    const deck2 = buildDeck(emperor2);

    const engine = GameEngine.create(deck1, deck2, emperor1, emperor2);

    const session: GameSession = {
      id,
      engine,
      players: [null, null],
      state: 'waiting',
      mode,
      playerEmperorIndices: [playerEmperorIndex, emperor2Index],
      playerDeckDefinitions: [playerDeckDefinition ?? null, null],
    };

    this.games.set(id, session);
    return session;
  }

  /**
   * Create a PvP game with only player 0's emperor chosen.
   * The engine is NOT created yet — it will be initialized when player 2 joins.
   */
  createPvpWaiting(player0EmperorIndex: number, player0DeckDefinition?: DeckDefinition): GameSession {
    const id = crypto.randomUUID();

    const session: GameSession = {
      id,
      engine: null,
      players: [null, null],
      state: 'waiting',
      mode: 'pvp',
      playerEmperorIndices: [player0EmperorIndex, -1],
      playerDeckDefinitions: [player0DeckDefinition ?? null, null],
    };

    this.games.set(id, session);
    return session;
  }

  /**
   * Find a PvP game that is waiting for a second player.
   */
  findWaitingPvpGame(callerSocketId?: string): GameSession | undefined {
    for (const session of this.games.values()) {
      if (
        session.mode === 'pvp' &&
        session.state === 'waiting' &&
        session.players[0] &&
        !session.players[1] &&
        session.players[0] !== callerSocketId
      ) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Initialize the engine for a PvP game once both emperor indices are known.
   */
  initializePvpEngine(session: GameSession): void {
    const idx0 = session.playerEmperorIndices[0];
    const idx1 = session.playerEmperorIndices[1];
    if (idx0 < 0 || idx0 >= ALL_EMPEROR_DATA_LIST.length ||
        idx1 < 0 || idx1 >= ALL_EMPEROR_DATA_LIST.length) {
      throw new Error(`Invalid emperor index: [${idx0}, ${idx1}]`);
    }
    const emperor1 = ALL_EMPEROR_DATA_LIST[idx0];
    const emperor2 = ALL_EMPEROR_DATA_LIST[idx1];
    const deck1 = session.playerDeckDefinitions?.[0]
      ? materializeDeckForEmperor(session.playerDeckDefinitions[0], emperor1)
      : buildDeck(emperor1);
    const deck2 = session.playerDeckDefinitions?.[1]
      ? materializeDeckForEmperor(session.playerDeckDefinitions[1], emperor2)
      : buildDeck(emperor2);
    session.engine = GameEngine.create(deck1, deck2, emperor1, emperor2);
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

  /**
   * Find all sessions where the given socketId is player 0 and the
   * session is still waiting (no opponent yet). Used to clean up
   * orphan waiting sessions when a player retries pvpJoin without
   * cancelling the previous waiting room.
   */
  getWaitingSessionsForSocket(socketId: string): GameSession[] {
    return Array.from(this.games.values()).filter(
      (s) =>
        s.mode === 'pvp' &&
        s.state === 'waiting' &&
        s.players[0] === socketId &&
        !s.players[1],
    );
  }
}
