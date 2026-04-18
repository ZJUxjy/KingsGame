import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerColony } from '../../../src/cards/effects/colony.js';
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
    civilization: 'UK',
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
    civilization: 'UK',
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

describe('COLONY effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerColony();
  });

  it('draws a card at turn end with >=3 distinct costs', () => {
    const drawCalls: Array<{ playerIndex: number; count: number }> = [];

    const colonyMinion = makeCardInstance({
      instanceId: 'colony_minion',
      card: makeCard('colony_card', ['COLONY']),
    });

    const ctx = makeEffectContext({
      source: colonyMinion,
      playerIndex: 0,
      mutator: {
        ...ctx_mutator_base(),
        drawCards(pIdx: number, count: number) {
          drawCalls.push({ playerIndex: pIdx, count });
          return null;
        },
      },
    });

    // Place 3 minions with distinct costs (2, 3, 5) on the battlefield
    (ctx.state as any).players[0].battlefield = [
      makeCardInstance({ instanceId: 'm1', card: { ...makeCard('c1'), cost: 2 } }),
      makeCardInstance({ instanceId: 'm2', card: { ...makeCard('c2'), cost: 3 } }),
      makeCardInstance({ instanceId: 'm3', card: { ...makeCard('c3'), cost: 5 } }),
    ];

    resolveEffects('ON_TURN_END', ctx);

    expect(drawCalls).toHaveLength(1);
    expect(drawCalls[0]).toEqual({ playerIndex: 0, count: 1 });
  });

  it('does not draw with <3 distinct costs', () => {
    const drawCalls: Array<{ playerIndex: number; count: number }> = [];

    const colonyMinion = makeCardInstance({
      instanceId: 'colony_minion',
      card: makeCard('colony_card', ['COLONY']),
    });

    const ctx = makeEffectContext({
      source: colonyMinion,
      playerIndex: 0,
      mutator: {
        ...ctx_mutator_base(),
        drawCards(pIdx: number, count: number) {
          drawCalls.push({ playerIndex: pIdx, count });
          return null;
        },
      },
    });

    // Place 2 minions with same cost
    (ctx.state as any).players[0].battlefield = [
      makeCardInstance({ instanceId: 'm1', card: { ...makeCard('c1'), cost: 2 } }),
      makeCardInstance({ instanceId: 'm2', card: { ...makeCard('c2'), cost: 2 } }),
    ];

    resolveEffects('ON_TURN_END', ctx);

    expect(drawCalls).toHaveLength(0);
  });

  it('non-COLONY minion does nothing', () => {
    const drawCalls: Array<{ playerIndex: number; count: number }> = [];

    const normalMinion = makeCardInstance({
      instanceId: 'normal_minion',
      card: makeCard('normal_card', ['TAUNT']),
    });

    const ctx = makeEffectContext({
      source: normalMinion,
      playerIndex: 0,
      mutator: {
        ...ctx_mutator_base(),
        drawCards(pIdx: number, count: number) {
          drawCalls.push({ playerIndex: pIdx, count });
          return null;
        },
      },
    });

    resolveEffects('ON_TURN_END', ctx);

    expect(drawCalls).toHaveLength(0);
  });
});
