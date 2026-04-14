import type {
  GameState,
  GameEvent,
  EventBus,
  EngineResult,
  EngineErrorCode,
  TargetRef,
  Card,
  CardInstance,
  RNG,
  EffectContext,
} from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';
import { createStateMutator } from './state-mutator.js';
import { checkWinCondition } from './win-condition.js';
import { executeTurnStart } from './game-loop.js';
import { resolveEffects } from '../cards/effects/index.js';
import { getEmperorData } from './emperor-registry.js';

// ─── Helpers ─────────────────────────────────────────────────────

function error(code: EngineErrorCode, message: string): EngineResult {
  return { success: false, errorCode: code, message };
}

function success(events: GameEvent[]): EngineResult {
  return { success: true, events };
}

function findMinion(
  state: GameState,
  instanceId: string,
): CardInstance | undefined {
  for (const player of state.players) {
    const minion = player.battlefield.find((m) => m.instanceId === instanceId);
    if (minion) return minion;
  }
  return undefined;
}

function hasKeyword(minion: CardInstance, keyword: string): boolean {
  return minion.card.keywords.includes(keyword as any);
}

function hasTauntButNotStealthKill(minion: CardInstance): boolean {
  return hasKeyword(minion, 'TAUNT') && !hasKeyword(minion, 'STEALTH_KILL');
}

/**
 * Creates an EventBus wrapper that collects all emitted events into an array.
 */
function createCollectingEventBus(
  eventBus: EventBus,
  collected: GameEvent[],
): EventBus {
  return {
    emit(event: GameEvent): void {
      collected.push(event);
      eventBus.emit(event);
    },
    on(eventType: string, handler: (event: GameEvent) => void): () => void {
      return eventBus.on(eventType, handler);
    },
    removeAllListeners(): void {
      eventBus.removeAllListeners();
    },
  };
}

// ─── executePlayCard ─────────────────────────────────────────────

