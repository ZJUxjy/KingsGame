import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerComboStrike } from '../../../src/cards/effects/combo-strike.js';
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
    justPlayed: true,
    sleepTurns: 0,
    frozenTurns: 0,
    garrisonTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
    position: 0,
    ...overrides,
  };
}

function makeCard(id: string, keywords: string[] = []): CardInstance['card'] {
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
    effects: [],
  };
}

function makeEffectContext(overrides: Partial<EffectContext> & { source: CardInstance }): EffectContext {
  return {
    state: {
      players: [
        {
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
        },
        {
          id: 'p2',
          name: 'Player 2',
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
        },
      ],
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

describe('COMBO_STRIKE effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerComboStrike();
  });

  it('COMBO_STRIKE minion gains extra attack after killing an enemy', () => {
    let grantExtraAttackCalled = false;
    let grantedInstanceId: string | undefined;

    const source = makeCardInstance({
      instanceId: 'combo_minion',
      card: makeCard('combo_card', ['COMBO_STRIKE']),
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
    expect(grantedInstanceId).toBe('combo_minion');
  });

  it('non-COMBO_STRIKE minion does not gain extra attack after killing', () => {
    let grantExtraAttackCalled = false;

    const source = makeCardInstance({
      instanceId: 'normal_minion',
      card: makeCard('normal_card', []),
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

  it('COMBO_STRIKE trigger correctly calls grantExtraAttack with source instanceId', () => {
    const calls: string[] = [];

    const source = makeCardInstance({
      instanceId: 'unique_combo_id',
      card: makeCard('combo_unique', ['COMBO_STRIKE']),
      remainingAttacks: 1,
    });
    const target = makeCardInstance({
      instanceId: 'victim',
      card: makeCard('victim_card', []),
      ownerIndex: 1,
    });

    const ctx = makeEffectContext({
      source,
      target,
      mutator: {
        ...ctx_mutator_base(),
        grantExtraAttack(instanceId: string) {
          calls.push(instanceId);
          return null;
        },
      },
    });

    resolveEffects('ON_KILL', ctx);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toBe('unique_combo_id');
  });
});
