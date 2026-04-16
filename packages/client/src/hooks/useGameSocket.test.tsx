import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SerializedGameState, ValidAction } from '../stores/gameStore.js';
import type { HeroSkill, HeroState } from '@king-card/shared';
import { useGameStore } from '../stores/gameStore.js';

type SocketListener = (...args: unknown[]) => void;

const stubHeroSkill: HeroSkill = {
  name: '',
  description: '',
  cost: 0,
  cooldown: 0,
  effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} },
};

const stubHeroState: HeroState = {
  health: 30,
  maxHealth: 30,
  armor: 0,
  heroSkill: stubHeroSkill,
  skillUsedThisTurn: false,
  skillCooldownRemaining: 0,
};

function createGameState(
  overrides: Partial<SerializedGameState> = {},
): SerializedGameState {
  return {
    turnNumber: 1,
    currentPlayerIndex: 0,
    phase: 'MAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
    me: {
      id: 'me',
      name: 'Player 1',
      civilization: 'CHINA',
      hero: {
        health: 30,
        maxHealth: 30,
        armor: 0,
        heroSkill: stubHeroSkill,
        skillUsedThisTurn: false,
        skillCooldownRemaining: 0,
      },
      hand: [],
      battlefield: [],
      energyCrystal: 0,
      maxEnergy: 0,
      deckCount: 30,
      activeMinisterIndex: 0,
      ministerPool: [],
      activeStratagems: [],
      cannotDrawNextTurn: false,
      boundCards: [],
      graveyard: [],
    },
    opponent: {
      id: 'opponent',
      name: 'Player 2',
      civilization: 'JAPAN',
      hero: stubHeroState,
      hand: [],
      battlefield: [],
      energyCrystal: 0,
      maxEnergy: 0,
      deckCount: 30,
      activeMinisterIndex: 0,
      ministerPool: [],
      activeStratagems: [],
      cannotDrawNextTurn: false,
      boundCards: [],
      graveyard: [],
    },
    ...overrides,
  };
}

function getListener(event: string): SocketListener {
  const listener = listeners.get(event);

  expect(listener).toBeTypeOf('function');

  return listener as SocketListener;
}

const { listeners, mockSocket, mockSocketService, setSocketAvailable } = vi.hoisted(() => {
  const hoistedListeners = new Map<string, SocketListener>();
  let socketAvailable = false;

  const hoistedMockSocket = {
    on: vi.fn((event: string, listener: SocketListener) => {
      hoistedListeners.set(event, listener);
      return hoistedMockSocket;
    }),
    off: vi.fn((event: string, listener: SocketListener) => {
      if (hoistedListeners.get(event) === listener) {
        hoistedListeners.delete(event);
      }
      return hoistedMockSocket;
    }),
  };

  return {
    listeners: hoistedListeners,
    mockSocket: hoistedMockSocket,
    mockSocketService: {
      connect: vi.fn(() => {
        socketAvailable = true;
        return hoistedMockSocket;
      }),
      isConnected: vi.fn(() => false),
      getSocket: vi.fn(() => {
        if (!socketAvailable) {
          throw new Error('Socket not connected');
        }

        return hoistedMockSocket;
      }),
      disconnect: vi.fn(() => {
        socketAvailable = false;
      }),
    },
    setSocketAvailable: (available: boolean) => {
      socketAvailable = available;
    },
  };
});

vi.mock('../services/socketService.js', () => ({
  socketService: mockSocketService,
}));

import { useGameSocket } from './useGameSocket.js';

describe('useGameSocket', () => {
  beforeEach(() => {
    listeners.clear();
    useGameStore.getState()._reset();
    vi.clearAllMocks();
    setSocketAvailable(false);
    mockSocketService.isConnected.mockReturnValue(false);
  });

  it('registers listeners after the socket is created when the hook mounted before connect and applies listener updates to the store', () => {
    renderHook(() => useGameSocket());

    expect(mockSocketService.getSocket).toHaveBeenCalledTimes(1);
    expect(mockSocket.on).not.toHaveBeenCalled();
    expect(useGameStore.getState().connected).toBe(false);

    act(() => {
      useGameStore.getState().connect('ws://test.example');
    });

    expect(mockSocketService.connect).toHaveBeenCalledWith('ws://test.example');
    expect(mockSocketService.getSocket).toHaveBeenCalledTimes(2);
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game:joined', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game:state', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game:validActions', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game:over', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game:error', expect.any(Function));
    expect(useGameStore.getState().connected).toBe(true);

    const validActions: ValidAction[] = [
      { type: 'ATTACK', attackerInstanceId: 'attacker-1', targetInstanceId: 'HERO' },
    ];
    const opponentTurnState = createGameState({ currentPlayerIndex: 1 });

    act(() => {
      getListener('game:joined')({ gameId: 'game-123', playerIndex: 0 });
    });

    expect(useGameStore.getState()).toMatchObject({
      gameId: 'game-123',
      playerIndex: 0,
      uiPhase: 'playing',
    });

    act(() => {
      useGameStore.setState({
        validActions,
        selectedAttacker: 'attacker-1',
      });
      getListener('game:state')({ state: opponentTurnState });
    });

    expect(useGameStore.getState().gameState).toEqual(opponentTurnState);
    expect(useGameStore.getState().validActions).toEqual([]);
    expect(useGameStore.getState().selectedAttacker).toBeNull();

    act(() => {
      getListener('game:validActions')({ actions: validActions });
    });

    expect(useGameStore.getState().validActions).toEqual(validActions);

    act(() => {
      getListener('game:error')({ code: 'INVALID_ACTION', message: 'Bad move' });
    });

    expect(useGameStore.getState().error).toBe('Bad move');

    act(() => {
      getListener('game:over')({ winnerIndex: 1, reason: 'HERO_KILLED' });
    });

    expect(useGameStore.getState().uiPhase).toBe('game-over');
    expect(useGameStore.getState().gameState).toMatchObject({
      isGameOver: true,
      winnerIndex: 1,
      winReason: 'HERO_KILLED',
    });
    expect(useGameStore.getState().validActions).toEqual([]);
    expect(useGameStore.getState().selectedAttacker).toBeNull();
  });

  it('sets uiPhase to pvp-waiting when game:pvpWaiting is received', () => {
    renderHook(() => useGameSocket());

    act(() => {
      useGameStore.getState().connect('ws://test.example');
    });

    expect(mockSocket.on).toHaveBeenCalledWith('game:pvpWaiting', expect.any(Function));

    act(() => {
      getListener('game:pvpWaiting')({ gameId: 'pvp-room-1' });
    });

    expect(useGameStore.getState().uiPhase).toBe('pvp-waiting');
  });

  it('transitions from pvp-waiting to playing when game:joined is received', () => {
    renderHook(() => useGameSocket());

    act(() => {
      useGameStore.getState().connect('ws://test.example');
    });

    act(() => {
      getListener('game:pvpWaiting')({ gameId: 'pvp-room-1' });
    });

    expect(useGameStore.getState().uiPhase).toBe('pvp-waiting');

    act(() => {
      getListener('game:joined')({ gameId: 'pvp-room-1', playerIndex: 1 });
    });

    expect(useGameStore.getState()).toMatchObject({
      gameId: 'pvp-room-1',
      playerIndex: 1,
      uiPhase: 'playing',
    });
  });
});