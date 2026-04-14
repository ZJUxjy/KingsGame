import Phaser from 'phaser';
import type { GamePhase } from '@king-card/shared';

/**
 * TurnIndicator - Displays turn info and the end turn button.
 *
 * Shows:
 *   - Current turn number
 *   - Current player name
 *   - Current phase
 *   - End turn button (only active when it's the local player's turn)
 */
export class TurnIndicator extends Phaser.GameObjects.Container {
  // ─── Internal game objects ─────────────────────────────────────────
  private turnText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private endTurnButton!: Phaser.GameObjects.Container;
  private endTurnButtonBg!: Phaser.GameObjects.Image;
  private endTurnButtonText!: Phaser.GameObjects.Text;
  private playerHighlight!: Phaser.GameObjects.Graphics;

  // ─── State ─────────────────────────────────────────────────────────
  private _isLocalPlayerTurn: boolean = false;

  // ─── Callbacks ─────────────────────────────────────────────────────
  onEndTurnClick?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.setSize(width, height);
    this.buildUI(width, height);
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Refresh the turn indicator with current game state info.
   */
  refresh(
    turnNumber: number,
    currentPlayerName: string,
    phase: GamePhase,
    isLocalPlayerTurn: boolean,
  ): void {
    this._isLocalPlayerTurn = isLocalPlayerTurn;

    // Turn info
    const phaseLabel = PHASE_LABELS[phase] || phase;
    this.turnText.setText(`第${turnNumber}回合 · ${currentPlayerName}的回合`);
    this.phaseText.setText(phaseLabel);

    // Highlight current player
    this.updateHighlight(isLocalPlayerTurn);

    // End turn button state
    if (isLocalPlayerTurn) {
      this.endTurnButton.setAlpha(1);
      this.endTurnButtonBg.clearTint();
    } else {
      this.endTurnButton.setAlpha(0.4);
      this.endTurnButtonBg.setTint(0x666666);
    }
  }

  /**
   * Check if it's the local player's turn.
   */
  isLocalPlayerTurn(): boolean {
    return this._isLocalPlayerTurn;
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private buildUI(width: number, height: number): void {
    // Background highlight bar (shows which player's turn it is)
    this.playerHighlight = this.scene.add.graphics();
    this.playerHighlight.fillStyle(0xffd700, 0.1);
    this.playerHighlight.fillRect(0, 0, width, height);
    this.add(this.playerHighlight);

    // Turn text
    this.turnText = this.scene.add.text(width / 2 - 80, height / 2, '第1回合 · 等待中', {
      fontSize: '16px',
      color: '#ffd700',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.add(this.turnText);

    // Phase text
    this.phaseText = this.scene.add.text(width / 2 + 60, height / 2, '', {
      fontSize: '12px',
      color: '#b0bec5',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0.5);
    this.add(this.phaseText);

    // End turn button
    this.endTurnButton = this.scene.add.container(width / 2 + 200, height / 2);
    this.endTurnButton.setSize(140, 36);

    this.endTurnButtonBg = this.scene.add.image(0, 0, 'end_turn_button');
    this.endTurnButton.add(this.endTurnButtonBg);

    this.endTurnButtonText = this.scene.add.text(0, 0, '结束回合', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.endTurnButton.add(this.endTurnButtonText);

    // Make interactive
    const hitArea = this.scene.add.rectangle(0, 0, 140, 36, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.endTurnButton.add(hitArea);

    hitArea.on('pointerover', () => {
      if (this._isLocalPlayerTurn) {
        this.endTurnButtonBg.setScale(1.05);
      }
    });
    hitArea.on('pointerout', () => {
      this.endTurnButtonBg.setScale(1);
    });
    hitArea.on('pointerdown', () => {
      if (this._isLocalPlayerTurn) {
        this.onEndTurnClick?.();
      }
    });

    this.add(this.endTurnButton);
  }

  private updateHighlight(isLocalPlayerTurn: boolean): void {
    this.playerHighlight.clear();
    if (isLocalPlayerTurn) {
      this.playerHighlight.fillStyle(0x2e7d32, 0.15);
    } else {
      this.playerHighlight.fillStyle(0xc62828, 0.15);
    }
    this.playerHighlight.fillRect(0, 0, this.width, this.height);
  }
}

// ─── Phase labels (Chinese) ─────────────────────────────────────────

const PHASE_LABELS: Record<GamePhase, string> = {
  ENERGY_GAIN: '能量阶段',
  DRAW: '抽牌阶段',
  UPKEEP: '准备阶段',
  MAIN: '主阶段',
  END: '结束阶段',
};
