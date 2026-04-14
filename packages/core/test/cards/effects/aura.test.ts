import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerAura } from '../../../src/cards/effects/aura.js';
import type { EffectContext, CardInstance, Buff } from '@king-card/shared';

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

describe('AURA effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerAura();
  });

  it('ALL_FRIENDLY aura buffs all friendly minions including self', () => {
    const appliedBuffs: Array<{ instanceId: string; buff: Buff }> = [];

    const friendlyMinion = makeCardInstance({
      instanceId: 'friendly_minion',
      card: makeCard('friendly', []),
    });

    const source = makeCardInstance({
      instanceId: 'aura_minion',
      card: makeCard('aura_card', ['AURA'], [
        {
          trigger: 'ON_PLAY',
          type: 'AURA',
          params: {
            auraScope: 'ALL_FRIENDLY',
            auraAttackBonus: 1,
            auraHealthBonus: 1,
          },
        },
      ]),
    });

    const ctx = makeEffectContext({
      source,
      mutator: {
        ...ctx_mutator_base(),
        applyBuff(target, buff) {
          appliedBuffs.push({ instanceId: target.instanceId, buff });
          return null;
        },
      },
    });

    // Both the aura source and another friendly minion are on the battlefield
    (ctx.state as any).players[0].battlefield = [friendlyMinion, source];

    resolveEffects('ON_PLAY', ctx);

    // Both friendly minions should receive the buff
    expect(appliedBuffs).toHaveLength(2);
    const buffedIds = appliedBuffs.map((b) => b.instanceId);
    expect(buffedIds).toContain('friendly_minion');
    expect(buffedIds).toContain('aura_minion');

    // Verify buff properties
    for (const { buff } of appliedBuffs) {
      expect(buff.type).toBe('AURA');
      expect(buff.sourceInstanceId).toBe('aura_minion');
      expect(buff.attackBonus).toBe(1);
      expect(buff.healthBonus).toBe(1);
      expect(buff.maxHealthBonus).toBe(1);
    }
  });

  it('AURA minion itself receives the buff (self-inclusive)', () => {
    const appliedBuffs: Array<{ instanceId: string }> = [];

    const source = makeCardInstance({
      instanceId: 'aura_self',
      card: makeCard('aura_self_card', ['AURA'], [
        {
          trigger: 'ON_PLAY',
          type: 'AURA',
          params: {
            auraScope: 'ALL_FRIENDLY',
            auraAttackBonus: 1,
            auraHealthBonus: 1,
          },
        },
      ]),
    });

    const ctx = makeEffectContext({
      source,
      mutator: {
        ...ctx_mutator_base(),
        applyBuff(target, _buff) {
          appliedBuffs.push({ instanceId: target.instanceId });
          return null;
        },
      },
    });

    // Only the aura minion on the battlefield
    (ctx.state as any).players[0].battlefield = [source];

    resolveEffects('ON_PLAY', ctx);

    expect(appliedBuffs).toHaveLength(1);
    expect(appliedBuffs[0].instanceId).toBe('aura_self');
  });

  it('non-AURA card does not trigger', () => {
    const appliedBuffs: Array<{ instanceId: string }> = [];

    const source = makeCardInstance({
      instanceId: 'normal_minion',
      card: makeCard('normal_card', ['TAUNT']),
    });

    const ctx = makeEffectContext({
      source,
      mutator: {
        ...ctx_mutator_base(),
        applyBuff(target, _buff) {
          appliedBuffs.push({ instanceId: target.instanceId });
          return null;
        },
      },
    });

    (ctx.state as any).players[0].battlefield = [source];

    resolveEffects('ON_PLAY', ctx);

    expect(appliedBuffs).toHaveLength(0);
  });
});
