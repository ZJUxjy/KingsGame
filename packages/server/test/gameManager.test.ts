import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ALL_EMPEROR_DATA_LIST, CHINA_EMPEROR_DATA_LIST, USA_EMPEROR_DATA_LIST } from '@king-card/core';
import { buildDeck, getRandomAiEmperorIndex } from '../src/deckBuilder.js';
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

  it('only uses same-civilization or neutral cards in the fill portion', () => {
    const emperorData = USA_EMPEROR_DATA_LIST[0];
    const deck = buildDeck(emperorData);
    const boundCount = emperorData.boundGenerals.length + emperorData.boundSorceries.length;

    for (let i = boundCount; i < deck.length; i++) {
      expect(['USA', 'NEUTRAL']).toContain(deck[i].civilization);
    }
  });

  it('getRandomAiEmperorIndex returns an in-range emperor index', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    expect(getRandomAiEmperorIndex()).toBe(ALL_EMPEROR_DATA_LIST.length - 1);
  });
});

describe('GameManager', () => {
  let manager: GameManager;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    manager = new GameManager();
  });

  it('createGame creates a game with valid engine', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const session = manager.createGame('pve', 0);
    const expectedAiIndex = Math.floor(0.5 * ALL_EMPEROR_DATA_LIST.length);

    expect(session.id).toBeTruthy();
    expect(session.engine).toBeDefined();
    expect(session.state).toBe('waiting');
    expect(session.mode).toBe('pve');
    expect(session.playerEmperorIndices).toEqual([0, expectedAiIndex]);
  });

  it('createGame engine has non-empty hands for both players', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
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
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const session = manager.createGame('pve', 0);
    const retrieved = manager.getGame(session.id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(session.id);
  });

  it('getGame returns undefined for non-existent game', () => {
    expect(manager.getGame('non-existent-id')).toBeUndefined();
  });

  it('destroyGame removes the game', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const session = manager.createGame('pve', 0);
    manager.destroyGame(session.id);

    expect(manager.getGame(session.id)).toBeUndefined();
  });

  it('setPlayerSocket assigns socket ID correctly', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const session = manager.createGame('pve', 0);
    manager.setPlayerSocket(session.id, 0, 'socket-abc');
    manager.setPlayerSocket(session.id, 1, 'socket-xyz');

    const retrieved = manager.getGame(session.id)!;
    expect(retrieved.players[0]).toBe('socket-abc');
    expect(retrieved.players[1]).toBe('socket-xyz');
  });

  it('getAllGames returns all created games', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    manager.createGame('pve', 0);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    manager.createGame('pve', 1);

    const all = manager.getAllGames();
    expect(all).toHaveLength(2);
  });

  it('getAllGames does not include destroyed games', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const session = manager.createGame('pve', 0);
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    manager.createGame('pve', 1);
    manager.destroyGame(session.id);

    const all = manager.getAllGames();
    expect(all).toHaveLength(1);
    expect(all[0].id).not.toBe(session.id);
  });

  it('createPvpWaiting creates a session with no engine and player1 emperor = -1', () => {
    const session = manager.createPvpWaiting(2);

    expect(session.mode).toBe('pvp');
    expect(session.state).toBe('waiting');
    expect(session.playerEmperorIndices).toEqual([2, -1]);
    expect(session.engine).toBeNull();
  });

  it('findWaitingPvpGame returns undefined when no waiting PvP games exist', () => {
    manager.createGame('pve', 0);
    expect(manager.findWaitingPvpGame()).toBeUndefined();
  });

  it('findWaitingPvpGame finds a waiting PvP game with player 0 assigned', () => {
    const session = manager.createPvpWaiting(1);
    manager.setPlayerSocket(session.id, 0, 'socket-host');

    const found = manager.findWaitingPvpGame();
    expect(found).toBeDefined();
    expect(found!.id).toBe(session.id);
  });

  it('findWaitingPvpGame skips games where player 1 is already assigned', () => {
    const session = manager.createPvpWaiting(1);
    manager.setPlayerSocket(session.id, 0, 'socket-host');
    manager.setPlayerSocket(session.id, 1, 'socket-guest');

    expect(manager.findWaitingPvpGame()).toBeUndefined();
  });

  it('initializePvpEngine creates a working engine from both emperor indices', () => {
    const session = manager.createPvpWaiting(0);
    session.playerEmperorIndices[1] = 2;

    manager.initializePvpEngine(session);

    expect(session.engine).not.toBeNull();
    const state = session.engine.getGameState();
    expect(state.players[0].hand.length).toBeGreaterThan(0);
    expect(state.players[1].hand.length).toBeGreaterThan(0);
  });
});
