import { describe, it, expect, beforeEach } from 'vitest';
import { CHINA_EMPEROR_DATA_LIST } from '@king-card/core';
import type { Card, EmperorData } from '@king-card/shared';
import { buildDeck, AI_DECK_EMPEROR_INDEX } from '../src/deckBuilder.js';
import { GameManager } from '../src/gameManager.js';

describe('buildDeck', () => {
  it('returns exactly 30 cards', () => {
    const deck = buildDeck(CHINA_EMPEROR_DATA_LIST[0]);
    expect(deck).toHaveLength(30);
  });

  it('includes all boundGenerals and boundSorceries at the start', () => {
    const emperorData = CHINA_EMPEROR_DATA_LIST[0];
    const deck = buildDeck(emperorData);

    const boundCards = [...emperorData.boundGenerals, ...emperorData.boundSorceries];
    expect(boundCards.length).toBeGreaterThan(0);

    for (let i = 0; i < boundCards.length; i++) {
      expect(deck[i].id).toBe(boundCards[i].id);
    }
  });

  it('does not include any EMPEROR type cards in the fill portion', () => {
    const emperorData = CHINA_EMPEROR_DATA_LIST[0];
    const deck = buildDeck(emperorData);
    const boundCount = emperorData.boundGenerals.length + emperorData.boundSorceries.length;

    for (let i = boundCount; i < deck.length; i++) {
      expect(deck[i].type).not.toBe('EMPEROR');
    }
  });

  it('AI_DECK_EMPEROR_INDEX is 1 (Han)', () => {
    expect(AI_DECK_EMPEROR_INDEX).toBe(1);
  });
});

describe('GameManager', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
  });

  it('createGame creates a game with valid engine', () => {
    const session = manager.createGame('pve', 0);

    expect(session.id).toBeTruthy();
    expect(session.engine).toBeDefined();
    expect(session.state).toBe('waiting');
    expect(session.mode).toBe('pve');
    expect(session.playerEmperorIndices).toEqual([0, AI_DECK_EMPEROR_INDEX]);
  });

  it('createGame engine has non-empty hands for both players', () => {
    const session = manager.createGame('pve', 0);
    const state = session.engine.getGameState();

    expect(state.players[0].hand.length).toBeGreaterThan(0);
    expect(state.players[1].hand.length).toBeGreaterThan(0);
  });

  it('createGame for PvP defaults second emperor to index 0', () => {
    const session = manager.createGame('pvp', 2);

    expect(session.mode).toBe('pvp');
    expect(session.playerEmperorIndices).toEqual([2, 0]);
  });

  it('getGame returns the created game', () => {
    const session = manager.createGame('pve', 0);
    const retrieved = manager.getGame(session.id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(session.id);
  });

  it('getGame returns undefined for non-existent game', () => {
    expect(manager.getGame('non-existent-id')).toBeUndefined();
  });

  it('destroyGame removes the game', () => {
    const session = manager.createGame('pve', 0);
    manager.destroyGame(session.id);

    expect(manager.getGame(session.id)).toBeUndefined();
  });

  it('setPlayerSocket assigns socket ID correctly', () => {
    const session = manager.createGame('pve', 0);
    manager.setPlayerSocket(session.id, 0, 'socket-abc');
    manager.setPlayerSocket(session.id, 1, 'socket-xyz');

    const retrieved = manager.getGame(session.id)!;
    expect(retrieved.players[0]).toBe('socket-abc');
    expect(retrieved.players[1]).toBe('socket-xyz');
  });

  it('getAllGames returns all created games', () => {
    manager.createGame('pve', 0);
    manager.createGame('pve', 1);

    const all = manager.getAllGames();
    expect(all).toHaveLength(2);
  });

  it('getAllGames does not include destroyed games', () => {
    const session = manager.createGame('pve', 0);
    manager.createGame('pve', 1);
    manager.destroyGame(session.id);

    const all = manager.getAllGames();
    expect(all).toHaveLength(1);
    expect(all[0].id).not.toBe(session.id);
  });
});
