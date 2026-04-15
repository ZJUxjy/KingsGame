import { describe, it, expect, beforeEach } from 'vitest';
import { executeUseGeneralSkill } from '../../../src/engine/action-executor.js';
import { GameEngine } from '../../../src/engine/game-engine.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import { SeededRNG } from '../../../src/engine/rng.js';
import { createCardInstance, resetInstanceCounter } from '../../../src/models/card-instance.js';
import { resetStratagemCounter } from '../../../src/engine/state-mutator.js';
import { clearEffectHandlers } from '../../../src/cards/effects/index.js';
import { HUOQUBING } from '../../../src/cards/definitions/china-generals.js';
import type { Card, GameState, CardInstance, Minister, EmperorData } from '@king-card/shared';

// ─── Test Fixtures ───────────────────────────────────────────────

function makeGeneralCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    id: overrides.id,
    name: `General ${overrides.id}`,
    civilization: 'CHINA',
    type: 'GENERAL',
    rarity: 'LEGENDARY',
    cost: 5,
    attack: 5,
    health: 5,
    description: 'A test general',
    keywords: [],
    effects: [],
    generalSkills: [
      {
        name: 'Smite',
        description: 'Deal 3 damage to enemy hero',
        cost: 1,
        usesPerTurn: 1,
        effect: {
          trigger: 'ON_PLAY',
          type: 'DAMAGE',
          params: { target: 'ENEMY_HERO', amount: 3 },
        },
      },
      {
        name: 'Fortify',
        description: 'Give self +2/+2',
        cost: 1,
        usesPerTurn: 1,
        effect: {
          trigger: 'ON_PLAY',
          type: 'MODIFY_STAT',
          params: { attackDelta: 2, healthDelta: 2 },
        },
      },
    ],
    ...overrides,
  };
}

