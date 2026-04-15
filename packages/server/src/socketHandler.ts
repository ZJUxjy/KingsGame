import type { Server, Socket } from 'socket.io';
import type { TargetRef, WinReason, ValidAction } from '@king-card/shared';
import type { GameSession } from './gameManager.js';
import { GameManager } from './gameManager.js';
import { serializeForPlayer } from './serialization.js';
import { runAiTurn, AI_PLAYER_INDEX } from './aiPlayer.js';

interface PlayerMapping {
  gameId: string;
  playerIndex: 0 | 1;
}

function toTargetRef(target: TargetRef | undefined): TargetRef | undefined {
  if (!target) {
    return undefined;
  }

  if (target.type === 'MINION') {
    return { type: 'MINION', instanceId: target.instanceId };
  }

  if (target.type === 'HERO') {
    return { type: 'HERO', playerIndex: target.playerIndex };
  }

  return undefined;
}

export function registerSocketHandlers(
  io: Server,
  gameManager: GameManager,
): void {
  const socketMapping = new Map<string, PlayerMapping>();

  // ─── Helper: broadcast personalized game state + valid actions ──

  function broadcastGameState(gameId: string): void {
    const session = gameManager.getGame(gameId);
    if (!session) return;

    const state = session.engine.getGameState();

    // Send personalized state to each connected player
    for (let p = 0; p < 2; p++) {
      const socketId = session.players[p];
      if (socketId) {
        const serialized = serializeForPlayer(state, p as 0 | 1);
        io.to(socketId).emit('game:state', { state: serialized });
      }
    }

    // Send valid actions to current player
    const currentSocketId = session.players[state.currentPlayerIndex];
    if (currentSocketId) {
      const actions: ValidAction[] = session.engine.getValidActions(
        state.currentPlayerIndex,
      );
      io.to(currentSocketId).emit('game:validActions', { actions });
    }
  }

  // ─── Helper: look up the player's game session and index ───────

  function lookupPlayer(
    socketId: string,
  ): { session: GameSession; playerIndex: 0 | 1 } | null {
    const mapping = socketMapping.get(socketId);
    if (!mapping) return null;
    const session = gameManager.getGame(mapping.gameId);
    if (!session) return null;
    return { session, playerIndex: mapping.playerIndex };
  }

  // ─── Helper: handle engine result ─────────────────────────────

  function handleEngineResult(
    socket: Socket,
    session: GameSession,
    result: { success: boolean; errorCode?: string; message?: string },
  ): void {
    if (!result.success) {
      socket.emit('game:error', {
        code: result.errorCode ?? 'UNKNOWN',
        message: result.message ?? 'Unknown error',
      });
      return;
    }

    broadcastGameState(session.id);
  }

  function ensureCurrentPlayerTurn(
    socket: Socket,
    session: GameSession,
    playerIndex: 0 | 1,
  ): boolean {
    const state = session.engine.getGameState();
    if (state.currentPlayerIndex === playerIndex) {
      return true;
    }

    socket.emit('game:error', {
      code: 'NOT_YOUR_TURN',
      message: 'It is not your turn',
    });
    return false;
  }

  // ─── Helper: listen for GAME_OVER on an engine ────────────────

  function subscribeGameOver(
    session: GameSession,
  ): void {
    session.engine.onEvent('GAME_OVER', (event) => {
      const gameOverEvent = event as {
        type: 'GAME_OVER';
        winnerIndex: number;
        reason: WinReason;
      };

      session.state = 'finished';

      // Notify both players
      for (let p = 0; p < 2; p++) {
        const socketId = session.players[p];
        if (socketId) {
          io.to(socketId).emit('game:over', {
            winnerIndex: gameOverEvent.winnerIndex,
            reason: gameOverEvent.reason,
          });
        }
      }
    });
  }

  // ─── Connection handler ────────────────────────────────────────

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── game:join ────────────────────────────────────────────────

    socket.on('game:join', (payload: { emperorIndex: number }) => {
      try {
        const { emperorIndex } = payload;
        const session = gameManager.createGame('pve', emperorIndex);

        session.state = 'playing';
        gameManager.setPlayerSocket(session.id, 0, socket.id);
        socketMapping.set(socket.id, { gameId: session.id, playerIndex: 0 });

        socket.join(session.id);

        // Listen for game-over events from the engine
        subscribeGameOver(session);

        socket.emit('game:joined', {
          gameId: session.id,
          playerIndex: 0,
        });

        broadcastGameState(session.id);
      } catch (err) {
        socket.emit('game:error', {
          code: 'JOIN_FAILED',
          message: err instanceof Error ? err.message : 'Failed to create game',
        });
      }
    });

    // ── game:playCard ────────────────────────────────────────────

    socket.on(
      'game:playCard',
      (payload: { handIndex: number; boardPosition?: number }) => {
        const ctx = lookupPlayer(socket.id);
        if (!ctx) {
          socket.emit('game:error', { code: 'NO_GAME', message: 'Not in a game' });
          return;
        }
        const { session, playerIndex } = ctx;

        if (!ensureCurrentPlayerTurn(socket, session, playerIndex)) {
          return;
        }

        try {
          const result = session.engine.playCard(
            playerIndex,
            payload.handIndex,
            payload.boardPosition,
          );
          handleEngineResult(socket, session, result);
        } catch (err) {
          socket.emit('game:error', {
            code: 'INTERNAL',
            message: err instanceof Error ? err.message : 'Internal error',
          });
        }
      },
    );

    // ── game:attack ──────────────────────────────────────────────

    socket.on(
      'game:attack',
      (payload: {
        attackerInstanceId: string;
        targetInstanceId: string | 'HERO';
      }) => {
        const ctx = lookupPlayer(socket.id);
        if (!ctx) {
          socket.emit('game:error', { code: 'NO_GAME', message: 'Not in a game' });
          return;
        }
        const { session, playerIndex } = ctx;

        if (!ensureCurrentPlayerTurn(socket, session, playerIndex)) {
          return;
        }

        try {
          const target: TargetRef =
            payload.targetInstanceId === 'HERO'
              ? { type: 'HERO', playerIndex: 1 - playerIndex }
              : { type: 'MINION', instanceId: payload.targetInstanceId };

          const result = session.engine.attack(
            payload.attackerInstanceId,
            target,
          );
          handleEngineResult(socket, session, result);
        } catch (err) {
          socket.emit('game:error', {
            code: 'INTERNAL',
            message: err instanceof Error ? err.message : 'Internal error',
          });
        }
      },
    );

    // ── game:endTurn ─────────────────────────────────────────────

    socket.on('game:endTurn', () => {
      const ctx = lookupPlayer(socket.id);
      if (!ctx) {
        socket.emit('game:error', { code: 'NO_GAME', message: 'Not in a game' });
        return;
      }
      const { session, playerIndex } = ctx;

      if (!ensureCurrentPlayerTurn(socket, session, playerIndex)) {
        return;
      }

      try {
        const result = session.engine.endTurn();
        handleEngineResult(socket, session, result);

        // If PvE and it's now AI's turn, run AI turn asynchronously
        if (
          result.success &&
          session.mode === 'pve' &&
          session.engine.getGameState().currentPlayerIndex === AI_PLAYER_INDEX &&
          !session.engine.getGameState().isGameOver
        ) {
          runAiTurn(session.engine, AI_PLAYER_INDEX).then(() => {
            if (!session.engine.getGameState().isGameOver) {
              broadcastGameState(session.id);
            }
          });
        }
      } catch (err) {
        socket.emit('game:error', {
          code: 'INTERNAL',
          message: err instanceof Error ? err.message : 'Internal error',
        });
      }
    });

    // ── game:useHeroSkill ────────────────────────────────────────

    socket.on('game:useHeroSkill', (payload?: { target?: TargetRef }) => {
      const ctx = lookupPlayer(socket.id);
      if (!ctx) {
        socket.emit('game:error', { code: 'NO_GAME', message: 'Not in a game' });
        return;
      }
      const { session, playerIndex } = ctx;

      if (!ensureCurrentPlayerTurn(socket, session, playerIndex)) {
        return;
      }

      try {
        const result = session.engine.useHeroSkill(playerIndex, toTargetRef(payload?.target));
        handleEngineResult(socket, session, result);
      } catch (err) {
        socket.emit('game:error', {
          code: 'INTERNAL',
          message: err instanceof Error ? err.message : 'Internal error',
        });
      }
    });

    // ── game:useMinisterSkill ────────────────────────────────────

    socket.on('game:useMinisterSkill', (payload?: { target?: TargetRef }) => {
      const ctx = lookupPlayer(socket.id);
      if (!ctx) {
        socket.emit('game:error', { code: 'NO_GAME', message: 'Not in a game' });
        return;
      }
      const { session, playerIndex } = ctx;

      if (!ensureCurrentPlayerTurn(socket, session, playerIndex)) {
        return;
      }

      try {
        const result = session.engine.useMinisterSkill(playerIndex, toTargetRef(payload?.target));
        handleEngineResult(socket, session, result);
      } catch (err) {
        socket.emit('game:error', {
          code: 'INTERNAL',
          message: err instanceof Error ? err.message : 'Internal error',
        });
      }
    });

    // ── game:switchMinister ──────────────────────────────────────

    socket.on(
      'game:switchMinister',
      (payload: { ministerIndex: number }) => {
        const ctx = lookupPlayer(socket.id);
        if (!ctx) {
          socket.emit('game:error', { code: 'NO_GAME', message: 'Not in a game' });
          return;
        }
        const { session, playerIndex } = ctx;

        if (!ensureCurrentPlayerTurn(socket, session, playerIndex)) {
          return;
        }

        try {
          const result = session.engine.switchMinister(
            playerIndex,
            payload.ministerIndex,
          );
          handleEngineResult(socket, session, result);
        } catch (err) {
          socket.emit('game:error', {
            code: 'INTERNAL',
            message: err instanceof Error ? err.message : 'Internal error',
          });
        }
      },
    );

    // ── game:useGeneralSkill ──────────────────────────────────────

    socket.on(
      'game:useGeneralSkill',
      (payload: { instanceId: string; skillIndex: number; target?: TargetRef }) => {
        const ctx = lookupPlayer(socket.id);
        if (!ctx) {
          socket.emit('game:error', { code: 'NO_GAME', message: 'Not in a game' });
          return;
        }
        const { session, playerIndex } = ctx;

        if (!ensureCurrentPlayerTurn(socket, session, playerIndex)) {
          return;
        }

        try {
          const result = session.engine.useGeneralSkill(
            playerIndex,
            payload.instanceId,
            payload.skillIndex,
            toTargetRef(payload.target),
          );
          handleEngineResult(socket, session, result);
        } catch (err) {
          socket.emit('game:error', {
            code: 'INTERNAL',
            message: err instanceof Error ? err.message : 'Internal error',
          });
        }
      },
    );

    // ── game:concede ─────────────────────────────────────────────

    socket.on('game:concede', () => {
      const ctx = lookupPlayer(socket.id);
      if (!ctx) {
        socket.emit('game:error', { code: 'NO_GAME', message: 'Not in a game' });
        return;
      }
      const { session, playerIndex } = ctx;

      const winnerIndex: 0 | 1 = (1 - playerIndex) as 0 | 1;
      session.state = 'finished';

      // Notify both players
      for (let p = 0; p < 2; p++) {
        const socketId = session.players[p];
        if (socketId) {
          io.to(socketId).emit('game:over', {
            winnerIndex,
            reason: 'HERO_KILLED' as WinReason,
          });
        }
      }
    });

    // ── disconnect ───────────────────────────────────────────────

    socket.on('disconnect', () => {
      const mapping = socketMapping.get(socket.id);
      if (mapping) {
        const session = gameManager.getGame(mapping.gameId);
        if (session && session.state !== 'finished') {
          // Clean up the game when a player disconnects
          session.state = 'finished';
          const opponentIndex = 1 - mapping.playerIndex;
          const opponentSocketId = session.players[opponentIndex];
          if (opponentSocketId) {
            io.to(opponentSocketId).emit('game:over', {
              winnerIndex: opponentIndex,
              reason: 'HERO_KILLED' as WinReason,
            });
          }
        }
        socketMapping.delete(socket.id);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
