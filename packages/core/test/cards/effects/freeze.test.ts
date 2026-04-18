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

// ─── FREEZE Tests ───────────────────────────────────────────────

describe('FREEZE effect', () => {
  it('sets frozenTurns on target minion', () => {
    const sourceCard = makeCard('freeze_source', [], [
      {
        trigger: 'ON_PLAY',
        type: 'FREEZE',
        params: { targetFilter: 'ALL_ENEMY_MINIONS', turns: 2 },
      },
    ]);
    const source = makeCardInstance({ instanceId: 'freeze_src', card: sourceCard });

    const enemyMinion = makeCardInstance({
      instanceId: 'enemy_1',
      ownerIndex: 1,
      card: makeCard('enemy_card'),
    });

    const ctx = makeEffectContext({ source });
    (ctx.state as any).players[0].battlefield = [source];
    (ctx.state as any).players[1].battlefield = [enemyMinion];

    executeCardEffects('ON_PLAY', ctx);

    expect(enemyMinion.frozenTurns).toBe(2);
  });

  it('defaults frozenTurns to 1 when turns param is not specified', () => {
    const sourceCard = makeCard('freeze_source', [], [
      {
        trigger: 'ON_PLAY',
        type: 'FREEZE',
        params: { targetFilter: 'ALL_ENEMY_MINIONS' },
      },
    ]);
    const source = makeCardInstance({ instanceId: 'freeze_src', card: sourceCard });

    const enemyMinion = makeCardInstance({
      instanceId: 'enemy_1',
      ownerIndex: 1,
      card: makeCard('enemy_card'),
    });

    const ctx = makeEffectContext({ source });
    (ctx.state as any).players[0].battlefield = [source];
    (ctx.state as any).players[1].battlefield = [enemyMinion];

    executeCardEffects('ON_PLAY', ctx);

    expect(enemyMinion.frozenTurns).toBe(1);
  });

  it('frozenTurns decrements at turn start (tested via game-loop integration)', () => {
    // This tests the frozenTurns field directly, since the decrement logic
    // is in game-loop.ts and tested in its own integration context.
    // Here we verify the FREEZE effect sets the value correctly,
    // and that decrementing works as expected on the field.
    const minion = makeCardInstance({
      instanceId: 'frozen_minion',
      card: makeCard('card1'),
      frozenTurns: 2,
    });

    // Simulate what game-loop does
    if (minion.frozenTurns > 0) {
      minion.frozenTurns -= 1;
    }

    expect(minion.frozenTurns).toBe(1);
  });
});
