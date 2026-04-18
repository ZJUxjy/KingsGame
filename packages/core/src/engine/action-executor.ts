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
import { executeTurnStart, executeTurnEnd } from './game-loop.js';
import { executeCardEffects, resolveEffects } from '../cards/effects/index.js';
import { getEmperorData } from './emperor-registry.js';
import { IdCounter } from './id-counter.js';

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

function createEffectEventBus(eventBus: EventBus): EffectContext['eventBus'] {
  return {
    emit(event: unknown): void {
      eventBus.emit(event as GameEvent);
    },
    on(eventType: string, handler: (event: unknown) => void): () => void {
      return eventBus.on(eventType, (event) => handler(event));
    },
    removeAllListeners(): void {
      eventBus.removeAllListeners();
    },
  };
}

function createEffectContext(
  state: GameState,
  eventBus: EventBus,
  rng: RNG,
  playerIndex: number,
  source: CardInstance,
  counter: IdCounter,
  target?: CardInstance,
): EffectContext {
  return {
    state,
    mutator: createStateMutator(state, eventBus, rng as EffectContext['rng'], counter),
    source,
    target,
    playerIndex,
    eventBus: createEffectEventBus(eventBus),
    rng: rng as unknown as EffectContext['rng'],
    counter,
  };
}

function getEffectiveCardCost(player: GameState['players'][number], card: Card): number {
  let cost = player.costModifiers.reduce(
    (c, modifier) => modifier.condition(card) ? modifier.modifier(c) : c,
    card.cost,
  );
  if (player.costReduction > 0) {
    cost = Math.max(0, cost - player.costReduction);
  }
  return cost;
}

function createSyntheticSource(
  card: Card,
  playerIndex: number,
  instanceId: string,
): CardInstance {
  return {
    card,
    instanceId,
    ownerIndex: playerIndex as 0 | 1,
    currentAttack: card.attack ?? 0,
    currentHealth: card.health ?? 0,
    currentMaxHealth: card.health ?? 0,
    remainingAttacks: 0,
    justPlayed: false,
    sleepTurns: 0,
    garrisonTurns: 0,
    frozenTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
    position: undefined,
  };
}

function requiresFriendlyMinionTarget(card: Card): boolean {
  return card.effects.some(
    (effect) => effect.type === 'SUMMON' && effect.params.cloneOfInstanceId === 'TARGET',
  );
}

function resolveFriendlyMinionTarget(
  state: GameState,
  playerIndex: number,
  target?: TargetRef,
): CardInstance | undefined {
  if (!target || target.type !== 'MINION') {
    return undefined;
  }

  const minion = findMinion(state, target.instanceId);
  if (!minion || minion.ownerIndex !== playerIndex) {
    return undefined;
  }

  return minion;
}

function getExplicitMinionTargetRequirement(
  card: Card,
): 'FRIENDLY_MINION' | 'ENEMY_MINION' | undefined {
  for (const effect of card.effects) {
    if (effect.params.target === 'FRIENDLY_MINION' || effect.params.target === 'ENEMY_MINION') {
      return effect.params.target;
    }
  }

  return undefined;
}

function resolveExplicitMinionTarget(
  state: GameState,
  playerIndex: number,
  targetRequirement: 'FRIENDLY_MINION' | 'ENEMY_MINION',
  target?: TargetRef,
): CardInstance | undefined {
  if (!target || target.type !== 'MINION') {
    return undefined;
  }

  const minion = findMinion(state, target.instanceId);
  if (!minion) {
    return undefined;
  }

  const expectedOwnerIndex = targetRequirement === 'FRIENDLY_MINION'
    ? playerIndex
    : 1 - playerIndex;

  if (minion.ownerIndex !== expectedOwnerIndex) {
    return undefined;
  }

  return minion;
}

// ─── executePlayCard ─────────────────────────────────────────────

