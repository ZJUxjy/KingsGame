import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GameEngine } from '@king-card/core';
import type { GameState, ValidAction, Card } from '@king-card/shared';
import { runAiTurn, AI_PLAYER_INDEX } from '../src/aiPlayer.js';

function makeCard(cost: number): Card {
  return {
    id: `card-${cost}`,
    name: `Test Card ${cost}`,
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost,
    attack: 1,
    health: 1,
    description: 'test',
    keywords: [],
    effects: [],
  };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  const player = {
    id: 'ai',
    name: 'AI',
    hero: {
      health: 30,
      maxHealth: 30,
      armor: 0,
      heroSkill: {
        name: 'Test Skill',
        description: 'test',
        cost: 2,
        cooldown: 0,
        effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: { amount: 1 } },
      },
      skillUsedThisTurn: false,
      skillCooldownRemaining: 0,
    },
    civilization: 'CHINA',
    hand: [makeCard(3), makeCard(1)],
    handLimit: 10,
    deck: [],
    graveyard: [],
    battlefield: [],
    activeStratagems: [],
    costModifiers: [],
    costReduction: 0,
    energyCrystal: 10,
    maxEnergy: 10,
    cannotDrawNextTurn: false,
    ministerPool: [],
    activeMinisterIndex: -1,
    boundCards: [],
  };

  const opponent = {
    ...player,
    id: 'opponent',
    name: 'Opponent',
    hand: [],
    battlefield: [],
  };

  return {
    players: [opponent, player],
    currentPlayerIndex: 1,
    turnNumber: 1,
    phase: 'MAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
    ...overrides,
  } as GameState;
}

function createMockEngine(gameState: GameState): GameEngine {
  return {
    getGameState: vi.fn(() => gameState),
    getValidActions: vi.fn(() => []),
    playCard: vi.fn(),
    attack: vi.fn(),
    endTurn: vi.fn(),
    useHeroSkill: vi.fn(),
    useMinisterSkill: vi.fn(),
    useGeneralSkill: vi.fn(),
  } as unknown as GameEngine;
}

