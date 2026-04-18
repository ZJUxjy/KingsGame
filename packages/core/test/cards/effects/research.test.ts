import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffects,
  clearEffectHandlers,
} from '../../../src/cards/effects/index.js';
import { registerResearch } from '../../../src/cards/effects/research.js';
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

function makeSpellCard(id: string, type: 'SORCERY' | 'STRATAGEM', civilization = 'USA'): any {
  return {
    id,
    name: `Spell ${id}`,
    civilization,
    type,
    rarity: 'COMMON',
    cost: 2,
    description: 'A test spell',
    keywords: [],
    effects: [],
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

function ctx_mutator_base(state?: EffectContext['state']) {
  return {
    damage: () => null,
    heal: () => null,
    drawCards: () => null,
    addCardToHand: (playerIndex: number, card: any) => {
      // Mirror real mutator semantics so handler tests can assert on player.hand.
      if (!state) return null;
      const player = state.players[playerIndex] as any;
      const copy = { ...card };
      if (player.hand.length >= player.handLimit) {
        player.graveyard.push(copy);
      } else {
        player.hand.push(copy);
      }
      return null;
    },
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

describe('RESEARCH effect handler', () => {
  beforeEach(() => {
    clearEffectHandlers();
    registerResearch();
  });

  it('adds a random same-civ spell from deck to hand on play', () => {
    const sorcery1 = makeSpellCard('usa_spell_1', 'SORCERY');
    const sorcery2 = makeSpellCard('usa_spell_2', 'SORCERY');

    const researchMinion = makeCardInstance({
      instanceId: 'research_minion',
      card: makeCard('research_card', ['RESEARCH']),
    });

    const player = makePlayer({
      deck: [sorcery1, sorcery2] as any,
      hand: [] as any,
    });

    const ctx = makeEffectContext({
      source: researchMinion,
      mutator: {} as any,
      rng: {
        nextInt: () => 0,
        next: () => 0,
        pick: (arr) => arr[0],
        shuffle: (a) => a,
      },
    });

    (ctx.state as any).players[0] = player;
    (ctx as any).mutator = ctx_mutator_base(ctx.state);

    resolveEffects('ON_PLAY', ctx);

    expect(player.hand).toHaveLength(1);
    expect((player.hand[0] as any).id).toBe('usa_spell_1');
    // Original deck should still have both cards
    expect(player.deck).toHaveLength(2);
  });

  it('does nothing if no spells in deck', () => {
    const minionCard = {
      id: 'usa_minion_1',
      name: 'Some Minion',
      civilization: 'USA',
      type: 'MINION',
      rarity: 'COMMON',
      cost: 1,
      attack: 1,
      health: 1,
      description: 'A minion',
      keywords: [],
      effects: [],
    };

    const researchMinion = makeCardInstance({
      instanceId: 'research_minion',
      card: makeCard('research_card', ['RESEARCH']),
    });

    const player = makePlayer({
      deck: [minionCard] as any,
      hand: [] as any,
    });

    const ctx = makeEffectContext({
      source: researchMinion,
      mutator: {} as any,
    });

    (ctx.state as any).players[0] = player;
    (ctx as any).mutator = ctx_mutator_base(ctx.state);

    resolveEffects('ON_PLAY', ctx);

    expect(player.hand).toHaveLength(0);
  });

  it('non-RESEARCH minion is not affected', () => {
    const sorcery = makeSpellCard('usa_spell_1', 'SORCERY');

    const normalMinion = makeCardInstance({
      instanceId: 'normal_minion',
      card: makeCard('normal_card', ['TAUNT']),
    });

    const player = makePlayer({
      deck: [sorcery] as any,
      hand: [] as any,
    });

    const ctx = makeEffectContext({
      source: normalMinion,
      mutator: {} as any,
    });

    (ctx.state as any).players[0] = player;
    (ctx as any).mutator = ctx_mutator_base(ctx.state);

    resolveEffects('ON_PLAY', ctx);

    expect(player.hand).toHaveLength(0);
  });
});
