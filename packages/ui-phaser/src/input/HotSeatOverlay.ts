import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

/**
 * HotSeatOverlay - Full-screen overlay shown between turns in hot-seat mode.
 *
 * Shows "请将设备交给玩家X" with a "准备好了" button.
 * The overlay blocks all interaction with the game underneath.
 */
export class HotSeatOverlay extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Graphics;
  private messageText!: Phaser.GameObjects.Text;
  private readyButton!: Phaser.GameObjects.Container;
  private onDismiss?: () => void;
  private _visible = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.setDepth(2000);
    this.buildUI();
    this.setVisible(false);
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Show the overlay prompting the next player to take the device.
   * @param nextPlayerName - Name of the player whose turn is next
   * @param onDismiss - Callback when the player clicks "准备好了"
   */
  show(nextPlayerName: string, onDismiss: () => void): void {
    this.onDismiss = onDismiss;
    this.messageText.setText(`请将设备交给\n${nextPlayerName}`);
    this.setVisible(true);
    this._visible = true;
  }

  /**
   * Hide the overlay.
   */
  hide(): void {
    this.setVisible(false);
    this._visible = false;
  }

  /**
   * Check if overlay is currently visible.
   */
  isOverlayVisible(): boolean {
    return this._visible;
  }

  // ─── Private ───────────────────────────────────────────────────────

  private buildUI(): void {
    // Semi-transparent background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.85);
    this.background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.add(this.background);

    // Decorative border
    this.background.lineStyle(3, 0xffd700, 0.6);
    this.background.strokeRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40);

    // Message text
    this.messageText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '', {
      fontSize: '36px',
      color: '#ffd700',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: GAME_WIDTH - 100 },
    }).setOrigin(0.5, 0.5);
    this.add(this.messageText);

    // Ready button
    this.readyButton = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);

    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0x2e7d32, 1);
    btnBg.fillRoundedRect(-100, -25, 200, 50, 12);
    btnBg.lineStyle(2, 0x4caf50, 1);
    btnBg.strokeRoundedRect(-100, -25, 200, 50, 12);
    this.readyButton.add(btnBg);

    const btnText = this.scene.add.text(0, 0, '准备好了', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.readyButton.add(btnText);

    // Hit area
    const hitArea = this.scene.add.rectangle(0, 0, 200, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.readyButton.add(hitArea);
    this.readyButton.setSize(200, 50);
    this.readyButton.setInteractive();

    hitArea.on('pointerover', () => {
      this.readyButton.setScale(1.05);
    });
    hitArea.on('pointerout', () => {
      this.readyButton.setScale(1);
    });
    hitArea.on('pointerdown', () => {
      this.onDismiss?.();
    });

    this.add(this.readyButton);
  }
}
