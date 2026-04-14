import type { GameState, GameEvent } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';
import { createStateMutator } from './state-mutator.js';
import { checkWinCondition } from './win-condition.js';

// ─── Turn Start ─────────────────────────────────────────────────────

/**
 * Execute the start of a turn for the current player.
 * Runs the five phases in order: ENERGY_GAIN -> DRAW -> UPKEEP -> MAIN -> END.
 */
export function executeTurnStart(state: GameState, eventBus: { emit: (event: GameEvent) => void }): void {
  const player = state.players[state.currentPlayerIndex];
  const mutator = createStateMutator(state, eventBus);

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

  // ── Phase 2: DRAW ─────────────────────────────────────────────────
  state.phase = 'DRAW';
  eventBus.emit({ type: 'PHASE_CHANGE', phase: 'DRAW', previousPhase: 'ENERGY_GAIN' });

  mutator.drawCards(state.currentPlayerIndex, 1);

  // If deck empty caused game over, stop early
  if (state.isGameOver) return;

  // ── Phase 3: UPKEEP ───────────────────────────────────────────────
  state.phase = 'UPKEEP';
  eventBus.emit({ type: 'PHASE_CHANGE', phase: 'UPKEEP', previousPhase: 'DRAW' });

  // 3a. Stratagem countdown
  const expiredStratagems: typeof player.activeStratagems = [];
  for (const stratagem of player.activeStratagems) {
    stratagem.remainingTurns -= 1;
    if (stratagem.remainingTurns <= 0) {
      expiredStratagems.push(stratagem);
      eventBus.emit({ type: 'STRATAGEM_EXPIRED', stratagem });
    }
  }
  player.activeStratagems = player.activeStratagems.filter(
    (s) => !expiredStratagems.includes(s),
  );

  // 3b. Garrison countdown: decrement garrisonTurns.
  // The actual stat buff is applied by the GARRISON effect handler (ON_TURN_START).
  for (const minion of player.battlefield) {
    if (minion.garrisonTurns > 0) {
      minion.garrisonTurns -= 1;
    }
  }

  // 3c. Sleep wakeup: when sleepTurns reaches 0, enable one attack
  for (const minion of player.battlefield) {
    if (minion.sleepTurns > 0) {
      minion.sleepTurns -= 1;
      if (minion.sleepTurns === 0) {
        minion.remainingAttacks = 1;
      }
    }
  }

  // ── Phase 4: MAIN ─────────────────────────────────────────────────
  state.phase = 'MAIN';
  eventBus.emit({ type: 'PHASE_CHANGE', phase: 'MAIN', previousPhase: 'UPKEEP' });

  // 4a. Reset battlefield minions
  for (const minion of player.battlefield) {
    minion.justPlayed = false;
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
