import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../../../src/engine/game-engine.js';
import { SeededRNG } from '../../../src/engine/rng.js';
import { createCardInstance, resetInstanceCounter } from '../../../src/models/card-instance.js';
import { resetStratagemCounter } from '../../../src/engine/state-mutator.js';
import { TANG_TAIZONG } from '../../../src/cards/definitions/china-emperors.js';
import type { Card, EmperorData, Minister } from '@king-card/shared';

// ─── Test Fixtures ───────────────────────────────────────────────────

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

function makeEmperorCard(): Card {
  return {
    id: 'emperor_1',
    name: 'Test Emperor',
    civilization: 'CHINA',
    type: 'EMPEROR',
    rarity: 'LEGENDARY',
    cost: 0,
    description: 'A test emperor',
    keywords: [],
    effects: [],
    heroSkill: {
      name: 'Test Skill',
      description: '',
      cost: 2,
      cooldown: 0,
      effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} },
    },
  };
}

function makeMinister(): Minister {
  return {
    id: 'minister_1',
    emperorId: 'emperor_1',
    name: 'Test Minister',
    type: 'STRATEGIST',
    activeSkill: {
      name: 'Test Minister Skill',
      description: '',
      cost: 1,
      effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} },
    },
    skillUsedThisTurn: false,
    cooldown: 0,
  };
}

function makeEmperorData(): EmperorData {
  return {
    emperorCard: makeEmperorCard(),
    ministers: [makeMinister()],
    boundGenerals: [],
    boundSorceries: [],
  };
}

function makeDeck(count: number): Card[] {
  return Array.from({ length: count }, (_, i) =>
    makeMinionCard({ id: `deck_card_${i}`, cost: 1 }),
  );
}

