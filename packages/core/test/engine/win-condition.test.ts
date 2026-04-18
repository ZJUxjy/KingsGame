import { describe, it, expect } from 'vitest';
import { checkWinCondition } from '../../../src/engine/win-condition.js';
import type { GameState } from '@king-card/shared';

// ─── Test Fixtures ───────────────────────────────────────────────

const dummyHeroSkill = {
  name: 'Skill',
  description: '',
  cost: 0,
  cooldown: 0,
  effect: { trigger: 'ON_PLAY' as const, type: 'DAMAGE' as const, params: {} },
};

function makeGameState(): GameState {
  return {
    players: [
      {
        id: 'p1',
        name: 'Player 1',
        hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: dummyHeroSkill, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        civilization: 'CHINA',
        hand: [],
        handLimit: 10,
        deck: [],
        graveyard: [],
        battlefield: [],
        activeStratagems: [],
        costModifiers: [],
        costReduction: 0,
        energyCrystal: 5,
        maxEnergy: 10,
        cannotDrawNextTurn: false,
        ministerPool: [],
        activeMinisterIndex: -1,
        boundCards: [],
      },
      {
        id: 'p2',
        name: 'Player 2',
        hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: dummyHeroSkill, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
        civilization: 'CHINA',
        hand: [],
        handLimit: 10,
        deck: [],
        graveyard: [],
        battlefield: [],
        activeStratagems: [],
        costModifiers: [],
        costReduction: 0,
        energyCrystal: 5,
        maxEnergy: 10,
        cannotDrawNextTurn: false,
        ministerPool: [],
        activeMinisterIndex: -1,
        boundCards: [],
      },
    ],
    currentPlayerIndex: 0,
    turnNumber: 0,
    phase: 'ENERGY_GAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
  };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('checkWinCondition', () => {
  it('两个英雄都活着 → isGameOver=false', () => {
    const state = makeGameState();
    const result = checkWinCondition(state);

    expect(result.isGameOver).toBe(false);
    expect(result.winnerIndex).toBeNull();
    expect(result.winReason).toBeNull();
  });

  it('玩家0英雄死亡 → isGameOver=true, winnerIndex=1, winReason=HERO_KILLED', () => {
    const state = makeGameState();
    state.players[0].hero.health = 0;

    const result = checkWinCondition(state);

    expect(result.isGameOver).toBe(true);
    expect(result.winnerIndex).toBe(1);
    expect(result.winReason).toBe('HERO_KILLED');
  });

  it('玩家1英雄死亡 → isGameOver=true, winnerIndex=0, winReason=HERO_KILLED', () => {
    const state = makeGameState();
    state.players[1].hero.health = 0;

    const result = checkWinCondition(state);

    expect(result.isGameOver).toBe(true);
    expect(result.winnerIndex).toBe(0);
    expect(result.winReason).toBe('HERO_KILLED');
  });

  it('两个英雄都死亡 → isGameOver=true（选第一个检测到的）', () => {
    const state = makeGameState();
    state.players[0].hero.health = -5;
    state.players[1].hero.health = 0;

    const result = checkWinCondition(state);

    expect(result.isGameOver).toBe(true);
    expect(result.winnerIndex).toBe(1);
    expect(result.winReason).toBe('HERO_KILLED');
  });

  it('isGameOver 已经为 true → 返回已有的状态', () => {
    const state = makeGameState();
    state.isGameOver = true;
    state.winnerIndex = 0;
    state.winReason = 'DECK_EMPTY';

    const result = checkWinCondition(state);

    expect(result.isGameOver).toBe(true);
    expect(result.winnerIndex).toBe(0);
    expect(result.winReason).toBe('DECK_EMPTY');
  });
});
