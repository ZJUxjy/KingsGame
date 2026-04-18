import { create } from 'zustand';
import type {
  GamePhase,
  ValidAction,
  WinReason,
  TargetRef,
  CardInstance,
  HeroState,
  Minister,
  Card,
  ActiveStratagem,
  Civilization,
  DeckDefinition,
} from '@king-card/shared';
import { socketService } from '../services/socketService.js';
import { useLocaleStore } from './localeStore.js';
import {
  CLIENT_ERROR_CODE,
  getClientErrorMessage,
} from '../utils/clientErrors.js';

export type { ValidAction } from '@king-card/shared';

/** Mirrors the server's HiddenCard serialized shape (opponent's face-down cards). */
export type HiddenCard = { hidden: true };

// These types mirror what the server sends
export interface SerializedGameState {
  turnNumber: number;
  currentPlayerIndex: 0 | 1;
  phase: GamePhase;
  isGameOver: boolean;
  winnerIndex: number | null;
  winReason: WinReason | null;
  me: {
    id: string;
    name: string;
    civilization: Civilization;
    hero: HeroState;
    hand: Card[];
    battlefield: CardInstance[];
    energyCrystal: number;
    maxEnergy: number;
    deckCount: number;
    activeMinisterIndex: number;
    ministerPool: Minister[];
    activeStratagems: ActiveStratagem[];
    cannotDrawNextTurn: boolean;
    boundCards: Card[];
    graveyard: Card[];
  };
  opponent: {
    id: string;
    name: string;
    civilization: Civilization;
    hero: HeroState;
    hand: (Card | HiddenCard)[];
    battlefield: CardInstance[];
    energyCrystal: number;
    maxEnergy: number;
    deckCount: number;
    activeMinisterIndex: number;
    ministerPool: Minister[];
    activeStratagems: ActiveStratagem[];
    cannotDrawNextTurn: boolean;
    boundCards: Card[];
    graveyard: Card[];
  };
}

export type UiPhase = 'lobby' | 'hero-select' | 'pvp-waiting' | 'playing' | 'game-over' | 'collection' | 'deck-builder';

export type PendingSkillAction =
  | { type: 'HERO' }
  | { type: 'MINISTER' }
  | { type: 'GENERAL'; instanceId: string; skillIndex: number };

interface GameStore {
  // Connection
  connected: boolean;
  gameId: string | null;
  playerIndex: 0 | 1 | null;
  gameMode: 'pve' | 'pvp';

  // Game state
  gameState: SerializedGameState | null;
  validActions: ValidAction[];

  // UI state
  uiPhase: UiPhase;
  selectedAttacker: string | null;
  pendingSkillAction: PendingSkillAction | null;
  error: string | null;

  // Last game start args (for restartGame to replay the previous match)
  lastEmperorIndex: number | null;
  lastDeckDefinition: DeckDefinition | null;

  // Computed
  isMyTurn: () => boolean;

  // Actions (emit to server)
  connect: (url: string) => void;
  joinGame: (emperorIndex: number, deck: DeckDefinition) => void;
  joinPvp: (emperorIndex: number, deck: DeckDefinition) => void;
  playCard: (handIndex: number, boardPosition?: number) => void;
  attack: (attackerInstanceId: string, target: TargetRef) => void;
  endTurn: () => void;
  useHeroSkill: (target?: TargetRef) => void;
  useMinisterSkill: (target?: TargetRef) => void;
  useGeneralSkill: (instanceId: string, skillIndex: number, target?: TargetRef) => void;
  switchMinister: (ministerIndex: number) => void;
  concede: () => void;
  restartGame: () => void;
  backToMainMenu: () => void;

  // UI actions
  setSelectedAttacker: (id: string | null) => void;
  setPendingSkillAction: (action: PendingSkillAction | null) => void;
  clearTargetingSelection: () => void;
  clearError: () => void;
  setUiPhase: (phase: UiPhase) => void;

  // Internal
  _setConnected: (v: boolean) => void;
  _setGameId: (v: string | null) => void;
  _setPlayerIndex: (v: 0 | 1 | null) => void;
  _setGameState: (v: SerializedGameState) => void;
  _setValidActions: (v: ValidAction[]) => void;
  _setError: (code: string, message: string) => void;
  _handleGameOver: (winnerIndex: number, reason: WinReason) => void;
  _setGameMode: (mode: 'pve' | 'pvp') => void;
  _reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Connection
  connected: false,
  gameId: null,
  playerIndex: null,
  gameMode: 'pve' as const,

