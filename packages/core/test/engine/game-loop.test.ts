import { describe, it, expect, beforeEach } from 'vitest';
import { executeTurnStart } from '../../../src/engine/game-loop.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import { createCardInstance, resetInstanceCounter } from '../../../src/models/card-instance.js';
import { resetStratagemCounter } from '../../../src/engine/state-mutator.js';
import type { Card, GameState, EmperorData, Minister } from '@king-card/shared';

// ─── Test Fixtures ───────────────────────────────────────────────

function makeMinionCard(id: string): Card {
  return {
    id,
    name: `Minion ${id}`,
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 1,
    health: 1,
    description: 'A test minion',
    keywords: [],
    effects: [],
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
      cost: 0,
      cooldown: 0,
      effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} },
    },
  };
}

function makeEmperorData(): EmperorData {
  return {
    emperorCard: makeEmperorCard(),
    ministers: [] as Minister[],
    boundGenerals: [],
    boundSorceries: [],
  };
}

function makeDeck(count: number): Card[] {
  return Array.from({ length: count }, (_, i) => makeMinionCard(`deck_card_${i}`));
}

function makeGameState(deckSize = 30): GameState {
  const deck = makeDeck(deckSize);
  return {
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
        deck: [...deck],
        graveyard: [],
        battlefield: [],
        activeStratagems: [],
        costModifiers: [],
        energyCrystal: 0,
        maxEnergy: 0,
        cannotDrawNextTurn: false,
        ministerPool: [],
        activeMinisterIndex: -1,
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
        civilization: 'JAPAN',
        hand: [],
        handLimit: 10,
        deck: makeDeck(30),
        graveyard: [],
        battlefield: [],
        activeStratagems: [],
        costModifiers: [],
        energyCrystal: 0,
        maxEnergy: 0,
        cannotDrawNextTurn: false,
        ministerPool: [],
        activeMinisterIndex: -1,
        boundCards: [],
      },
    ],
    currentPlayerIndex: 0,
    turnNumber: 0,
    phase: 'ENERGY_GAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
  };
}

