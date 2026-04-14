import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

/**
 * VictoryScreen - Full-screen overlay shown when the game ends.
 *
 * Displays winner information and a "再来一局" button to return to MenuScene.
 */
export class VictoryScreen extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private replayButton!: Phaser.GameObjects.Container;
  private onReplay?: () => void;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.setDepth(3000);
    this.buildUI();
    this.setVisible(false);
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Show the victory screen.
   * @param winnerName - Name of the winning player
   * @param winnerIndex - Index of the winner (0 or 1)
   * @param winReason - Reason for victory (e.g., "HERO_DEATH")
   * @param onReplay - Callback to restart the game (go to MenuScene)
   */
  show(
    winnerName: string,
    winnerIndex: number,
    winReason: string | null,
    onReplay: () => void,
  ): void {
    this.onReplay = onReplay;

    const isPlayerWin = winnerIndex === 0; // In hot-seat, "player 0" is the last one playing
    const titleColor = isPlayerWin ? '#ffd700' : '#ef5350';
    const titleText = isPlayerWin ? '胜利！' : '失败！';

    this.titleText.setText(titleText);
    this.titleText.setColor(titleColor);

    const reasonMap: Record<string, string> = {
      HERO_DEATH: '英雄阵亡',
      DECK_EXHAUSTION: '牌库耗尽',
      SURRENDER: '投降',
    };
    const reasonDisplay = winReason ? (reasonMap[winReason] || winReason) : '';
    this.subtitleText.setText(`${winnerName} 获得了胜利！\n${reasonDisplay}`);

    this.setVisible(true);
  }

  /**
   * Hide the victory screen.
   */
  hide(): void {
    this.setVisible(false);
  }

  // ─── Private ───────────────────────────────────────────────────────

  private buildUI(): void {
    // Semi-transparent background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.88);
    this.background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.add(this.background);

    // Decorative border
    this.background.lineStyle(4, 0xffd700, 0.8);
    this.background.strokeRect(30, 30, GAME_WIDTH - 60, GAME_HEIGHT - 60);
    this.background.lineStyle(2, 0xffd700, 0.3);
    this.background.strokeRect(40, 40, GAME_WIDTH - 80, GAME_HEIGHT - 80);

    // Title
    this.titleText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, '胜利！', {
      fontSize: '56px',
      color: '#ffd700',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5);
    this.add(this.titleText);

    // Subtitle
    this.subtitleText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontSize: '20px',
      color: '#b0b0cc',
      fontFamily: 'sans-serif',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 1,
      wordWrap: { width: GAME_WIDTH - 120 },
    }).setOrigin(0.5, 0.5);
    this.add(this.subtitleText);

    // Replay button
    this.replayButton = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);

    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0xc62828, 1);
    btnBg.fillRoundedRect(-100, -25, 200, 50, 12);
    btnBg.lineStyle(2, 0xef5350, 1);
    btnBg.strokeRoundedRect(-100, -25, 200, 50, 12);
    this.replayButton.add(btnBg);

    const btnText = this.scene.add.text(0, 0, '再来一局', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.replayButton.add(btnText);

    // Hit area
    const hitArea = this.scene.add.rectangle(0, 0, 200, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.replayButton.add(hitArea);
    this.replayButton.setSize(200, 50);
    this.replayButton.setInteractive();

    hitArea.on('pointerover', () => {
      this.replayButton.setScale(1.08);
    });
    hitArea.on('pointerout', () => {
      this.replayButton.setScale(1);
    });
    hitArea.on('pointerdown', () => {
      this.onReplay?.();
    });

    this.add(this.replayButton);
  }
}
