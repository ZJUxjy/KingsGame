import type { GameState, GameEvent, EffectContext } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';
import { createStateMutator } from './state-mutator.js';
import { checkWinCondition } from './win-condition.js';
import { executeCardEffects, resolveEffects } from '../cards/effects/index.js';

const turnStartRng: EffectContext['rng'] = {
  nextInt(min: number): number {
    return min;
  },
  next(): number {
    return 0;
  },
  pick<T>(arr: T[]): T {
    return arr[0]!;
  },
  shuffle<T>(arr: T[]): T[] {
    return [...arr];
  },
};

function createEffectEventBus(
  eventBus: { emit: (event: GameEvent) => void },
): EffectContext['eventBus'] {
  return {
    emit(event: unknown): void {
      eventBus.emit(event as GameEvent);
    },
    on(): () => void {
      return () => {};
    },
    removeAllListeners(): void {
      // Turn-start execution only needs emit.
    },
  };
}

function expireTemporaryBuffs(
  state: GameState,
  eventBus: { emit: (event: GameEvent) => void },
): void {
  const mutator = createStateMutator(state, eventBus);

  for (const player of state.players) {
    for (const minion of [...player.battlefield]) {
      for (const buff of [...minion.buffs]) {
        if (buff.type !== 'TEMPORARY' || typeof buff.remainingTurns !== 'number') {
          continue;
        }

        buff.remainingTurns -= 1;
        if (buff.remainingTurns > 0) {
          continue;
        }

        mutator.removeBuff({ type: 'MINION', instanceId: minion.instanceId }, buff.id);

        const stillExists = state.players[minion.ownerIndex]?.battlefield.some(
          (candidate) => candidate.instanceId === minion.instanceId,
        );
        if (!stillExists) {
          break;
        }
      }
    }
  }
}

// ─── Turn Start ─────────────────────────────────────────────────────

/**
 * Execute the start of a turn for the current player.
 * Runs the five phases in order: ENERGY_GAIN -> DRAW -> UPKEEP -> MAIN -> END.
 */
export function executeTurnStart(state: GameState, eventBus: { emit: (event: GameEvent) => void }): void {
  const player = state.players[state.currentPlayerIndex];
  const mutator = createStateMutator(state, eventBus);
  player.cardsPlayedThisTurn = 0;

  // ── Phase 1: ENERGY_GAIN ──────────────────────────────────────────
  state.phase = 'ENERGY_GAIN';
  const previousPhase: GameState['phase'] = 'ENERGY_GAIN';
  eventBus.emit({ type: 'PHASE_CHANGE', phase: 'ENERGY_GAIN', previousPhase });

  const energyGained = Math.min(
    GAME_CONSTANTS.ENERGY_PER_TURN,
    GAME_CONSTANTS.MAX_ENERGY - player.maxEnergy,
  );
  player.maxEnergy = Math.min(player.maxEnergy + energyGained, GAME_CONSTANTS.MAX_ENERGY);
  player.energyCrystal = player.maxEnergy;

  eventBus.emit({
    type: 'ENERGY_GAINED',
    playerIndex: state.currentPlayerIndex,
    amount: energyGained,
    totalEnergy: player.maxEnergy,
  });

  state.turnNumber += 1;
  eventBus.emit({
    type: 'TURN_START',
    playerIndex: state.currentPlayerIndex,
    turnNumber: state.turnNumber,
  });

  // ── Phase 2: DRAW ─────────────────────────────────────────────────
  state.phase = 'DRAW';
  eventBus.emit({ type: 'PHASE_CHANGE', phase: 'DRAW', previousPhase: 'ENERGY_GAIN' });

  mutator.drawCards(state.currentPlayerIndex, 1);

  // If deck empty caused game over, stop early
  if (state.isGameOver) return;

  // ── Phase 3: UPKEEP ───────────────────────────────────────────────
  state.phase = 'UPKEEP';
  eventBus.emit({ type: 'PHASE_CHANGE', phase: 'UPKEEP', previousPhase: 'DRAW' });

  // 3a. Temporary buff countdown
  expireTemporaryBuffs(state, eventBus);

  // 3b. Stratagem countdown
  const expiredStratagems: typeof player.activeStratagems = [];
  for (const stratagem of player.activeStratagems) {
    stratagem.remainingTurns -= 1;
    if (stratagem.remainingTurns <= 0) {
      expiredStratagems.push(stratagem);
      player.costModifiers = player.costModifiers.filter(
        (modifier) => modifier.sourceId !== stratagem.instanceId,
      );
      eventBus.emit({ type: 'STRATAGEM_EXPIRED', stratagem });
    }
  }
  player.activeStratagems = player.activeStratagems.filter(
    (s) => !expiredStratagems.includes(s),
  );

  // 3c. Garrison countdown: decrement garrisonTurns.
  // The actual stat buff is applied by the GARRISON effect handler (ON_TURN_START).
  for (const minion of player.battlefield) {
    if (minion.garrisonTurns > 0) {
      minion.garrisonTurns -= 1;
    }
  }

  // 3d. Sleep wakeup: when sleepTurns reaches 0, enable one attack
  for (const minion of player.battlefield) {
    if (minion.sleepTurns > 0) {
      minion.sleepTurns -= 1;
      if (minion.sleepTurns === 0) {
        minion.remainingAttacks = 1;
      }
    }
  }

  for (const minion of [...player.battlefield]) {
    const effectCtx: EffectContext = {
      state,
      mutator,
      source: minion,
      playerIndex: state.currentPlayerIndex,
      eventBus: createEffectEventBus(eventBus),
      rng: turnStartRng,
    };

    executeCardEffects('ON_TURN_START', effectCtx);
    resolveEffects('ON_TURN_START', effectCtx);
  }

  // ── Phase 4: MAIN ─────────────────────────────────────────────────
  state.phase = 'MAIN';
  eventBus.emit({ type: 'PHASE_CHANGE', phase: 'MAIN', previousPhase: 'UPKEEP' });

  // 4a. Reset battlefield minions
  for (const minion of player.battlefield) {
    minion.justPlayed = false;
    minion.usedGeneralSkills = 0;
    // Only reset remainingAttacks for non-sleeping minions
    if (minion.sleepTurns === 0) {
      minion.remainingAttacks = 1;
    }
  }

  // 4b. Reset hero skill
  player.hero.skillUsedThisTurn = false;
  if (player.hero.skillCooldownRemaining > 0) {
    player.hero.skillCooldownRemaining -= 1;
  }

  // 4c. Reset minister pool
  for (const minister of player.ministerPool) {
    minister.skillUsedThisTurn = false;
    if (minister.cooldown > 0) {
      minister.cooldown -= 1;
    }
  }

  // ── Phase 5: END ──────────────────────────────────────────────────
  const result = checkWinCondition(state);
  state.isGameOver = result.isGameOver;
  state.winnerIndex = result.winnerIndex;
  state.winReason = result.winReason;

  eventBus.emit({
    type: 'TURN_END',
    playerIndex: state.currentPlayerIndex,
    turnNumber: state.turnNumber,
  });
}