describe('aiPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('AI_PLAYER_INDEX is 1', () => {
    expect(AI_PLAYER_INDEX).toBe(1);
  });

  it('plays cards when available (highest cost first)', async () => {
    const gameState = makeGameState();
    const engine = createMockEngine(gameState);

    // Stateful mock: drain one play_card per engine.playCard call. The
    // AI re-fetches valid actions every iteration, so the mock returns
    // the current view of remaining playable cards each time.
    const remaining: ValidAction[] = [
      { type: 'PLAY_CARD', handIndex: 0 }, // cost 3
      { type: 'PLAY_CARD', handIndex: 1 }, // cost 1
    ];
    vi.mocked(engine.getValidActions).mockImplementation(() => [...remaining]);
    vi.mocked(engine.playCard).mockImplementation(() => {
      if (remaining.length > 0) remaining.shift();
    });

    const promise = runAiTurn(engine, 1);

    await vi.advanceTimersByTimeAsync(2000);

    expect(engine.playCard).toHaveBeenCalledTimes(2);
    // Highest cost first (handIndex 0 = cost 3) on first iteration.
    expect(engine.playCard).toHaveBeenNthCalledWith(1, 1, 0);
    // Second iteration sees the remaining cost-1 card at handIndex 1.
    expect(engine.playCard).toHaveBeenNthCalledWith(2, 1, 1);
    expect(engine.endTurn).toHaveBeenCalledTimes(1);

    await promise;
  });

  it('attacks when possible', async () => {
    const gameState = makeGameState();
    const engine = createMockEngine(gameState);

    // Stateful mock: drain one attack per engine.attack call. The card-phase
    // prefetch sees the same list but filters out non-PLAY_CARD entries.
    // Each attack-loop iteration sees the remaining list; when empty, the
    // loop breaks.
    const remaining: ValidAction[] = [
      { type: 'ATTACK', attackerInstanceId: 'minion-1', targetInstanceId: 'minion-2' },
      { type: 'ATTACK', attackerInstanceId: 'minion-3', targetInstanceId: 'HERO' },
    ];
    vi.mocked(engine.getValidActions).mockImplementation(() => [...remaining]);
    vi.mocked(engine.attack).mockImplementation(() => {
      remaining.shift();
    });

    const promise = runAiTurn(engine, 1);
    await vi.advanceTimersByTimeAsync(2000);

    expect(engine.attack).toHaveBeenCalledTimes(2);
    expect(engine.attack).toHaveBeenNthCalledWith(1, 'minion-1', { type: 'MINION', instanceId: 'minion-2' });
    expect(engine.attack).toHaveBeenNthCalledWith(2, 'minion-3', { type: 'HERO', playerIndex: 0 });
    expect(engine.endTurn).toHaveBeenCalledTimes(1);

    await promise;
  });

  it('uses hero skill when available', async () => {
    const gameState = makeGameState();
    const engine = createMockEngine(gameState);

    vi.mocked(engine.getValidActions)
      .mockReturnValueOnce([])                          // no cards
      .mockReturnValueOnce([])                          // no attacks
      .mockReturnValueOnce([{ type: 'USE_HERO_SKILL' }]); // hero skill

    const promise = runAiTurn(engine, 1);
    await vi.advanceTimersByTimeAsync(1500);

    expect(engine.useHeroSkill).toHaveBeenCalledTimes(1);
    expect(engine.useHeroSkill).toHaveBeenCalledWith(1, undefined);
    expect(engine.endTurn).toHaveBeenCalledTimes(1);

    await promise;
  });

  it('ends turn after all actions', async () => {
    const gameState = makeGameState();
    const engine = createMockEngine(gameState);

    vi.mocked(engine.getValidActions).mockReturnValue([]);

    const promise = runAiTurn(engine, 1);
    await vi.advanceTimersByTimeAsync(500);

    expect(engine.endTurn).toHaveBeenCalledTimes(1);

    await promise;
  });

  it('skips actions when game is over', async () => {
    const gameOverState = makeGameState({ isGameOver: true });
    const engine = createMockEngine(gameOverState);

    vi.mocked(engine.getValidActions).mockReturnValue([]);

    await runAiTurn(engine, 1);

    expect(engine.playCard).not.toHaveBeenCalled();
    expect(engine.attack).not.toHaveBeenCalled();
    expect(engine.useHeroSkill).not.toHaveBeenCalled();
    expect(engine.endTurn).not.toHaveBeenCalled();
  });

  it('convertTargetInstanceId converts HERO target correctly', async () => {
    // We test indirectly via the attack flow
    const gameState = makeGameState();
    const engine = createMockEngine(gameState);

    vi.mocked(engine.getValidActions)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([
        { type: 'ATTACK', attackerInstanceId: 'm1', targetInstanceId: 'HERO' },
      ])
      .mockReturnValue([]);

    const promise = runAiTurn(engine, 1);
    await vi.advanceTimersByTimeAsync(1500);

    // playerIndex=1, so HERO should target playerIndex 0
    expect(engine.attack).toHaveBeenCalledWith('m1', { type: 'HERO', playerIndex: 0 });

    await promise;
  });

  it('convertTargetInstanceId converts minion target correctly', async () => {
    const gameState = makeGameState();
    const engine = createMockEngine(gameState);

    vi.mocked(engine.getValidActions)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([
        { type: 'ATTACK', attackerInstanceId: 'm1', targetInstanceId: 'enemy-minion-42' },
      ])
      .mockReturnValue([]);

    const promise = runAiTurn(engine, 1);
    await vi.advanceTimersByTimeAsync(1500);

    expect(engine.attack).toHaveBeenCalledWith('m1', { type: 'MINION', instanceId: 'enemy-minion-42' });

    await promise;
  });

  it('re-fetches valid actions between play_card invocations (handIndex shifts after each play)', async () => {
    const gameState = makeGameState();
    const engine = createMockEngine(gameState);

    // After playing handIndex 0 (cost 3), the cost-1 card slides into
    // handIndex 0. If the AI iterated over a stale snapshot, the second
    // playCard would fire with handIndex 1 (out-of-bounds). With the fix
    // it re-fetches and sees only handIndex 0 remaining, so the second
    // playCard fires with handIndex 0.
    let callCount = 0;
    vi.mocked(engine.getValidActions).mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return [
          { type: 'PLAY_CARD', handIndex: 0 },
          { type: 'PLAY_CARD', handIndex: 1 },
        ];
      }
      if (callCount === 2) {
        return [{ type: 'PLAY_CARD', handIndex: 0 }];
      }
      return [];
    });

    const promise = runAiTurn(engine, 1);
    await vi.advanceTimersByTimeAsync(2000);

    expect(engine.playCard).toHaveBeenCalledTimes(2);
    expect(engine.playCard).toHaveBeenNthCalledWith(1, 1, 0);
    expect(engine.playCard).toHaveBeenNthCalledWith(2, 1, 0);
    expect(engine.endTurn).toHaveBeenCalledTimes(1);

    await promise;
  });

  it('re-fetches valid actions between attacks (avoids stale INVALID_TARGET)', async () => {
    const gameState = makeGameState();
    const engine = createMockEngine(gameState);

    // Sequence:
    //   1) cards phase prefetch: []
    //   2) attack loop iter 1: two attacks both targeting enemy-1
    //   3) attack loop iter 2 (after m1 killed enemy-1): []
    //   4+) hero/minister/general phase prefetches: []
    vi.mocked(engine.getValidActions)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([
        { type: 'ATTACK', attackerInstanceId: 'm1', targetInstanceId: 'enemy-1' },
        { type: 'ATTACK', attackerInstanceId: 'm2', targetInstanceId: 'enemy-1' },
      ])
      .mockReturnValueOnce([])
      .mockReturnValue([]);

    const promise = runAiTurn(engine, 1);
    await vi.advanceTimersByTimeAsync(2000);

    // Only the first attack fires; the AI must re-evaluate and discover that
    // enemy-1 is no longer a valid target for m2.
    expect(engine.attack).toHaveBeenCalledTimes(1);
    expect(engine.attack).toHaveBeenCalledWith('m1', { type: 'MINION', instanceId: 'enemy-1' });
    expect(engine.endTurn).toHaveBeenCalledTimes(1);

    await promise;
  });
});
