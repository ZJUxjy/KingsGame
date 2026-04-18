import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerMobilizationOrder } from '../../../src/cards/effects/mobilization-order.js';
import type { Buff, EffectContext, CardInstance, TargetRef } from '@king-card/shared';
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
    civilization: 'USA',
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
    civilization: 'USA',
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
      turnNumber: 7,
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
    addCardToHand: () => null,
  };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('MOBILIZATION_ORDER effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerMobilizationOrder();
  });

  it('applies a TEMPORARY +1 attack buff to all friendly minions when >=3 on board at turn start', () => {
    const buffCalls: Array<{ instanceId: string; buff: Buff }> = [];

    const minion1 = makeCardInstance({
      instanceId: 'minion_1',
      card: makeCard('card_1', ['MOBILIZATION_ORDER']),
    });
    const minion2 = makeCardInstance({
      instanceId: 'minion_2',
      card: makeCard('card_2'),
    });
    const minion3 = makeCardInstance({
      instanceId: 'minion_3',
      card: makeCard('card_3'),
    });

    const ctx = makeEffectContext({
      source: minion1,
      mutator: {
        ...ctx_mutator_base(),
        applyBuff(target: TargetRef, buff: Buff) {
          if (target.type === 'MINION') {
            buffCalls.push({ instanceId: target.instanceId, buff });
          }
          return null;
        },
      } as any,
    });

    (ctx.state as any).players[0].battlefield = [minion1, minion2, minion3];

    resolveEffects('ON_TURN_START', ctx);

    expect(buffCalls).toHaveLength(3);
    const targeted = buffCalls.map((c) => c.instanceId).sort();
    expect(targeted).toEqual(['minion_1', 'minion_2', 'minion_3']);

    for (const call of buffCalls) {
      expect(call.buff).toMatchObject({
        type: 'TEMPORARY',
        attackBonus: 1,
        healthBonus: 0,
        maxHealthBonus: 0,
        keywordsGranted: [],
        remainingTurns: 1,
      });
      expect(call.buff.id).toMatch(/^buff_/);
      expect(call.buff.sourceInstanceId).toBe(`mobilization_order_turn_${ctx.state.turnNumber}`);
    }
  });

  it('does not trigger with <3 minions', () => {
    const buffCalls: Array<{ instanceId: string; buff: Buff }> = [];

    const minion1 = makeCardInstance({
      instanceId: 'minion_1',
      card: makeCard('card_1', ['MOBILIZATION_ORDER']),
    });
    const minion2 = makeCardInstance({
      instanceId: 'minion_2',
      card: makeCard('card_2'),
    });

    const ctx = makeEffectContext({
      source: minion1,
      mutator: {
        ...ctx_mutator_base(),
        applyBuff(target: TargetRef, buff: Buff) {
          if (target.type === 'MINION') {
            buffCalls.push({ instanceId: target.instanceId, buff });
          }
          return null;
        },
      } as any,
    });

    (ctx.state as any).players[0].battlefield = [minion1, minion2];

    resolveEffects('ON_TURN_START', ctx);

    expect(buffCalls).toHaveLength(0);
  });

  it('non-MOBILIZATION_ORDER source minion does not trigger', () => {
    const buffCalls: Array<{ instanceId: string; buff: Buff }> = [];

    const normalMinion = makeCardInstance({
      instanceId: 'normal_minion',
      card: makeCard('normal_card', ['TAUNT']),
    });
    const minion2 = makeCardInstance({
      instanceId: 'minion_2',
      card: makeCard('card_2'),
    });
    const minion3 = makeCardInstance({
      instanceId: 'minion_3',
      card: makeCard('card_3'),
    });

    const ctx = makeEffectContext({
      source: normalMinion,
      mutator: {
        ...ctx_mutator_base(),
        applyBuff(target: TargetRef, buff: Buff) {
          if (target.type === 'MINION') {
            buffCalls.push({ instanceId: target.instanceId, buff });
          }
          return null;
        },
      } as any,
    });

    (ctx.state as any).players[0].battlefield = [normalMinion, minion2, minion3];

    resolveEffects('ON_TURN_START', ctx);

    expect(buffCalls).toHaveLength(0);
  });

  it('dedupes within the same turn: a second MOBILIZATION_ORDER source does not re-buff', () => {
    const buffCalls: Array<{ instanceId: string; buff: Buff }> = [];

    const minion1 = makeCardInstance({
      instanceId: 'minion_1',
      card: makeCard('card_1', ['MOBILIZATION_ORDER']),
    });
    const minion2 = makeCardInstance({
      instanceId: 'minion_2',
      card: makeCard('card_2', ['MOBILIZATION_ORDER']),
    });
    const minion3 = makeCardInstance({
      instanceId: 'minion_3',
      card: makeCard('card_3'),
    });

    const battlefield = [minion1, minion2, minion3];

    const ctx = makeEffectContext({
      source: minion1,
      mutator: {
        ...ctx_mutator_base(),
        applyBuff(target: TargetRef, buff: Buff) {
          if (target.type === 'MINION') {
            const target_minion = battlefield.find((m) => m.instanceId === target.instanceId);
            if (target_minion) target_minion.buffs.push(buff);
            buffCalls.push({ instanceId: target.instanceId, buff });
          }
          return null;
        },
      } as any,
    });

    (ctx.state as any).players[0].battlefield = battlefield;

    resolveEffects('ON_TURN_START', ctx);
    expect(buffCalls).toHaveLength(3);

    // Second MOBILIZATION_ORDER source firing in the same turn must dedupe
    resolveEffects('ON_TURN_START', { ...ctx, source: minion2 });

    expect(buffCalls).toHaveLength(3);
  });

  it('skips when source is not on the active player side', () => {
    const buffCalls: Array<{ instanceId: string; buff: Buff }> = [];

    const opponentMinion = makeCardInstance({
      instanceId: 'opp_minion',
      ownerIndex: 1,
      card: makeCard('opp_card', ['MOBILIZATION_ORDER']),
    });
    const m2 = makeCardInstance({
      instanceId: 'm2',
      ownerIndex: 1,
      card: makeCard('c2'),
    });
    const m3 = makeCardInstance({
      instanceId: 'm3',
      ownerIndex: 1,
      card: makeCard('c3'),
    });

    const ctx = makeEffectContext({
      source: opponentMinion,
      playerIndex: 1,
      mutator: {
        ...ctx_mutator_base(),
        applyBuff(target: TargetRef, buff: Buff) {
          if (target.type === 'MINION') {
            buffCalls.push({ instanceId: target.instanceId, buff });
          }
          return null;
        },
      } as any,
    });

    // currentPlayerIndex stays at 0 (default), so opponent's MOBILIZATION_ORDER
    // must not fire even though their own playerIndex is 1.
    (ctx.state as any).players[1].battlefield = [opponentMinion, m2, m3];

    resolveEffects('ON_TURN_START', ctx);

    expect(buffCalls).toHaveLength(0);
  });
});
