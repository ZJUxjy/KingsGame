import { describe, it, expect, beforeEach } from 'vitest';
import { executePlayCard } from '../../../src/engine/action-executor.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import { SeededRNG } from '../../../src/engine/rng.js';
import { IdCounter } from '../../../src/engine/id-counter.js';

let counter: IdCounter;
import { registerEmperorData, clearEmperorRegistry } from '../../../src/engine/emperor-registry.js';
import { QIN_SHIHUANG } from '../../../src/cards/definitions/china-emperors.js';
import { QIN_MINISTERS } from '../../../src/cards/definitions/china-ministers.js';
import { HUOQUBING, WEIQING } from '../../../src/cards/definitions/china-generals.js';
import { WUGUZHIHUO, FENSHU_KENGRU } from '../../../src/cards/definitions/china-sorceries.js';
import type { Card, GameState, EmperorData } from '@king-card/shared';

// ─── Test Fixtures ───────────────────────────────────────────────

function makeMinionCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    id: overrides.id,
    name: `Minion ${overrides.id}`,
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 2,
    health: 3,
    description: 'A test minion',
    keywords: [],
    effects: [],
    ...overrides,
  };
}

function makeBaseGameState(): GameState {
  return {
    players: [
      {
        id: 'p1',
        name: 'Player 1',
        hero: {
          health: 30,
          maxHealth: 30,
          armor: 5,
          heroSkill: {
            name: 'Old Skill',
            description: 'Old hero skill',
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
        activeMinisterIndex: -1,
        boundCards: [
          makeMinionCard({ id: 'old_bound_1' }),
          makeMinionCard({ id: 'old_bound_2' }),
        ],
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
        civilization: 'JAPAN',
        hand: [],
        handLimit: 10,
        deck: [],
        graveyard: [],
        battlefield: [],
        activeStratagems: [],
        costModifiers: [],
        costReduction: 0,
        energyCrystal: 5,
        maxEnergy: 5,
        cannotDrawNextTurn: false,
        ministerPool: [],
        activeMinisterIndex: -1,
        boundCards: [],
      },
    ],
    currentPlayerIndex: 0,
    turnNumber: 1,
    phase: 'MAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
  };
}

function setup() {
  clearEmperorRegistry();
  counter = new IdCounter();
  const bus = new EventBus();
  const state = makeBaseGameState();
  const rng = new SeededRNG(42);

  // Register EmperorData for QIN_SHIHUANG
  const qinData: EmperorData = {
    emperorCard: QIN_SHIHUANG,
    ministers: QIN_MINISTERS.map((m) => ({
      ...m,
      skillUsedThisTurn: false,
      cooldown: 0,
    })),
    boundGenerals: [HUOQUBING, WEIQING],
    boundSorceries: [WUGUZHIHUO, FENSHU_KENGRU],
  };
  registerEmperorData(qinData);

  return { state, bus, rng, qinData };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('Emperor Switch', () => {
  beforeEach(() => {
    clearEmperorRegistry();
  });

  it('should update hero info when playing Qin Shihuang', () => {
    const { state, bus, rng } = setup();
    state.players[0].hand.push(QIN_SHIHUANG);

    const result = executePlayCard(state, bus, rng, 0, 0, counter);

    expect(result.success).toBe(true);
    const hero = state.players[0].hero;
    expect(hero.heroSkill).toBeDefined();
    expect(hero.heroSkill!.name).toBe('召唤兵马俑');
    expect(hero.maxHealth).toBe(30);
    // Armor should be preserved
    expect(hero.armor).toBe(5);
  });

  it('should replace minister pool when playing Qin Shihuang', () => {
    const { state, bus, rng } = setup();
    state.players[0].hand.push(QIN_SHIHUANG);

    const result = executePlayCard(state, bus, rng, 0, 0, counter);

    expect(result.success).toBe(true);
    const player = state.players[0];
    expect(player.ministerPool).toHaveLength(QIN_MINISTERS.length);
    expect(player.ministerPool[0].name).toBe('李斯');
    expect(player.activeMinisterIndex).toBe(0);
  });

  it('should add bound cards to hand when playing Qin Shihuang', () => {
    const { state, bus, rng } = setup();
    state.players[0].hand.push(QIN_SHIHUANG);

    const result = executePlayCard(state, bus, rng, 0, 0, counter);

    expect(result.success).toBe(true);
    const player = state.players[0];
    // Emperor card was removed from hand (-1), 4 bound cards added (+4)
    // Hand started with 1 card (QIN_SHIHUANG), now should have 4 bound cards
    expect(player.hand).toHaveLength(4);
    expect(player.hand.some(c => c.id === 'china_huoqubing')).toBe(true);
    expect(player.hand.some(c => c.id === 'china_weiqing')).toBe(true);
    expect(player.hand.some(c => c.id === 'china_wuguzhihuo')).toBe(true);
    expect(player.hand.some(c => c.id === 'china_fenshu_kengru')).toBe(true);
  });

  it('should remove old bound cards when switching emperor', () => {
    const { state, bus, rng } = setup();
    state.players[0].hand.push(QIN_SHIHUANG);
    // Player starts with 2 old bound cards
    expect(state.players[0].boundCards).toHaveLength(2);

    const result = executePlayCard(state, bus, rng, 0, 0, counter);

    expect(result.success).toBe(true);
    // Old bound cards should be gone, replaced by new ones
    const player = state.players[0];
    expect(player.boundCards).toHaveLength(4);
    expect(player.boundCards.some(c => c.id === 'old_bound_1')).toBe(false);
    expect(player.boundCards.some(c => c.id === 'old_bound_2')).toBe(false);
  });

  it('should not affect non-emperor cards', () => {
    clearEmperorRegistry();
    const bus = new EventBus();
    const state = makeBaseGameState();
    const rng = new SeededRNG(42);
    const minion = makeMinionCard({ id: 'normal_minion', cost: 1 });
    state.players[0].hand.push(minion);

    const result = executePlayCard(state, bus, rng, 0, 0, counter);

    expect(result.success).toBe(true);
    // Hero should not have changed
    expect(state.players[0].hero.heroSkill!.name).toBe('Old Skill');
    // No ministers should be set
    expect(state.players[0].ministerPool).toHaveLength(0);
  });

  it('should set hero skill cooldown after switching emperor', () => {
    const { state, bus, rng } = setup();
    state.players[0].hand.push(QIN_SHIHUANG);

    const result = executePlayCard(state, bus, rng, 0, 0, counter);

    expect(result.success).toBe(true);
    const hero = state.players[0].hero;
    // New emperor's skill should be marked as used this turn
    expect(hero.skillUsedThisTurn).toBe(true);
    // Cooldown should be set
    expect(hero.skillCooldownRemaining).toBe(QIN_SHIHUANG.heroSkill!.cooldown);
  });

  it('should emit EMPEROR_CHANGED event', () => {
    const { state, bus, rng } = setup();
    state.players[0].hand.push(QIN_SHIHUANG);

    const result = executePlayCard(state, bus, rng, 0, 0, counter);

    expect(result.success).toBe(true);
    if (result.success) {
      const emperorChanged = result.events.find(e => e.type === 'EMPEROR_CHANGED');
      expect(emperorChanged).toBeDefined();
      if (emperorChanged && emperorChanged.type === 'EMPEROR_CHANGED') {
        expect(emperorChanged.playerIndex).toBe(0);
        expect(emperorChanged.newEmperorId).toBe('china_qin_shihuang');
      }
    }
  });

  it('should set cooldown on first minister after emperor switch', () => {
    const { state, bus, rng } = setup();
    state.players[0].hand.push(QIN_SHIHUANG);

    const result = executePlayCard(state, bus, rng, 0, 0, counter);

    expect(result.success).toBe(true);
    const player = state.players[0];
    // First minister should have cooldown set (can't use this turn)
    expect(player.ministerPool[0].cooldown).toBeGreaterThanOrEqual(1);
  });

  // Followup #3: bound cards must be added via mutator.addCardToHand
  // so that each addition emits CARD_DRAWN (or CARD_DISCARDED on
  // hand-full fallback), matching the Task 5 mutator contract. The
  // previous direct push silently bypassed event emission.
  it('emits CARD_DRAWN for each bound card added on emperor switch', () => {
    const { state, bus, rng } = setup();
    state.players[0].hand.push(QIN_SHIHUANG);

    const result = executePlayCard(state, bus, rng, 0, 0, counter);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const drawnEvents = result.events.filter(
      (e): e is Extract<typeof e, { type: 'CARD_DRAWN' }> => e.type === 'CARD_DRAWN',
    );
    const drawnIds = drawnEvents.map((e) => e.card.id);
    expect(drawnIds).toContain('china_huoqubing');
    expect(drawnIds).toContain('china_weiqing');
    expect(drawnIds).toContain('china_wuguzhihuo');
    expect(drawnIds).toContain('china_fenshu_kengru');
    for (const e of drawnEvents) {
      if (
        e.card.id === 'china_huoqubing'
        || e.card.id === 'china_weiqing'
        || e.card.id === 'china_wuguzhihuo'
        || e.card.id === 'china_fenshu_kengru'
      ) {
        expect(e.playerIndex).toBe(0);
      }
    }
  });

  it('falls back to graveyard via CARD_DISCARDED when hand fills during emperor switch', () => {
    const { state, bus, rng } = setup();
    // Fill the hand to its limit, including QIN_SHIHUANG itself. After
    // playing the emperor (hand splices down by 1), there is exactly
    // 1 free slot for the 4 incoming bound cards, so 1 lands in hand
    // (CARD_DRAWN) and the other 3 fall through to CARD_DISCARDED.
    const filler = makeMinionCard({ id: 'filler' });
    state.players[0].hand = Array.from({ length: state.players[0].handLimit - 1 }, () => filler);
    state.players[0].hand.push(QIN_SHIHUANG);
    expect(state.players[0].hand).toHaveLength(state.players[0].handLimit);
    const handIndex = state.players[0].hand.length - 1;

    const boundIds = new Set([
      'china_huoqubing', 'china_weiqing', 'china_wuguzhihuo', 'china_fenshu_kengru',
    ]);

    const result = executePlayCard(state, bus, rng, 0, handIndex, counter);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const drawnBound = result.events.filter(
      (e): e is Extract<typeof e, { type: 'CARD_DRAWN' }> =>
        e.type === 'CARD_DRAWN' && boundIds.has(e.card.id),
    );
    const discardedBound = result.events.filter(
      (e): e is Extract<typeof e, { type: 'CARD_DISCARDED' }> =>
        e.type === 'CARD_DISCARDED' && boundIds.has(e.card.id),
    );
    // Every bound card must be accounted for via exactly one of the
    // mutator-emitted events; total = 4 with at least one discard.
    expect(drawnBound.length + discardedBound.length).toBe(4);
    expect(discardedBound.length).toBeGreaterThan(0);
  });
});
