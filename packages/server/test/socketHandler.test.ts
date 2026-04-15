import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerSocketHandlers } from '../src/socketHandler.js';
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