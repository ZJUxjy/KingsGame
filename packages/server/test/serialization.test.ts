import { describe, it, expect } from 'vitest';
import { GameEngine, CHINA_EMPEROR_DATA_LIST, CHINA_ALL_CARDS } from '@king-card/core';
import type { Card } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';
import { serializeForPlayer } from '../src/serialization.js';
import type { SerializedGameState, HiddenCard } from '../src/types.js';

function buildTestDeck(emperorData: any): Card[] {
  const nonEmperorCards = CHINA_ALL_CARDS.filter((c) => c.type !== 'EMPEROR');
  const deck: Card[] = [...emperorData.boundGenerals, ...emperorData.boundSorceries];
  let fillIdx = 0;
  while (deck.length < GAME_CONSTANTS.DECK_SIZE) {
    deck.push(nonEmperorCards[fillIdx % nonEmperorCards.length]);
    fillIdx++;
  }
  return deck;
}

function createTestEngine() {
  return GameEngine.create(
    buildTestDeck(CHINA_EMPEROR_DATA_LIST[0]),
    buildTestDeck(CHINA_EMPEROR_DATA_LIST[1]),
    CHINA_EMPEROR_DATA_LIST[0],
    CHINA_EMPEROR_DATA_LIST[1],
  );
}

function isHiddenCard(card: unknown): card is HiddenCard {
  return (
    typeof card === 'object' &&
    card !== null &&
    'hidden' in card &&
    (card as HiddenCard).hidden === true
  );
}

describe('serializeForPlayer', () => {
  it('returns correct structure with me and opponent', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    expect(serialized).toHaveProperty('me');
    expect(serialized).toHaveProperty('opponent');
    expect(serialized.me).toHaveProperty('id');
    expect(serialized.me).toHaveProperty('name');
    expect(serialized.me).toHaveProperty('hero');
    expect(serialized.me).toHaveProperty('hand');
    expect(serialized.me).toHaveProperty('battlefield');
    expect(serialized.opponent).toHaveProperty('id');
    expect(serialized.opponent).toHaveProperty('name');
  });

  it('own hand contains full Card objects (check .name exists)', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    expect(serialized.me.hand.length).toBeGreaterThan(0);
    for (const card of serialized.me.hand) {
      expect(isHiddenCard(card)).toBe(false);
      expect('name' in (card as Card)).toBe(true);
      expect((card as Card).name).toBeTruthy();
      expect((card as Card).cost).toBeDefined();
    }
  });

  it('opponent hand contains only { hidden: true } objects', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    expect(serialized.opponent.hand.length).toBeGreaterThan(0);
    for (const card of serialized.opponent.hand) {
      expect(isHiddenCard(card)).toBe(true);
      expect((card as HiddenCard).hidden).toBe(true);
    }
  });

  it('both sides battlefield contains CardInstance data', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    // Battlefield may be empty at start, but the property should exist and be an array
    expect(Array.isArray(serialized.me.battlefield)).toBe(true);
    expect(Array.isArray(serialized.opponent.battlefield)).toBe(true);

    // If there are battlefield cards, verify they have CardInstance fields
    for (const minion of serialized.me.battlefield) {
      expect(minion).toHaveProperty('instanceId');
      expect(minion).toHaveProperty('currentAttack');
      expect(minion).toHaveProperty('currentHealth');
      expect(minion).toHaveProperty('card');
    }
    for (const minion of serialized.opponent.battlefield) {
      expect(minion).toHaveProperty('instanceId');
      expect(minion).toHaveProperty('currentAttack');
      expect(minion).toHaveProperty('currentHealth');
      expect(minion).toHaveProperty('card');
    }
  });

  it('deckCount matches deck.length for both sides', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    expect(serialized.me.deckCount).toBe(state.players[0].deck.length);
    expect(serialized.opponent.deckCount).toBe(state.players[1].deck.length);
  });

  it('costModifiers is NOT present in the output', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    const meJson = JSON.stringify(serialized.me);
    const opponentJson = JSON.stringify(serialized.opponent);

    expect(meJson).not.toContain('costModifiers');
    expect(opponentJson).not.toContain('costModifiers');
    expect('costModifiers' in serialized.me).toBe(false);
    expect('costModifiers' in serialized.opponent).toBe(false);
  });

  it('JSON.stringify/parse round-trip works without errors', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    // This should not throw
    const json = JSON.stringify(serialized);
    const parsed = JSON.parse(json) as SerializedGameState;

    expect(parsed).toEqual(serialized);
    expect(parsed.me.hand.length).toBe(serialized.me.hand.length);
    expect(parsed.opponent.hand.length).toBe(serialized.opponent.hand.length);
  });

  it('graveyard is included', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    expect(serialized.me).toHaveProperty('graveyard');
    expect(serialized.opponent).toHaveProperty('graveyard');
    expect(Array.isArray(serialized.me.graveyard)).toBe(true);
    expect(Array.isArray(serialized.opponent.graveyard)).toBe(true);
  });

  it('isGameOver, winnerIndex, winReason are correctly passed through', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    // At the start of the game, game should not be over
    expect(serialized.isGameOver).toBe(state.isGameOver);
    expect(serialized.winnerIndex).toBe(state.winnerIndex);
    expect(serialized.winReason).toBe(state.winReason);

    expect(serialized.isGameOver).toBe(false);
    expect(serialized.winnerIndex).toBeNull();
    expect(serialized.winReason).toBeNull();
  });

  it('turnNumber, currentPlayerIndex, phase are correct', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    expect(serialized.turnNumber).toBe(state.turnNumber);
    expect(serialized.currentPlayerIndex).toBe(state.currentPlayerIndex);
    expect(serialized.phase).toBe(state.phase);
  });

  it('serializes correctly for player 1 perspective', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 1);

    // Player 1's hand should be visible
    expect(serialized.me.hand.length).toBeGreaterThan(0);
    for (const card of serialized.me.hand) {
      expect(isHiddenCard(card)).toBe(false);
    }

    // Player 0's hand (opponent) should be hidden
    expect(serialized.opponent.hand.length).toBeGreaterThan(0);
    for (const card of serialized.opponent.hand) {
      expect(isHiddenCard(card)).toBe(true);
    }

    // me should be player 1, opponent should be player 0
    expect(serialized.me.id).toBe(state.players[1].id);
    expect(serialized.opponent.id).toBe(state.players[0].id);
  });

  it('includes boundCards, activeStratagems, cannotDrawNextTurn', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    expect(serialized.me).toHaveProperty('boundCards');
    expect(serialized.me).toHaveProperty('activeStratagems');
    expect(serialized.me).toHaveProperty('cannotDrawNextTurn');
    expect(serialized.opponent).toHaveProperty('boundCards');
    expect(serialized.opponent).toHaveProperty('activeStratagems');
    expect(serialized.opponent).toHaveProperty('cannotDrawNextTurn');
  });

  it('includes ministerPool and activeMinisterIndex', () => {
    const engine = createTestEngine();
    const state = engine.getGameState();
    const serialized = serializeForPlayer(state, 0);

    expect(serialized.me).toHaveProperty('ministerPool');
    expect(serialized.me).toHaveProperty('activeMinisterIndex');
    expect(serialized.opponent).toHaveProperty('ministerPool');
    expect(serialized.opponent).toHaveProperty('activeMinisterIndex');

    expect(serialized.me.activeMinisterIndex).toBe(state.players[0].activeMinisterIndex);
    expect(serialized.opponent.activeMinisterIndex).toBe(state.players[1].activeMinisterIndex);
  });
});
