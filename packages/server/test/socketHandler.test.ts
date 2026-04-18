import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cleanupSessionMappings, registerSocketHandlers } from '../src/socketHandler.js';
import type { GameSession } from '../src/gameManager.js';
import type { GameState, Player } from '@king-card/shared';

function makePlayer(id: string, civilization: Player['civilization']): Player {
  return {
    id,
    name: id,
    civilization,
    hero: {
      health: 30,
      maxHealth: 30,
      armor: 0,
      heroSkill: {
        name: 'Skill',
        description: '',
        cost: 0,
        cooldown: 0,
        effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} },
      },
      skillUsedThisTurn: false,
      skillCooldownRemaining: 0,
    },
    hand: [],
    handLimit: 10,
    deck: [],
    graveyard: [],
    battlefield: [],
    activeStratagems: [],
    costModifiers: [],
    costReduction: 0,
    energyCrystal: 0,
    maxEnergy: 0,
    cannotDrawNextTurn: false,
    ministerPool: [],
    activeMinisterIndex: -1,
    boundCards: [],
  };
}

function makeState(currentPlayerIndex: 0 | 1): GameState {
  return {
    players: [makePlayer('p0', 'CHINA'), makePlayer('p1', 'JAPAN')],
    currentPlayerIndex,
    turnNumber: 1,
    phase: 'MAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
  };
}

function createSocket(id: string) {
  const handlers = new Map<string, (...args: any[]) => void>();
  return {
    id,
    emit: vi.fn(),
    join: vi.fn(),
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      handlers.set(event, handler);
    }),
    trigger(event: string, payload?: unknown) {
      const handler = handlers.get(event);
      if (!handler) {
        throw new Error(`Missing handler for ${event}`);
      }
      return handler(payload);
    },
  };
}

function setupSocketHandlerTest(currentPlayerIndex: 0 | 1 = 1) {
  const state = makeState(currentPlayerIndex);
  const engine = {
    getGameState: vi.fn(() => state),
    getValidActions: vi.fn(() => []),
    playCard: vi.fn(),
    attack: vi.fn(),
    endTurn: vi.fn(),
    useHeroSkill: vi.fn(),
    useMinisterSkill: vi.fn(),
    switchMinister: vi.fn(),
    useGeneralSkill: vi.fn(),
    onEvent: vi.fn(),
  };

  const session: GameSession = {
    id: 'game-1',
    engine: engine as unknown as GameSession['engine'],
    players: ['socket-1', null],
    state: 'playing',
    mode: 'pve',
    playerEmperorIndices: [0, 1],
  };

  const createGame = vi.fn().mockReturnValue(session);
  const getGame = vi.fn((gameId: string) => (gameId === session.id ? session : undefined));
  const setPlayerSocket = vi.fn();
  const gameManager = { createGame, getGame, setPlayerSocket };

  const ioEmits: Array<{ room: string; event: string; payload: unknown }> = [];
  let connectionHandler: ((socket: ReturnType<typeof createSocket>) => void) | undefined;
  const io = {
    on: vi.fn((event: string, handler: (socket: ReturnType<typeof createSocket>) => void) => {
      if (event === 'connection') {
        connectionHandler = handler;
      }
    }),
    to: vi.fn((room: string) => ({
      emit: (event: string, payload: unknown) => {
        ioEmits.push({ room, event, payload });
      },
    })),
  };

  registerSocketHandlers(io as any, gameManager as any);

  const socket = createSocket('socket-1');
  connectionHandler?.(socket);
  socket.trigger('game:join', { emperorIndex: 0 });

  return { engine, ioEmits, socket };
}