export function executePlayCard(
  state: GameState,
  eventBus: EventBus,
  _rng: RNG,
  playerIndex: number,
  handIndex: number,
  targetBoardPosition?: number,
): EngineResult {
  // ── Validation ──────────────────────────────────────────────────
  if (state.phase !== 'MAIN') {
    return error('INVALID_PHASE', `Cannot play card in phase ${state.phase}, expected MAIN`);
  }

  if (playerIndex !== state.currentPlayerIndex) {
    return error('INVALID_PHASE', `Player ${playerIndex} is not the current player`);
  }

  const player = state.players[playerIndex];
  if (handIndex < 0 || handIndex >= player.hand.length) {
    return error('CARD_NOT_IN_HAND', `Hand index ${handIndex} is out of range`);
  }

  const card = player.hand[handIndex];
  if (card.cost > player.energyCrystal) {
    return error('INSUFFICIENT_ENERGY', `Card costs ${card.cost}, but player only has ${player.energyCrystal} energy`);
  }

  if (card.type === 'MINION' || card.type === 'GENERAL') {
    if (player.battlefield.length >= GAME_CONSTANTS.MAX_BOARD_SIZE) {
      return error('BOARD_FULL', `Battlefield is full (max ${GAME_CONSTANTS.MAX_BOARD_SIZE})`);
    }
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);
  const mutator = createStateMutator(state, collectingBus);

  // Remove card from hand
  player.hand.splice(handIndex, 1);

  // Spend energy
  player.energyCrystal -= card.cost;
  collectingBus.emit({
    type: 'ENERGY_SPENT',
    playerIndex,
    amount: card.cost,
    remainingEnergy: player.energyCrystal,
  });

  // Emit CARD_PLAYED
  const instanceId = card.type === 'MINION' || card.type === 'GENERAL'
    ? `${card.id}_${Date.now()}`
    : undefined;
  collectingBus.emit({ type: 'CARD_PLAYED', playerIndex, card, instanceId });

  if (card.type === 'MINION' || card.type === 'GENERAL') {
    // Summon to battlefield
    const summonResult = mutator.summonMinion(card, playerIndex as 0 | 1, targetBoardPosition);
    if (summonResult) {
      return error(summonResult, `Failed to summon minion: ${summonResult}`);
    }
    // Trigger ON_PLAY effects (e.g. BATTLECRY)
    const summonedMinion = state.players[playerIndex].battlefield.find(
      (m) => m.card.id === card.id,
    );
    if (summonedMinion) {
      const effectCtx: EffectContext = {
        state,
        mutator,
        source: summonedMinion,
        playerIndex,
        eventBus: collectingBus as unknown as EffectContext['eventBus'],
        rng: _rng as unknown as EffectContext['rng'],
      };
      resolveEffects('ON_PLAY', effectCtx);
    }
  } else if (card.type === 'STRATAGEM' || card.type === 'SORCERY') {
    // Phase 1: no specific effect processing
  } else if (card.type === 'EMPEROR') {
    const emperorData = getEmperorData(card.id);
    if (!emperorData) {
      // Emperor data not registered — skip emperor switch
      // (should not happen in normal gameplay)
    } else {
      const oldEmperorId = player.hero.heroSkill
        ? card.id // fallback: use new card id if no prior emperor
        : undefined;

      // Derive old emperor id from the heroSkill that was set during init
      // We store it on hero for tracking; if heroSkill exists, we can
      // infer the old emperor from the boundCards (they were from previous emperor).
      // For simplicity we emit the event with the new emperor id.

      // 1. Hero replacement
      const oldArmor = player.hero.armor;
      player.hero = {
        health: card.health ?? player.hero.health,
        maxHealth: card.health ?? player.hero.maxHealth,
        armor: oldArmor, // preserve armor
        heroSkill: card.heroSkill!, // EMPEROR cards always have heroSkill
        skillUsedThisTurn: true, // new emperor cannot use skill this turn
        skillCooldownRemaining: card.heroSkill!.cooldown, // set cooldown
      };

      // 2. Minister replacement
      player.ministerPool = emperorData.ministers.map((m) => ({
        ...m,
        skillUsedThisTurn: false,
        cooldown: m.cooldown > 0 ? m.cooldown : 0, // keep original cooldown as initial cooldown
      }));
      if (player.ministerPool.length > 0) {
        // Set the first minister's cooldown to 1 so it can't be used this turn
        player.ministerPool[0].cooldown = 1;
      }
      player.activeMinisterIndex = player.ministerPool.length > 0 ? 0 : -1;

      // 3. Remove old bound cards (no graveyard, no deathrattle)
      player.boundCards = [];

      // 4. Add new bound cards to hand
      const newBoundCards = [...emperorData.boundGenerals, ...emperorData.boundSorceries];
      for (const boundCard of newBoundCards) {
        if (player.hand.length < player.handLimit) {
          player.hand.push(boundCard);
        }
        // If hand is full, bound card is lost (not discarded to graveyard)
      }
      player.boundCards = newBoundCards;

      // 5. Emit EMPEROR_CHANGED
      collectingBus.emit({
        type: 'EMPEROR_CHANGED',
        playerIndex,
        newEmperorId: card.id,
      });
    }
  }

  return success(events);
}

// ─── executeAttack ───────────────────────────────────────────────

