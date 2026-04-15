import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerSocketHandlers } from '../src/socketHandler.js';
import type { GameSession } from '../src/gameManager.js';

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
      createPvpWaiting: vi.fn((emperorIndex: number) => {
        const session: GameSession = {
          id: `pvp-${sessions.size}`,
          engine: null as any,
          players: [null, null],
          state: 'waiting',
          mode: 'pvp',
          playerEmperorIndices: [emperorIndex, -1],
        };
        sessions.set(session.id, session);
        return session;
      }),
      findWaitingPvpGame: vi.fn(() => {
        for (const s of sessions.values()) {
          if (s.mode === 'pvp' && s.state === 'waiting' && s.players[0] && !s.players[1]) {
            return s;
          }
        }
        return undefined;
      }),
      initializePvpEngine: vi.fn((session: GameSession) => {
        session.engine = {
          getGameState: vi.fn(() => ({
            players: [
              { id: 'p0', name: 'P0', hand: [], battlefield: [], deck: [], graveyard: [], activeStratagems: [], costModifiers: [], ministerPool: [], boundCards: [], civilization: 'CHINA', hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: null, skillUsedThisTurn: false, skillCooldownRemaining: 0 }, energyCrystal: 1, maxEnergy: 1, handLimit: 10, deckCount: 25, activeMinisterIndex: 0, cannotDrawNextTurn: false },
              { id: 'p1', name: 'P1', hand: [], battlefield: [], deck: [], graveyard: [], activeStratagems: [], costModifiers: [], ministerPool: [], boundCards: [], civilization: 'CHINA', hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: null, skillUsedThisTurn: false, skillCooldownRemaining: 0 }, energyCrystal: 1, maxEnergy: 1, handLimit: 10, deckCount: 25, activeMinisterIndex: 0, cannotDrawNextTurn: false },
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
    socket1.trigger('game:pvpJoin', { emperorIndex: 0 });

    expect(gameManager.createPvpWaiting).toHaveBeenCalledWith(0);
    expect(socket1.emit).toHaveBeenCalledWith('game:pvpWaiting', expect.objectContaining({ gameId: expect.any(String) }));
  });

  it('second PvP player joins the waiting room and both receive game events', () => {
    const socket1 = connectSocket('s1');
    socket1.trigger('game:pvpJoin', { emperorIndex: 0 });

    const socket2 = connectSocket('s2');
    socket2.trigger('game:pvpJoin', { emperorIndex: 2 });

    // Player 2 receives game:joined
    expect(socket2.emit).toHaveBeenCalledWith('game:joined', expect.objectContaining({
      playerIndex: 1,
    }));

    // Player 1 receives game:joined via io.to
    const joinedEmit = ioEmits.find(e => e.event === 'game:joined');
    expect(joinedEmit).toBeDefined();
    expect(joinedEmit!.room).toBe('s1');

    // Engine was initialized
    expect(gameManager.initializePvpEngine).toHaveBeenCalled();
  });

  it('PvP game state is broadcast to both players after match', () => {
    const socket1 = connectSocket('s1');
    socket1.trigger('game:pvpJoin', { emperorIndex: 0 });

    const socket2 = connectSocket('s2');
    socket2.trigger('game:pvpJoin', { emperorIndex: 1 });

    // game:state should be broadcast to the room
    const stateEmits = ioEmits.filter(e => e.event === 'game:state');
    expect(stateEmits.length).toBeGreaterThan(0);
  });

  it('disconnect during PvP waiting cleans up and marks session finished', () => {
    const socket1 = connectSocket('s1');
    socket1.trigger('game:pvpJoin', { emperorIndex: 0 });

    // Simulate disconnect
    socket1.trigger('disconnect');

    const session = Array.from(sessions.values())[0];
    expect(session.state).toBe('finished');
  });

  it('disconnect during active PvP game notifies opponent with game:over', () => {
    const socket1 = connectSocket('s1');
    socket1.trigger('game:pvpJoin', { emperorIndex: 0 });

    const socket2 = connectSocket('s2');
    socket2.trigger('game:pvpJoin', { emperorIndex: 1 });

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
    socket1.trigger('game:pvpJoin', { emperorIndex: 0 });

    // Player cancels while waiting
    socket1.trigger('game:pvpCancel');

    expect(gameManager.destroyGame).toHaveBeenCalled();
  });
});