describe('registerSocketHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects actions from a non-current player before calling the engine', () => {
    const { engine, ioEmits, socket } = setupSocketHandlerTest();
    socket.trigger('game:playCard', { handIndex: 0 });

    expect(engine.playCard).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith('game:error', {
      code: 'NOT_YOUR_TURN',
      message: 'It is not your turn',
    });
    expect(ioEmits.some((entry) => entry.event === 'game:state')).toBe(true);
  });

  it('rejects attack from a non-current player before calling the engine', () => {
    const { engine, socket } = setupSocketHandlerTest();

    socket.trigger('game:attack', {
      attackerInstanceId: 'attacker_1',
      targetInstanceId: 'HERO',
    });

    expect(engine.attack).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith('game:error', {
      code: 'NOT_YOUR_TURN',
      message: 'It is not your turn',
    });
  });

  it('rejects endTurn from a non-current player before calling the engine', () => {
    const { engine, socket } = setupSocketHandlerTest();

    socket.trigger('game:endTurn');

    expect(engine.endTurn).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith('game:error', {
      code: 'NOT_YOUR_TURN',
      message: 'It is not your turn',
    });
  });
});

describe('cleanupSessionMappings', () => {
  it('removes both players socketIds from the mapping for a session', () => {
    const mapping = new Map<string, { gameId: string; playerIndex: 0 | 1 }>();
    mapping.set('s-A', { gameId: 'game-1', playerIndex: 0 });
    mapping.set('s-B', { gameId: 'game-1', playerIndex: 1 });
    mapping.set('s-C', { gameId: 'game-2', playerIndex: 0 });

    cleanupSessionMappings(mapping, 'game-1');

    expect(mapping.has('s-A')).toBe(false);
    expect(mapping.has('s-B')).toBe(false);
    expect(mapping.has('s-C')).toBe(true);
  });
});

describe('game:pvpJoin idempotency cleans up orphan waiting sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('repeated pvpJoin from same socket destroys the previous waiting session', () => {
    let nextId = 0;
    const sessions = new Map<string, GameSession>();
    const createPvpWaiting = vi.fn((emperorIndex: number) => {
      const id = `waiting-${nextId++}`;
      const session: GameSession = {
        id,
        engine: null,
        players: [null, null],
        state: 'waiting',
        mode: 'pvp',
        playerEmperorIndices: [emperorIndex, -1],
        playerDeckDefinitions: [null, null],
      };
      sessions.set(id, session);
      return session;
    });

    const findWaitingPvpGame = vi.fn(() => undefined);
    const setPlayerSocket = vi.fn((gameId: string, playerIndex: 0 | 1, socketId: string) => {
      const s = sessions.get(gameId);
      if (s) s.players[playerIndex] = socketId;
    });
    const getGame = vi.fn((id: string) => sessions.get(id));
    const destroyGame = vi.fn((id: string) => {
      sessions.delete(id);
    });
    const getWaitingSessionsForSocket = vi.fn((socketId: string) =>
      Array.from(sessions.values()).filter(
        (s) => s.mode === 'pvp' && s.state === 'waiting' && s.players[0] === socketId && !s.players[1],
      ),
    );

    const gameManager = {
      createPvpWaiting,
      findWaitingPvpGame,
      setPlayerSocket,
      getGame,
      destroyGame,
      getWaitingSessionsForSocket,
      // Unused stubs to satisfy interface usage
      createGame: vi.fn(),
    };

    let connectionHandler: ((socket: ReturnType<typeof createSocket>) => void) | undefined;
    const io = {
      on: vi.fn((event: string, handler: (s: ReturnType<typeof createSocket>) => void) => {
        if (event === 'connection') connectionHandler = handler;
      }),
      to: vi.fn(() => ({ emit: vi.fn() })),
    };

    registerSocketHandlers(io as any, gameManager as any);
    const socket = createSocket('socket-A');
    socket.leave = vi.fn();
    connectionHandler?.(socket as any);

    socket.trigger('game:pvpJoin', { emperorIndex: 0 });
    socket.trigger('game:pvpJoin', { emperorIndex: 0 });

    // After the second call, only one waiting session for socket-A should remain.
    const remaining = Array.from(sessions.values()).filter(
      (s) => s.players[0] === 'socket-A',
    );
    expect(remaining).toHaveLength(1);
    expect(destroyGame).toHaveBeenCalledTimes(1);
  });
});