export function executeAttack(
  state: GameState,
  eventBus: EventBus,
  attackerInstanceId: string,
  target: TargetRef,
): EngineResult {
  // ── Validation ──────────────────────────────────────────────────
  if (state.phase !== 'MAIN') {
    return error('INVALID_PHASE', `Cannot attack in phase ${state.phase}, expected MAIN`);
  }

  const attacker = findMinion(state, attackerInstanceId);
  if (!attacker) {
    return error('INVALID_TARGET', `Attacker ${attackerInstanceId} not found on battlefield`);
  }

  if (attacker.ownerIndex !== state.currentPlayerIndex) {
    return error('INVALID_TARGET', `Attacker is not controlled by the current player`);
  }

  if (attacker.remainingAttacks <= 0) {
    return error('MINION_CANNOT_ATTACK', `Attacker has no remaining attacks`);
  }

  const opponentIndex = 1 - state.currentPlayerIndex;
  const opponent = state.players[opponentIndex];

  // TAUNT check: if target does not have TAUNT, and there are enemy TAUNT minions
  // (without STEALTH_KILL), the attack must target a TAUNT minion
  if (target.type === 'HERO') {
    const hasNonStealthKillTaunt = opponent.battlefield.some(
      (m) => hasTauntButNotStealthKill(m),
    );
    if (hasNonStealthKillTaunt && !hasKeyword(attacker, 'STEALTH_KILL')) {
      return error('INVALID_TARGET', 'Must attack a TAUNT minion before attacking the hero');
    }
  } else if (target.type === 'MINION') {
    const targetMinion = findMinion(state, target.instanceId);
    if (!targetMinion) {
      return error('INVALID_TARGET', `Target minion ${target.instanceId} not found`);
    }
    if (targetMinion.ownerIndex !== opponentIndex) {
      return error('INVALID_TARGET', 'Target minion is not on the opponent\'s battlefield');
    }
    // If target doesn't have TAUNT, check if there are taunters that must be attacked first
    if (!hasTauntButNotStealthKill(targetMinion)) {
      const hasNonStealthKillTaunt = opponent.battlefield.some(
        (m) => hasTauntButNotStealthKill(m),
      );
      if (hasNonStealthKillTaunt && !hasKeyword(attacker, 'STEALTH_KILL')) {
        return error('INVALID_TARGET', 'Must attack a TAUNT minion before attacking other minions');
      }
    }
  }

  // Hero attack restriction: attacker must have CHARGE or ASSASSIN (not just RUSH)
  if (target.type === 'HERO') {
    const canAttackHero =
      hasKeyword(attacker, 'CHARGE') ||
      hasKeyword(attacker, 'ASSASSIN');
    if (!canAttackHero) {
      return error('INVALID_TARGET', 'Attacker cannot attack the hero without CHARGE or ASSASSIN');
    }
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);
  const mutator = createStateMutator(state, collectingBus);

  // Decrement remaining attacks
  attacker.remainingAttacks -= 1;

  // Emit ATTACK_DECLARED
  collectingBus.emit({ type: 'ATTACK_DECLARED', attacker, defender: target });

  // Calculate and apply damage
  const damage = attacker.currentAttack;

  // Track target minion before damage for ON_KILL trigger
  let targetMinionBeforeDamage: CardInstance | undefined;
  if (target.type === 'MINION') {
    targetMinionBeforeDamage = findMinion(state, target.instanceId);
  }

  mutator.damage(target, damage);

  // Trigger ON_KILL if the target minion was destroyed
  if (target.type === 'MINION' && targetMinionBeforeDamage) {
    const targetStillAlive = findMinion(state, target.instanceId);
    if (!targetStillAlive) {
      const effectCtx: EffectContext = {
        state,
        mutator,
        source: attacker,
        target: targetMinionBeforeDamage,
        playerIndex: attacker.ownerIndex,
        eventBus: collectingBus as unknown as EffectContext['eventBus'],
        rng: { nextInt: () => 0, next: () => 0, pick: (arr) => arr[0], shuffle: (a) => a },
      };
      resolveEffects('ON_KILL', effectCtx);
    }
  }

  // Emit ATTACK_RESOLVED
  collectingBus.emit({ type: 'ATTACK_RESOLVED', attacker, defender: target, damage });

  // If target is a MINION and still alive, counterattack
  if (target.type === 'MINION') {
    const targetMinion = findMinion(state, target.instanceId);
    if (targetMinion && targetMinion.currentHealth > 0) {
      const counterDamage = targetMinion.currentAttack;
      const attackerRef: TargetRef = { type: 'MINION', instanceId: attackerInstanceId };
      mutator.damage(attackerRef, counterDamage);
    }
  }

  // Check win condition
  const winResult = checkWinCondition(state);
  state.isGameOver = winResult.isGameOver;
  state.winnerIndex = winResult.winnerIndex;
  state.winReason = winResult.winReason;

  return success(events);
}

// ─── executeEndTurn ──────────────────────────────────────────────

export function executeEndTurn(
  state: GameState,
  eventBus: EventBus,
): EngineResult {
  // ── Validation ──────────────────────────────────────────────────
  const validPhases: GameState['phase'][] = ['MAIN', 'UPKEEP', 'DRAW', 'ENERGY_GAIN'];
  if (!validPhases.includes(state.phase)) {
    return error('INVALID_PHASE', `Cannot end turn in phase ${state.phase}`);
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);

  // Switch current player
  state.currentPlayerIndex = (1 - state.currentPlayerIndex) as 0 | 1;

  // Start the new turn
  executeTurnStart(state, collectingBus);

  return success(events);
}

