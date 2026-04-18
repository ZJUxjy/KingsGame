import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerBlitz } from '../../../src/cards/effects/blitz.js';
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

describe('BLITZ effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerBlitz();
  });

  it('deals 2 damage to a random enemy minion on play', () => {
    const damageCalls: Array<{ instanceId: string; amount: number }> = [];

    const blitzMinion = makeCardInstance({
      instanceId: 'blitz_minion',
      card: makeCard('blitz_card', ['BLITZ']),
    });

    const enemyMinion = makeCardInstance({
      instanceId: 'enemy_minion',
      card: makeCard('enemy_card'),
      ownerIndex: 1,
    });

    const ctx = makeEffectContext({
      source: blitzMinion,
      mutator: {
        ...ctx_mutator_base(),
        damage(target: any, amount: any) {
          damageCalls.push({ instanceId: target.instanceId, amount });
          return null;
        },
      },
      rng: {
        nextInt: () => 0,
        next: () => 0,
        pick: () => enemyMinion,
        shuffle: (a: any) => a,
      },
    });

    // Place enemy minion on opponent's battlefield
    (ctx.state as any).players[1].battlefield = [enemyMinion];

    resolveEffects('ON_PLAY', ctx);

    expect(damageCalls).toHaveLength(1);
    expect(damageCalls[0]).toEqual({ instanceId: 'enemy_minion', amount: 2 });
  });

  it('does nothing with no enemy minions', () => {
    const damageCalls: Array<{ instanceId: string; amount: number }> = [];

    const blitzMinion = makeCardInstance({
      instanceId: 'blitz_minion',
      card: makeCard('blitz_card', ['BLITZ']),
    });

    const ctx = makeEffectContext({
      source: blitzMinion,
      mutator: {
        ...ctx_mutator_base(),
        damage(target: any, amount: any) {
          damageCalls.push({ instanceId: target.instanceId, amount });
          return null;
        },
      },
    });

    // Empty enemy battlefield
    (ctx.state as any).players[1].battlefield = [];

    resolveEffects('ON_PLAY', ctx);

    expect(damageCalls).toHaveLength(0);
  });

  it('non-BLITZ minion not affected', () => {
    const damageCalls: Array<{ instanceId: string; amount: number }> = [];

    const normalMinion = makeCardInstance({
      instanceId: 'normal_minion',
      card: makeCard('normal_card', ['TAUNT']),
    });

    const enemyMinion = makeCardInstance({
      instanceId: 'enemy_minion',
      card: makeCard('enemy_card'),
      ownerIndex: 1,
    });

    const ctx = makeEffectContext({
      source: normalMinion,
      mutator: {
        ...ctx_mutator_base(),
        damage(target: any, amount: any) {
          damageCalls.push({ instanceId: target.instanceId, amount });
          return null;
        },
      },
    });

    (ctx.state as any).players[1].battlefield = [enemyMinion];

    resolveEffects('ON_PLAY', ctx);

    expect(damageCalls).toHaveLength(0);
  });
});