export function executePlayCard(
  state: GameState,
  eventBus: EventBus,
  _rng: RNG,
  playerIndex: number,
  handIndex: number,
  counter: IdCounter,
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
  const effectiveCost = getEffectiveCardCost(player, card);
  if (effectiveCost > player.energyCrystal) {
    return error('INSUFFICIENT_ENERGY', `Card costs ${effectiveCost}, but player only has ${player.energyCrystal} energy`);
  }

  if (card.type === 'MINION' || card.type === 'GENERAL') {
    if (player.battlefield.length >= GAME_CONSTANTS.MAX_BOARD_SIZE) {
      return error('BOARD_FULL', `Battlefield is full (max ${GAME_CONSTANTS.MAX_BOARD_SIZE})`);
    }
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);
  const mutator = createStateMutator(state, collectingBus, _rng as EffectContext['rng'], counter);

  // Remove card from hand
  player.hand.splice(handIndex, 1);
  player.cardsPlayedThisTurn = (player.cardsPlayedThisTurn ?? 0) + 1;

  // Spend energy
  player.energyCrystal -= effectiveCost;
  if (player.costReduction > 0) {
    player.costReduction = 0;
  }
  collectingBus.emit({
    type: 'ENERGY_SPENT',
    playerIndex,
    amount: effectiveCost,
    remainingEnergy: player.energyCrystal,
  });

  if (card.type === 'MINION' || card.type === 'GENERAL') {
    // Summon to battlefield
    const summonResult = mutator.summonMinion(card, playerIndex as 0 | 1, targetBoardPosition);
    if (summonResult.error) {
      return error(summonResult.error, `Failed to summon minion: ${summonResult.error}`);
    }

    // Trigger ON_PLAY effects (e.g. BATTLECRY)
    const summonedMinion = summonResult.instance;

    collectingBus.emit({
      type: 'CARD_PLAYED',
      playerIndex,
      card,
      instanceId: summonedMinion?.instanceId,
    });

    if (summonedMinion) {
      const effectCtx = createEffectContext(state, collectingBus, _rng, playerIndex, summonedMinion, counter);
      executeCardEffects('ON_PLAY', effectCtx);
      resolveEffects('ON_PLAY', effectCtx);
    }
  } else {
    collectingBus.emit({ type: 'CARD_PLAYED', playerIndex, card });

    if (card.type === 'STRATAGEM' || card.type === 'SORCERY') {
      const effectCtx = createEffectContext(
        state,
        collectingBus,
        _rng,
        playerIndex,
        createSyntheticSource(card, playerIndex, counter.nextSyntheticSourceId(`card_${card.id}`)),
        counter,
      );
      executeCardEffects('ON_PLAY', effectCtx);
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

        const effectCtx = createEffectContext(
          state,
          collectingBus,
          _rng,
          playerIndex,
          createSyntheticSource(card, playerIndex, counter.nextSyntheticSourceId(`emperor_${card.id}`)),
          counter,
        );
        executeCardEffects('ON_PLAY', effectCtx);
      }
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
  _rng: RNG,
  counter: IdCounter,
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

  if (attacker.frozenTurns > 0) {
    return error('MINION_CANNOT_ATTACK', 'Attacker is frozen');
  }

  if (attacker.remainingAttacks <= 0) {
    return error('MINION_CANNOT_ATTACK', `Attacker has no remaining attacks`);
  }

  if (attacker.currentAttack <= 0) {
    return error('MINION_CANNOT_ATTACK', 'Attacker must have positive attack to attack');
  }

  const opponentIndex = 1 - state.currentPlayerIndex;
  const opponent = state.players[opponentIndex];

  // RUSH check: a RUSH minion cannot attack the hero on the turn it is played
  if (target.type === 'HERO' && attacker.justPlayed && hasKeyword(attacker, 'RUSH')) {
    return error('INVALID_TARGET', 'RUSH minions cannot attack the hero on the turn they are played');
  }

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

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);
  const mutator = createStateMutator(state, collectingBus, _rng as EffectContext['rng'], counter);

  // Decrement remaining attacks
  attacker.remainingAttacks -= 1;

  // Emit ATTACK_DECLARED
  collectingBus.emit({ type: 'ATTACK_DECLARED', attacker, defender: target });

  // Capture the target minion before any mutation so that both
  // ON_ATTACK and ON_KILL receive a stable reference even after damage
  // resolution (which may remove the minion from the battlefield).
  const targetMinionBeforeDamage =
    target.type === 'MINION' ? findMinion(state, target.instanceId) : undefined;

  // Trigger ON_ATTACK handlers before damage is applied
  const attackEffectCtx: EffectContext = {
    state,
    mutator,
    source: attacker,
    target: targetMinionBeforeDamage,
    playerIndex: attacker.ownerIndex,
    eventBus: createEffectEventBus(collectingBus),
    rng: { nextInt: () => 0, next: () => 0, pick: (arr) => arr[0], shuffle: (a) => a },
    counter,
  };
  resolveEffects('ON_ATTACK', attackEffectCtx);

  // Calculate and apply damage
  const damage = Math.max(0, attacker.currentAttack);

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
        eventBus: createEffectEventBus(collectingBus),
        rng: { nextInt: () => 0, next: () => 0, pick: (arr) => arr[0], shuffle: (a) => a },
        counter,
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
      const counterDamage = Math.max(0, targetMinion.currentAttack);
      const attackerRef: TargetRef = { type: 'MINION', instanceId: attackerInstanceId };
      mutator.damage(attackerRef, counterDamage);

      // If counterattack killed the attacker, trigger ON_KILL for the defender
      const attackerAfterCounter = findMinion(state, attackerInstanceId);
      if (!attackerAfterCounter) {
        const onKillEffectCtx: EffectContext = {
          state,
          mutator,
          source: targetMinion,
          target: attacker,
          playerIndex: targetMinion.ownerIndex,
          eventBus: createEffectEventBus(collectingBus),
          rng: { nextInt: () => 0, next: () => 0, pick: (arr) => arr[0], shuffle: (a) => a },
          counter,
        };
        resolveEffects('ON_KILL', onKillEffectCtx);
      }
    }
  }

  // Check win condition
  const winResult = checkWinCondition(state);
  state.isGameOver = winResult.isGameOver;
  state.winnerIndex = winResult.winnerIndex;
  state.winReason = winResult.winReason;

  if (winResult.isGameOver) {
    collectingBus.emit({
      type: 'GAME_OVER',
      winnerIndex: winResult.winnerIndex!,
      reason: winResult.winReason!,
    });
  }

  return success(events);
}

