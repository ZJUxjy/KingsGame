import type { Server, Socket } from 'socket.io';
import type { TargetRef, WinReason, ValidAction } from '@king-card/shared';
import type { GameEngine } from '@king-card/core';
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
    if (!session || !session.engine) return;

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
    if (!session.engine) return false;
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

  /** Returns the engine or emits an error and returns null. */
  function requireEngine(
    socket: Socket,
    session: GameSession,
  ): GameEngine | null {
    if (session.engine) return session.engine;
    socket.emit('game:error', { code: 'NO_ENGINE', message: 'Game not started' });
    return null;
  }

  // ─── Helper: listen for GAME_OVER on an engine ────────────────

  function subscribeGameOver(
    session: GameSession,
  ): void {
    if (!session.engine) return;
    session.engine.onEvent('GAME_OVER', (event) => {
      const gameOverEvent = event as {
        type: 'GAME_OVER';
        winnerIndex: number;
        reason: WinReason;
      };

      session.state = 'finished';
      gameManager.destroyGame(session.id);

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

    // ── game:pvpJoin ──────────────────────────────────────────────

    socket.on('game:pvpJoin', (payload: { emperorIndex: number }) => {
      try {
        const { emperorIndex } = payload;

        // Try to find a waiting PvP game
        const waitingSession = gameManager.findWaitingPvpGame();

        if (waitingSession) {
          // Join as player 1
          waitingSession.playerEmperorIndices[1] = emperorIndex;
          gameManager.initializePvpEngine(waitingSession);

          waitingSession.state = 'playing';
          gameManager.setPlayerSocket(waitingSession.id, 1, socket.id);
          socketMapping.set(socket.id, { gameId: waitingSession.id, playerIndex: 1 });

          socket.join(waitingSession.id);
          subscribeGameOver(waitingSession);

          socket.emit('game:joined', {
            gameId: waitingSession.id,
            playerIndex: 1,
          });

          // Notify player 0 that the game has started
          const player0SocketId = waitingSession.players[0];
          if (player0SocketId) {
            io.to(player0SocketId).emit('game:joined', {
              gameId: waitingSession.id,
              playerIndex: 0,
            });
          }

          broadcastGameState(waitingSession.id);
        } else {
          // Create a new PvP room and wait
          const session = gameManager.createPvpWaiting(emperorIndex);
          gameManager.setPlayerSocket(session.id, 0, socket.id);
          socketMapping.set(socket.id, { gameId: session.id, playerIndex: 0 });

          socket.join(session.id);

          socket.emit('game:pvpWaiting', {
            gameId: session.id,
          });
        }
      } catch (err) {
        socket.emit('game:error', {
          code: 'PVP_JOIN_FAILED',
          message: err instanceof Error ? err.message : 'Failed to join PvP',
        });
      }
    });

    // ── game:pvpCancel ────────────────────────────────────────────

    socket.on('game:pvpCancel', () => {
      const mapping = socketMapping.get(socket.id);
      if (!mapping) return;
      const session = gameManager.getGame(mapping.gameId);
      if (session && session.mode === 'pvp' && session.state === 'waiting') {
        session.state = 'finished';
        gameManager.destroyGame(mapping.gameId);
        socketMapping.delete(socket.id);
        socket.leave(mapping.gameId);
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
        const engine = requireEngine(socket, session);
        if (!engine) return;

        try {
          const result = engine.playCard(
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
        const engine = requireEngine(socket, session);
        if (!engine) return;

        try {
          const target: TargetRef =
            payload.targetInstanceId === 'HERO'
              ? { type: 'HERO', playerIndex: 1 - playerIndex }
              : { type: 'MINION', instanceId: payload.targetInstanceId };

          const result = engine.attack(
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
      const engine = requireEngine(socket, session);
      if (!engine) return;

      try {
        const result = engine.endTurn();
        handleEngineResult(socket, session, result);

        // If PvE and it's now AI's turn, run AI turn asynchronously
        if (
          result.success &&
          session.mode === 'pve' &&
          engine.getGameState().currentPlayerIndex === AI_PLAYER_INDEX &&
          !engine.getGameState().isGameOver
        ) {
          runAiTurn(engine, AI_PLAYER_INDEX).then(() => {
            if (!engine.getGameState().isGameOver) {
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
      const engine = requireEngine(socket, session);
      if (!engine) return;

      try {
        const result = engine.useHeroSkill(playerIndex, toTargetRef(payload?.target));
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
      const engine = requireEngine(socket, session);
      if (!engine) return;

      try {
        const result = engine.useMinisterSkill(playerIndex, toTargetRef(payload?.target));
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
        const engine = requireEngine(socket, session);
        if (!engine) return;

        try {
          const result = engine.switchMinister(
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
        const engine = requireEngine(socket, session);
        if (!engine) return;

        try {
          const result = engine.useGeneralSkill(
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

      gameManager.destroyGame(session.id);
    });

    // ── disconnect ───────────────────────────────────────────────

    socket.on('disconnect', () => {
      const mapping = socketMapping.get(socket.id);
      if (mapping) {
        const session = gameManager.getGame(mapping.gameId);
        if (session && session.state !== 'finished') {
          session.state = 'finished';
          const opponentIndex = 1 - mapping.playerIndex;
          const opponentSocketId = session.players[opponentIndex];
          if (opponentSocketId) {
            io.to(opponentSocketId).emit('game:over', {
              winnerIndex: opponentIndex,
              reason: 'HERO_KILLED' as WinReason,
            });
          }
          gameManager.destroyGame(mapping.gameId);
        }
        socketMapping.delete(socket.id);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
