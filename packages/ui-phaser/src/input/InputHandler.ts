import type { GameEngine } from '@king-card/core';
import type { Card, CardInstance, GameEvent, ValidAction, TargetRef } from '@king-card/shared';
import { AnimationQueue } from '../animations/AnimationQueue.js';
import type { HandZone } from '../components/HandZone.js';
import type { BoardZone } from '../components/BoardZone.js';
import type { HeroPanel } from '../components/HeroPanel.js';
import type { MinisterPanel } from '../components/MinisterPanel.js';
import type { TurnIndicator } from '../components/TurnIndicator.js';

// ─── Interaction Mode ───────────────────────────────────────────────

type InteractionMode = 'IDLE' | 'SELECTING_ATTACK_TARGET' | 'DRAGGING_CARD';

/**
 * InputHandler bridges UI component callbacks to GameEngine actions.
 *
 * Responsibilities:
 *   - Wire component callbacks (click, drag, skill buttons)
 *   - Validate actions via getValidActions before calling engine
 *   - Handle attack targeting (select attacker -> highlight targets -> click target)
 *   - Manage input lock during animations
 *   - Play animations based on engine events
 *   - Trigger hot-seat overlay on turn end
 *   - Show victory screen on game over
 */
export class InputHandler {
  private engine: GameEngine;
  private animationQueue: AnimationQueue;

  // Component references
  private handZone: HandZone;
  private playerBoard: BoardZone;
  private enemyBoard: BoardZone;
  private playerHeroPanel: HeroPanel;
  private enemyHeroPanel: HeroPanel;
  private playerMinisterPanel: MinisterPanel;
  private turnIndicator: TurnIndicator;

  // Callbacks provided by BattleScene
  private onRefreshUI: () => void;
  private onShowHotSeat: (nextPlayerName: string, onDismiss: () => void) => void;
  private onShowVictory: (winnerName: string, winnerIndex: number, winReason: string | null) => void;

  // Interaction state
  private mode: InteractionMode = 'IDLE';
  private selectedAttackerInstanceId: string | null = null;
  private validAttackTargets: string[] = [];

  // Which player index is "local" (sitting at the bottom of the screen).
  // In hot-seat, this changes after each turn.
  private localPlayerIndex: 0 | 1 = 0;

  // Input lock
  private inputLocked = false;

  // Toast container for error messages
  private toastContainer: Phaser.GameObjects.Container;

