import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerEffectHandler,
  resolveEffects,
  getRegisteredHandlers,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { deathrattleHandler } from '../../../src/cards/effects/deathrattle.js';
import { createStateMutator } from '../../../src/engine/state-mutator.js';
import { createCardInstance } from '../../../src/models/card-instance.js';
import { IdCounter } from '../../../src/engine/id-counter.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import { BINGMAYONG } from '../../../src/cards/definitions/china-minions.js';
import type { EffectContext, EffectHandler, CardInstance } from '@king-card/shared';

let counter: IdCounter = new IdCounter();

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
    counter,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('DEATHRATTLE effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    counter = new IdCounter();
  });

  it('registers DEATHRATTLE handler without error', () => {
    const handler: EffectHandler = {
      keyword: 'DEATHRATTLE',
    };
    registerEffectHandler(handler);

    const handlers = getRegisteredHandlers();
    const deathrattleHandler = handlers.find(h => h.keyword === 'DEATHRATTLE');
    expect(deathrattleHandler).toBeDefined();
    expect(deathrattleHandler!.keyword).toBe('DEATHRATTLE');
  });

  it('resolveEffects ON_DEATH does not throw with registered DEATHRATTLE handler', () => {
    const handler: EffectHandler = {
      keyword: 'DEATHRATTLE',
    };
    registerEffectHandler(handler);

    const source = makeCardInstance({ card: makeCard('test_deathrattle', ['DEATHRATTLE']) });
    const ctx = makeEffectContext({ source });

    expect(() => resolveEffects('ON_DEATH', ctx)).not.toThrow();
  });

  it('onDeath receives the correct EffectContext', () => {
    let receivedCtx: EffectContext | undefined;

    const handler: EffectHandler = {
      keyword: 'DEATHRATTLE',
      onDeath(ctx: EffectContext) {
        receivedCtx = ctx;
        return [];
      },
    };
    registerEffectHandler(handler);

    const source = makeCardInstance({ card: makeCard('test_deathrattle', ['DEATHRATTLE']) });
    const ctx = makeEffectContext({ source });

    resolveEffects('ON_DEATH', ctx);

    expect(receivedCtx).toBe(ctx);
    expect(receivedCtx!.source).toBe(source);
  });

  it('destroyMinion triggers draw from a real deathrattle card', () => {
    registerEffectHandler(deathrattleHandler);

    const bus = new EventBus();
    const ctx = makeEffectContext({ source: makeCardInstance({ card: makeCard('placeholder') }) });
    ctx.state.players[0].deck = [{ ...makeCard('draw_target') }];
    const mutator = createStateMutator(ctx.state, bus, undefined, counter);
    const source = createCardInstance(BINGMAYONG, 0, counter);
    ctx.state.players[0].battlefield.push(source);

    mutator.destroyMinion(source.instanceId);

    expect(ctx.state.players[0].hand).toHaveLength(1);
    expect(ctx.state.players[0].hand[0].id).toBe('draw_target');
    expect(ctx.state.players[0].graveyard.map((card) => card.id)).toContain(BINGMAYONG.id);
  });
});