// ─── executeEndTurn ──────────────────────────────────────────────

export function executeEndTurn(
  state: GameState,
  eventBus: EventBus,
  counter: IdCounter,
): EngineResult {
  // ── Validation ──────────────────────────────────────────────────
  const validPhases: GameState['phase'][] = ['MAIN', 'UPKEEP', 'DRAW', 'ENERGY_GAIN'];
  if (!validPhases.includes(state.phase)) {
    return error('INVALID_PHASE', `Cannot end turn in phase ${state.phase}`);
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);

  // Fire ON_TURN_END handlers for the player whose turn is ending,
  // before switching control. COLONY and other end-of-turn keywords
  // depend on this firing for the correct player's battlefield.
  executeTurnEnd(state, collectingBus, counter);

  // Emit TURN_END for the player whose turn is actually ending.
  // Must happen before the player switch + turnNumber increment in
  // executeTurnStart so listeners receive the just-ended turn's metadata.
  collectingBus.emit({
    type: 'TURN_END',
    playerIndex: state.currentPlayerIndex,
    turnNumber: state.turnNumber,
  });

  // Switch current player
  state.currentPlayerIndex = (1 - state.currentPlayerIndex) as 0 | 1;

  // Start the new turn
  executeTurnStart(state, collectingBus, counter);

  return success(events);
}

// ─── executeUseHeroSkill ──────────────────────────────────────────