  constructor(
    engine: GameEngine,
    animationQueue: AnimationQueue,
    components: {
      handZone: HandZone;
      playerBoard: BoardZone;
      enemyBoard: BoardZone;
      playerHeroPanel: HeroPanel;
      enemyHeroPanel: HeroPanel;
      playerMinisterPanel: MinisterPanel;
      turnIndicator: TurnIndicator;
    },
    scene: Phaser.Scene,
    callbacks: {
      onRefreshUI: () => void;
      onShowHotSeat: (nextPlayerName: string, onDismiss: () => void) => void;
      onShowVictory: (winnerName: string, winnerIndex: number, winReason: string | null) => void;
    },
  ) {
    this.engine = engine;
    this.animationQueue = animationQueue;
    this.handZone = components.handZone;
    this.playerBoard = components.playerBoard;
    this.enemyBoard = components.enemyBoard;
    this.playerHeroPanel = components.playerHeroPanel;
    this.enemyHeroPanel = components.enemyHeroPanel;
    this.playerMinisterPanel = components.playerMinisterPanel;
    this.turnIndicator = components.turnIndicator;
    this.onRefreshUI = callbacks.onRefreshUI;
    this.onShowHotSeat = callbacks.onShowHotSeat;
    this.onShowVictory = callbacks.onShowVictory;

    // Toast container for error messages
    this.toastContainer = scene.add.container(640, 250);
    this.toastContainer.setDepth(1500);
    scene.add.existing(this.toastContainer);

    this.wireCallbacks();
    this.subscribeToEngineEvents();
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Update the local player index (for hot-seat mode).
   */
  setLocalPlayerIndex(index: 0 | 1): void {
    this.localPlayerIndex = index;
  }

  /**
   * Lock or unlock input.
   */
  setInputLocked(locked: boolean): void {
    this.inputLocked = locked;
  }

  /**
   * Get the current local player index.
   */
  getLocalPlayerIndex(): 0 | 1 {
    return this.localPlayerIndex;
  }

  /**
   * Check if input is currently locked.
   */
  isInputLocked(): boolean {
    return this.inputLocked || this.animationQueue.isPlaying();
  }

  /**
   * Clean up event subscriptions and references.
   */
  destroy(): void {
    this.animationQueue.clear();
    this.toastContainer.destroy();
  }

  // ─── Callback Wiring ───────────────────────────────────────────────

  private wireCallbacks(): void {
    // Hand zone: card drag
    this.handZone.onCardDragStart = () => {
      if (this.isInputLocked()) return;
      this.mode = 'DRAGGING_CARD';
    };

    this.handZone.onCardDragEnd = (card, handIndex, worldX, worldY) => {
      if (this.isInputLocked()) {
        this.handZone.animateCardBack(handIndex);
        return;
      }

      this.mode = 'IDLE';

      // Check if dropped on player battlefield
      const boardY = 300; // playerBattlefieldZone.y
      if (worldY >= boardY && worldY <= boardY + 180) {
        const canPlace = this.playerBoard.showDragPreview(card, worldX, worldY);
        if (canPlace) {
          const insertionIndex = this.playerBoard.confirmPlacement(card);
          this.playerBoard.hideDragPreview();
          this.tryPlayCard(handIndex, insertionIndex);
          return;
        }
      }

      // Not placed on board, animate card back
      this.playerBoard.hideDragPreview();
      this.handZone.animateCardBack(handIndex);
    };

    this.handZone.onCardClick = (_card, _handIndex) => {
      if (this.isInputLocked()) return;
      // Cancel attack targeting if in that mode
      if (this.mode === 'SELECTING_ATTACK_TARGET') {
        this.cancelAttackTargeting();
      }
    };

    // Player board: minion click (select attacker or target)
    this.playerBoard.onMinionClick = (instance) => {
      if (this.isInputLocked()) return;

      if (this.mode === 'SELECTING_ATTACK_TARGET') {
        // Check if this minion is a valid target
        if (this.validAttackTargets.includes(instance.instanceId)) {
          this.executeAttack(this.selectedAttackerInstanceId!, instance.instanceId);
        } else {
          this.cancelAttackTargeting();
        }
        return;
      }

      // Try to select this minion as an attacker
      this.trySelectAttacker(instance);
    };

    // Enemy board: click on enemy minion (attack target)
    this.enemyBoard.onMinionClick = (instance) => {
      if (this.isInputLocked()) return;

      if (this.mode === 'SELECTING_ATTACK_TARGET') {
        if (this.validAttackTargets.includes(instance.instanceId)) {
          this.executeAttack(this.selectedAttackerInstanceId!, instance.instanceId);
        } else {
          this.cancelAttackTargeting();
        }
        return;
      }

      // Check if any friendly minion can attack this enemy
      this.tryAutoSelectAttackerForTarget(instance.instanceId);
    };

    // Enemy hero: click to attack enemy hero
    this.enemyHeroPanel.onHeroSkillClick = () => {
      if (this.isInputLocked()) return;

      if (this.mode === 'SELECTING_ATTACK_TARGET') {
        if (this.validAttackTargets.includes('HERO')) {
          this.executeAttack(this.selectedAttackerInstanceId!, 'HERO');
        } else {
          this.cancelAttackTargeting();
        }
        return;
      }
    };

    // Player hero skill
    this.playerHeroPanel.onHeroSkillClick = () => {
      if (this.isInputLocked()) return;
      this.cancelAttackTargeting();
      this.tryUseHeroSkill();
    };

    // Player minister skill
    this.playerMinisterPanel.onMinisterSkillClick = () => {
      if (this.isInputLocked()) return;
      this.cancelAttackTargeting();
      this.tryUseMinisterSkill();
    };

    // Player minister switch
    this.playerMinisterPanel.onSwitchMinister = (ministerIndex) => {
      if (this.isInputLocked()) return;
      this.cancelAttackTargeting();
      this.trySwitchMinister(ministerIndex);
    };

    // End turn
    this.turnIndicator.onEndTurnClick = () => {
      if (this.isInputLocked()) return;
      this.cancelAttackTargeting();
      this.tryEndTurn();
    };
  }

  // ─── Action Execution ──────────────────────────────────────────────

  private tryPlayCard(handIndex: number, insertionIndex: number): void {
    const validActions = this.engine.getValidActions(this.localPlayerIndex);

    const action = validActions.find(
      (a) => a.type === 'PLAY_CARD' && a.handIndex === handIndex,
    );

    if (!action) {
      this.showToast('无法打出这张牌');
      return;
    }

    const result = this.engine.playCard(this.localPlayerIndex, handIndex, insertionIndex);

    if (result.success) {
      this.handleEngineEvents(result.events);
    } else {
      this.showToast(result.message || '操作失败');
      this.onRefreshUI();
    }
  }

  private trySelectAttacker(instance: CardInstance): void {
    const validActions = this.engine.getValidActions(this.localPlayerIndex);

    // Find all attack actions for this minion
    const attackActions = validActions.filter(
      (a): a is Extract<ValidAction, { type: 'ATTACK' }> =>
        a.type === 'ATTACK' && a.attackerInstanceId === instance.instanceId,
    );

    if (attackActions.length === 0) {
      if (instance.remainingAttacks <= 0) {
        this.showToast('该随从本回合已攻击过');
      } else {
        this.showToast('该随从无法攻击');
      }
      return;
    }

    // Enter attack targeting mode
    this.mode = 'SELECTING_ATTACK_TARGET';
    this.selectedAttackerInstanceId = instance.instanceId;
    this.validAttackTargets = attackActions.map((a) => a.targetInstanceId);

    this.showToast('请选择攻击目标');
  }

  private tryAutoSelectAttackerForTarget(targetInstanceId: string): void {
    const validActions = this.engine.getValidActions(this.localPlayerIndex);

    const action = validActions.find(
      (a): a is Extract<ValidAction, { type: 'ATTACK' }> =>
        a.type === 'ATTACK' && a.targetInstanceId === targetInstanceId,
    );

    if (!action) {
      this.showToast('没有可攻击的随从');
      return;
    }

    this.selectedAttackerInstanceId = action.attackerInstanceId;
    this.executeAttack(action.attackerInstanceId, targetInstanceId);
  }

  private executeAttack(attackerInstanceId: string, targetInstanceId: string): void {
    this.cancelAttackTargeting();

    // Build proper TargetRef
    const target: TargetRef = targetInstanceId === 'HERO'
      ? { type: 'HERO', playerIndex: 1 - this.localPlayerIndex }
      : { type: 'MINION', instanceId: targetInstanceId };

    const result = this.engine.attack(attackerInstanceId, target);

    if (result.success) {
      this.handleEngineEvents(result.events);
    } else {
      this.showToast(result.message || '攻击失败');
      this.onRefreshUI();
    }
  }

  private tryUseHeroSkill(): void {
    const validActions = this.engine.getValidActions(this.localPlayerIndex);
    const canUse = validActions.some((a) => a.type === 'USE_HERO_SKILL');

    if (!canUse) {
      this.showToast('无法使用帝王技');
      return;
    }

    const result = this.engine.useHeroSkill(this.localPlayerIndex);

    if (result.success) {
      this.handleEngineEvents(result.events);
    } else {
      this.showToast(result.message || '技能使用失败');
      this.onRefreshUI();
    }
  }

  private tryUseMinisterSkill(): void {
    const validActions = this.engine.getValidActions(this.localPlayerIndex);
    const canUse = validActions.some((a) => a.type === 'USE_MINISTER_SKILL');

    if (!canUse) {
      this.showToast('无法使用文臣技');
      return;
    }

    const result = this.engine.useMinisterSkill(this.localPlayerIndex);

    if (result.success) {
      this.handleEngineEvents(result.events);
    } else {
      this.showToast(result.message || '文臣技使用失败');
      this.onRefreshUI();
    }
  }

  private trySwitchMinister(ministerIndex: number): void {
    const validActions = this.engine.getValidActions(this.localPlayerIndex);
    const canSwitch = validActions.some(
      (a) => a.type === 'SWITCH_MINISTER' && a.ministerIndex === ministerIndex,
    );

    if (!canSwitch) {
      this.showToast('无法切换文臣');
      return;
    }

    const result = this.engine.switchMinister(this.localPlayerIndex, ministerIndex);

    if (result.success) {
      this.handleEngineEvents(result.events);
    } else {
      this.showToast(result.message || '切换文臣失败');
      this.onRefreshUI();
    }
  }

  private tryEndTurn(): void {
    const result = this.engine.endTurn();

    if (result.success) {
      this.handleEngineEvents(result.events);
    } else {
      this.showToast(result.message || '结束回合失败');
      this.onRefreshUI();
    }
  }

  // ─── Attack Targeting ──────────────────────────────────────────────

  private cancelAttackTargeting(): void {
    this.mode = 'IDLE';
    this.selectedAttackerInstanceId = null;
    this.validAttackTargets = [];
  }

  // ─── Engine Event Handling ─────────────────────────────────────────

  private handleEngineEvents(events: GameEvent[]): void {
    if (events.length === 0) {
      this.onRefreshUI();
      this.checkGameOver();
      return;
    }

    // Lock input during animations
    this.inputLocked = true;

    // Process events and queue animations
    this.processEventChain(events, 0).then(() => {
      this.inputLocked = false;
      this.onRefreshUI();
      this.checkGameOver();
      this.checkTurnEnd(events);
    });
  }

  private async processEventChain(events: GameEvent[], index: number): Promise<void> {
    if (index >= events.length) return;

    const event = events[index];

    // Show damage text for damage events (parallel, doesn't block)
    if (event.type === 'DAMAGE_DEALT' && event.amount > 0) {
      const pos = this.getPositionForTargetRef(event.target);
      if (pos) {
        this.animationQueue.showDamageText({
          x: pos.x,
          y: pos.y,
          text: `-${event.amount}`,
          color: '#ff4444',
        });
      }
    }

    if (event.type === 'HEAL_APPLIED' && event.amount > 0) {
      const pos = this.getPositionForTargetRef(event.target);
      if (pos) {
        this.animationQueue.showDamageText({
          x: pos.x,
          y: pos.y,
          text: `+${event.amount}`,
          color: '#44ff44',
        });
      }
    }

    if (event.type === 'HERO_DAMAGED') {
      const isLocal = event.playerIndex === this.localPlayerIndex;
      const x = 160;
      const y = isLocal ? 520 : 40;
      this.animationQueue.showDamageText({
        x, y,
        text: `-${event.amount}`,
        color: '#ff4444',
        fontSize: '32px',
      });
    }

    if (event.type === 'HERO_HEALED') {
      const isLocal = event.playerIndex === this.localPlayerIndex;
      const x = 160;
      const y = isLocal ? 520 : 40;
      this.animationQueue.showDamageText({
        x, y,
        text: `+${event.amount}`,
        color: '#44ff44',
        fontSize: '32px',
      });
    }

    // Process next event
    await this.processEventChain(events, index + 1);
  }

  private getPositionForTargetRef(target: TargetRef): { x: number; y: number } | null {
    if (target.type === 'HERO') {
      const isLocal = target.playerIndex === this.localPlayerIndex;
      return { x: 160, y: isLocal ? 520 : 40 };
    }

    // MINION target
    const state = this.engine.getGameState();

    for (const player of state.players) {
      for (const minion of player.battlefield) {
        if (minion.instanceId === target.instanceId) {
          const isLocal = minion.ownerIndex === this.localPlayerIndex;
          const y = isLocal ? 390 : 170;
          const count = player.battlefield.length;
          const idx = player.battlefield.indexOf(minion);
          const x = count <= 1 ? 640 : 80 + idx * (1120 / (count - 1));
          return { x, y };
        }
      }
    }

    return null;
  }

  private checkGameOver(): void {
    const state = this.engine.getGameState();
    if (state.isGameOver && state.winnerIndex !== null) {
      const winner = state.players[state.winnerIndex];
      this.onShowVictory(winner.name, state.winnerIndex, state.winReason as string | null);
    }
  }

  private checkTurnEnd(events: GameEvent[]): void {
    // Check if the last event was TURN_END, meaning the turn ended
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent.type === 'TURN_END') {
      const state = this.engine.getGameState();
      const nextPlayerName = state.players[state.currentPlayerIndex].name;
      this.onShowHotSeat(nextPlayerName, () => {
        // Update local player index to match the new current player
        this.setLocalPlayerIndex(state.currentPlayerIndex);
        this.onRefreshUI();
      });
    }
  }

  // ─── Engine Event Subscription ─────────────────────────────────────

  private subscribeToEngineEvents(): void {
    // Listen for GAME_OVER event (in case it fires through the event bus)
    this.engine.onEvent('GAME_OVER', (_event: GameEvent) => {
      const state = this.engine.getGameState();
      if (state.winnerIndex !== null) {
        const winner = state.players[state.winnerIndex];
        this.onShowVictory(winner.name, state.winnerIndex, state.winReason as string | null);
      }
    });
  }

  // ─── Toast Messages ────────────────────────────────────────────────

  private showToast(message: string): void {
    const text = this.toastContainer.scene.add.text(0, 0, message, {
      fontSize: '16px',
      color: '#ffcc00',
      fontFamily: 'sans-serif',
      backgroundColor: '#333333',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5, 0.5);

    this.toastContainer.add(text);

    // Auto-remove after 1.5 seconds
    this.toastContainer.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: 500,
      delay: 1000,
      onComplete: () => {
        text.destroy();
      },
    });
  }
}
