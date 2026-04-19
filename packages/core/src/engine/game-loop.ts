import type { GameState, GameEvent, EffectContext, CardInstance } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';
import { createStateMutator } from './state-mutator.js';
import { checkWinCondition } from './win-condition.js';
import { executeCardEffects, resolveEffects } from '../cards/effects/index.js';
import { IdCounter } from './id-counter.js';

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

/**
 * Decrement `remainingTurns` on every TEMPORARY buff on every player's
 * battlefield at the start of each turn (active *and* opponent).
 *
 * Important invariant:
 *   A buff with `remainingTurns: N` lives through `N` turn-starts after
 *   it is applied, regardless of which player owns the affected minion.
 *
 * Practical consequences:
 *   - `remainingTurns: 1` = "lasts until the very next turn-start (which
 *     could be the opponent's turn)". Suitable for buffs that are
 *     re-applied at the start of each owner turn — e.g. MOBILIZATION_ORDER
 *     gives +1/+1 for "this turn only" and re-emits the buff every turn,
 *     so a single decrement is exactly the lifetime we want.
 *   - For "lasts until the SAME player's next turn", use
 *     `remainingTurns: 2` (one decrement on the opponent's turn-start,
 *     one on the return to the owner). Verify each call site against
 *     this two-decrement model when authoring such effects.
 *
 * Buffs of type other than TEMPORARY, or with no numeric `remainingTurns`,
 * are left untouched.
 */
function expireTemporaryBuffs(
  state: GameState,
  eventBus: { emit: (event: GameEvent) => void },
  counter: IdCounter,
): void {
  const mutator = createStateMutator(state, eventBus, turnStartRng, counter);

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
 * Per-turn attack budget for a minion that is "ready to attack" (i.e., not
 * sleeping / not freshly summoned without CHARGE/RUSH/ASSASSIN). Single source
 * of truth for both the sleep-wake reset (Phase 3d) and the turn-start
 * battlefield reset (Phase 4a) — keep these two paths in sync via this helper
 * so future keyword additions (or reordering of 3d/4a) don't silently
 * regress WINDFURY back to a single swing.
 */
function resetMinionAttacksPerTurn(minion: CardInstance): number {
  return minion.card.keywords.includes('WINDFURY') ? 2 : 1;
}

/**
 * Execute the start of a turn for the current player.
 * Runs the five phases in order: ENERGY_GAIN -> DRAW -> UPKEEP -> MAIN -> END.
 */
export function executeTurnStart(
  state: GameState,
  eventBus: { emit: (event: GameEvent) => void },
  counter: IdCounter,
): void {
  const player = state.players[state.currentPlayerIndex];
  const mutator = createStateMutator(state, eventBus, turnStartRng, counter);
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

  // ── BLOCKADE penalty: opponent's BLOCKADE minions reduce our usable energy ──
  // Applied here (after the energy refresh) rather than via an ON_TURN_START
  // handler on the opponent's battlefield, because IRON_FIST / MOBILIZATION_ORDER
  // / GARRISON handlers lack owner guards and would spuriously trigger.
  const opponentIdx = (1 - state.currentPlayerIndex) as 0 | 1;
  const blockadeCount = state.players[opponentIdx].battlefield.filter(
    (m) => m.card.keywords.includes('BLOCKADE'),
  ).length;

  if (blockadeCount > 0) {
    const reduction = Math.min(blockadeCount, player.energyCrystal);
    player.energyCrystal -= reduction;
    if (reduction > 0) {
      eventBus.emit({
        type: 'ENERGY_SPENT',
        playerIndex: state.currentPlayerIndex,
        amount: reduction,
        remainingEnergy: player.energyCrystal,
        reason: 'BLOCKADE',
      });
    }
  }

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
  expireTemporaryBuffs(state, eventBus, counter);

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
        minion.remainingAttacks = resetMinionAttacksPerTurn(minion);
      }
    }
  }

  // 3e. Freeze thaw: decrement frozenTurns each turn start
  for (const minion of player.battlefield) {
    if (minion.frozenTurns > 0) {
      minion.frozenTurns -= 1;
    }
  }

  for (const minion of [...player.battlefield]) {
    if (state.isGameOver) break;
    const effectCtx: EffectContext = {
      state,
      mutator,
      source: minion,
      playerIndex: state.currentPlayerIndex,
      eventBus: createEffectEventBus(eventBus),
      rng: turnStartRng,
      counter,
    };

    executeCardEffects('ON_TURN_START', effectCtx);
    resolveEffects('ON_TURN_START', effectCtx);
  }

  // If an ON_TURN_START handler ended the game, stop before the rest
  // of the turn-start phases mutate post-game state.
  if (state.isGameOver) return;

  // ── Phase 4: MAIN ─────────────────────────────────────────────────
  state.phase = 'MAIN';
  eventBus.emit({ type: 'PHASE_CHANGE', phase: 'MAIN', previousPhase: 'UPKEEP' });

  // 4a. Reset battlefield minions
  for (const minion of player.battlefield) {
    minion.justPlayed = false;
    minion.usedGeneralSkills = 0;
    // Only reset remainingAttacks for non-sleeping minions.
    // resetMinionAttacksPerTurn is the single source of truth (also called
    // from Phase 3d sleep-wake) so WINDFURY's "2 swings per turn" stays
    // consistent across both paths.
    if (minion.sleepTurns === 0) {
      minion.remainingAttacks = resetMinionAttacksPerTurn(minion);
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

  if (result.isGameOver) {
    eventBus.emit({
      type: 'GAME_OVER',
      winnerIndex: result.winnerIndex!,
      reason: result.winReason!,
    });
  }
}

// ─── Turn End ───────────────────────────────────────────────────────

/**
 * Fire ON_TURN_END effect handlers for every minion on the current
 * player's battlefield. Called by executeEndTurn BEFORE the player
 * switch so handlers like COLONY trigger for the player whose turn
 * is actually ending.
 *
 * Snapshot the battlefield to be safe in case a handler removes a
 * minion mid-iteration.
 */
export function executeTurnEnd(
  state: GameState,
  eventBus: { emit: (event: GameEvent) => void },
  counter: IdCounter,
): void {
  const player = state.players[state.currentPlayerIndex];
  const mutator = createStateMutator(state, eventBus, turnStartRng, counter);

  for (const minion of [...player.battlefield]) {
    if (state.isGameOver) break;
    const effectCtx: EffectContext = {
      state,
      mutator,
      source: minion,
      playerIndex: state.currentPlayerIndex,
      eventBus: createEffectEventBus(eventBus),
      rng: turnStartRng,
      counter,
    };

    executeCardEffects('ON_TURN_END', effectCtx);
    resolveEffects('ON_TURN_END', effectCtx);
  }
}