function createTestEngine(rng?: SeededRNG): GameEngine {
  resetInstanceCounter();
  resetStratagemCounter();
  const deck1 = makeDeck(30);
  const deck2 = makeDeck(30);
  const emp1 = makeEmperorData();
  const emp2 = makeEmperorData();
  return GameEngine.create(deck1, deck2, emp1, emp2, rng);
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('GameEngine', () => {
  beforeEach(() => {
    resetInstanceCounter();
    resetStratagemCounter();
  });

  // ─── Game Creation ────────────────────────────────────────────────

  describe('create()', () => {
    it('should create a game where both players have 30 cards in deck', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();
      expect(state.players[0].deck.length).toBe(30 - 4); // drew 4
      expect(state.players[1].deck.length).toBe(30 - 5); // drew 4 + 1 compensation
    });

    it('should give the first player 1 energy and 4 cards in hand', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();
      expect(state.players[0].energyCrystal).toBe(1);
      expect(state.players[0].maxEnergy).toBe(1);
      expect(state.players[0].hand.length).toBe(4);
    });

    it('should give the second player 5 cards in hand (4 + 1 compensation)', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();
      expect(state.players[1].hand.length).toBe(5);
    });
  });

  // ─── Query Actions ────────────────────────────────────────────────

  describe('getValidActions()', () => {
    it('should return PLAY_CARD options during MAIN phase', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();
      // After create, executeTurnStart has already been called and we should be in MAIN phase
      expect(state.phase).toBe('MAIN');

      const actions = engine.getValidActions(state.currentPlayerIndex);
      const playCardActions = actions.filter((a) => a.type === 'PLAY_CARD');
      // Player 0 has 1 energy, all deck cards cost 1, so all 4 hand cards are playable
      expect(playCardActions.length).toBe(4);
    });

    it('should only return END_TURN when not in MAIN phase', () => {
      const engine = createTestEngine();
      // Force phase to DRAW
      const state = engine.getGameState();
      (state as any).phase = 'DRAW';

      const actions = engine.getValidActions(state.currentPlayerIndex);
      expect(actions).toEqual([{ type: 'END_TURN' }]);
    });

    it('should not include PLAY_CARD for cards that cost more than available energy', () => {
      resetInstanceCounter();
      resetStratagemCounter();
      // Create deck where all cards cost more than the starting energy (1)
      const deck1 = Array.from({ length: 30 }, (_, i) =>
        makeMinionCard({ id: `p1_exp_${i}`, cost: 5 }),
      );
      const deck2 = makeDeck(30);
      const engine = GameEngine.create(deck1, deck2, makeEmperorData(), makeEmperorData());

      const state = engine.getGameState();
      // Player 0 has 1 energy, all cards cost 5
      const actions = engine.getValidActions(state.currentPlayerIndex);
      const playCardActions = actions.filter((a) => a.type === 'PLAY_CARD');
      // No cards should be playable due to insufficient energy
      expect(playCardActions.length).toBe(0);
    });

    it('should enumerate targeted hero and minister skill actions per legal minion target', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();

      state.players[0].hero.heroSkill = {
        name: 'Clone Ally',
        description: 'Clone a friendly minion',
        cost: 0,
        cooldown: 0,
        effect: {
          trigger: 'ON_PLAY',
          type: 'SUMMON',
          params: { cloneOfInstanceId: 'TARGET' },
        },
      };
      state.players[0].activeMinisterIndex = 0;
      state.players[0].ministerPool[0].activeSkill = {
        name: 'Buff Ally',
        description: 'Buff a friendly minion',
        cost: 0,
        effect: {
          trigger: 'ON_PLAY',
          type: 'APPLY_BUFF',
          params: { target: 'FRIENDLY_MINION', attackBonus: 1, type: 'TEMPORARY', remainingTurns: 1 },
        },
      };

      const targetA = createCardInstance(makeMinionCard({ id: 'target_a' }), 0);
      const targetB = createCardInstance(makeMinionCard({ id: 'target_b' }), 0);
      state.players[0].battlefield.push(targetA, targetB);

      const actions = engine.getValidActions(state.currentPlayerIndex);
      const heroActions = actions.filter((action) => action.type === 'USE_HERO_SKILL');
      const ministerActions = actions.filter((action) => action.type === 'USE_MINISTER_SKILL');

      expect(heroActions).toHaveLength(2);
      expect(heroActions).toEqual([
        { type: 'USE_HERO_SKILL', target: { type: 'MINION', instanceId: targetA.instanceId } },
        { type: 'USE_HERO_SKILL', target: { type: 'MINION', instanceId: targetB.instanceId } },
      ]);
      expect(ministerActions).toHaveLength(2);
      expect(ministerActions).toEqual([
        { type: 'USE_MINISTER_SKILL', target: { type: 'MINION', instanceId: targetA.instanceId } },
        { type: 'USE_MINISTER_SKILL', target: { type: 'MINION', instanceId: targetB.instanceId } },
      ]);
    });

    it('should not enumerate Tang Taizong clone hero skill actions when battlefield is full', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();

      state.players[0].hero.heroSkill = TANG_TAIZONG.heroSkill!;
      for (let i = 0; i < 7; i += 1) {
        state.players[0].battlefield.push(createCardInstance(makeMinionCard({ id: `full_${i}` }), 0));
      }

      const actions = engine.getValidActions(state.currentPlayerIndex);
      const heroSkillActions = actions.filter((action) => action.type === 'USE_HERO_SKILL');

      expect(heroSkillActions).toHaveLength(0);
    });
  });

  // ─── Play Card ────────────────────────────────────────────────────

  describe('playCard()', () => {
    it('should remove card from hand and add to battlefield on success', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();

      const initialHandSize = state.players[0].hand.length;
      const initialBattlefieldSize = state.players[0].battlefield.length;

      const result = engine.playCard(state.currentPlayerIndex, 0);

      expect(result.success).toBe(true);
      expect(state.players[0].hand.length).toBe(initialHandSize - 1);
      expect(state.players[0].battlefield.length).toBe(initialBattlefieldSize + 1);
    });

    it('should reduce energy after playing a card', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();

      const cardCost = state.players[0].hand[0].cost;
      const result = engine.playCard(state.currentPlayerIndex, 0);

      expect(result.success).toBe(true);
      expect(state.players[0].energyCrystal).toBe(1 - cardCost);
    });

    it('should fail when not enough energy', () => {
      resetInstanceCounter();
      resetStratagemCounter();
      // Create deck with expensive cards
      const deck1 = Array.from({ length: 30 }, (_, i) =>
        makeMinionCard({ id: `p1_exp_${i}`, cost: 5 }),
      );
      const deck2 = makeDeck(30);
      const engine = GameEngine.create(deck1, deck2, makeEmperorData(), makeEmperorData());

      const state = engine.getGameState();
      // Player 0 has 1 energy, card costs 5
      const result = engine.playCard(state.currentPlayerIndex, 0);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_ENERGY');
    });
  });

  // ─── Attack ───────────────────────────────────────────────────────

  describe('attack()', () => {
    it('should damage the opponent hero on successful attack', () => {
      resetInstanceCounter();
      resetStratagemCounter();
      // Create deck with a CHARGE minion
      const deck1 = Array.from({ length: 30 }, (_, i) =>
        makeMinionCard({ id: `p1_charge_${i}`, cost: 1, keywords: ['CHARGE'], attack: 3 }),
      );
      const deck2 = makeDeck(30);
      const engine = GameEngine.create(deck1, deck2, makeEmperorData(), makeEmperorData());

      const state = engine.getGameState();
      // Play a CHARGE minion
      engine.playCard(state.currentPlayerIndex, 0);

      // Get the minion's instanceId
      const minion = state.players[0].battlefield[0];
      const opponentHeroHealth = state.players[1].hero.health;

      // Attack the opponent hero
      const result = engine.attack(minion.instanceId, { type: 'HERO', playerIndex: 1 });

      expect(result.success).toBe(true);
      expect(state.players[1].hero.health).toBeLessThan(opponentHeroHealth);
    });
  });

  // ─── End Turn ─────────────────────────────────────────────────────

  describe('endTurn()', () => {
    it('should switch to the next player', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();

      expect(state.currentPlayerIndex).toBe(0);
      engine.endTurn();
      expect(state.currentPlayerIndex).toBe(1);
    });

    it('should increase energy for the new current player', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();

      // Player 0 starts with 1 energy
      expect(state.players[1].maxEnergy).toBe(0);

      engine.endTurn();

      // Player 1 is now current, should have gained energy
      expect(state.players[1].maxEnergy).toBe(1);
      expect(state.players[1].energyCrystal).toBe(1);
    });
  });
});
