import { describe, it, expect } from 'vitest';
import { executeCardEffects } from '../../../src/cards/effects/execute-card-effects.js';
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
    counter: new IdCounter(),
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

// ─── SACRIFICE Tests ────────────────────────────────────────────

describe('SACRIFICE effect', () => {
  it('destroys weakest friendly minion and buffs source', () => {
    const destroyCalls: string[] = [];
    const modifyCalls: Array<{ instanceId: string; stat: string; delta: number }> = [];

    const sourceCard = makeCard('sacrifice_source', [], [
      {
        trigger: 'ON_PLAY',
        type: 'SACRIFICE',
        params: { attackBonus: 3, healthBonus: 3 },
      },
    ]);
    const source = makeCardInstance({
      instanceId: 'sacrifice_src',
      currentAttack: 5,
      card: sourceCard,
    });

    const weakMinion = makeCardInstance({
      instanceId: 'weak_minion',
      currentAttack: 1,
      card: makeCard('weak'),
    });

    const strongMinion = makeCardInstance({
      instanceId: 'strong_minion',
      currentAttack: 4,
      card: makeCard('strong'),
    });

    const ctx = makeEffectContext({
      source,
      mutator: {
        ...ctx_mutator_base(),
        destroyMinion(instanceId: string) {
          destroyCalls.push(instanceId);
          return null;
        },
        modifyStat(target: any, stat: string, delta: number) {
          modifyCalls.push({ instanceId: target.instanceId, stat, delta });
          return null;
        },
      } as any,
    });

    (ctx.state as any).players[0].battlefield = [source, weakMinion, strongMinion];

    executeCardEffects('ON_PLAY', ctx);

    expect(destroyCalls).toEqual(['weak_minion']);
    expect(modifyCalls).toContainEqual({ instanceId: 'sacrifice_src', stat: 'attack', delta: 3 });
    expect(modifyCalls).toContainEqual({ instanceId: 'sacrifice_src', stat: 'health', delta: 3 });
  });

  it('does nothing when no other friendly minions exist', () => {
    const destroyCalls: string[] = [];

    const sourceCard = makeCard('sacrifice_source', [], [
      {
        trigger: 'ON_PLAY',
        type: 'SACRIFICE',
        params: { attackBonus: 3, healthBonus: 3 },
      },
    ]);
    const source = makeCardInstance({
      instanceId: 'sacrifice_src',
      card: sourceCard,
    });

    const ctx = makeEffectContext({
      source,
      mutator: {
        ...ctx_mutator_base(),
        destroyMinion(instanceId: string) {
          destroyCalls.push(instanceId);
          return null;
        },
      } as any,
    });

    (ctx.state as any).players[0].battlefield = [source];

    executeCardEffects('ON_PLAY', ctx);

    expect(destroyCalls).toHaveLength(0);
  });

  it('does nothing when battlefield is empty', () => {
    const destroyCalls: string[] = [];

    const sourceCard = makeCard('sacrifice_source', [], [
      {
        trigger: 'ON_PLAY',
        type: 'SACRIFICE',
        params: { attackBonus: 3, healthBonus: 3 },
      },
    ]);
    const source = makeCardInstance({
      instanceId: 'sacrifice_src',
      card: sourceCard,
    });

    const ctx = makeEffectContext({
      source,
      mutator: {
        ...ctx_mutator_base(),
        destroyMinion(instanceId: string) {
          destroyCalls.push(instanceId);
          return null;
        },
      } as any,
    });

    (ctx.state as any).players[0].battlefield = [];

    executeCardEffects('ON_PLAY', ctx);

    expect(destroyCalls).toHaveLength(0);
  });
});