  // Game state
  gameState: null,
  validActions: [],

  // UI state
  uiPhase: 'lobby',
  selectedAttacker: null,
  pendingSkillAction: null,
  error: null,

  // Last game start args
  lastEmperorIndex: null,
  lastDeckDefinition: null,

  // Computed
  isMyTurn: () => {
    const { gameState, playerIndex } = get();
    return gameState !== null && gameState.currentPlayerIndex === playerIndex;
  },

  // Actions (emit to server)
  connect: (url: string) => {
    const socket = socketService.connect(url);
    // Wait for actual connection before setting connected=true
    if (socket.connected) {
      set({ connected: true });
    } else {
      socket.once('connect', () => {
        set({ connected: true });
      });
      socket.once('connect_error', (err: Error) => {
        set({
          connected: false,
          error: getClientErrorMessage(
            CLIENT_ERROR_CODE.CONNECT_FAILED,
            useLocaleStore.getState().locale,
            err.message,
          ),
        });
      });
    }
  },

  joinGame: (emperorIndex: number, deck: DeckDefinition) => {
    try {
      const socket = socketService.getSocket();
      if (!socket.connected) {
        set({
          error: getClientErrorMessage(
            CLIENT_ERROR_CODE.NOT_CONNECTED_RETRY,
            useLocaleStore.getState().locale,
          ),
        });
        return;
      }
      set({
        lastEmperorIndex: emperorIndex,
        lastDeckDefinition: deck,
        gameMode: 'pve',
      });
      socket.emit('game:join', { emperorIndex, deck });
    } catch {
      set({
        error: getClientErrorMessage(
          CLIENT_ERROR_CODE.NOT_CONNECTED_LOBBY,
          useLocaleStore.getState().locale,
        ),
      });
    }
  },

  joinPvp: (emperorIndex: number, deck: DeckDefinition) => {
    try {
      const socket = socketService.getSocket();
      if (!socket.connected) {
        set({
          error: getClientErrorMessage(
            CLIENT_ERROR_CODE.NOT_CONNECTED_RETRY,
            useLocaleStore.getState().locale,
          ),
        });
        return;
      }
      set({
        lastEmperorIndex: emperorIndex,
        lastDeckDefinition: deck,
        gameMode: 'pvp',
      });
      socket.emit('game:pvpJoin', { emperorIndex, deck });
    } catch {
      set({
        error: getClientErrorMessage(
          CLIENT_ERROR_CODE.NOT_CONNECTED_LOBBY,
          useLocaleStore.getState().locale,
        ),
      });
    }
  },

  playCard: (handIndex: number, boardPosition?: number) => {
    socketService.getSocket().emit('game:playCard', { handIndex, boardPosition });
  },

  attack: (attackerInstanceId: string, target: TargetRef) => {
    const targetInstanceId =
      target.type === 'HERO' ? 'HERO' : target.instanceId;
    socketService.getSocket().emit('game:attack', {
      attackerInstanceId,
      targetInstanceId,
    });
  },

  endTurn: () => {
    socketService.getSocket().emit('game:endTurn');
  },

  useHeroSkill: (target?: TargetRef) => {
    socketService.getSocket().emit('game:useHeroSkill', { target });
  },

  useMinisterSkill: (target?: TargetRef) => {
    socketService.getSocket().emit('game:useMinisterSkill', { target });
  },

  useGeneralSkill: (instanceId: string, skillIndex: number, target?: TargetRef) => {
    socketService.getSocket().emit('game:useGeneralSkill', { instanceId, skillIndex, target });
  },

  switchMinister: (ministerIndex: number) => {
    socketService.getSocket().emit('game:switchMinister', { ministerIndex });
  },

  concede: () => {
    socketService.getSocket().emit('game:concede');
  },

