import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerIronFist } from '../../../src/cards/effects/iron-fist.js';
import type { EffectContext, CardInstance } from '@king-card/shared';
import { IdCounter } from '../../../src/engine/id-counter.js';

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
    frozenTurns: 0,
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
    civilization: 'GERMANY',
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
    civilization: 'GERMANY',
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
    counter: new IdCounter(),
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

describe('IRON_FIST effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerIronFist();
  });

  it('grants +2/+2 when hero health ≤15', () => {
    const modifyCalls: Array<{ instanceId: string; stat: string; delta: number }> = [];

    const ironFistMinion = makeCardInstance({
      instanceId: 'iron_fist_minion',
      card: makeCard('iron_fist_card', ['IRON_FIST']),
    });

    const ctx = makeEffectContext({
      source: ironFistMinion,
      mutator: {
        ...ctx_mutator_base(),
        modifyStat(target: any, stat: any, delta: any) {
          modifyCalls.push({ instanceId: target.instanceId, stat, delta });
          return null;
        },
      },
    });

    // Set hero health to 12 (≤15)
    (ctx.state as any).players[0].hero.health = 12;
    (ctx.state as any).players[0].battlefield = [ironFistMinion];

    resolveEffects('ON_TURN_START', ctx);

    expect(modifyCalls).toHaveLength(2);
    expect(modifyCalls).toContainEqual({ instanceId: 'iron_fist_minion', stat: 'attack', delta: 2 });
    expect(modifyCalls).toContainEqual({ instanceId: 'iron_fist_minion', stat: 'health', delta: 2 });
  });

  it('does not trigger when hero health >15', () => {
    const modifyCalls: Array<{ instanceId: string; stat: string; delta: number }> = [];

    const ironFistMinion = makeCardInstance({
      instanceId: 'iron_fist_minion',
      card: makeCard('iron_fist_card', ['IRON_FIST']),
    });

    const ctx = makeEffectContext({
      source: ironFistMinion,
      mutator: {
        ...ctx_mutator_base(),
        modifyStat(target: any, stat: any, delta: any) {
          modifyCalls.push({ instanceId: target.instanceId, stat, delta });
          return null;
        },
      },
    });

    // Hero health is 20 (>15)
    (ctx.state as any).players[0].hero.health = 20;
    (ctx.state as any).players[0].battlefield = [ironFistMinion];

    resolveEffects('ON_TURN_START', ctx);

    expect(modifyCalls).toHaveLength(0);
  });

  it('non-IRON_FIST minion not affected', () => {
    const modifyCalls: Array<{ instanceId: string; stat: string; delta: number }> = [];

    const normalMinion = makeCardInstance({
      instanceId: 'normal_minion',
      card: makeCard('normal_card', ['TAUNT']),
    });

    const ctx = makeEffectContext({
      source: normalMinion,
      mutator: {
        ...ctx_mutator_base(),
        modifyStat(target: any, stat: any, delta: any) {
          modifyCalls.push({ instanceId: target.instanceId, stat, delta });
          return null;
        },
      },
    });

    // Even with low hero health, non-IRON_FIST shouldn't trigger
    (ctx.state as any).players[0].hero.health = 10;
    (ctx.state as any).players[0].battlefield = [normalMinion];

    resolveEffects('ON_TURN_START', ctx);

    expect(modifyCalls).toHaveLength(0);
  });
});