function makeMinionCard(id: string): Card {
  return {
    id,
    name: id,
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 2,
    health: 3,
    description: 'Test minion',
    keywords: [],
    effects: [],
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
        deck: [],
        graveyard: [],
        battlefield: [],
        activeStratagems: [],
        costModifiers: [],
        energyCrystal: 10,
        maxEnergy: 10,
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
  resetInstanceCounter();
  resetStratagemCounter();
  clearEffectHandlers();
  const bus = new EventBus();
  const state = makeBaseGameState();
  const rng = new SeededRNG(42);
  return { state, bus, rng };
}

function addGeneralToBattlefield(
  state: GameState,
  playerIndex: number,
  cardOverrides?: Partial<Card> & { id?: string },
): CardInstance {
  const card = makeGeneralCard({ id: 'test_general', ...cardOverrides });
  const instance = createCardInstance(card, playerIndex as 0 | 1);
  instance.justPlayed = false;
  instance.remainingAttacks = 1;
  state.players[playerIndex].battlefield.push(instance);
  return instance;
}

function makeEmperorCard(): Card {
  return {
    id: 'emperor_test',
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
    id: 'minister_test',
    emperorId: 'emperor_test',
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
    makeMinionCard(`deck_card_${i}`),
  );
}

function createTestEngine(rng?: SeededRNG): GameEngine {
  resetInstanceCounter();
  resetStratagemCounter();
  clearEffectHandlers();
  const deck1 = makeDeck(30);
  const deck2 = makeDeck(30);
  const emp1 = makeEmperorData();
  const emp2 = makeEmperorData();
  return GameEngine.create(deck1, deck2, emp1, emp2, rng);
}

// ─── Tests ───────────────────────────────────────────────────────

describe('General Skill (USE_GENERAL_SKILL)', () => {
  beforeEach(() => {
    resetInstanceCounter();
    resetStratagemCounter();
    clearEffectHandlers();
  });

  // ── getValidActions ─────────────────────────────────────────────

  describe('getValidActions', () => {
    it('should include USE_GENERAL_SKILL for generals on battlefield with unused skills', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();

      // Place a general on player 0's battlefield
      const generalCard = makeGeneralCard({ id: 'gen_valid', cost: 1 });
      const instance = createCardInstance(generalCard, 0);
      instance.justPlayed = false;
      state.players[0].battlefield.push(instance);

      const actions = engine.getValidActions(state.currentPlayerIndex);
      const generalSkillActions = actions.filter((a) => a.type === 'USE_GENERAL_SKILL');

      // Should have 2 skills available (Smite and Fortify)
      expect(generalSkillActions).toHaveLength(2);
      expect(generalSkillActions[0]).toEqual({
        type: 'USE_GENERAL_SKILL',
        instanceId: instance.instanceId,
        skillIndex: 0,
      });
      expect(generalSkillActions[1]).toEqual({
        type: 'USE_GENERAL_SKILL',
        instanceId: instance.instanceId,
        skillIndex: 1,
      });
    });

    it('should omit skills already used this turn (tracked by usedGeneralSkills bitmask)', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();

      const generalCard = makeGeneralCard({ id: 'gen_bitmask', cost: 1 });
      const instance = createCardInstance(generalCard, 0);
      instance.justPlayed = false;
      // Mark skill 0 as used (bit 0 set)
      instance.usedGeneralSkills = 1; // 0b001
      state.players[0].battlefield.push(instance);

      const actions = engine.getValidActions(state.currentPlayerIndex);
      const generalSkillActions = actions.filter((a) => a.type === 'USE_GENERAL_SKILL');

      // Only skill 1 should be available
      expect(generalSkillActions).toHaveLength(1);
      expect(generalSkillActions[0]).toEqual({
        type: 'USE_GENERAL_SKILL',
        instanceId: instance.instanceId,
        skillIndex: 1,
      });
    });

    it('should omit skills that cost more energy than available', () => {
      const engine = createTestEngine();
      const state = engine.getGameState();

      const generalCard = makeGeneralCard({
        id: 'gen_expensive',
        generalSkills: [
          {
            name: 'Expensive Skill',
            description: 'Costs a lot',
            cost: 99,
            usesPerTurn: 1,
            effect: {
              trigger: 'ON_PLAY',
              type: 'DAMAGE',
              params: { target: 'ENEMY_HERO', amount: 10 },
            },
          },
        ],
      });
      const instance = createCardInstance(generalCard, 0);
      instance.justPlayed = false;
      state.players[0].battlefield.push(instance);

      const actions = engine.getValidActions(state.currentPlayerIndex);
      const generalSkillActions = actions.filter((a) => a.type === 'USE_GENERAL_SKILL');

      expect(generalSkillActions).toHaveLength(0);
    });
  });

  // ── executeUseGeneralSkill ──────────────────────────────────────

  describe('executeUseGeneralSkill', () => {
    it('should apply DAMAGE effect to enemy hero', () => {
      const { state, bus, rng } = setup();
      const general = addGeneralToBattlefield(state, 0, {
        id: 'gen_damage',
        generalSkills: [
          {
            name: 'Lightning Bolt',
            description: 'Deal 5 damage to enemy hero',
            cost: 1,
            usesPerTurn: 1,
            effect: {
              trigger: 'ON_PLAY',
              type: 'DAMAGE',
              params: { target: 'ENEMY_HERO', amount: 5 },
            },
          },
        ],
      });

      const enemyHeroHealthBefore = state.players[1].hero.health;

      const result = executeUseGeneralSkill(
        state, bus, rng, 0,
        general.instanceId,
        0,
      );

      expect(result.success).toBe(true);
      expect(state.players[1].hero.health).toBe(enemyHeroHealthBefore - 5);

      if (result.success) {
        const skillEvent = result.events.find((e) => e.type === 'GENERAL_SKILL_USED');
        expect(skillEvent).toBeDefined();
      }
    });

    it('should apply MODIFY_STAT effect to self', () => {
      const { state, bus, rng } = setup();
      const general = addGeneralToBattlefield(state, 0, {
        id: 'gen_buff',
        generalSkills: [
          {
            name: 'Fortify',
            description: '+2/+2',
            cost: 0,
            usesPerTurn: 1,
            effect: {
              trigger: 'ON_PLAY',
              type: 'MODIFY_STAT',
              params: { attackDelta: 2, healthDelta: 2 },
            },
          },
        ],
      });

      const attackBefore = general.currentAttack;
      const healthBefore = general.currentHealth;

      const result = executeUseGeneralSkill(
        state, bus, rng, 0,
        general.instanceId,
        0,
      );

      expect(result.success).toBe(true);
      expect(general.currentAttack).toBe(attackBefore + 2);
      expect(general.currentHealth).toBe(healthBefore + 2);
    });

    it('should fail when skill already used this turn', () => {
      const { state, bus, rng } = setup();
      const general = addGeneralToBattlefield(state, 0);
      // Mark skill 0 as used
      general.usedGeneralSkills = 1;

      const result = executeUseGeneralSkill(
        state, bus, rng, 0,
        general.instanceId,
        0,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('SKILL_ON_COOLDOWN');
      }
    });

    it('should fail in wrong phase', () => {
      const { state, bus, rng } = setup();
      const general = addGeneralToBattlefield(state, 0);
      state.phase = 'DRAW';

      const result = executeUseGeneralSkill(
        state, bus, rng, 0,
        general.instanceId,
        0,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('INVALID_PHASE');
      }
    });

    it('should fail when wrong player tries to use skill', () => {
      const { state, bus, rng } = setup();
      const general = addGeneralToBattlefield(state, 0);
      // Player 1 is not the current player (current is 0)

      const result = executeUseGeneralSkill(
        state, bus, rng, 1,
        general.instanceId,
        0,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('INVALID_PHASE');
      }
    });

    it('should mark skill as used via bitmask', () => {
      const { state, bus, rng } = setup();
      const general = addGeneralToBattlefield(state, 0);
      expect(general.usedGeneralSkills).toBe(0);

      const result = executeUseGeneralSkill(
        state, bus, rng, 0,
        general.instanceId,
        0,
      );

      expect(result.success).toBe(true);
      // Bit 0 should be set
      expect(general.usedGeneralSkills).toBe(1);

      // Use second skill
      const result2 = executeUseGeneralSkill(
        state, bus, rng, 0,
        general.instanceId,
        1,
      );

      expect(result2.success).toBe(true);
      // Bits 0 and 1 should be set = 3
      expect(general.usedGeneralSkills).toBe(3);
    });

    it('should spend energy when skill has a cost', () => {
      const { state, bus, rng } = setup();
      const general = addGeneralToBattlefield(state, 0, {
        id: 'gen_costly',
        generalSkills: [
          {
            name: 'Costly Strike',
            description: 'Costs 3 energy',
            cost: 3,
            usesPerTurn: 1,
            effect: {
              trigger: 'ON_PLAY',
              type: 'DAMAGE',
              params: { target: 'ENEMY_HERO', amount: 5 },
            },
          },
        ],
      });

      const energyBefore = state.players[0].energyCrystal;

      const result = executeUseGeneralSkill(
        state, bus, rng, 0,
        general.instanceId,
        0,
      );

      expect(result.success).toBe(true);
      expect(state.players[0].energyCrystal).toBe(energyBefore - 3);
    });

    it('should fail when energy is insufficient for skill cost', () => {
      const { state, bus, rng } = setup();
      const general = addGeneralToBattlefield(state, 0, {
        id: 'gen_broke',
        generalSkills: [
          {
            name: 'Expensive',
            description: 'Costs 99 energy',
            cost: 99,
            usesPerTurn: 1,
            effect: {
              trigger: 'ON_PLAY',
              type: 'DAMAGE',
              params: { target: 'ENEMY_HERO', amount: 99 },
            },
          },
        ],
      });

      const result = executeUseGeneralSkill(
        state, bus, rng, 0,
        general.instanceId,
        0,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('INSUFFICIENT_ENERGY');
      }
    });

    it('should work with HUOQUBING damage skill (targeting enemy minion)', () => {
      const { state, bus, rng } = setup();
      const general = createCardInstance(HUOQUBING, 0);
      general.justPlayed = false;
      state.players[0].battlefield.push(general);

      // Add an enemy minion for targeting
      const enemyMinion = createCardInstance(makeMinionCard('enemy_target'), 1);
      enemyMinion.currentHealth = 10;
      state.players[1].battlefield.push(enemyMinion);

      const result = executeUseGeneralSkill(
        state, bus, rng, 0,
        general.instanceId,
        0, // Long-drive: DAMAGE 6 to ENEMY_MINION
        { type: 'MINION', instanceId: enemyMinion.instanceId },
      );

      expect(result.success).toBe(true);
      expect(enemyMinion.currentHealth).toBe(4); // 10 - 6
    });
  });
});