  restartGame: () => {
    const { lastEmperorIndex, lastDeckDefinition, gameMode } = get();
    if (lastEmperorIndex == null || lastDeckDefinition == null) {
      // Nothing to replay — fall back to lobby
      get().backToMainMenu();
      return;
    }

    // Reset gameplay state but keep the socket connection and last-args.
    set({
      gameId: null,
      playerIndex: null,
      gameState: null,
      validActions: [],
      selectedAttacker: null,
      pendingSkillAction: null,
      error: null,
    });

    try {
      const socket = socketService.getSocket();
      if (!socket.connected) {
        set({
          uiPhase: 'lobby',
          error: getClientErrorMessage(
            CLIENT_ERROR_CODE.NOT_CONNECTED_RETRY,
            useLocaleStore.getState().locale,
          ),
        });
        return;
      }
      if (gameMode === 'pve') {
        socket.emit('game:join', {
          emperorIndex: lastEmperorIndex,
          deck: lastDeckDefinition,
        });
      } else {
        socket.emit('game:pvpJoin', {
          emperorIndex: lastEmperorIndex,
          deck: lastDeckDefinition,
        });
      }
    } catch {
      set({
        uiPhase: 'lobby',
        error: getClientErrorMessage(
          CLIENT_ERROR_CODE.NOT_CONNECTED_LOBBY,
          useLocaleStore.getState().locale,
        ),
      });
    }
  },

  backToMainMenu: () => {
    // Navigate back to the lobby without disconnecting the socket so the
    // user can immediately start another game. lastEmperorIndex/Deck are
    // intentionally preserved so a subsequent restartGame still works.
    set({
      gameId: null,
      playerIndex: null,
      gameState: null,
      validActions: [],
      uiPhase: 'lobby',
      selectedAttacker: null,
      pendingSkillAction: null,
      error: null,
    });
  },

  // UI actions
  setSelectedAttacker: (id: string | null) => {
    set({ selectedAttacker: id, pendingSkillAction: null });
  },

  setPendingSkillAction: (action: PendingSkillAction | null) => {
    set({ pendingSkillAction: action, selectedAttacker: action ? null : get().selectedAttacker });
  },

  clearTargetingSelection: () => {
    set({ selectedAttacker: null, pendingSkillAction: null });
  },

  clearError: () => {
    set({ error: null });
  },

  setUiPhase: (phase: UiPhase) => {
    set({ uiPhase: phase });
  },

  // Internal
  _setConnected: (v: boolean) => {
    set({
      connected: v,
      validActions: v ? get().validActions : [],
      selectedAttacker: v ? get().selectedAttacker : null,
      pendingSkillAction: v ? get().pendingSkillAction : null,
    });
  },

  _setGameId: (v: string | null) => {
    set({ gameId: v });
  },

  _setPlayerIndex: (v: 0 | 1 | null) => {
    set({ playerIndex: v });
  },

  _setGameState: (v: SerializedGameState) => {
    const playerIndex = get().playerIndex;
    const isOpponentTurn =
      playerIndex !== null && v.currentPlayerIndex !== playerIndex;

    set({
      gameState: v,
      validActions: isOpponentTurn ? [] : get().validActions,
      selectedAttacker: isOpponentTurn ? null : get().selectedAttacker,
      pendingSkillAction: null,
    });
  },

  _setValidActions: (v: ValidAction[]) => {
    set({ validActions: v });
  },

  _setError: (code: string, message: string) => {
    set({ error: message });
    setTimeout(() => {
      if (get().error === message) {
        set({ error: null });
      }
    }, 3000);
  },

  _handleGameOver: (winnerIndex: number, reason: WinReason) => {
    set((state) => ({
      gameState: state.gameState
        ? { ...state.gameState, isGameOver: true, winnerIndex, winReason: reason }
        : null,
      validActions: [],
      selectedAttacker: null,
      pendingSkillAction: null,
      uiPhase: 'game-over',
    }));
  },

  _reset: () => {
    set({
      connected: false,
      gameId: null,
      playerIndex: null,
      gameMode: 'pve',
      gameState: null,
      validActions: [],
      uiPhase: 'lobby',
      selectedAttacker: null,
      pendingSkillAction: null,
      error: null,
      lastEmperorIndex: null,
      lastDeckDefinition: null,
    });
    socketService.disconnect();
  },

  _setGameMode: (mode: 'pve' | 'pvp') => {
    set({ gameMode: mode });
  },
}));
