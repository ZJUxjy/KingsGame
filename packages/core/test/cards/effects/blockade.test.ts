import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerBlockade } from '../../../src/cards/effects/blockade.js';
import type { EffectContext, CardInstance } from '@king-card/shared';

// ─── Test Fixtures ───────────────────────────────────────────────

function makeCardInstance(overrides: Partial<CardInstance> & { card: CardInstance['card'] }): CardInstance {
  return {
    instanceId: 'test_instance_1',
    ownerIndex: 0,
    currentAttack: 2,
    currentHealth: 3,
    currentMaxHealth: 3,
    remainingAttacks: 0,
    justPlayed: false,
    sleepTurns: 0,
    garrisonTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
    position: 0,
    ...overrides,
  };
}

function makeCard(id: string, keywords: string[] = [], effects: CardInstance['card']['effects'] = []): CardInstance['card'] {
  return {
    id,
    name: `Card ${id}`,
    civilization: 'UK',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 2,
    health: 3,
    description: 'A test card',
    keywords: keywords as any,
    effects,
  };
}

function makePlayer(overrides: Partial<EffectContext['state']['players'][0]> = {}) {
  return {
    id: 'p1',
    name: 'Player 1',
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
    civilization: 'UK',
    hand: [],
    handLimit: 10,
    deck: [],
    graveyard: [],
    battlefield: [],
    activeStratagems: [],
    costModifiers: [],
    energyCrystal: 10,
    maxEnergy: 10,
    cannotDrawNextTurn: false,
    ministerPool: [],
    activeMinisterIndex: 0,
    boundCards: [],
    ...overrides,
  };
}

function makeEffectContext(overrides: Partial<EffectContext> & { source: CardInstance }): EffectContext {
  return {
    state: {
      players: [makePlayer(), makePlayer()],
      currentPlayerIndex: 0,
      turnNumber: 1,
      phase: 'MAIN',
      isGameOver: false,
      winnerIndex: null,
      winReason: null,
    },
    mutator: {} as any,
    playerIndex: 0,
    eventBus: {
      emit: () => {},
      on: () => () => {},
      removeAllListeners: () => {},
    },
    rng: {
      nextInt: () => 0,
      next: () => 0,
      pick: (arr) => arr[0],
      shuffle: (a) => a,
    },
    ...overrides,
  };
}

function ctx_mutator_base() {
  return {
    damage: () => null,
    heal: () => null,
    drawCards: () => null,
    discardCard: () => null,
    summonMinion: () => null,
    destroyMinion: () => null,
    modifyStat: () => null,
    applyBuff: () => null,
    removeBuff: () => null,
    gainArmor: () => null,
    spendEnergy: () => null,
    activateStratagem: () => null,
    setDrawLock: () => null,
    grantExtraAttack: () => null,
  };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('BLOCKADE effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerBlockade();
  });

  it('reduces opponent energy by 1 at owner turn start', () => {
    const spendCalls: Array<{ playerIndex: number; amount: number }> = [];

    const blockadeMinion = makeCardInstance({
      instanceId: 'blockade_minion',
      card: makeCard('blockade_card', ['BLOCKADE', 'TAUNT']),
    });

    const ctx = makeEffectContext({
      source: blockadeMinion,
      playerIndex: 0,
      mutator: {
        ...ctx_mutator_base(),
        spendEnergy(pIdx: number, amount: number) {
          spendCalls.push({ playerIndex: pIdx, amount });
          return null;
        },
      },
    });

    // Opponent (index 1) has 5 energy
    (ctx.state as any).players[1].energyCrystal = 5;

    resolveEffects('ON_TURN_START', ctx);

    expect(spendCalls).toHaveLength(1);
    expect(spendCalls[0]).toEqual({ playerIndex: 1, amount: 1 });
  });

  it('does not reduce if opponent has 0 energy', () => {
    const spendCalls: Array<{ playerIndex: number; amount: number }> = [];

    const blockadeMinion = makeCardInstance({
      instanceId: 'blockade_minion',
      card: makeCard('blockade_card', ['BLOCKADE', 'TAUNT']),
    });

    const ctx = makeEffectContext({
      source: blockadeMinion,
      playerIndex: 0,
      mutator: {
        ...ctx_mutator_base(),
        spendEnergy(pIdx: number, amount: number) {
          spendCalls.push({ playerIndex: pIdx, amount });
          return null;
        },
      },
    });

    // Opponent has 0 energy
    (ctx.state as any).players[1].energyCrystal = 0;

    resolveEffects('ON_TURN_START', ctx);

    expect(spendCalls).toHaveLength(0);
  });

  it('non-BLOCKADE minion does nothing', () => {
    const spendCalls: Array<{ playerIndex: number; amount: number }> = [];

    const normalMinion = makeCardInstance({
      instanceId: 'normal_minion',
      card: makeCard('normal_card', ['TAUNT']),
    });

    const ctx = makeEffectContext({
      source: normalMinion,
      playerIndex: 0,
      mutator: {
        ...ctx_mutator_base(),
        spendEnergy(pIdx: number, amount: number) {
          spendCalls.push({ playerIndex: pIdx, amount });
          return null;
        },
      },
    });

    resolveEffects('ON_TURN_START', ctx);

    expect(spendCalls).toHaveLength(0);
  });
});
