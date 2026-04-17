import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerAssassin } from '../../../src/cards/effects/assassin.js';
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
    costReduction: 0,
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

describe('ASSASSIN effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerAssassin();
  });

  it('grants extra attack via grantExtraAttack after killing a minion', () => {
    let grantExtraAttackCalled = false;
    let grantedInstanceId: string | undefined;

    const source = makeCardInstance({
      instanceId: 'assassin_minion',
      card: makeCard('assassin_card', ['ASSASSIN']),
      remainingAttacks: 1,
    });
    const target = makeCardInstance({
      instanceId: 'enemy_minion',
      card: makeCard('enemy_card', []),
      ownerIndex: 1,
    });

    const ctx = makeEffectContext({
      source,
      target,
      mutator: {
        ...ctx_mutator_base(),
        grantExtraAttack(instanceId: string) {
          grantExtraAttackCalled = true;
          grantedInstanceId = instanceId;
          return null;
        },
      },
    });

    resolveEffects('ON_KILL', ctx);

    expect(grantExtraAttackCalled).toBe(true);
    expect(grantedInstanceId).toBe('assassin_minion');
  });

  it('does not grant extra attack if source lacks ASSASSIN', () => {
    let grantExtraAttackCalled = false;

    const source = makeCardInstance({
      instanceId: 'rush_minion',
      card: makeCard('rush_card', ['RUSH']),
      remainingAttacks: 1,
    });
    const target = makeCardInstance({
      instanceId: 'enemy_minion',
      card: makeCard('enemy_card', []),
      ownerIndex: 1,
    });

    const ctx = makeEffectContext({
      source,
      target,
      mutator: {
        ...ctx_mutator_base(),
        grantExtraAttack() {
          grantExtraAttackCalled = true;
          return null;
        },
      },
    });

    resolveEffects('ON_KILL', ctx);

    expect(grantExtraAttackCalled).toBe(false);
  });
});
