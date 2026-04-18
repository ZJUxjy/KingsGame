import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ALL_CARDS, ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import {
  GAME_CONSTANTS,
  getDeckCopyLimit,
  getEditableDeckSize,
  type DeckDefinition,
  type EmperorData,
} from '@king-card/shared';
import { registerSocketHandlers } from '../src/socketHandler.js';
import type { GameSession } from '../src/gameManager.js';

function makeCustomDeckDefinition(emperorData: EmperorData): DeckDefinition {
  const excludedCardIds = new Set([
    ...emperorData.boundGenerals.map((card) => card.id),
    ...emperorData.boundSorceries.map((card) => card.id),
  ]);
  const editableDeckSize = getEditableDeckSize(emperorData);
  const pool = ALL_CARDS.filter(
    (card) =>
      (card.civilization === emperorData.emperorCard.civilization || card.civilization === 'NEUTRAL')
      && !excludedCardIds.has(card.id),
  );
  const orderedPool = [
    ...pool.filter((card) => card.type === 'MINION' || card.type === 'STRATAGEM'),
    ...pool.filter((card) => card.type === 'GENERAL'),
    ...pool.filter((card) => card.type === 'SORCERY'),
    ...pool.filter((card) => card.type === 'EMPEROR'),
  ];
  const mainCardIds: string[] = [];
  const copyCounts = new Map<string, number>();
  let generalCount = 0;
  let sorceryCount = 0;
  let emperorCount = 1;

  for (const card of orderedPool) {
    const remainingTypeLimit =
      card.type === 'GENERAL'
        ? GAME_CONSTANTS.GENERAL_DECK_LIMIT - generalCount
        : card.type === 'SORCERY'
          ? GAME_CONSTANTS.SORCERY_DECK_LIMIT - sorceryCount
          : card.type === 'EMPEROR'
            ? GAME_CONSTANTS.EMPEROR_SOFT_LIMIT - emperorCount
            : getDeckCopyLimit(card);
    const allowedCopies = Math.min(getDeckCopyLimit(card), Math.max(remainingTypeLimit, 0));

    for (let count = copyCounts.get(card.id) ?? 0; count < allowedCopies && mainCardIds.length < editableDeckSize; count++) {
      mainCardIds.push(card.id);
      copyCounts.set(card.id, count + 1);

      if (card.type === 'GENERAL') {
        generalCount += 1;
      } else if (card.type === 'SORCERY') {
        sorceryCount += 1;
      } else if (card.type === 'EMPEROR') {
        emperorCount += 1;
      }
    }

    if (mainCardIds.length === editableDeckSize) {
      break;
    }
  }

  return {
    id: `${emperorData.emperorCard.id}-custom`,
    name: `${emperorData.emperorCard.name} 自定义套牌`,
    civilization: emperorData.emperorCard.civilization,
    emperorCardId: emperorData.emperorCard.id,
    mainCardIds: mainCardIds.reverse(),
  };
}

function createSocket(id: string) {
  const handlers = new Map<string, (...args: any[]) => void>();
  return {
    id,
    emit: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      handlers.set(event, handler);
    }),
    off: vi.fn(),
    trigger(event: string, payload?: unknown) {
      const handler = handlers.get(event);
      if (!handler) throw new Error(`Missing handler for ${event}`);
      return handler(payload);
    },
  };
}

