import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocaleStore } from './localeStore.js';
import type { SerializedGameState, ValidAction } from './gameStore.js';
import type { TargetRef, HeroSkill, HeroState } from '@king-card/shared';

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

const { emit, mockSocketService } = vi.hoisted(() => ({
  emit: vi.fn(),
  mockSocketService: {
    connect: vi.fn(() => ({ connected: true, once: vi.fn() })),
    disconnect: vi.fn(),
    getSocket: vi.fn(() => ({ emit, connected: true })),
    isConnected: vi.fn(() => false),
  },
}));

vi.mock('../services/socketService.js', () => ({
  socketService: mockSocketService,
}));

import { useGameStore } from './gameStore.js';

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

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState()._reset();
    useLocaleStore.setState({ locale: 'zh-CN' });
    vi.clearAllMocks();
  });

  it('clears stale validActions and selectedAttacker when a new game state shows it is the opponent turn', () => {
    const staleActions: ValidAction[] = [{ type: 'ATTACK', attackerInstanceId: 'attacker-1', targetInstanceId: 'HERO' }];

    useGameStore.setState({
      playerIndex: 0,
      validActions: staleActions,
      selectedAttacker: 'attacker-1',
    });

    const nextState = createGameState({ currentPlayerIndex: 1 });

    useGameStore.getState()._setGameState(nextState);

    expect(useGameStore.getState().gameState).toEqual(nextState);
    expect(useGameStore.getState().validActions).toEqual([]);
    expect(useGameStore.getState().selectedAttacker).toBeNull();
  });

  it('clears stale combat UI state when the client disconnects', () => {
    useGameStore.setState({
      connected: true,
      validActions: [{ type: 'ATTACK', attackerInstanceId: 'attacker-1', targetInstanceId: 'HERO' }],
      selectedAttacker: 'attacker-1',
    });

    useGameStore.getState()._setConnected(false);

    expect(useGameStore.getState().connected).toBe(false);
    expect(useGameStore.getState().validActions).toEqual([]);
    expect(useGameStore.getState().selectedAttacker).toBeNull();
  });

  it('clears stale combat UI state when the game ends', () => {
    useGameStore.setState({
      gameState: createGameState(),
      validActions: [{ type: 'ATTACK', attackerInstanceId: 'attacker-1', targetInstanceId: 'HERO' }],
      selectedAttacker: 'attacker-1',
    });

    useGameStore.getState()._handleGameOver(1, 'HERO_KILLED');

    expect(useGameStore.getState().uiPhase).toBe('game-over');
    expect(useGameStore.getState().gameState).toMatchObject({
      isGameOver: true,
      winnerIndex: 1,
      winReason: 'HERO_KILLED',
    });
    expect(useGameStore.getState().validActions).toEqual([]);
    expect(useGameStore.getState().selectedAttacker).toBeNull();
  });

  it('emits targeted skill payloads and tracks pending skill state locally', () => {
    const target: TargetRef = { type: 'MINION', instanceId: 'target-1' };

    useGameStore.getState().setPendingSkillAction({ type: 'GENERAL', instanceId: 'general-1', skillIndex: 2 });
    expect(useGameStore.getState().pendingSkillAction).toEqual({ type: 'GENERAL', instanceId: 'general-1', skillIndex: 2 });

    useGameStore.getState().useHeroSkill(target);
    useGameStore.getState().useMinisterSkill(target);
    useGameStore.getState().useGeneralSkill('general-1', 2, target);

    expect(emit).toHaveBeenNthCalledWith(1, 'game:useHeroSkill', { target });
    expect(emit).toHaveBeenNthCalledWith(2, 'game:useMinisterSkill', { target });
    expect(emit).toHaveBeenNthCalledWith(3, 'game:useGeneralSkill', {
      instanceId: 'general-1',
      skillIndex: 2,
      target,
    });
  });

  it('clearTargetingSelection clears both selectedAttacker and pendingSkillAction', () => {
    useGameStore.getState().setSelectedAttacker('attacker-1');
    useGameStore.getState().setPendingSkillAction({ type: 'HERO' });

    useGameStore.getState().clearTargetingSelection();

    expect(useGameStore.getState().selectedAttacker).toBeNull();
    expect(useGameStore.getState().pendingSkillAction).toBeNull();
  });

  it('sets a localized connection error when connect_error fires before connect', async () => {
    const handlers = new Map<string, (err?: Error) => void>();
    const mockSocket = {
      connected: false,
      once: vi.fn((event: string, cb: (err?: Error) => void) => {
        handlers.set(event, cb);
        return mockSocket;
      }),
    };
    mockSocketService.connect.mockImplementationOnce(() => mockSocket as { connected: boolean; once: typeof mockSocket.once });

    useLocaleStore.setState({ locale: 'en-US' });
    useGameStore.getState().connect('ws://localhost');

    const onErr = handlers.get('connect_error');
    expect(onErr).toBeTypeOf('function');
    onErr!(new Error('econnrefused'));

    await vi.waitFor(() => {
      expect(useGameStore.getState().connected).toBe(false);
      expect(useGameStore.getState().error).toContain('Failed to connect to server');
      expect(useGameStore.getState().error).toContain('econnrefused');
    });
  });
});