export function executeUseHeroSkill(
  state: GameState,
  eventBus: EventBus,
  _rng: RNG,
  playerIndex: number,
  counter: IdCounter,
  target?: TargetRef,
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

  const syntheticSkillCard: Card = {
    id: `hero_skill_${player.id}`,
    name: heroSkill.name,
    civilization: player.civilization,
    type: 'EMPEROR',
    rarity: 'LEGENDARY',
    cost: heroSkill.cost,
    description: heroSkill.description,
    keywords: [],
    effects: [heroSkill.effect],
  };

  const requiresCloneTarget = requiresFriendlyMinionTarget(syntheticSkillCard);
  const minionTargetRequirement = getExplicitMinionTargetRequirement(syntheticSkillCard);

  if (requiresCloneTarget && player.battlefield.length >= GAME_CONSTANTS.MAX_BOARD_SIZE) {
    return error('BOARD_FULL', `Battlefield is full (max ${GAME_CONSTANTS.MAX_BOARD_SIZE})`);
  }

  const cloneTarget = requiresCloneTarget
    ? resolveFriendlyMinionTarget(state, playerIndex, target)
    : undefined;
  const explicitTarget = minionTargetRequirement
    ? resolveExplicitMinionTarget(state, playerIndex, minionTargetRequirement, target)
    : undefined;

  const effectTarget = cloneTarget ?? explicitTarget;

  if (requiresCloneTarget && !cloneTarget) {
    return error('INVALID_TARGET', 'Hero skill requires a friendly minion target');
  }

  if (minionTargetRequirement && !explicitTarget) {
    const targetLabel = minionTargetRequirement === 'FRIENDLY_MINION' ? 'friendly' : 'enemy';
    return error('INVALID_TARGET', `Hero skill requires a ${targetLabel} minion target`);
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);

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
  const effectCtx = createEffectContext(
    state,
    collectingBus,
    _rng,
    playerIndex,
    createSyntheticSource(
      syntheticSkillCard,
      playerIndex,
      counter.nextSyntheticSourceId(`hero_skill_${player.id}`),
    ),
    counter,
    effectTarget,
  );

  executeCardEffects('ON_PLAY', effectCtx);
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
  counter: IdCounter,
  target?: TargetRef,
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

  const syntheticSkillCard: Card = {
    id: minister.id,
    name: minister.name,
    civilization: player.civilization,
    type: 'MINION',
    rarity: 'RARE',
    cost: minister.activeSkill.cost,
    description: minister.activeSkill.description,
    keywords: [],
    effects: [minister.activeSkill.effect],
  };

  const minionTargetRequirement = getExplicitMinionTargetRequirement(syntheticSkillCard);
  const effectTarget = minionTargetRequirement
    ? resolveExplicitMinionTarget(state, playerIndex, minionTargetRequirement, target)
    : undefined;

  if (minionTargetRequirement && !effectTarget) {
    const targetLabel = minionTargetRequirement === 'FRIENDLY_MINION' ? 'friendly' : 'enemy';
    return error('INVALID_TARGET', `Minister skill requires a ${targetLabel} minion target`);
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);

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
  const effectCtx = createEffectContext(
    state,
    collectingBus,
    _rng,
    playerIndex,
    createSyntheticSource(
      syntheticSkillCard,
      playerIndex,
      counter.nextSyntheticSourceId(`minister_${minister.id}`),
    ),
    counter,
    effectTarget,
  );

  executeCardEffects('ON_PLAY', effectCtx);
  resolveEffects('ON_PLAY', effectCtx);

  // Emit MINISTER_SKILL_USED
  collectingBus.emit({
    type: 'MINISTER_SKILL_USED',
    playerIndex,
    ministerId: minister.id,
  });

  return success(events);
}

// ─── executeUseGeneralSkill ────────────────────────────────────────