// ─── executeUseHeroSkill ──────────────────────────────────────────

export function executeUseHeroSkill(
  state: GameState,
  eventBus: EventBus,
  _rng: RNG,
  playerIndex: number,
): EngineResult {
  // ── Validation ──────────────────────────────────────────────────
  if (state.phase !== 'MAIN') {
    return error('INVALID_PHASE', `Cannot use hero skill in phase ${state.phase}, expected MAIN`);
  }

  if (playerIndex !== state.currentPlayerIndex) {
    return error('INVALID_PHASE', `Player ${playerIndex} is not the current player`);
  }

  const player = state.players[playerIndex];
  const heroSkill = player.hero.heroSkill;

  if (!heroSkill) {
    return error('INVALID_TARGET', 'No hero skill available');
  }

  if (player.hero.skillUsedThisTurn) {
    return error('SKILL_ON_COOLDOWN', 'Hero skill already used this turn');
  }

  if (player.hero.skillCooldownRemaining > 0) {
    return error('SKILL_ON_COOLDOWN', `Hero skill is on cooldown (${player.hero.skillCooldownRemaining} turns remaining)`);
  }

  if (player.energyCrystal < heroSkill.cost) {
    return error('INSUFFICIENT_ENERGY', `Hero skill costs ${heroSkill.cost}, but player only has ${player.energyCrystal} energy`);
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);
  const mutator = createStateMutator(state, collectingBus);

  // Mark skill as used
  player.hero.skillUsedThisTurn = true;
  player.hero.skillCooldownRemaining = heroSkill.cooldown;

  // Spend energy
  player.energyCrystal -= heroSkill.cost;
  collectingBus.emit({
    type: 'ENERGY_SPENT',
    playerIndex,
    amount: heroSkill.cost,
    remainingEnergy: player.energyCrystal,
  });

  // Create a synthetic CardInstance as source for effect resolution
  const syntheticSource: CardInstance = {
    card: {
      id: `hero_skill_${player.id}`,
      name: heroSkill.name,
      civilization: player.civilization,
      type: 'EMPEROR',
      rarity: 'LEGENDARY',
      cost: heroSkill.cost,
      description: heroSkill.description,
      keywords: [],
      effects: [heroSkill.effect],
    },
    instanceId: `hero_skill_${player.id}_${Date.now()}`,
    ownerIndex: playerIndex as 0 | 1,
    currentAttack: 0,
    currentHealth: player.hero.health,
    currentMaxHealth: player.hero.maxHealth,
    remainingAttacks: 0,
    justPlayed: false,
    sleepTurns: 0,
    garrisonTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
    position: undefined,
  };

  const effectCtx: EffectContext = {
    state,
    mutator,
    source: syntheticSource,
    playerIndex,
    eventBus: collectingBus as unknown as EffectContext['eventBus'],
    rng: _rng as unknown as EffectContext['rng'],
  };

  resolveEffects('ON_PLAY', effectCtx);

  // Emit HERO_SKILL_USED
  collectingBus.emit({
    type: 'HERO_SKILL_USED',
    playerIndex,
    hero: player.hero,
  });

  return success(events);
}

// ─── executeUseMinisterSkill ──────────────────────────────────────

