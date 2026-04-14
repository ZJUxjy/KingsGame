import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerEffectHandler,
  resolveEffects,
  getRegisteredHandlers,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import type { EffectContext, EffectHandler, CardInstance } from '@king-card/shared';

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
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('BATTLECRY effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
  });

  it('registers BATTLECRY handler without error', () => {
    const handler: EffectHandler = {
      keyword: 'BATTLECRY',
    };
    registerEffectHandler(handler);

    const handlers = getRegisteredHandlers();
    const battlecryHandler = handlers.find(h => h.keyword === 'BATTLECRY');
    expect(battlecryHandler).toBeDefined();
    expect(battlecryHandler!.keyword).toBe('BATTLECRY');
  });

  it('resolveEffects ON_PLAY does not throw with registered BATTLECRY handler', () => {
    const handler: EffectHandler = {
      keyword: 'BATTLECRY',
    };
    registerEffectHandler(handler);

    const source = makeCardInstance({ card: makeCard('test_battlecry', ['BATTLECRY']) });
    const ctx = makeEffectContext({ source });

    expect(() => resolveEffects('ON_PLAY', ctx)).not.toThrow();
  });

  it('onPlay receives the correct EffectContext', () => {
    let receivedCtx: EffectContext | undefined;

    const handler: EffectHandler = {
      keyword: 'BATTLECRY',
      onPlay(ctx: EffectContext) {
        receivedCtx = ctx;
        return [];
      },
    };
    registerEffectHandler(handler);

    const source = makeCardInstance({ card: makeCard('test_battlecry', ['BATTLECRY']) });
    const ctx = makeEffectContext({ source });

    resolveEffects('ON_PLAY', ctx);

    expect(receivedCtx).toBe(ctx);
    expect(receivedCtx!.source).toBe(source);
    expect(receivedCtx!.playerIndex).toBe(0);
  });
});