export function executeUseGeneralSkill(
  state: GameState,
  eventBus: EventBus,
  _rng: RNG,
  playerIndex: number,
  instanceId: string,
  skillIndex: number,
  counter: IdCounter,
  target?: TargetRef,
): EngineResult {
  // ── Validation ──────────────────────────────────────────────────
  if (state.phase !== 'MAIN') {
    return error('INVALID_PHASE', `Cannot use general skill in phase ${state.phase}, expected MAIN`);
  }

  if (playerIndex !== state.currentPlayerIndex) {
    return error('INVALID_PHASE', `Player ${playerIndex} is not the current player`);
  }

  const player = state.players[playerIndex];

  // Find minion on battlefield by instanceId
  const minion = findMinion(state, instanceId);
  if (!minion) {
    return error('INVALID_TARGET', `Minion ${instanceId} not found on battlefield`);
  }

  if (minion.card.type !== 'GENERAL') {
    return error('INVALID_TARGET', `Minion ${instanceId} is not a general`);
  }

  if (!minion.card.generalSkills || minion.card.generalSkills.length === 0) {
    return error('INVALID_TARGET', `General ${instanceId} has no general skills`);
  }

  if (skillIndex < 0 || skillIndex >= minion.card.generalSkills.length) {
    return error('INVALID_TARGET', `Skill index ${skillIndex} is out of range`);
  }

  // Check bitmask: skill already used this turn?
  const usedMask = 1 << skillIndex;
  if (minion.usedGeneralSkills & usedMask) {
    return error('SKILL_ON_COOLDOWN', `General skill at index ${skillIndex} already used this turn`);
  }

  const skill = minion.card.generalSkills[skillIndex];

  if (player.energyCrystal < skill.cost) {
    return error('INSUFFICIENT_ENERGY', `General skill costs ${skill.cost}, but player only has ${player.energyCrystal} energy`);
  }

  // Build synthetic skill card for effect resolution
  const syntheticSkillCard: Card = {
    id: `general_skill_${minion.card.id}_${skillIndex}`,
    name: skill.name,
    civilization: player.civilization,
    type: 'GENERAL',
    rarity: 'LEGENDARY',
    cost: skill.cost,
    description: skill.description,
    keywords: [],
    effects: [skill.effect],
  };

  const requiresCloneTarget = requiresFriendlyMinionTarget(syntheticSkillCard);

  if (requiresCloneTarget && player.battlefield.length >= GAME_CONSTANTS.MAX_BOARD_SIZE) {
    return error('BOARD_FULL', `Battlefield is full (max ${GAME_CONSTANTS.MAX_BOARD_SIZE})`);
  }

  const cloneTarget = requiresCloneTarget
    ? resolveFriendlyMinionTarget(state, playerIndex, target)
    : undefined;

  if (requiresCloneTarget && !cloneTarget) {
    return error('INVALID_TARGET', 'General skill requires a friendly minion target');
  }

  // Resolve explicit minion target if required
  const minionTargetRequirement = getExplicitMinionTargetRequirement(syntheticSkillCard);
  const explicitTarget = minionTargetRequirement
    ? resolveExplicitMinionTarget(state, playerIndex, minionTargetRequirement, target)
    : undefined;

  const effectTarget = cloneTarget ?? explicitTarget;

  if (minionTargetRequirement && !explicitTarget) {
    const targetLabel = minionTargetRequirement === 'FRIENDLY_MINION' ? 'friendly' : 'enemy';
    return error('INVALID_TARGET', `General skill requires a ${targetLabel} minion target`);
  }

  // ── Execution ───────────────────────────────────────────────────
  const events: GameEvent[] = [];
  const collectingBus = createCollectingEventBus(eventBus, events);

  // Mark skill as used via bitmask
  minion.usedGeneralSkills |= usedMask;

  // Spend energy if cost > 0
  if (skill.cost > 0) {
    player.energyCrystal -= skill.cost;
    collectingBus.emit({
      type: 'ENERGY_SPENT',
      playerIndex,
      amount: skill.cost,
      remainingEnergy: player.energyCrystal,
    });
  }

  // Create a synthetic CardInstance as source for effect resolution.
  // Use the minion's actual instanceId so that findSourceOnBattlefield
  // can locate it on the battlefield for self-targeting effects (MODIFY_STAT, etc.).
  const effectCtx = createEffectContext(
    state,
    collectingBus,
    _rng,
    playerIndex,
    createSyntheticSource(
      syntheticSkillCard,
      playerIndex,
      minion.instanceId,
    ),
    counter,
    effectTarget,
  );

  executeCardEffects('ON_PLAY', effectCtx);
  resolveEffects('ON_PLAY', effectCtx);

  // Emit GENERAL_SKILL_USED
  collectingBus.emit({
    type: 'GENERAL_SKILL_USED',
    instance: minion,
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