export function executeUseMinisterSkill(
  state: GameState,
  eventBus: EventBus,
  _rng: RNG,
  playerIndex: number,
): EngineResult {
  // ── Validation ──────────────────────────────────────────────────
  if (state.phase !== 'MAIN') {
    return error('INVALID_PHASE', `Cannot use minister skill in phase ${state.phase}, expected MAIN`);
  }

  if (playerIndex !== state.currentPlayerIndex) {
    return error('INVALID_PHASE', `Player ${playerIndex} is not the current player`);
  }

  const player = state.players[playerIndex];

  if (player.activeMinisterIndex < 0) {
    return error('INVALID_TARGET', 'No active minister');
  }

  const minister = player.ministerPool[player.activeMinisterIndex];
  if (!minister) {
    return error('INVALID_TARGET', `Minister at index ${player.activeMinisterIndex} not found`);
  }

  if (minister.skillUsedThisTurn) {
    return error('SKILL_ON_COOLDOWN', 'Minister skill already used this turn');
  }

  if (minister.cooldown > 0) {
    return error('SKILL_ON_COOLDOWN', `Minister skill is on cooldown (${minister.cooldown} turns remaining)`);
  }

  if (player.energyCrystal < minister.activeSkill.cost) {
    return error('INSUFFICIENT_ENERGY', `Minister skill costs ${minister.activeSkill.cost}, but player only has ${player.energyCrystal} energy`);
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);
  const mutator = createStateMutator(state, collectingBus);

  // Mark skill as used
  minister.skillUsedThisTurn = true;

  // Spend energy
  player.energyCrystal -= minister.activeSkill.cost;
  collectingBus.emit({
    type: 'ENERGY_SPENT',
    playerIndex,
    amount: minister.activeSkill.cost,
    remainingEnergy: player.energyCrystal,
  });

  // Create a synthetic CardInstance as source for effect resolution
  const syntheticSource: CardInstance = {
    card: {
      id: minister.id,
      name: minister.name,
      civilization: player.civilization,
      type: 'MINION',
      rarity: 'RARE',
      cost: minister.activeSkill.cost,
      description: minister.activeSkill.description,
      keywords: [],
      effects: [minister.activeSkill.effect],
    },
    instanceId: `minister_${minister.id}_${Date.now()}`,
    ownerIndex: playerIndex as 0 | 1,
    currentAttack: 0,
    currentHealth: 0,
    currentMaxHealth: 0,
    remainingAttacks: 0,
    justPlayed: false,
    sleepTurns: 0,
    garrisonTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
    position: undefined,
  };

  const effectCtx: EffectContext = {
    state,
    mutator,
    source: syntheticSource,
    playerIndex,
    eventBus: collectingBus as unknown as EffectContext['eventBus'],
    rng: _rng as unknown as EffectContext['rng'],
  };

  resolveEffects('ON_PLAY', effectCtx);

  // Emit MINISTER_SKILL_USED
  collectingBus.emit({
    type: 'MINISTER_SKILL_USED',
    playerIndex,
    ministerId: minister.id,
  });

  return success(events);
}

// ─── executeSwitchMinister ────────────────────────────────────────

export function executeSwitchMinister(
  state: GameState,
  eventBus: EventBus,
  playerIndex: number,
  ministerIndex: number,
): EngineResult {
  // ── Validation ──────────────────────────────────────────────────
  if (state.phase !== 'MAIN') {
    return error('INVALID_PHASE', `Cannot switch minister in phase ${state.phase}, expected MAIN`);
  }

  if (playerIndex !== state.currentPlayerIndex) {
    return error('INVALID_PHASE', `Player ${playerIndex} is not the current player`);
  }

  const player = state.players[playerIndex];

  if (ministerIndex < 0 || ministerIndex >= player.ministerPool.length) {
    return error('INVALID_TARGET', `Minister index ${ministerIndex} is out of range`);
  }

  if (ministerIndex === player.activeMinisterIndex) {
    return error('INVALID_TARGET', `Minister ${ministerIndex} is already the active minister`);
  }

  if (player.energyCrystal < 1) {
    return error('INSUFFICIENT_ENERGY', `Switching minister costs 1 energy, but player only has ${player.energyCrystal}`);
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);

  // Spend energy
  player.energyCrystal -= 1;
  collectingBus.emit({
    type: 'ENERGY_SPENT',
    playerIndex,
    amount: 1,
    remainingEnergy: player.energyCrystal,
  });

  // Switch active minister
  player.activeMinisterIndex = ministerIndex;

  // Set cooldown on the new minister so it can't be used this turn
  const newMinister = player.ministerPool[ministerIndex];
  if (newMinister.cooldown < 1) {
    newMinister.cooldown = 1;
  }

  // Emit MINISTER_CHANGED
  collectingBus.emit({
    type: 'MINISTER_CHANGED',
    playerIndex,
    ministerIndex,
  });

  return success(events);
}
