import type {
  GameState,
  GameEvent,
  EventBus,
  EngineResult,
  TargetRef,
  Card,
  EmperorData,
  Player,
  ValidAction,
  RNG,
  EffectContext,
} from '@king-card/shared';
import { GAME_CONSTANTS, getEffectiveCardCost } from '@king-card/shared';
import { createGameState } from '../models/game.js';
import { createStateMutator } from './state-mutator.js';
import { executeTurnStart } from './game-loop.js';
import { executePlayCard, executeAttack, executeEndTurn, executeUseHeroSkill, executeUseMinisterSkill, executeSwitchMinister, executeUseGeneralSkill } from './action-executor.js';
import { EventBusImpl } from './event-bus.js';
import { DefaultRNG } from './rng.js';
import { registerEmperorData } from './emperor-registry.js';
import { IdCounter } from './id-counter.js';

function requiresFriendlyMinionTarget(card: Card): boolean {
  return card.effects.some(
    (effect) => effect.type === 'SUMMON' && effect.params.cloneOfInstanceId === 'TARGET',
  );
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

function getSkillTargets(
  state: GameState,
  playerIndex: number,
  card: Card,
): TargetRef[] | null {
  if (requiresFriendlyMinionTarget(card)) {
    if (state.players[playerIndex].battlefield.length >= GAME_CONSTANTS.MAX_BOARD_SIZE) {
      return [];
    }

    return state.players[playerIndex].battlefield.map((minion) => ({
      type: 'MINION' as const,
      instanceId: minion.instanceId,
    }));
  }

  const targetRequirement = getExplicitMinionTargetRequirement(card);
  if (!targetRequirement) {
    return null;
  }

  const targetPlayer = targetRequirement === 'FRIENDLY_MINION'
    ? state.players[playerIndex]
    : state.players[1 - playerIndex];

  return targetPlayer.battlefield.map((minion) => ({
    type: 'MINION' as const,
    instanceId: minion.instanceId,
  }));
}

function pushTargetedSkillActions<T extends Extract<ValidAction, { target?: TargetRef }>>(
  actions: ValidAction[],
  baseAction: T,
  targets: TargetRef[] | null,
): void {
  if (targets === null) {
    actions.push(baseAction);
    return;
  }

  for (const target of targets) {
    actions.push({ ...baseAction, target });
  }
}

// ─── GameEngine ─────────────────────────────────────────────────────

export class GameEngine {
  private state: GameState;
  private eventBus: EventBus;
  private rng: RNG;
  private counter: IdCounter;

  private constructor(state: GameState, eventBus: EventBus, rng: RNG, counter: IdCounter) {
    this.state = state;
    this.eventBus = eventBus;
    this.rng = rng;
    this.counter = counter;
  }

  // ─── Factory ──────────────────────────────────────────────────────

  /**
   * Create a new GameEngine instance with the given decks and emperor data.
   *
   * - Creates EventBus and optional RNG
   * - Builds initial GameState from deck + emperor data
   * - Shuffles both decks
   * - Emits GAME_START
   * - Runs first turn start (player 0 gains 1 energy, draws 4)
   * - Player 1 draws an extra card as second-player compensation
   */
  static create(
    deck1: Card[],
    deck2: Card[],
    emperor1: EmperorData,
    emperor2: EmperorData,
    rng?: RNG,
  ): GameEngine {
    // 1. Create EventBus
    const eventBus: EventBus = new EventBusImpl();

    // 2. Default RNG
    const actualRng = rng ?? new DefaultRNG();

    // 2.1 Per-engine ID counter (replaces the old module-level counters that
    // caused ID collisions between players within a game and across concurrent
    // games). Threaded into createGameState, the StateMutator, and every
    // EffectContext so all generated ids share one monotonic source.
    const counter = new IdCounter();

    // 2.5 Register emperor data for lookup during EMPEROR card play
    registerEmperorData(emperor1);
    registerEmperorData(emperor2);

    // 3. Create initial state
    const state = createGameState(deck1, deck2, emperor1, emperor2, counter);

    // 4. Shuffle decks (CardInstance[] arrays produced by createGameState)
    state.players[0].deck = actualRng.shuffle(state.players[0].deck);
    state.players[1].deck = actualRng.shuffle(state.players[1].deck);

    // 7. Emit GAME_START
    eventBus.emit({ type: 'GAME_START', state });

    // 8. Pre-draw cards before first turn start
    // executeTurnStart draws 1 card per turn. We need STARTING_HAND_SIZE total for each player.
    // So pre-draw (STARTING_HAND_SIZE - 1) for player 0 and STARTING_HAND_SIZE for player 1.
    const mutator = createStateMutator(state, eventBus, actualRng as EffectContext['rng'], counter);
    mutator.drawCards(0, GAME_CONSTANTS.STARTING_HAND_SIZE - 1);
    mutator.drawCards(1, GAME_CONSTANTS.STARTING_HAND_SIZE);

    // Now run executeTurnStart for player 0 (gains energy, draws 1 more card)
    executeTurnStart(state, eventBus, counter);

    // 9. Second-player compensation: player 1 draws an extra card
    mutator.drawCards(1, 1);

    return new GameEngine(state, eventBus, actualRng, counter);
  }

  // ─── Query Interface ──────────────────────────────────────────────

  getGameState(): Readonly<GameState> {
    return this.state;
  }

  getValidActions(playerIndex: number): ValidAction[] {
    const actions: ValidAction[] = [];

    // If game is over, no actions available
    if (this.state.isGameOver) {
      return actions;
    }

    // Non-MAIN phase: only END_TURN
    if (this.state.phase !== 'MAIN') {
      actions.push({ type: 'END_TURN' });
      return actions;
    }

    const player = this.state.players[playerIndex];
    const opponentIndex = 1 - playerIndex;
    const opponent = this.state.players[opponentIndex];

    // 1. PLAY_CARD
    for (let i = 0; i < player.hand.length; i++) {
      const card = player.hand[i];
      if (getEffectiveCardCost(player, card) > player.energyCrystal) continue;

      if (card.type === 'MINION' || card.type === 'GENERAL') {
        if (player.battlefield.length >= GAME_CONSTANTS.MAX_BOARD_SIZE) continue;
      }

      actions.push({ type: 'PLAY_CARD', handIndex: i });
    }

    // 2. ATTACK
    const opponentHasTaunt = opponent.battlefield.some(
      (m) => m.card.keywords.includes('TAUNT' as any) && !m.card.keywords.includes('STEALTH_KILL' as any),
    );

    for (const minion of player.battlefield) {
      if (minion.remainingAttacks <= 0 || minion.currentAttack <= 0) continue;

      const isStealthKill = minion.card.keywords.includes('STEALTH_KILL' as any);
      // RUSH minions cannot attack the hero on the turn they are played
      const isRushFirstTurn = minion.justPlayed && minion.card.keywords.includes('RUSH' as any);

      // Attack hero when attack-ready and no taunt blockers unless STEALTH_KILL, and not RUSH first turn
      if (!isRushFirstTurn && (!opponentHasTaunt || isStealthKill)) {
        actions.push({
          type: 'ATTACK',
          attackerInstanceId: minion.instanceId,
          targetInstanceId: 'HERO',
        });
      }

      // Attack enemy minions
      for (const enemyMinion of opponent.battlefield) {
        const enemyIsTaunt = enemyMinion.card.keywords.includes('TAUNT' as any) && !enemyMinion.card.keywords.includes('STEALTH_KILL' as any);
        // If opponent has taunt, non-STEALTH_KILL can only target taunt minions
        if (opponentHasTaunt && !isStealthKill && !enemyIsTaunt) continue;

        actions.push({
          type: 'ATTACK',
          attackerInstanceId: minion.instanceId,
          targetInstanceId: enemyMinion.instanceId,
        });
      }
    }

    // 3. USE_HERO_SKILL
    if (
      player.hero.heroSkill &&
      !player.hero.skillUsedThisTurn &&
      player.hero.skillCooldownRemaining === 0 &&
      player.energyCrystal >= player.hero.heroSkill.cost
    ) {
      const heroSkillCard: Card = {
        id: `hero_skill_${player.id}`,
        name: player.hero.heroSkill.name,
        civilization: player.civilization,
        type: 'EMPEROR',
        rarity: 'LEGENDARY',
        cost: player.hero.heroSkill.cost,
        description: player.hero.heroSkill.description,
        keywords: [],
        effects: [player.hero.heroSkill.effect],
      };

      pushTargetedSkillActions(
        actions,
        { type: 'USE_HERO_SKILL' },
        getSkillTargets(this.state, playerIndex, heroSkillCard),
      );
    }

    // 4. USE_MINISTER_SKILL
    if (player.activeMinisterIndex >= 0) {
      const minister = player.ministerPool[player.activeMinisterIndex];
      if (
        minister &&
        !minister.skillUsedThisTurn &&
        minister.cooldown === 0 &&
        player.energyCrystal >= minister.activeSkill.cost
      ) {
        const ministerSkillCard: Card = {
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

        pushTargetedSkillActions(
          actions,
          { type: 'USE_MINISTER_SKILL' },
          getSkillTargets(this.state, playerIndex, ministerSkillCard),
        );
      }
    }

    // 5. SWITCH_MINISTER
    if (player.energyCrystal >= 1) {
      for (let i = 0; i < player.ministerPool.length; i++) {
        if (i !== player.activeMinisterIndex) {
          actions.push({ type: 'SWITCH_MINISTER', ministerIndex: i });
        }
      }
    }

    // 5.5. USE_GENERAL_SKILL
    for (const minion of player.battlefield) {
      if (minion.card.type !== 'GENERAL' || !minion.card.generalSkills) continue;
      for (let si = 0; si < minion.card.generalSkills.length; si++) {
        const skill = minion.card.generalSkills[si];
        const usedMask = 1 << si;
        if (minion.usedGeneralSkills & usedMask) continue;
        if (skill.cost > player.energyCrystal) continue;
        const generalSkillCard: Card = {
          id: `general_skill_${minion.card.id}_${si}`,
          name: skill.name,
          civilization: player.civilization,
          type: 'GENERAL',
          rarity: 'LEGENDARY',
          cost: skill.cost,
          description: skill.description,
          keywords: [],
          effects: [skill.effect],
        };

        pushTargetedSkillActions(
          actions,
          { type: 'USE_GENERAL_SKILL', instanceId: minion.instanceId, skillIndex: si },
          getSkillTargets(this.state, playerIndex, generalSkillCard),
        );
      }
    }

    // 6. END_TURN
    actions.push({ type: 'END_TURN' });

    return actions;
  }

  getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  // ─── Action Interface ─────────────────────────────────────────────

  playCard(playerIndex: number, handIndex: number, targetBoardPosition?: number): EngineResult {
    return executePlayCard(this.state, this.eventBus, this.rng, playerIndex, handIndex, this.counter, targetBoardPosition);
  }

  attack(attackerInstanceId: string, target: TargetRef): EngineResult {
    return executeAttack(this.state, this.eventBus, attackerInstanceId, target, this.rng, this.counter);
  }

  endTurn(): EngineResult {
    return executeEndTurn(this.state, this.eventBus, this.counter);
  }

  useHeroSkill(playerIndex: number, target?: TargetRef): EngineResult {
    return executeUseHeroSkill(this.state, this.eventBus, this.rng, playerIndex, this.counter, target);
  }

  useMinisterSkill(playerIndex: number, target?: TargetRef): EngineResult {
    return executeUseMinisterSkill(this.state, this.eventBus, this.rng, playerIndex, this.counter, target);
  }

  switchMinister(playerIndex: number, ministerIndex: number): EngineResult {
    return executeSwitchMinister(this.state, this.eventBus, playerIndex, ministerIndex);
  }

  useGeneralSkill(playerIndex: number, instanceId: string, skillIndex: number, target?: TargetRef): EngineResult {
    return executeUseGeneralSkill(this.state, this.eventBus, this.rng, playerIndex, instanceId, skillIndex, this.counter, target);
  }

  // ─── Event Subscription ────────────────────────────────────────────

  /**
   * Subscribe to engine events. Returns an unsubscribe function.
   */
  onEvent(eventType: string, handler: (event: GameEvent) => void): () => void {
    return this.eventBus.on(eventType, handler);
  }
}
