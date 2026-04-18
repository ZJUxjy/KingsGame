import { describe, it, expect } from 'vitest';
import { executePlayCard, executeAttack, executeEndTurn, executeUseHeroSkill } from '../../../src/engine/action-executor.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import { createCardInstance } from '../../../src/models/card-instance.js';
import { IdCounter } from '../../../src/engine/id-counter.js';
import { SeededRNG } from '../../../src/engine/rng.js';
import { WUGUZHIHUO } from '../../../src/cards/definitions/china-sorceries.js';
import { BINGFA_SANSHILIUJI, MINGXIU_ZHANDAO } from '../../../src/cards/definitions/china-stratagems.js';
import { TANG_TAIZONG } from '../../../src/cards/definitions/china-emperors.js';
import type { Card, GameState, CardInstance } from '@king-card/shared';

let counter: IdCounter;

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

function makeStratagemCard(id: string, cost = 1): Card {
  return {
    id,
    name: `Stratagem ${id}`,
    civilization: 'CHINA',
    type: 'STRATAGEM',
    rarity: 'RARE',
    cost,
    description: 'A test stratagem',
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
        costReduction: 0,
        energyCrystal: 5,
        maxEnergy: 5,
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
  counter = new IdCounter();
  const bus = new EventBus();
  const state = makeBaseGameState();
  const rng = new SeededRNG(42);
  return { state, bus, rng, counter };
}

function addMinionToBattlefield(
  state: GameState,
  playerIndex: number,
  cardOverrides: Partial<Card> & { id: string },
): CardInstance {
  const card = makeMinionCard(cardOverrides);
  const instance = createCardInstance(card, playerIndex as 0 | 1, counter);
  instance.justPlayed = false;
  instance.remainingAttacks = 1;
  state.players[playerIndex].battlefield.push(instance);
  return instance;
}

// ─── Tests ───────────────────────────────────────────────────────

describe('ActionExecutor', () => {
  // ── executePlayCard ─────────────────────────────────────────────
  describe('executePlayCard', () => {
    it('should successfully play a MINION card', () => {
      const { state, bus, rng } = setup();
      const card = makeMinionCard({ id: 'minion_1', cost: 2 });
      state.players[0].hand.push(card);

      const result = executePlayCard(state, bus, rng, 0, 0, counter);

      expect(result.success).toBe(true);
      expect(state.players[0].hand).toHaveLength(0);
      expect(state.players[0].battlefield).toHaveLength(1);
      expect(state.players[0].battlefield[0].card.id).toBe('minion_1');
    });

    it('should fail when energy is insufficient', () => {
      const { state, bus, rng } = setup();
      const card = makeMinionCard({ id: 'expensive', cost: 10 });
      state.players[0].hand.push(card);

      const result = executePlayCard(state, bus, rng, 0, 0, counter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('INSUFFICIENT_ENERGY');
      }
      // State should not be modified
      expect(state.players[0].hand).toHaveLength(1);
      expect(state.players[0].energyCrystal).toBe(5);
    });

    it('should fail when battlefield is full', () => {
      const { state, bus, rng } = setup();
      const card = makeMinionCard({ id: 'extra', cost: 1 });
      state.players[0].hand.push(card);

      // Fill battlefield with 7 minions
      for (let i = 0; i < 7; i++) {
        addMinionToBattlefield(state, 0, { id: `fill_${i}` });
      }

      const result = executePlayCard(state, bus, rng, 0, 0, counter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('BOARD_FULL');
      }
      expect(state.players[0].hand).toHaveLength(1);
    });

    it('should fail when non-current player tries to play a card', () => {
      const { state, bus, rng } = setup();
      const card = makeMinionCard({ id: 'minion_p2', cost: 1 });
      state.players[1].hand.push(card);

      const result = executePlayCard(state, bus, rng, 1, 0, counter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('INVALID_PHASE');
      }
    });

    it('should successfully play a STRATAGEM card', () => {
      const { state, bus, rng } = setup();
      const card = makeStratagemCard('strat_1', 2);
      state.players[0].hand.push(card);

      const result = executePlayCard(state, bus, rng, 0, 0, counter);

      expect(result.success).toBe(true);
      expect(state.players[0].hand).toHaveLength(0);
      expect(state.players[0].battlefield).toHaveLength(0); // Stratagems don't go to battlefield
    });

    it('should deduct energy after playing a card', () => {
      const { state, bus, rng } = setup();
      const card = makeMinionCard({ id: 'minion_cost3', cost: 3 });
      state.players[0].hand.push(card);

      executePlayCard(state, bus, rng, 0, 0, counter);

      expect(state.players[0].energyCrystal).toBe(2); // 5 - 3
    });

    it('should move card from hand to battlefield', () => {
      const { state, bus, rng } = setup();
      const card = makeMinionCard({ id: 'minion_move', cost: 1, attack: 4, health: 5 });
      state.players[0].hand.push(card);

      executePlayCard(state, bus, rng, 0, 0, counter);

      expect(state.players[0].hand).toHaveLength(0);
      expect(state.players[0].battlefield).toHaveLength(1);
      expect(state.players[0].battlefield[0].card.id).toBe('minion_move');
      expect(state.players[0].battlefield[0].currentAttack).toBe(4);
      expect(state.players[0].battlefield[0].currentHealth).toBe(5);
    });

    it('should emit CARD_PLAYED with the summoned minion instance id', () => {
      const { state, bus, rng } = setup();
      const card = makeMinionCard({ id: 'minion_event', cost: 1 });
      state.players[0].hand.push(card);

      const result = executePlayCard(state, bus, rng, 0, 0, counter);

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      const playedEvent = result.events.find((event) => event.type === 'CARD_PLAYED');
      const summonedEvent = result.events.find((event) => event.type === 'MINION_SUMMONED');

      expect(playedEvent).toEqual({
        type: 'CARD_PLAYED',
        playerIndex: 0,
        card,
        instanceId: state.players[0].battlefield[0].instanceId,
      });
      expect(summonedEvent).toEqual({
        type: 'MINION_SUMMONED',
        instance: state.players[0].battlefield[0],
      });
      expect(playedEvent?.instanceId).toBe(summonedEvent?.instance.instanceId);
    });

    it('should execute declared ON_PLAY effects when playing a SORCERY card', () => {
      const { state, bus, rng } = setup();
      state.players[0].hand.push(WUGUZHIHUO);

      const friendlyMinion = addMinionToBattlefield(state, 0, { id: 'friendly_target' });
      const enemyMinion = addMinionToBattlefield(state, 1, { id: 'enemy_target' });

      const result = executePlayCard(state, bus, rng, 0, 0, counter);

      expect(result.success).toBe(true);
      expect(state.players[0].battlefield).not.toContain(friendlyMinion);
      expect(state.players[1].battlefield).not.toContain(enemyMinion);
      expect(state.players[0].graveyard).toContain(friendlyMinion.card);
      expect(state.players[1].graveyard).toContain(enemyMinion.card);

      if (result.success) {
        const destroyedEvents = result.events.filter((event) => event.type === 'MINION_DESTROYED');
        expect(destroyedEvents).toHaveLength(2);
      }
    });

    it('should execute declared ON_PLAY effects when playing a STRATAGEM card', () => {
      const { state, bus, rng } = setup();
      state.players[0].hand.push(BINGFA_SANSHILIUJI);
      state.players[0].deck.push(
        createCardInstance(makeMinionCard({ id: 'draw_1' }), 0, counter),
        createCardInstance(makeMinionCard({ id: 'draw_2' }), 0, counter),
      );

      const result = executePlayCard(state, bus, rng, 0, 0, counter);

      expect(result.success).toBe(true);
      expect(state.players[0].hand.map((card) => card.id)).toEqual(['draw_1', 'draw_2']);
      expect(state.players[0].deck).toHaveLength(0);

      if (result.success) {
        const drawnEvents = result.events.filter((event) => event.type === 'CARD_DRAWN');
        expect(drawnEvents).toHaveLength(2);
      }
    });

    it('should apply active cost modifiers when validating and spending card cost', () => {
      const { state, bus, rng } = setup();
      state.players[0].energyCrystal = 3;
      state.players[0].hand.push(MINGXIU_ZHANDAO);

      const stratagemResult = executePlayCard(state, bus, rng, 0, 0, counter);
      expect(stratagemResult.success).toBe(true);
      expect(state.players[0].costModifiers).toHaveLength(1);

      state.players[0].hand.push(makeMinionCard({ id: 'discounted_minion', cost: 2 }));

      const result = executePlayCard(state, bus, rng, 0, 0, counter);

      expect(result.success).toBe(true);
      expect(state.players[0].energyCrystal).toBe(0);
      if (result.success) {
        const energySpentEvents = result.events.filter((event) => event.type === 'ENERGY_SPENT');
        expect(energySpentEvents.at(-1)).toMatchObject({ amount: 1, remainingEnergy: 0 });
      }
    });
  });

  // ── executeAttack ──────────────────────────────────────────────
  describe('executeAttack', () => {
    it('should successfully attack an enemy minion', () => {
      const { state, bus, rng } = setup();
      const attacker = addMinionToBattlefield(state, 0, { id: 'attacker', attack: 3, health: 3 });
      const target = addMinionToBattlefield(state, 1, { id: 'target', attack: 2, health: 5 });

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'MINION',
        instanceId: target.instanceId,
      }, rng, counter);

      expect(result.success).toBe(true);
      expect(target.currentHealth).toBe(2); // 5 - 3
      expect(attacker.currentHealth).toBe(1); // 3 - 2 (counterattack)
    });

    it('should fail when attacker has no remaining attacks', () => {
      const { state, bus, rng } = setup();
      const attacker = addMinionToBattlefield(state, 0, { id: 'tired' });
      attacker.remainingAttacks = 0;
      const target = addMinionToBattlefield(state, 1, { id: 'target2' });

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'MINION',
        instanceId: target.instanceId,
      }, rng, counter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('MINION_CANNOT_ATTACK');
      }
    });

    it('should fail when attacker belongs to non-current player', () => {
      const { state, bus, rng } = setup();
      const attacker = addMinionToBattlefield(state, 1, { id: 'enemy_attacker' });
      const target = addMinionToBattlefield(state, 0, { id: 'my_minion' });

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'MINION',
        instanceId: target.instanceId,
      }, rng, counter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('INVALID_TARGET');
      }
    });

    it('should decrement remaining attacks after attacking', () => {
      const { state, bus, rng } = setup();
      const attacker = addMinionToBattlefield(state, 0, { id: 'attack_once' });
      attacker.remainingAttacks = 1;
      const target = addMinionToBattlefield(state, 1, { id: 'target3', health: 10 });

      executeAttack(state, bus, attacker.instanceId, {
        type: 'MINION',
        instanceId: target.instanceId,
      }, rng, counter);

      expect(attacker.remainingAttacks).toBe(0);
    });

    it('should allow a ready RUSH minion to attack hero on subsequent turns', () => {
      const { state, bus, rng } = setup();
      const attacker = addMinionToBattlefield(state, 0, { id: 'rusher', keywords: ['RUSH'] });
      attacker.remainingAttacks = 1;
      // justPlayed = false (already set by addMinionToBattlefield) — simulates a later turn

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'HERO',
        playerIndex: 1,
      }, rng, counter);

      expect(result.success).toBe(true);
      expect(state.players[1].hero.health).toBe(28);
      expect(attacker.remainingAttacks).toBe(0);
    });

    it('should NOT allow a freshly played RUSH minion to attack the hero on the turn it is played', () => {
      const { state, bus, rng } = setup();
      const card = makeMinionCard({ id: 'rush_fresh', attack: 3, keywords: ['RUSH'] });
      const attacker = createCardInstance(card, 0, counter);
      // justPlayed = true (default from createCardInstance), remainingAttacks = 1 (RUSH)
      state.players[0].battlefield.push(attacker);

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'HERO',
        playerIndex: 1,
      }, rng, counter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('INVALID_TARGET');
      }
      expect(state.players[1].hero.health).toBe(30);
    });

    it('should allow a freshly played RUSH minion to attack an enemy minion on the turn it is played', () => {
      const { state, bus, rng } = setup();
      const card = makeMinionCard({ id: 'rush_fresh2', attack: 3, keywords: ['RUSH'] });
      const attacker = createCardInstance(card, 0, counter);
      state.players[0].battlefield.push(attacker);
      const enemyMinion = addMinionToBattlefield(state, 1, { id: 'enemy_target', health: 5 });

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'MINION',
        instanceId: enemyMinion.instanceId,
      }, rng, counter);

      expect(result.success).toBe(true);
      expect(enemyMinion.currentHealth).toBeLessThan(5);
    });

    it('should allow a freshly played CHARGE minion to attack the hero on the turn it is played', () => {
      const { state, bus, rng } = setup();
      const card = makeMinionCard({ id: 'charge_fresh', attack: 4, keywords: ['CHARGE'] });
      const attacker = createCardInstance(card, 0, counter);
      // justPlayed = true (default), remainingAttacks = 1 (CHARGE)
      state.players[0].battlefield.push(attacker);

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'HERO',
        playerIndex: 1,
      }, rng, counter);

      expect(result.success).toBe(true);
      expect(state.players[1].hero.health).toBe(26); // 30 - 4
    });

    it('should allow CHARGE minion to attack hero', () => {
      const { state, bus, rng } = setup();
      const attacker = addMinionToBattlefield(state, 0, { id: 'charger', attack: 5, keywords: ['CHARGE'] });
      attacker.remainingAttacks = 1;

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'HERO',
        playerIndex: 1,
      }, rng, counter);

      expect(result.success).toBe(true);
      expect(state.players[1].hero.health).toBe(25); // 30 - 5
    });

    it('should allow an ordinary ready minion to attack the enemy hero', () => {
      const { state, bus, rng } = setup();
      const attacker = addMinionToBattlefield(state, 0, { id: 'ready_hero_attacker', attack: 4 });
      attacker.remainingAttacks = 1;

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'HERO',
        playerIndex: 1,
      }, rng, counter);

      expect(result.success).toBe(true);
      expect(state.players[1].hero.health).toBe(26);
      expect(attacker.remainingAttacks).toBe(0);
    });

    it('should not allow a freshly summoned non-CHARGE minion to attack the enemy hero', () => {
      const { state, bus, rng } = setup();
      const attacker = createCardInstance(makeMinionCard({ id: 'fresh_hero_attacker', attack: 4 }), 0, counter);
      state.players[0].battlefield.push(attacker);

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'HERO',
        playerIndex: 1,
      }, rng, counter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('MINION_CANNOT_ATTACK');
      }
      expect(state.players[1].hero.health).toBe(30);
    });

    it('should require attacking TAUNT minion first', () => {
      const { state, bus, rng } = setup();
      const attacker = addMinionToBattlefield(state, 0, { id: 'normal_att', attack: 3 });
      attacker.remainingAttacks = 1;
      // Add a taunt minion on opponent's side
      const taunt = addMinionToBattlefield(state, 1, { id: 'taunt_minion', keywords: ['TAUNT'], health: 10 });
      // Add a non-taunt minion
      const nonTaunt = addMinionToBattlefield(state, 1, { id: 'non_taunt', health: 5 });

      // Try to attack the non-taunt minion
      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'MINION',
        instanceId: nonTaunt.instanceId,
      }, rng, counter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('INVALID_TARGET');
      }

      // But attacking the taunt should work
      const result2 = executeAttack(state, bus, attacker.instanceId, {
        type: 'MINION',
        instanceId: taunt.instanceId,
      }, rng, counter);
      expect(result2.success).toBe(true);
    });

    it('should still require attacking a TAUNT minion before the enemy hero', () => {
      const { state, bus, rng } = setup();
      const attacker = addMinionToBattlefield(state, 0, { id: 'hero_attacker', attack: 3 });
      const tauntMinion = addMinionToBattlefield(state, 1, {
        id: 'hero_guard',
        keywords: ['TAUNT'],
        health: 6,
      });
      attacker.remainingAttacks = 1;

      const result = executeAttack(state, bus, attacker.instanceId, {
        type: 'HERO',
        playerIndex: 1,
      }, rng, counter);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('INVALID_TARGET');
        expect(result.message).toBe('Must attack a TAUNT minion before attacking the hero');
      }
      expect(state.players[1].hero.health).toBe(30);
      expect(tauntMinion.currentHealth).toBe(6);
    });
  });

  // ── executeEndTurn ─────────────────────────────────────────────
  describe('executeEndTurn', () => {
    it('should switch current player and start new turn', () => {
      const { state, bus } = setup();
      // Give players some deck cards for draw
      state.players[0].deck.push(createCardInstance(makeMinionCard({ id: 'deck_0' }), 0, counter));
      state.players[1].deck.push(createCardInstance(makeMinionCard({ id: 'deck_1' }), 1, counter));

      expect(state.currentPlayerIndex).toBe(0);

      const result = executeEndTurn(state, bus, counter);

      expect(result.success).toBe(true);
      expect(state.currentPlayerIndex).toBe(1);
      expect(state.phase).toBe('MAIN');
      expect(state.turnNumber).toBe(2);
    });
  });

  // ── executeUseHeroSkill ───────────────────────────────────────
  describe('executeUseHeroSkill', () => {
    it('should apply explicit ENEMY_MINION hero skill targeting when a target is provided', () => {
      const { state, bus, rng } = setup();
      state.players[0].hero.heroSkill = {
        name: 'Targeted Bolt',
        description: 'Deal 4 damage to an enemy minion',
        cost: 1,
        cooldown: 0,
        effect: {
          trigger: 'ON_PLAY',
          type: 'DAMAGE',
          params: { target: 'ENEMY_MINION', amount: 4 },
        },
      };

      const enemyMinion = addMinionToBattlefield(state, 1, {
        id: 'enemy_target',
        health: 6,
      });

      const result = executeUseHeroSkill(state, bus, rng, 0, counter, {
        type: 'MINION',
        instanceId: enemyMinion.instanceId,
      });

      expect(result.success).toBe(true);
      expect(enemyMinion.currentHealth).toBe(2);
      expect(state.players[0].energyCrystal).toBe(4);
    });

    it('should summon a 1/1 clone of the targeted friendly minion for Tang Taizong', () => {
      const { state, bus, rng } = setup();
      state.players[0].hero.heroSkill = TANG_TAIZONG.heroSkill!;

      const target = addMinionToBattlefield(state, 0, {
        id: 'clone_source',
        attack: 7,
        health: 8,
      });

      const result = executeUseHeroSkill(state, bus, rng, 0, counter, {
        type: 'MINION',
        instanceId: target.instanceId,
      });

      expect(result.success).toBe(true);
      expect(state.players[0].energyCrystal).toBe(2);
      expect(state.players[0].battlefield).toHaveLength(2);

      const clone = state.players[0].battlefield[1];
      expect(clone.card.id).toBe(target.card.id);
      expect(clone.currentAttack).toBe(1);
      expect(clone.currentHealth).toBe(1);
      expect(clone.currentMaxHealth).toBe(1);

      if (result.success) {
        const summonedEvent = result.events.find((event) => event.type === 'MINION_SUMMONED');
        const skillEvent = result.events.find((event) => event.type === 'HERO_SKILL_USED');

        expect(summonedEvent).toBeDefined();
        expect(skillEvent).toBeDefined();
      }
    });

    it('should fail Tang Taizong clone hero skill when battlefield is full', () => {
      const { state, bus, rng } = setup();
      state.players[0].hero.heroSkill = TANG_TAIZONG.heroSkill!;

      for (let i = 0; i < 7; i += 1) {
        addMinionToBattlefield(state, 0, { id: `full_${i}` });
      }
      const target = state.players[0].battlefield[0];

      const result = executeUseHeroSkill(state, bus, rng, 0, counter, {
        type: 'MINION',
        instanceId: target.instanceId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe('BOARD_FULL');
      }
      expect(state.players[0].battlefield).toHaveLength(7);
      expect(state.players[0].energyCrystal).toBe(5);
      expect(state.players[0].hero.skillUsedThisTurn).toBe(false);
    });
  });
});
