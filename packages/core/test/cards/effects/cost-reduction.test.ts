import { describe, it, expect, beforeEach } from 'vitest';
import { executeCardEffects, resetBuffCounter } from '../../../src/cards/effects/execute-card-effects.js';
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
    frozenTurns: 0,
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
    civilization: 'CHINA',
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
    civilization: 'CHINA',
    hand: [],
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
    mutator: ctx_mutator_base(),
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

function ctx_mutator_base(): EffectContext['mutator'] {
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
  } as any;
}

// ─── COST_REDUCTION Tests ───────────────────────────────────────

describe('COST_REDUCTION effect', () => {
  beforeEach(() => {
    resetBuffCounter();
  });

  it('increases player costReduction', () => {
    const sourceCard = makeCard('cost_reducer', [], [
      {
        trigger: 'ON_PLAY',
        type: 'COST_REDUCTION',
        params: { amount: 3 },
      },
    ]);
    const source = makeCardInstance({ instanceId: 'cost_src', card: sourceCard });

    const ctx = makeEffectContext({ source });

    executeCardEffects('ON_PLAY', ctx);

    expect((ctx.state.players[0] as any).costReduction).toBe(3);
  });

  it('defaults amount to 1 when not specified', () => {
    const sourceCard = makeCard('cost_reducer', [], [
      {
        trigger: 'ON_PLAY',
        type: 'COST_REDUCTION',
        params: {},
      },
    ]);
    const source = makeCardInstance({ instanceId: 'cost_src', card: sourceCard });

    const ctx = makeEffectContext({ source });

    executeCardEffects('ON_PLAY', ctx);

    expect((ctx.state.players[0] as any).costReduction).toBe(1);
  });

  it('stacks with existing costReduction', () => {
    const sourceCard = makeCard('cost_reducer', [], [
      {
        trigger: 'ON_PLAY',
        type: 'COST_REDUCTION',
        params: { amount: 2 },
      },
    ]);
    const source = makeCardInstance({ instanceId: 'cost_src', card: sourceCard });

    const ctx = makeEffectContext({ source });
    (ctx.state.players[0] as any).costReduction = 1;

    executeCardEffects('ON_PLAY', ctx);

    expect((ctx.state.players[0] as any).costReduction).toBe(3);
  });
});
