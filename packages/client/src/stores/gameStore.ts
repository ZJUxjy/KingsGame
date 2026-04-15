import { create } from 'zustand';
import type { GamePhase, WinReason, TargetRef } from '@king-card/shared';
import { socketService } from '../services/socketService.js';

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
    civilization: string;
    hero: {
      health: number;
      maxHealth: number;
      armor: number;
      heroSkill: unknown;
      skillUsedThisTurn: boolean;
      skillCooldownRemaining: number;
    };
    hand: unknown[];
    battlefield: unknown[];
    energyCrystal: number;
    maxEnergy: number;
    deckCount: number;
    activeMinisterIndex: number;
    ministerPool: unknown[];
    activeStratagems: unknown[];
    cannotDrawNextTurn: boolean;
    boundCards: unknown[];
    graveyard: unknown[];
  };
  opponent: {
    id: string;
    name: string;
    civilization: string;
    hero: unknown;
    hand: unknown[];
    battlefield: unknown[];
    energyCrystal: number;
    maxEnergy: number;
    deckCount: number;
    activeMinisterIndex: number;
    ministerPool: unknown[];
    activeStratagems: unknown[];
    cannotDrawNextTurn: boolean;
    boundCards: unknown[];
    graveyard: unknown[];
  };
}

export interface ValidAction {
  type: string;
  [key: string]: unknown;
}

export type UiPhase = 'lobby' | 'hero-select' | 'playing' | 'game-over';

interface GameStore {
  // Connection
  connected: boolean;
  gameId: string | null;
  playerIndex: 0 | 1 | null;

  // Game state
  gameState: SerializedGameState | null;
  validActions: ValidAction[];

  // UI state
  uiPhase: UiPhase;
  selectedAttacker: string | null;
  error: string | null;

  // Computed
  isMyTurn: () => boolean;

  // Actions (emit to server)
  connect: (url: string) => void;
  joinGame: (emperorIndex: number) => void;
  playCard: (handIndex: number, boardPosition?: number) => void;
  attack: (attackerInstanceId: string, target: TargetRef) => void;
  endTurn: () => void;
  useHeroSkill: () => void;
  useMinisterSkill: () => void;
  switchMinister: (ministerIndex: number) => void;
  concede: () => void;

  // UI actions
  setSelectedAttacker: (id: string | null) => void;
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
  _reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Connection
  connected: false,
  gameId: null,
  playerIndex: null,

  // Game state
  gameState: null,
  validActions: [],

  // UI state
  uiPhase: 'lobby',
  selectedAttacker: null,
  error: null,

  // Computed
  isMyTurn: () => {
    const { gameState, playerIndex } = get();
    return gameState !== null && gameState.currentPlayerIndex === playerIndex;
  },

  // Actions (emit to server)
  connect: (url: string) => {
    socketService.connect(url);
    set({ connected: true });
  },

  joinGame: (emperorIndex: number) => {
    socketService.getSocket().emit('game:join', { emperorIndex });
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

  useHeroSkill: () => {
    socketService.getSocket().emit('game:useHeroSkill');
  },

  useMinisterSkill: () => {
    socketService.getSocket().emit('game:useMinisterSkill');
  },

  switchMinister: (ministerIndex: number) => {
    socketService.getSocket().emit('game:switchMinister', { ministerIndex });
  },

  concede: () => {
    socketService.getSocket().emit('game:concede');
  },

  // UI actions
  setSelectedAttacker: (id: string | null) => {
    set({ selectedAttacker: id });
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
      uiPhase: 'game-over',
    }));
  },

  _reset: () => {
    set({
      connected: false,
      gameId: null,
      playerIndex: null,
      gameState: null,
      validActions: [],
      uiPhase: 'lobby',
      selectedAttacker: null,
      error: null,
    });
    socketService.disconnect();
  },
}));
