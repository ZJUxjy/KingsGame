import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ALL_CARDS, ALL_EMPEROR_DATA_LIST, CHINA_EMPEROR_DATA_LIST, GameEngine, USA_EMPEROR_DATA_LIST } from '@king-card/core';
import {
  GAME_CONSTANTS,
  getDeckCopyLimit,
  getEditableDeckSize,
  materializeDeckCards,
  type DeckDefinition,
  type EmperorData,
} from '@king-card/shared';
import { buildDeck, getRandomAiEmperorIndex } from '../src/deckBuilder.js';
import { GameManager } from '../src/gameManager.js';

function makeCustomDeckDefinition(emperorData: EmperorData): DeckDefinition {
  const excludedCardIds = new Set([
    ...emperorData.boundGenerals.map((card) => card.id),
    ...emperorData.boundSorceries.map((card) => card.id),
  ]);
  const editableDeckSize = getEditableDeckSize(emperorData);
  const pool = ALL_CARDS.filter(
    (card) =>
      (card.civilization === emperorData.emperorCard.civilization || card.civilization === 'NEUTRAL')
      && !excludedCardIds.has(card.id),
  );
  const orderedPool = [
    ...pool.filter((card) => card.type === 'MINION' || card.type === 'STRATAGEM'),
    ...pool.filter((card) => card.type === 'GENERAL'),
    ...pool.filter((card) => card.type === 'SORCERY'),
    ...pool.filter((card) => card.type === 'EMPEROR'),
  ];
  const mainCardIds: string[] = [];
  const copyCounts = new Map<string, number>();
  let generalCount = 0;
  let sorceryCount = 0;
  let emperorCount = 1;

  for (const card of orderedPool) {
    const remainingTypeLimit =
      card.type === 'GENERAL'
        ? GAME_CONSTANTS.GENERAL_DECK_LIMIT - generalCount
        : card.type === 'SORCERY'
          ? GAME_CONSTANTS.SORCERY_DECK_LIMIT - sorceryCount
          : card.type === 'EMPEROR'
            ? GAME_CONSTANTS.EMPEROR_SOFT_LIMIT - emperorCount
            : getDeckCopyLimit(card);
    const allowedCopies = Math.min(getDeckCopyLimit(card), Math.max(remainingTypeLimit, 0));

    for (let count = copyCounts.get(card.id) ?? 0; count < allowedCopies && mainCardIds.length < editableDeckSize; count++) {
      mainCardIds.push(card.id);
      copyCounts.set(card.id, count + 1);

      if (card.type === 'GENERAL') {
        generalCount += 1;
      } else if (card.type === 'SORCERY') {
        sorceryCount += 1;
      } else if (card.type === 'EMPEROR') {
        emperorCount += 1;
      }
    }

    if (mainCardIds.length === editableDeckSize) {
      break;
    }
  }

  return {
    id: `${emperorData.emperorCard.id}-custom`,
    name: `${emperorData.emperorCard.name} 自定义套牌`,
    civilization: emperorData.emperorCard.civilization,
    emperorCardId: emperorData.emperorCard.id,
    mainCardIds: mainCardIds.reverse(),
  };
}

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

  it('createGame stores a custom deck definition and materializes it for PvE', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const createSpy = vi.spyOn(GameEngine, 'create');
    const emperorData = ALL_EMPEROR_DATA_LIST[3];
    const customDeck = makeCustomDeckDefinition(emperorData);

    const session = (manager as any).createGame('pve', 3, customDeck);

    expect((session as any).playerDeckDefinitions).toEqual([customDeck, null]);
    expect(createSpy).toHaveBeenCalledWith(
      materializeDeckCards(customDeck, ALL_CARDS, emperorData),
      expect.any(Array),
      emperorData,
      ALL_EMPEROR_DATA_LIST[0],
    );
  });

  it('findWaitingPvpGame excludes session whose player[0] socket equals caller', () => {
    const session = manager.createPvpWaiting(0);
    manager.setPlayerSocket(session.id, 0, 'socket-A');

    expect(manager.findWaitingPvpGame('socket-A')).toBeUndefined();
    expect(manager.findWaitingPvpGame('socket-B')?.id).toBe(session.id);
  });

  it('getWaitingSessionsForSocket finds only waiting PvP sessions owned by the given socket', () => {
    const own = manager.createPvpWaiting(0);
    manager.setPlayerSocket(own.id, 0, 'socket-A');

    // Another socket's waiting session (must not be returned)
    const other = manager.createPvpWaiting(1);
    manager.setPlayerSocket(other.id, 0, 'socket-B');

    // Already-paired session owned by socket-A (must not be returned: not waiting)
    const paired = manager.createPvpWaiting(0);
    manager.setPlayerSocket(paired.id, 0, 'socket-A');
    manager.setPlayerSocket(paired.id, 1, 'socket-X');
    paired.state = 'playing';

    const owned = manager.getWaitingSessionsForSocket('socket-A');
    expect(owned).toHaveLength(1);
    expect(owned[0].id).toBe(own.id);
  });

  it('initializePvpEngine materializes stored custom decks for both PvP players', () => {
    const createSpy = vi.spyOn(GameEngine, 'create');
    const player0Deck = makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[3]);
    const player1Deck = makeCustomDeckDefinition(ALL_EMPEROR_DATA_LIST[6]);
    const session = (manager as any).createPvpWaiting(3, player0Deck);
    session.playerEmperorIndices[1] = 6;
    (session as any).playerDeckDefinitions = [player0Deck, player1Deck];

    manager.initializePvpEngine(session);

    expect(createSpy).toHaveBeenCalledWith(
      materializeDeckCards(player0Deck, ALL_CARDS, ALL_EMPEROR_DATA_LIST[3]),
      materializeDeckCards(player1Deck, ALL_CARDS, ALL_EMPEROR_DATA_LIST[6]),
      ALL_EMPEROR_DATA_LIST[3],
      ALL_EMPEROR_DATA_LIST[6],
    );
  });
});