function setup(deckSize = 30) {
  resetInstanceCounter();
  resetStratagemCounter();
  const bus = new EventBus();
  const state = makeGameState(deckSize);
  return { state, bus };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('GameLoop', () => {
  // ── ENERGY_GAIN ────────────────────────────────────────────────
  describe('ENERGY_GAIN phase', () => {
    it('should increase maxEnergy by 1 and set energyCrystal to maxEnergy', () => {
      const { state, bus } = setup();
      executeTurnStart(state, bus);

      expect(state.players[0].maxEnergy).toBe(1);
      expect(state.players[0].energyCrystal).toBe(1);
    });

    it('should have maxEnergy=1 and energyCrystal=1 after first turn', () => {
      const { state, bus } = setup();
      executeTurnStart(state, bus);

      expect(state.players[0].maxEnergy).toBe(1);
      expect(state.players[0].energyCrystal).toBe(1);
    });

    it('should correctly increment maxEnergy over multiple turns', () => {
      const { state, bus } = setup();
      // Run 5 turns for player 0
      for (let i = 0; i < 5; i++) {
        executeTurnStart(state, bus);
        state.currentPlayerIndex = 1 - state.currentPlayerIndex;
      }

      // Player 0 had turns 1, 3, 5 -> maxEnergy should be 3
      expect(state.players[0].maxEnergy).toBe(3);
      expect(state.players[0].energyCrystal).toBe(3);
      // Player 1 had turns 2, 4 -> maxEnergy should be 2
      expect(state.players[1].maxEnergy).toBe(2);
      expect(state.players[1].energyCrystal).toBe(2);
    });

    it('should not exceed maxEnergy of 10', () => {
      const { state, bus } = setup();
      state.players[0].maxEnergy = 9;

      executeTurnStart(state, bus);

      expect(state.players[0].maxEnergy).toBe(10);
      expect(state.players[0].energyCrystal).toBe(10);

      // Another turn should not go above 10
      state.currentPlayerIndex = 1;
      state.currentPlayerIndex = 0; // back to player 0 for simplicity
      state.players[0].maxEnergy = 10;

      executeTurnStart(state, bus);

      expect(state.players[0].maxEnergy).toBe(10);
    });

    it('should emit ENERGY_GAINED event', () => {
      const { state, bus } = setup();
      const events: unknown[] = [];
      bus.on('ENERGY_GAINED', (e) => events.push(e));

      executeTurnStart(state, bus);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'ENERGY_GAINED',
        playerIndex: 0,
        amount: 1,
        totalEnergy: 1,
      });
    });
  });

  // ── DRAW ───────────────────────────────────────────────────────
  describe('DRAW phase', () => {
    it('should draw 1 card on turn start', () => {
      const { state, bus } = setup();
      executeTurnStart(state, bus);

      expect(state.players[0].hand).toHaveLength(1);
      expect(state.players[0].deck).toHaveLength(29);
    });

    it('should not draw when cannotDrawNextTurn is true', () => {
      const { state, bus } = setup();
      state.players[0].cannotDrawNextTurn = true;

      executeTurnStart(state, bus);

      expect(state.players[0].hand).toHaveLength(0);
      expect(state.players[0].deck).toHaveLength(30);
      // Flag should be reset
      expect(state.players[0].cannotDrawNextTurn).toBe(false);
    });
  });

  // ── UPKEEP ─────────────────────────────────────────────────────
  describe('UPKEEP phase', () => {
    it('should decrement stratagem remainingTurns and remove expired ones', () => {
      const { state, bus } = setup();
      resetStratagemCounter();
      state.players[0].activeStratagems = [
        {
          card: makeMinionCard('strat_1'),
          instanceId: 'stratagem_1',
          ownerIndex: 0,
          remainingTurns: 1, // will expire this turn
          appliedEffects: [],
        },
        {
          card: makeMinionCard('strat_2'),
          instanceId: 'stratagem_2',
          ownerIndex: 0,
          remainingTurns: 3, // will not expire
          appliedEffects: [],
        },
      ];

      const events: unknown[] = [];
      bus.on('STRATAGEM_EXPIRED', (e) => events.push(e));

      executeTurnStart(state, bus);

      expect(state.players[0].activeStratagems).toHaveLength(1);
      expect(state.players[0].activeStratagems[0].remainingTurns).toBe(2);
      expect(events).toHaveLength(1);
    });

    it('should decrement garrisonTurns when > 0', () => {
      const { state, bus } = setup();
      resetInstanceCounter();
      const minion = createCardInstance(makeMinionCard('garrison_minion'), 0);
      minion.garrisonTurns = 1;
      minion.currentAttack = 3;
      minion.currentHealth = 4;
      minion.currentMaxHealth = 4;
      state.players[0].battlefield.push(minion);

      executeTurnStart(state, bus);

      // game-loop only decrements garrisonTurns; the buff is applied
      // by the GARRISON effect handler (ON_TURN_START)
      expect(minion.garrisonTurns).toBe(0);
    });
  });

  // ── MAIN ───────────────────────────────────────────────────────
  describe('MAIN phase', () => {
    it('should reset justPlayed to false and set remainingAttacks to 1', () => {
      const { state, bus } = setup();
      resetInstanceCounter();
      const minion = createCardInstance(makeMinionCard('test_minion'), 0);
      minion.justPlayed = true;
      minion.remainingAttacks = 0;
      state.players[0].battlefield.push(minion);

      executeTurnStart(state, bus);

      expect(minion.justPlayed).toBe(false);
      expect(minion.remainingAttacks).toBe(1);
    });

    it('should reset hero skillUsedThisTurn and decrement cooldown', () => {
      const { state, bus } = setup();
      state.players[0].hero.skillUsedThisTurn = true;
      state.players[0].hero.skillCooldownRemaining = 1;

      executeTurnStart(state, bus);

      expect(state.players[0].hero.skillUsedThisTurn).toBe(false);
      expect(state.players[0].hero.skillCooldownRemaining).toBe(0);
    });

    it('should reset minister skillUsedThisTurn and decrement cooldown', () => {
      const { state, bus } = setup();
      state.players[0].ministerPool = [
        {
          id: 'minister_1',
          emperorId: 'emp_1',
          name: 'Test Minister',
          type: 'STRATEGIST',
          activeSkill: {
            name: 'Test',
            description: '',
            cost: 0,
            effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} },
          },
          skillUsedThisTurn: true,
          cooldown: 1,
        },
      ];

      executeTurnStart(state, bus);

      expect(state.players[0].ministerPool[0].skillUsedThisTurn).toBe(false);
      expect(state.players[0].ministerPool[0].cooldown).toBe(0);
    });
  });

  // ── Turn flow ──────────────────────────────────────────────────
  describe('Turn flow', () => {
    it('should increment turnNumber after a full turn', () => {
      const { state, bus } = setup();
      expect(state.turnNumber).toBe(0);

      executeTurnStart(state, bus);

      expect(state.turnNumber).toBe(1);
    });

    it('should set phase to MAIN after turn start', () => {
      const { state, bus } = setup();

      executeTurnStart(state, bus);

      expect(state.phase).toBe('MAIN');
    });

    it('should emit TURN_END event', () => {
      const { state, bus } = setup();
      const events: unknown[] = [];
      bus.on('TURN_END', (e) => events.push(e));

      executeTurnStart(state, bus);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'TURN_END',
        playerIndex: 0,
        turnNumber: 1,
      });
    });

    it('should emit PHASE_CHANGE events for each phase', () => {
      const { state, bus } = setup();
      const events: unknown[] = [];
      bus.on('PHASE_CHANGE', (e) => events.push(e));

      executeTurnStart(state, bus);

      const phases = events.map((e: any) => e.phase);
      expect(phases).toEqual(['ENERGY_GAIN', 'DRAW', 'UPKEEP', 'MAIN']);
    });

    it('should not reset remainingAttacks for sleeping minions', () => {
      const { state, bus } = setup();
      resetInstanceCounter();
      const minion = createCardInstance(makeMinionCard('sleeping'), 0);
      minion.sleepTurns = 2;
      minion.remainingAttacks = 0;
      state.players[0].battlefield.push(minion);

      executeTurnStart(state, bus);

      // sleepTurns decremented by 1 in UPKEEP, but still sleeping
      expect(minion.sleepTurns).toBe(1);
      expect(minion.remainingAttacks).toBe(0);
    });

    it('should wake up minion when sleepTurns reaches 0', () => {
      const { state, bus } = setup();
      resetInstanceCounter();
      const minion = createCardInstance(makeMinionCard('waking'), 0);
      minion.sleepTurns = 1;
      minion.remainingAttacks = 0;
      state.players[0].battlefield.push(minion);

      executeTurnStart(state, bus);

      // UPKEEP wakes it up (remainingAttacks = 1), then MAIN resets to 1 again
      expect(minion.sleepTurns).toBe(0);
      expect(minion.remainingAttacks).toBe(1);
    });
  });
});
