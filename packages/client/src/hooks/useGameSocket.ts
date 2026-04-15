import { useEffect } from 'react';
import { socketService } from '../services/socketService.js';
import { useGameStore } from '../stores/gameStore.js';
import type { SerializedGameState, ValidAction } from '../stores/gameStore.js';
import type { WinReason } from '@king-card/shared';

export function useGameSocket(): void {
  useEffect(() => {
    if (!socketService.isConnected()) {
      return;
    }

    const socket = socketService.getSocket();

    const onConnect = () => {
      useGameStore.getState()._setConnected(true);
    };

    const onDisconnect = () => {
      useGameStore.getState()._setConnected(false);
    };

    const onGameJoined = (payload: {
      gameId: string;
      playerIndex: 0 | 1;
    }) => {
      const s = useGameStore.getState();
      s._setGameId(payload.gameId);
      s._setPlayerIndex(payload.playerIndex);
      s.setUiPhase('playing');
    };

    const onGameState = (payload: { state: SerializedGameState }) => {
      useGameStore.getState()._setGameState(payload.state);
    };

    const onValidActions = (payload: { actions: ValidAction[] }) => {
      useGameStore.getState()._setValidActions(payload.actions);
    };

    const onGameOver = (payload: {
      winnerIndex: number;
      reason: WinReason;
    }) => {
      useGameStore.getState()._handleGameOver(
        payload.winnerIndex,
        payload.reason,
      );
    };

    const onGameError = (payload: { code: string; message: string }) => {
      useGameStore.getState()._setError(payload.code, payload.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game:joined', onGameJoined);
    socket.on('game:state', onGameState);
    socket.on('game:validActions', onValidActions);
    socket.on('game:over', onGameOver);
    socket.on('game:error', onGameError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game:joined', onGameJoined);
      socket.off('game:state', onGameState);
      socket.off('game:validActions', onValidActions);
      socket.off('game:over', onGameOver);
      socket.off('game:error', onGameError);
    };
  }, []);
}
