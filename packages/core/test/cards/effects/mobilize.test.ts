import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerMobilize } from '../../../src/cards/effects/mobilize.js';
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
    justPlayed: true,
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

describe('MOBILIZE effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerMobilize();
  });

  it('triggers buff when friendly minion count >= threshold', () => {
    const modifyCalls: Array<{ stat: string; delta: number }> = [];

    const existingMinion = makeCardInstance({
      instanceId: 'existing_minion',
      card: makeCard('existing', []),
    });

    const source = makeCardInstance({
      instanceId: 'mobilize_minion',
      card: makeCard('mobilize_card', ['MOBILIZE'], [
        {
          trigger: 'ON_PLAY',
          type: 'MOBILIZE',
          params: {
            mobilizeThreshold: 2,
            mobilizeAttackBonus: 1,
            mobilizeHealthBonus: 1,
          },
        },
      ]),
    });

    const ctx = makeEffectContext({
      source,
      mutator: {
        ...ctx_mutator_base(),
        modifyStat(target, stat, delta) {
          modifyCalls.push({ stat, delta });
          return null;
        },
      },
    });

    // Place both minions on battlefield (2 >= threshold of 2)
    (ctx.state as any).players[0].battlefield = [existingMinion, source];

    resolveEffects('ON_PLAY', ctx);

    // Should have called modifyStat for both attack and health
    expect(modifyCalls).toHaveLength(2);
    expect(modifyCalls).toContainEqual({ stat: 'attack', delta: 1 });
    expect(modifyCalls).toContainEqual({ stat: 'health', delta: 1 });
  });

  it('does not trigger when friendly minion count < threshold', () => {
    const modifyCalls: Array<{ stat: string; delta: number }> = [];

    const source = makeCardInstance({
      instanceId: 'mobilize_minion',
      card: makeCard('mobilize_card', ['MOBILIZE'], [
        {
          trigger: 'ON_PLAY',
          type: 'MOBILIZE',
          params: {
            mobilizeThreshold: 3,
            mobilizeAttackBonus: 1,
            mobilizeHealthBonus: 1,
          },
        },
      ]),
    });

    const ctx = makeEffectContext({
      source,
      mutator: {
        ...ctx_mutator_base(),
        modifyStat(_target, stat, delta) {
          modifyCalls.push({ stat, delta });
          return null;
        },
      },
    });

    // Only 1 minion on battlefield (source itself), threshold is 3
    (ctx.state as any).players[0].battlefield = [source];

    resolveEffects('ON_PLAY', ctx);

    expect(modifyCalls).toHaveLength(0);
  });

  it('non-MOBILIZE card does not trigger', () => {
    const modifyCalls: Array<{ stat: string; delta: number }> = [];

    const source = makeCardInstance({
      instanceId: 'normal_minion',
      card: makeCard('normal_card', ['TAUNT']),
    });

    const ctx = makeEffectContext({
      source,
      mutator: {
        ...ctx_mutator_base(),
        modifyStat(_target, stat, delta) {
          modifyCalls.push({ stat, delta });
          return null;
        },
      },
    });

    resolveEffects('ON_PLAY', ctx);

    expect(modifyCalls).toHaveLength(0);
  });
});
