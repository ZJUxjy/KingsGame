import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStateMutator } from '../../../src/engine/state-mutator.js';
import { createCardInstance } from '../../../src/models/card-instance.js';
import { IdCounter } from '../../../src/engine/id-counter.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import type { Card, GameState, Buff } from '@king-card/shared';

let counter: IdCounter;

// ─── Test Fixtures ───────────────────────────────────────────────

const dummyCard: Card = {
  id: 'test_minion',
  name: 'Test Minion',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 3,
  attack: 4,
  health: 5,
  description: 'A test minion',
  keywords: [],
  effects: [],
};

const stratagemCard: Card = {
  id: 'test_stratagem',
  name: 'Test Stratagem',
  civilization: 'CHINA',
  type: 'STRATAGEM',
  rarity: 'RARE',
  cost: 2,
  description: 'A test stratagem',
  keywords: [],
  effects: [],
};

function makeGameState(): GameState {
  return {
    players: [
      {
        id: 'p1',
        name: 'Player 1',
        hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: { name: 'Skill', description: '', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } }, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
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
        maxEnergy: 10,
        cannotDrawNextTurn: false,
        ministerPool: [],
        activeMinisterIndex: -1,
        boundCards: [],
      },
      {
        id: 'p2',
        name: 'Player 2',
        hero: { health: 30, maxHealth: 30, armor: 0, heroSkill: { name: 'Skill', description: '', cost: 0, cooldown: 0, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } }, skillUsedThisTurn: false, skillCooldownRemaining: 0 },
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
  counter = new IdCounter();
  const bus = new EventBus();
  const state = makeGameState();
  const mutator = createStateMutator(state, bus, undefined, counter);
  return { state, bus, mutator };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('StateMutator', () => {
  // ── damage ─────────────────────────────────────────────────────
  describe('damage', () => {
    it('should damage hero health directly when no armor', () => {
      const { state, bus, mutator } = setup();
      const handler = vi.fn();
      bus.on('HERO_DAMAGED', handler);

      mutator.damage({ type: 'HERO', playerIndex: 0 }, 5);

      expect(state.players[0].hero.health).toBe(25);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'HERO_DAMAGED', playerIndex: 0, amount: 5 }),
      );
    });

    it('should absorb damage with armor first', () => {
      const { state, mutator } = setup();
      state.players[0].hero.armor = 3;

      mutator.damage({ type: 'HERO', playerIndex: 0 }, 5);

      expect(state.players[0].hero.armor).toBe(0);
      expect(state.players[0].hero.health).toBe(28); // 5 - 3 = 2 remaining to health
    });

    it('should destroy minion when health drops to 0 or below', () => {
      const { state, mutator } = setup();

      const instance = createCardInstance(dummyCard, 0, counter);
      state.players[0].battlefield.push(instance);

      mutator.damage({ type: 'MINION', instanceId: instance.instanceId }, 5);

      expect(state.players[0].battlefield).toHaveLength(0);
      expect(state.players[0].graveyard).toHaveLength(1);
    });
  });

  // ── heal ───────────────────────────────────────────────────────
  describe('heal', () => {
    it('should heal hero up to maxHealth', () => {
      const { state, bus, mutator } = setup();
      state.players[0].hero.health = 20;
      const handler = vi.fn();
      bus.on('HERO_HEALED', handler);

      mutator.heal({ type: 'HERO', playerIndex: 0 }, 15);

      expect(state.players[0].hero.health).toBe(30);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'HERO_HEALED', amount: 10 }),
      );
    });

    it('should heal minion up to currentMaxHealth', () => {
      const { state, mutator } = setup();

      const instance = createCardInstance(dummyCard, 0, counter);
      instance.currentHealth = 2;
      state.players[0].battlefield.push(instance);

      mutator.heal({ type: 'MINION', instanceId: instance.instanceId }, 10);

      expect(instance.currentHealth).toBe(5); // maxHealth is 5
    });
  });

  // ── drawCards ──────────────────────────────────────────────────
  describe('drawCards', () => {
    it('should draw cards from deck to hand', () => {
      const { state, bus, mutator } = setup();
      state.players[0].deck = [{ ...dummyCard, id: 'card_a' }, { ...dummyCard, id: 'card_b' }];
      const handler = vi.fn();
      bus.on('CARD_DRAWN', handler);

      mutator.drawCards(0, 2);

      expect(state.players[0].hand).toHaveLength(2);
      expect(state.players[0].deck).toHaveLength(0);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should discard when hand is full', () => {
      const { state, bus, mutator } = setup();
      state.players[0].handLimit = 2;
      state.players[0].hand = [{ ...dummyCard, id: 'h1' }, { ...dummyCard, id: 'h2' }];
      state.players[0].deck = [{ ...dummyCard, id: 'card_a' }, { ...dummyCard, id: 'card_b' }];
      const discardHandler = vi.fn();
      bus.on('CARD_DISCARDED', discardHandler);

      mutator.drawCards(0, 2);

      expect(state.players[0].hand).toHaveLength(2);
      expect(state.players[0].graveyard).toHaveLength(2);
      expect(discardHandler).toHaveBeenCalledTimes(2);
    });

    it('should trigger game over when deck is empty', () => {
      const { state, mutator } = setup();
      state.players[0].deck = [];

      mutator.drawCards(0, 1);

      expect(state.isGameOver).toBe(true);
      expect(state.winnerIndex).toBe(1);
      expect(state.winReason).toBe('DECK_EMPTY');
    });

    it('should skip drawing when cannotDrawNextTurn is true', () => {
      const { state, bus, mutator } = setup();
      state.players[0].cannotDrawNextTurn = true;
      state.players[0].deck = [{ ...dummyCard, id: 'card_a' }];
      const lockHandler = vi.fn();
      bus.on('DRAW_LOCKED', lockHandler);

      mutator.drawCards(0, 1);

      expect(lockHandler).toHaveBeenCalledTimes(1);
      expect(state.players[0].cannotDrawNextTurn).toBe(false);
      expect(state.players[0].hand).toHaveLength(0);
    });
  });

  // ── discardCard ────────────────────────────────────────────────
  describe('discardCard', () => {
    it('should move card from hand to graveyard', () => {
      const { state, mutator } = setup();
      const card = { ...dummyCard, id: 'to_discard' };
      state.players[0].hand = [card];

      mutator.discardCard(0, 0);

      expect(state.players[0].hand).toHaveLength(0);
      expect(state.players[0].graveyard).toHaveLength(1);
      expect(state.players[0].graveyard[0].id).toBe('to_discard');
    });
  });

  // ── summonMinion ───────────────────────────────────────────────
  describe('summonMinion', () => {
    it('should create and place minion on battlefield', () => {
      const { state, bus, mutator } = setup();
      const handler = vi.fn();
      bus.on('MINION_SUMMONED', handler);

      mutator.summonMinion(dummyCard, 0);

      expect(state.players[0].battlefield).toHaveLength(1);
      expect(state.players[0].battlefield[0].card.id).toBe('test_minion');
      expect(state.players[0].battlefield[0].currentAttack).toBe(4);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return the actual summoned instance', () => {
      const { state, mutator } = setup();

      const result = mutator.summonMinion(dummyCard, 0);

      expect(result.error).toBeNull();
      expect(result.instance).toBe(state.players[0].battlefield[0]);
      expect(result.instance?.instanceId).toBe(state.players[0].battlefield[0].instanceId);
    });

    it('should insert at specified position', () => {
      const { state, mutator } = setup();

      const inst1 = createCardInstance(dummyCard, 0, counter);
      const inst2 = createCardInstance(dummyCard, 0, counter);
      state.players[0].battlefield = [inst1, inst2];

      mutator.summonMinion({ ...dummyCard, id: 'new_card' }, 0, 1);

      expect(state.players[0].battlefield).toHaveLength(3);
      expect(state.players[0].battlefield[1].card.id).toBe('new_card');
    });
  });

  // ── destroyMinion ──────────────────────────────────────────────
  describe('destroyMinion', () => {
    it('should remove minion from battlefield and add to graveyard', () => {
      const { state, bus, mutator } = setup();

      const instance = createCardInstance(dummyCard, 0, counter);
      state.players[0].battlefield.push(instance);
      const handler = vi.fn();
      bus.on('MINION_DESTROYED', handler);

      mutator.destroyMinion(instance.instanceId);

      expect(state.players[0].battlefield).toHaveLength(0);
      expect(state.players[0].graveyard).toHaveLength(1);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ── modifyStat ─────────────────────────────────────────────────
  describe('modifyStat', () => {
    it('should modify attack of minion', () => {
      const { state, mutator } = setup();

      const instance = createCardInstance(dummyCard, 0, counter);
      state.players[0].battlefield.push(instance);

      mutator.modifyStat({ type: 'MINION', instanceId: instance.instanceId }, 'attack', 3);

      expect(instance.currentAttack).toBe(7);
    });

    it('should modify health and update currentMaxHealth when increased', () => {
      const { state, mutator } = setup();

      const instance = createCardInstance(dummyCard, 0, counter);
      state.players[0].battlefield.push(instance);

      mutator.modifyStat({ type: 'MINION', instanceId: instance.instanceId }, 'health', 3);

      expect(instance.currentHealth).toBe(8);
      expect(instance.currentMaxHealth).toBe(8);
    });

    it('should reduce health without changing maxHealth', () => {
      const { state, mutator } = setup();

      const instance = createCardInstance(dummyCard, 0, counter);
      state.players[0].battlefield.push(instance);

      mutator.modifyStat({ type: 'MINION', instanceId: instance.instanceId }, 'health', -2);

      expect(instance.currentHealth).toBe(3);
      expect(instance.currentMaxHealth).toBe(5);
    });
  });

  // ── applyBuff / removeBuff ────────────────────────────────────
  describe('applyBuff', () => {
    it('should apply buff and update minion stats', () => {
      const { state, mutator } = setup();

      const instance = createCardInstance(dummyCard, 0, counter);
      state.players[0].battlefield.push(instance);

      const buff: Buff = {
        id: 'buff_1',
        attackBonus: 2,
        healthBonus: 1,
        maxHealthBonus: 3,
        keywordsGranted: ['TAUNT'],
        type: 'PERMANENT',
      };

      mutator.applyBuff({ type: 'MINION', instanceId: instance.instanceId }, buff);

      expect(instance.currentAttack).toBe(6);
      expect(instance.currentHealth).toBe(6);
      expect(instance.currentMaxHealth).toBe(8);
      expect(instance.buffs).toHaveLength(1);
      expect(instance.card.keywords).toContain('TAUNT');
    });
  });

  describe('removeBuff', () => {
    it('should reverse buff effects', () => {
      const { state, mutator } = setup();

      const instance = createCardInstance(dummyCard, 0, counter);
      state.players[0].battlefield.push(instance);

      const buff: Buff = {
        id: 'buff_1',
        attackBonus: 2,
        healthBonus: 1,
        maxHealthBonus: 3,
        keywordsGranted: ['TAUNT'],
        type: 'PERMANENT',
      };

      // Apply then remove
      mutator.applyBuff({ type: 'MINION', instanceId: instance.instanceId }, buff);
      mutator.removeBuff({ type: 'MINION', instanceId: instance.instanceId }, 'buff_1');

      expect(instance.currentAttack).toBe(4);
      expect(instance.currentHealth).toBe(5);
      expect(instance.currentMaxHealth).toBe(5);
      expect(instance.buffs).toHaveLength(0);
      expect(instance.card.keywords).not.toContain('TAUNT');
    });
  });

  // ── gainArmor ──────────────────────────────────────────────────
  describe('gainArmor', () => {
    it('should increase hero armor', () => {
      const { state, mutator } = setup();

      mutator.gainArmor(0, 5);

      expect(state.players[0].hero.armor).toBe(5);
    });
  });

  // ── spendEnergy ────────────────────────────────────────────────
  describe('spendEnergy', () => {
    it('should reduce energyCrystal and emit event', () => {
      const { state, bus, mutator } = setup();
      const handler = vi.fn();
      bus.on('ENERGY_SPENT', handler);

      mutator.spendEnergy(0, 3);

      expect(state.players[0].energyCrystal).toBe(2);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ENERGY_SPENT', playerIndex: 0, amount: 3, remainingEnergy: 2 }),
      );
    });
  });

  // ── activateStratagem ──────────────────────────────────────────
  describe('activateStratagem', () => {
    it('should add stratagem to player and emit event', () => {
      const { state, bus, mutator } = setup();
      const handler = vi.fn();
      bus.on('STRATAGEM_ACTIVATED', handler);

      mutator.activateStratagem(stratagemCard, 0);

      expect(state.players[0].activeStratagems).toHaveLength(1);
      expect(state.players[0].activeStratagems[0].card.id).toBe('test_stratagem');
      expect(state.players[0].activeStratagems[0].remainingTurns).toBe(2);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ── setDrawLock ────────────────────────────────────────────────
  describe('setDrawLock', () => {
    it('should set cannotDrawNextTurn flag', () => {
      const { state, mutator } = setup();

      mutator.setDrawLock(0, true);

      expect(state.players[0].cannotDrawNextTurn).toBe(true);

      mutator.setDrawLock(0, false);

      expect(state.players[0].cannotDrawNextTurn).toBe(false);
    });
  });

  // ── grantExtraAttack ───────────────────────────────────────────
  describe('grantExtraAttack', () => {
    it('should increment minion remainingAttacks', () => {
      const { state, mutator } = setup();

      const instance = createCardInstance(dummyCard, 0, counter);
      state.players[0].battlefield.push(instance);

      mutator.grantExtraAttack(instance.instanceId);

      expect(instance.remainingAttacks).toBe(1);
    });
  });
});
