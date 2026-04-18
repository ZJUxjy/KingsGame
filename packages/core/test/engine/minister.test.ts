import { describe, it, expect } from 'vitest';
import {
  executeAttack,
  executeEndTurn,
  executeUseMinisterSkill,
  executeSwitchMinister,
} from '../../../src/engine/action-executor.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import { SeededRNG } from '../../../src/engine/rng.js';
import { LISI, HANXIN, XIAOHE, CHENPING } from '../../../src/cards/definitions/china-ministers.js';
import { createCardInstance } from '../../../src/models/card-instance.js';
import { IdCounter } from '../../../src/engine/id-counter.js';
import type { Card, GameState, Minister } from '@king-card/shared';

let counter: IdCounter;

// ─── Test Fixtures ───────────────────────────────────────────────

function makeBaseGameState(): GameState {
  // Create fresh minister instances with reset state
  const ministers: Minister[] = [
    LISI, HANXIN, XIAOHE, CHENPING,
  ].map((m) => ({
    ...m,
    skillUsedThisTurn: false,
    cooldown: 0,
  }));

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
            name: 'Hero Skill',
            description: '',
            cost: 2,
            cooldown: 1,
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
        energyCrystal: 5,
        maxEnergy: 5,
        cannotDrawNextTurn: false,
        ministerPool: ministers,
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

function makeMinionCard(id: string): Card {
  return {
    id,
    name: id,
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 1,
    health: 1,
    description: 'Test minion',
    keywords: [],
    effects: [],
  };
}

function setup() {
  counter = new IdCounter();
  const bus = new EventBus();
  const state = makeBaseGameState();
  const rng = new SeededRNG(42);
  return { state, bus, rng, counter };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('Minister Operations', () => {
  it('should successfully use minister skill', () => {
    const { state, bus, rng } = setup();
    state.players[0].deck.push(createCardInstance({
      id: 'draw_target',
      name: 'Draw Target',
      civilization: 'CHINA',
      type: 'MINION',
      rarity: 'COMMON',
      cost: 1,
      attack: 1,
      health: 1,
      description: 'A card to draw',
      keywords: [],
      effects: [],
    }, 0, counter));

    // Active minister is LISI (index 0), cost 1
    const result = executeUseMinisterSkill(state, bus, rng, 0, counter);

    expect(result.success).toBe(true);
    expect(state.players[0].ministerPool[0].skillUsedThisTurn).toBe(true);
    expect(state.players[0].energyCrystal).toBe(4); // 5 - 1
    expect(state.players[0].hand).toHaveLength(1);
    expect(state.players[0].hand[0].id).toBe('draw_target');
    expect(state.players[0].deck).toHaveLength(0);

    if (result.success) {
      const ministerEvent = result.events.find(e => e.type === 'MINISTER_SKILL_USED');
      const drawEvent = result.events.find(e => e.type === 'CARD_DRAWN');
      expect(ministerEvent).toBeDefined();
      expect(drawEvent).toBeDefined();
      if (ministerEvent && ministerEvent.type === 'MINISTER_SKILL_USED') {
        expect(ministerEvent.playerIndex).toBe(0);
        expect(ministerEvent.ministerId).toBe('china_lisi');
      }
    }
  });

  it('should apply a targeted minister buff to the selected friendly minion', () => {
    const { state, bus, rng } = setup();
    state.players[0].activeMinisterIndex = 1;

    const targetMinion = createCardInstance(makeMinionCard('friendly_target'), 0, counter);
    state.players[0].battlefield.push(targetMinion);

    const result = executeUseMinisterSkill(
      state,
      bus,
      rng,
      0,
      counter,
      { type: 'MINION', instanceId: targetMinion.instanceId },
    );

    expect(result.success).toBe(true);
    expect(state.players[0].ministerPool[1].skillUsedThisTurn).toBe(true);
    expect(state.players[0].energyCrystal).toBe(3);
    expect(targetMinion.currentAttack).toBe(3);
    expect(targetMinion.currentHealth).toBe(2);
    expect(targetMinion.currentMaxHealth).toBe(2);
    expect(targetMinion.card.keywords).toContain('RUSH');

    if (result.success) {
      const ministerEvent = result.events.find((event) => event.type === 'MINISTER_SKILL_USED');
      const buffEvent = result.events.find((event) => event.type === 'BUFF_APPLIED');
      expect(ministerEvent).toBeDefined();
      expect(buffEvent).toBeDefined();
    }
  });

  it('should prevent a Chenping-targeted enemy minion from attacking while the buff is active', () => {
    const { state, bus, rng } = setup();
    state.players[0].activeMinisterIndex = 3;

    const friendlyTarget = createCardInstance(makeMinionCard('friendly_target'), 0, counter);
    const enemyAttacker = createCardInstance(makeMinionCard('enemy_attacker'), 1, counter);
    enemyAttacker.justPlayed = false;
    enemyAttacker.remainingAttacks = 1;

    state.players[0].battlefield.push(friendlyTarget);
    state.players[1].battlefield.push(enemyAttacker);

    const skillResult = executeUseMinisterSkill(
      state,
      bus,
      rng,
      0,
      counter,
      { type: 'MINION', instanceId: enemyAttacker.instanceId },
    );

    expect(skillResult.success).toBe(true);
    expect(enemyAttacker.currentAttack).toBeLessThanOrEqual(0);

    state.currentPlayerIndex = 1;

    const attackResult = executeAttack(state, bus, enemyAttacker.instanceId, {
      type: 'MINION',
      instanceId: friendlyTarget.instanceId,
    }, rng, counter);

    expect(attackResult.success).toBe(false);
    if (!attackResult.success) {
      expect(attackResult.errorCode).toBe('MINION_CANNOT_ATTACK');
    }
    expect(friendlyTarget.currentHealth).toBe(1);
  });

  it('should expire temporary minister buffs at the next turn start before the next player acts', () => {
    const { state, bus, rng } = setup();
    state.players[0].deck.push(createCardInstance(makeMinionCard('p1_draw'), 0, counter));
    state.players[1].deck.push(createCardInstance(makeMinionCard('p2_draw'), 1, counter));
    state.players[0].activeMinisterIndex = 1;

    const targetCard: Card = {
      id: 'rush_target',
      name: 'Rush Target',
      civilization: 'CHINA',
      type: 'MINION',
      rarity: 'COMMON',
      cost: 1,
      attack: 1,
      health: 1,
      description: 'Already has rush',
      keywords: ['RUSH'],
      effects: [],
    };
    const targetMinion = createCardInstance(targetCard, 0, counter);
    targetMinion.justPlayed = false;
    state.players[0].battlefield.push(targetMinion);

    const skillResult = executeUseMinisterSkill(
      state,
      bus,
      rng,
      0,
      counter,
      { type: 'MINION', instanceId: targetMinion.instanceId },
    );

    expect(skillResult.success).toBe(true);
    expect(targetMinion.currentAttack).toBe(3);
    expect(targetMinion.currentHealth).toBe(2);
    expect(targetMinion.currentMaxHealth).toBe(2);
    expect(targetMinion.card.keywords).toContain('RUSH');
    expect(targetMinion.buffs).toHaveLength(1);

    const endTurnResult = executeEndTurn(state, bus, counter);

    expect(endTurnResult.success).toBe(true);
    expect(state.currentPlayerIndex).toBe(1);
    expect(state.phase).toBe('MAIN');
    expect(targetMinion.currentAttack).toBe(1);
    expect(targetMinion.currentHealth).toBe(1);
    expect(targetMinion.currentMaxHealth).toBe(1);
    expect(targetMinion.card.keywords).toContain('RUSH');
    expect(targetMinion.buffs).toHaveLength(0);

    if (endTurnResult.success) {
      const buffRemovedEvent = endTurnResult.events.find((event) => event.type === 'BUFF_REMOVED');
      expect(buffRemovedEvent).toBeDefined();
    }
  });

  it('should fail when energy is insufficient for minister skill', () => {
    const { state, bus, rng } = setup();
    state.players[0].energyCrystal = 0;

    const result = executeUseMinisterSkill(state, bus, rng, 0, counter);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('INSUFFICIENT_ENERGY');
    }
  });

  it('should successfully switch minister', () => {
    const { state, bus } = setup();
    expect(state.players[0].activeMinisterIndex).toBe(0);

    const result = executeSwitchMinister(state, bus, 0, 2);

    expect(result.success).toBe(true);
    expect(state.players[0].activeMinisterIndex).toBe(2);
    expect(state.players[0].energyCrystal).toBe(4); // 5 - 1

    if (result.success) {
      const switchEvent = result.events.find(e => e.type === 'MINISTER_CHANGED');
      expect(switchEvent).toBeDefined();
      if (switchEvent && switchEvent.type === 'MINISTER_CHANGED') {
        expect(switchEvent.playerIndex).toBe(0);
        expect(switchEvent.ministerIndex).toBe(2);
      }
    }
  });

  it('should fail when energy is insufficient for switching minister', () => {
    const { state, bus } = setup();
    state.players[0].energyCrystal = 0;

    const result = executeSwitchMinister(state, bus, 0, 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('INSUFFICIENT_ENERGY');
    }
  });

  it('should not allow minister skill when on cooldown', () => {
    const { state, bus, rng } = setup();
    // Set cooldown on the active minister
    state.players[0].ministerPool[0].cooldown = 2;

    const result = executeUseMinisterSkill(state, bus, rng, 0, counter);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('SKILL_ON_COOLDOWN');
    }
  });

  it('should not allow skill use on newly switched minister (cooldown)', () => {
    const { state, bus, rng } = setup();

    // Switch to minister at index 2 (XIAOHE), cooldown 1
    const switchResult = executeSwitchMinister(state, bus, 0, 2);
    expect(switchResult.success).toBe(true);

    // Now try to use XIAOHE's skill - should fail because cooldown was set
    const skillResult = executeUseMinisterSkill(state, bus, rng, 0, counter);

    expect(skillResult.success).toBe(false);
    if (!skillResult.success) {
      expect(skillResult.errorCode).toBe('SKILL_ON_COOLDOWN');
    }
  });
});
