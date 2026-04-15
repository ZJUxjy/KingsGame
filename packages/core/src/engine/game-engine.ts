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
} from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';
import { createGameState } from '../models/game.js';
import { createStateMutator } from './state-mutator.js';
import { executeTurnStart } from './game-loop.js';
import { executePlayCard, executeAttack, executeEndTurn, executeUseHeroSkill, executeUseMinisterSkill, executeSwitchMinister } from './action-executor.js';
import { EventBusImpl } from './event-bus.js';
import { DefaultRNG } from './rng.js';
import { registerEmperorData } from './emperor-registry.js';

// ─── GameEngine ─────────────────────────────────────────────────────

export class GameEngine {
  private state: GameState;
  private eventBus: EventBus;
  private rng: RNG;

  private constructor(state: GameState, eventBus: EventBus, rng: RNG) {
    this.state = state;
    this.eventBus = eventBus;
    this.rng = rng;
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

    // 2.5 Register emperor data for lookup during EMPEROR card play
    registerEmperorData(emperor1);
    registerEmperorData(emperor2);

    // 3. Create initial state
    const state = createGameState(deck1, deck2, emperor1, emperor2);

    // 4. Replace deck contents with original Card objects.
    // createGameState internally wraps deck cards as CardInstance, but the game
    // engine expects deck cards to be plain Card objects so that drawCards
    // moves plain Card objects into hand (executePlayCard reads card.cost, card.type).
    state.players[0].deck = [...deck1];
    state.players[1].deck = [...deck2];

    // 6. Shuffle decks
    state.players[0].deck = actualRng.shuffle(state.players[0].deck);
    state.players[1].deck = actualRng.shuffle(state.players[1].deck);

    // 7. Emit GAME_START
    eventBus.emit({ type: 'GAME_START', state });

    // 8. Pre-draw cards before first turn start
    // executeTurnStart draws 1 card per turn. We need STARTING_HAND_SIZE total for each player.
    // So pre-draw (STARTING_HAND_SIZE - 1) for player 0 and STARTING_HAND_SIZE for player 1.
    const mutator = createStateMutator(state, eventBus);
    mutator.drawCards(0, GAME_CONSTANTS.STARTING_HAND_SIZE - 1);
    mutator.drawCards(1, GAME_CONSTANTS.STARTING_HAND_SIZE);

    // Now run executeTurnStart for player 0 (gains energy, draws 1 more card)
    executeTurnStart(state, eventBus);

    // 9. Second-player compensation: player 1 draws an extra card
    mutator.drawCards(1, 1);

    return new GameEngine(state, eventBus, actualRng);
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
      if (card.cost > player.energyCrystal) continue;

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
      if (minion.remainingAttacks <= 0) continue;

      const isStealthKill = minion.card.keywords.includes('STEALTH_KILL' as any);
      const canAttackHero =
        minion.card.keywords.includes('CHARGE' as any) ||
        minion.card.keywords.includes('ASSASSIN' as any);

      // Attack hero (only if CHARGE or ASSASSIN, and no taunt blockers unless STEALTH_KILL)
      if (canAttackHero) {
        if (!opponentHasTaunt || isStealthKill) {
          actions.push({
            type: 'ATTACK',
            attackerInstanceId: minion.instanceId,
            targetInstanceId: 'HERO',
          });
        }
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
      actions.push({ type: 'USE_HERO_SKILL' });
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
        actions.push({ type: 'USE_MINISTER_SKILL' });
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

    // 6. END_TURN
    actions.push({ type: 'END_TURN' });

    return actions;
  }

  getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  // ─── Action Interface ─────────────────────────────────────────────

  playCard(playerIndex: number, handIndex: number, targetBoardPosition?: number): EngineResult {
    return executePlayCard(this.state, this.eventBus, this.rng, playerIndex, handIndex, targetBoardPosition);
  }

  attack(attackerInstanceId: string, target: TargetRef): EngineResult {
    return executeAttack(this.state, this.eventBus, attackerInstanceId, target);
  }

  endTurn(): EngineResult {
    return executeEndTurn(this.state, this.eventBus);
  }

  useHeroSkill(playerIndex: number): EngineResult {
    return executeUseHeroSkill(this.state, this.eventBus, this.rng, playerIndex);
  }

  useMinisterSkill(playerIndex: number, target?: TargetRef): EngineResult {
    return executeUseMinisterSkill(this.state, this.eventBus, this.rng, playerIndex, target);
  }

  switchMinister(playerIndex: number, ministerIndex: number): EngineResult {
    return executeSwitchMinister(this.state, this.eventBus, playerIndex, ministerIndex);
  }

  // ─── Event Subscription ────────────────────────────────────────────

  /**
   * Subscribe to engine events. Returns an unsubscribe function.
   */
  onEvent(eventType: string, handler: (event: GameEvent) => void): () => void {
    return this.eventBus.on(eventType, handler);
  }
}
