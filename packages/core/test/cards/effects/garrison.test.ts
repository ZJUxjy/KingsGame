import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerGarrison } from '../../../src/cards/effects/garrison.js';
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

describe('GARRISON effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerGarrison();
  });

  it('minion with garrisonTurns=0 receives buff at turn start', () => {
    const modifyCalls: Array<{ instanceId: string; stat: string; delta: number }> = [];

    const garrisonMinion = makeCardInstance({
      instanceId: 'garrison_minion',
      card: makeCard('garrison_card', ['GARRISON'], [
        {
          trigger: 'ON_TURN_START',
          type: 'GARRISON',
          params: {
            garrisonAttackBonus: 2,
            garrisonHealthBonus: 2,
          },
        },
      ]),
      garrisonTurns: 0,
    });

    const ctx = makeEffectContext({
      source: garrisonMinion,
      mutator: {
        ...ctx_mutator_base(),
        modifyStat(target, stat, delta) {
          modifyCalls.push({ instanceId: target.instanceId, stat, delta });
          return null;
        },
      },
    });

    (ctx.state as any).players[0].battlefield = [garrisonMinion];

    resolveEffects('ON_TURN_START', ctx);

    expect(modifyCalls).toHaveLength(2);
    expect(modifyCalls).toContainEqual({ instanceId: 'garrison_minion', stat: 'attack', delta: 2 });
    expect(modifyCalls).toContainEqual({ instanceId: 'garrison_minion', stat: 'health', delta: 2 });
  });

  it('minion with garrisonTurns>0 does not trigger', () => {
    const modifyCalls: Array<{ instanceId: string; stat: string; delta: number }> = [];

    const garrisonMinion = makeCardInstance({
      instanceId: 'garrison_minion',
      card: makeCard('garrison_card', ['GARRISON'], [
        {
          trigger: 'ON_TURN_START',
          type: 'GARRISON',
          params: {
            garrisonAttackBonus: 2,
            garrisonHealthBonus: 2,
          },
        },
      ]),
      garrisonTurns: 1, // Still counting down
    });

    const ctx = makeEffectContext({
      source: garrisonMinion,
      mutator: {
        ...ctx_mutator_base(),
        modifyStat(target, stat, delta) {
          modifyCalls.push({ instanceId: target.instanceId, stat, delta });
          return null;
        },
      },
    });

    (ctx.state as any).players[0].battlefield = [garrisonMinion];

    resolveEffects('ON_TURN_START', ctx);

    expect(modifyCalls).toHaveLength(0);
  });

  it('non-GARRISON minion is not affected', () => {
    const modifyCalls: Array<{ instanceId: string; stat: string; delta: number }> = [];

    const normalMinion = makeCardInstance({
      instanceId: 'normal_minion',
      card: makeCard('normal_card', ['TAUNT']),
      garrisonTurns: 0,
    });

    const ctx = makeEffectContext({
      source: normalMinion,
      mutator: {
        ...ctx_mutator_base(),
        modifyStat(target, stat, delta) {
          modifyCalls.push({ instanceId: target.instanceId, stat, delta });
          return null;
        },
      },
    });

    (ctx.state as any).players[0].battlefield = [normalMinion];

    resolveEffects('ON_TURN_START', ctx);

    expect(modifyCalls).toHaveLength(0);
  });
});