describe('PvP socket flow', () => {
  let connectionHandler: ((socket: ReturnType<typeof createSocket>) => void) | undefined;
  let ioEmits: Array<{ room: string; event: string; payload: unknown }>;
  let sessions: Map<string, GameSession>;
  let gameManager: any;
  let io: any;

  beforeEach(() => {
    vi.clearAllMocks();
    sessions = new Map();
    ioEmits = [];

    gameManager = {
      createGame: vi.fn(),
      createPvpWaiting: vi.fn((emperorIndex: number, deck?: DeckDefinition) => {
        const session: GameSession = {
          id: `pvp-${sessions.size}`,
          engine: null as any,
          players: [null, null],
          state: 'waiting',
          mode: 'pvp',
          playerEmperorIndices: [emperorIndex, -1],
          playerDeckDefinitions: [deck ?? null, null],
        };
        sessions.set(session.id, session);
        return session;
      }),
      findWaitingPvpGame: vi.fn((callerSocketId?: string) => {
        for (const s of sessions.values()) {
          if (
            s.mode === 'pvp' && s.state === 'waiting' &&
            s.players[0] && !s.players[1] &&
            s.players[0] !== callerSocketId
          ) {
            return s;
          }
        }
        return undefined;
      }),
      initializePvpEngine: vi.fn((session: GameSession) => {
        session.engine = {
          getGameState: vi.fn(() => ({
            players: [
              { id: 'p0', name: 'P0', hand: [], battlefield: [], deck: [], graveyard: [], activeStratagems: [], costModifiers: [], costReduction: 0, ministerPool: [], boundCards: [], civilization: 'CHINA', hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: null, skillUsedThisTurn: false, skillCooldownRemaining: 0 }, energyCrystal: 1, maxEnergy: 1, handLimit: 10, deckCount: 25, activeMinisterIndex: 0, cannotDrawNextTurn: false },
              { id: 'p1', name: 'P1', hand: [], battlefield: [], deck: [], graveyard: [], activeStratagems: [], costModifiers: [], costReduction: 0, ministerPool: [], boundCards: [], civilization: 'CHINA', hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: null, skillUsedThisTurn: false, skillCooldownRemaining: 0 }, energyCrystal: 1, maxEnergy: 1, handLimit: 10, deckCount: 25, activeMinisterIndex: 0, cannotDrawNextTurn: false },
            ],
            currentPlayerIndex: 0,
            turnNumber: 1,
            phase: 'MAIN',
            isGameOver: false,
            winnerIndex: null,
            winReason: null,
          })),
          getValidActions: vi.fn(() => []),
          onEvent: vi.fn(),
        } as any;
      }),
      getGame: vi.fn((id: string) => sessions.get(id)),
      setPlayerSocket: vi.fn((gameId: string, playerIndex: 0 | 1, socketId: string) => {
        const s = sessions.get(gameId);
        if (s) s.players[playerIndex] = socketId;
      }),
      destroyGame: vi.fn(),
      getAllGames: vi.fn(() => Array.from(sessions.values())),
      getWaitingSessionsForSocket: vi.fn((socketId: string) =>
        Array.from(sessions.values()).filter(
          (s) =>
            s.mode === 'pvp' &&
            s.state === 'waiting' &&
            s.players[0] === socketId &&
            !s.players[1],
        ),
      ),
    };

    io = {
      on: vi.fn((event: string, handler: (socket: ReturnType<typeof createSocket>) => void) => {
        if (event === 'connection') connectionHandler = handler;
      }),
      to: vi.fn((room: string) => ({
        emit: (event: string, payload: unknown) => {
          ioEmits.push({ room, event, payload });
        },
      })),
    };

    registerSocketHandlers(io, gameManager);
  });

  function connectSocket(id: string) {
    const socket = createSocket(id);
    connectionHandler?.(socket);
    return socket;
  }

  it('first PvP player creates a waiting room and receives game:pvpWaiting', () => {
    const socket1 = connectSocket('s1');
    const deck = makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[3]);
    socket1.trigger('game:pvpJoin', { emperorIndex: 3, deck });

    expect(gameManager.createPvpWaiting).toHaveBeenCalledWith(3, deck);
    expect(socket1.emit).toHaveBeenCalledWith('game:pvpWaiting', expect.objectContaining({ gameId: expect.any(String) }));
  });

  it('second PvP player joins the waiting room and both receive game events', () => {
    const socket1 = connectSocket('s1');
    const player0Deck = makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[3]);
    socket1.trigger('game:pvpJoin', { emperorIndex: 3, deck: player0Deck });

    const socket2 = connectSocket('s2');
    const player1Deck = makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[6]);
    socket2.trigger('game:pvpJoin', { emperorIndex: 6, deck: player1Deck });

    // Player 2 receives game:joined
    expect(socket2.emit).toHaveBeenCalledWith('game:joined', expect.objectContaining({
      playerIndex: 1,
    }));

    const session = Array.from(sessions.values())[0] as GameSession & {
      playerDeckDefinitions?: [DeckDefinition | null, DeckDefinition | null];
    };
    expect(session.playerDeckDefinitions).toEqual([player0Deck, player1Deck]);

    // Player 1 receives game:joined via io.to
    const joinedEmit = ioEmits.find(e => e.event === 'game:joined');
    expect(joinedEmit).toBeDefined();
    expect(joinedEmit!.room).toBe('s1');

    // Engine was initialized
    expect(gameManager.initializePvpEngine).toHaveBeenCalled();
  });

  it('PvP game state is broadcast to both players after match', () => {
    const socket1 = connectSocket('s1');
    socket1.trigger('game:pvpJoin', { emperorIndex: 3, deck: makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[3]) });

    const socket2 = connectSocket('s2');
    socket2.trigger('game:pvpJoin', { emperorIndex: 6, deck: makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[6]) });

    // game:state should be broadcast to the room
    const stateEmits = ioEmits.filter(e => e.event === 'game:state');
    expect(stateEmits.length).toBeGreaterThan(0);
  });

  it('disconnect during PvP waiting cleans up and marks session finished', () => {
    const socket1 = connectSocket('s1');
    socket1.trigger('game:pvpJoin', { emperorIndex: 3, deck: makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[3]) });

    // Simulate disconnect
    socket1.trigger('disconnect');

    const session = Array.from(sessions.values())[0];
    expect(session.state).toBe('finished');
  });

  it('disconnect during active PvP game notifies opponent with game:over', () => {
    const socket1 = connectSocket('s1');
    socket1.trigger('game:pvpJoin', { emperorIndex: 3, deck: makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[3]) });

    const socket2 = connectSocket('s2');
    socket2.trigger('game:pvpJoin', { emperorIndex: 6, deck: makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[6]) });

    // Player 1 disconnects
    socket1.trigger('disconnect');

    const gameOverEmit = ioEmits.find(e => e.event === 'game:over' && e.room === 's2');
    expect(gameOverEmit).toBeDefined();
    expect(gameOverEmit!.payload).toMatchObject({
      winnerIndex: 1,
    });
  });

  it('game:pvpCancel cleans up waiting room and destroys session', () => {
    const socket1 = connectSocket('s1');
    socket1.trigger('game:pvpJoin', { emperorIndex: 3, deck: makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[3]) });

    // Player cancels while waiting
    socket1.trigger('game:pvpCancel');

    expect(gameManager.destroyGame).toHaveBeenCalled();
  });

  it('rejects an invalid PvE custom deck with game:error', () => {
    const socket = connectSocket('pve-player');
    const invalidDeck = {
      ...makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[0]),
      emperorCardId: ALL_EMPEROR_DATA_LIST[1].emperorCard.id,
    };

    socket.trigger('game:join', { emperorIndex: 0, deck: invalidDeck });

    expect(socket.emit).toHaveBeenCalledWith('game:error', expect.objectContaining({
      code: 'INVALID_DECK',
    }));
    expect(gameManager.createGame).not.toHaveBeenCalled();
  });

  it('rejects an invalid PvP custom deck with game:error', () => {
    const socket = connectSocket('pvp-player');
    const invalidDeck = {
      ...makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[0]),
      emperorCardId: ALL_EMPEROR_DATA_LIST[1].emperorCard.id,
    };

    socket.trigger('game:pvpJoin', { emperorIndex: 0, deck: invalidDeck });

    expect(socket.emit).toHaveBeenCalledWith('game:error', expect.objectContaining({
      code: 'INVALID_DECK',
    }));
    expect(gameManager.createPvpWaiting).not.toHaveBeenCalled();
  });

  it('rejects a malformed PvE custom deck payload with INVALID_DECK', () => {
    const socket = connectSocket('pve-bad-payload');

    socket.trigger('game:join', {
      emperorIndex: 0,
      deck: {
        id: 'bad-deck',
        name: 'Malformed Deck',
        emperorCardId: ALL_EMPEROR_DATA_LIST[0].emperorCard.id,
        mainCardIds: null,
      },
    });

    expect(socket.emit).toHaveBeenCalledWith('game:error', {
      code: 'INVALID_DECK',
      message: 'Custom deck payload is malformed.',
    });
    expect(gameManager.createGame).not.toHaveBeenCalled();
  });

  it('rejects a malformed PvP custom deck payload with INVALID_DECK', () => {
    const socket = connectSocket('pvp-bad-payload');

    socket.trigger('game:pvpJoin', {
      emperorIndex: 0,
      deck: {
        id: 'bad-deck',
        name: 'Malformed Deck',
        civilization: ALL_EMPEROR_DATA_LIST[0].emperorCard.civilization,
        emperorCardId: ALL_EMPEROR_DATA_LIST[0].emperorCard.id,
        mainCardIds: [42],
      },
    });

    expect(socket.emit).toHaveBeenCalledWith('game:error', {
      code: 'INVALID_DECK',
      message: 'Custom deck payload is malformed.',
    });
    expect(gameManager.createPvpWaiting).not.toHaveBeenCalled();
  });
});
