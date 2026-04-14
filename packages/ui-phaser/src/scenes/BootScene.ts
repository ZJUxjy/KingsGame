import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

/**
 * BootScene - Entry scene that generates all placeholder assets programmatically
 * and shows a loading progress bar. No external asset files are needed.
 */
export class BootScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressFill!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create progress bar UI
    const barWidth = 400;
    const barHeight = 30;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = (GAME_HEIGHT - barHeight) / 2;

    // Background bar
    this.progressBar = this.add.graphics();
    this.progressBar.fillStyle(0x333355, 1);
    this.progressBar.fillRect(barX, barY, barWidth, barHeight);

    // Fill bar
    this.progressFill = this.add.graphics();

    // Loading text
    this.progressText = this.add.text(GAME_WIDTH / 2, barY - 30, '加载中...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    });
    this.progressText.setOrigin(0.5, 0.5);

    // Title text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '帝王牌', {
      fontSize: '64px',
      color: '#ffd700',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // Simulate loading progress (since we generate assets in create, not preload)
    let progress = 0;
    const loadingInterval = this.time.addEvent({
      delay: 100,
      repeat: 10,
      callback: () => {
        progress += 0.1;
        this.updateProgress(progress);

        if (progress >= 1) {
          loadingInterval.destroy();
        }
      },
    });
  }

  private updateProgress(value: number): void {
    const barWidth = 400;
    const barHeight = 30;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = (GAME_HEIGHT - barHeight) / 2;

    this.progressFill.clear();
    this.progressFill.fillStyle(0xffd700, 1);
    this.progressFill.fillRect(barX + 2, barY + 2, (barWidth - 4) * value, barHeight - 4);
  }

  create(): void {
    this.updateProgress(1);
    this.progressText.setText('准备就绪!');

    // Generate all placeholder textures
    this.generateCardBack();
    this.generateCardFrames();
    this.generateHeroPortrait();
    this.generateEnergyCrystal();
    this.generateEndTurnButton();
    this.generateMinisterPortrait();
    this.generateBattleSlot();
    this.generateHandSlot();

    // Brief pause to show completion, then transition
    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
    });
  }

  // ─── Placeholder texture generators ──────────────────────────────

  private generateCardBack(): void {
    const g = this.make.graphics({}, false);
    const w = 100;
    const h = 140;

    // Card body
    g.fillStyle(0x1a237e, 1);
    g.fillRoundedRect(0, 0, w, h, 6);

    // Border
    g.lineStyle(2, 0x5c6bc0, 1);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 6);

    // Inner pattern - cross hatch
    g.lineStyle(1, 0x3949ab, 0.5);
    for (let i = 0; i < w; i += 10) {
      g.lineBetween(i, 0, i, h);
    }
    for (let i = 0; i < h; i += 10) {
      g.lineBetween(0, i, w, i);
    }

    // Center emblem (diamond)
    g.fillStyle(0xffd700, 1);
    g.fillTriangle(w / 2, h / 2 - 15, w / 2 + 10, h / 2, w / 2, h / 2 + 15);
    g.fillTriangle(w / 2, h / 2 - 15, w / 2 - 10, h / 2, w / 2, h / 2 + 15);

    g.generateTexture('card_back', w, h);
    g.destroy();
  }

  private generateCardFrames(): void {
    const rarityColors: Record<string, number> = {
      COMMON: 0x9e9e9e,
      RARE: 0x2196f3,
      EPIC: 0x9c27b0,
      LEGENDARY: 0xff9800,
    };

    const w = 100;
    const h = 140;

    for (const [rarity, color] of Object.entries(rarityColors)) {
      const g = this.make.graphics({}, false);

      // Card body (white/cream)
      g.fillStyle(0xf5f5f0, 1);
      g.fillRoundedRect(0, 0, w, h, 6);

      // Rarity border (top and bottom thick lines)
      g.fillStyle(color, 1);
      g.fillRoundedRect(0, 0, w, 8, { tl: 6, tr: 6, bl: 0, br: 0 });
      g.fillRoundedRect(0, h - 8, w, 8, { tl: 0, tr: 0, bl: 6, br: 6 });

      // Side borders
      g.fillRect(0, 4, 3, h - 8);
      g.fillRect(w - 3, 4, 3, h - 8);

      // Art placeholder area
      g.fillStyle(0xe0e0e0, 1);
      g.fillRect(6, 12, w - 12, 60);

      // Name area background
      g.fillStyle(0x333333, 1);
      g.fillRect(6, 76, w - 12, 18);

      // Description area background
      g.fillStyle(0xfafafa, 1);
      g.fillRect(6, 98, w - 12, 30);

      // Cost circle (top-left)
      g.fillStyle(color, 1);
      g.fillCircle(14, 14, 11);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeCircle(14, 14, 11);

      g.generateTexture(`card_frame_${rarity.toLowerCase()}`, w, h);
      g.destroy();
    }
  }

  private generateHeroPortrait(): void {
    const g = this.make.graphics({}, false);
    const size = 80;

    // Background circle
    g.fillStyle(0x37474f, 1);
    g.fillCircle(size / 2, size / 2, size / 2);

    // Border ring
    g.lineStyle(3, 0xffd700, 1);
    g.strokeCircle(size / 2, size / 2, size / 2 - 2);

    // Inner lighter circle (portrait area)
    g.fillStyle(0x546e7a, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 6);

    // Placeholder person silhouette
    g.fillStyle(0x90a4ae, 1);
    g.fillCircle(size / 2, size / 2 - 6, 10); // Head
    g.fillEllipse(size / 2, size / 2 + 16, 28, 20); // Body

    g.generateTexture('hero_portrait', size, size);
    g.destroy();
  }

  private generateEnergyCrystal(): void {
    const g = this.make.graphics({}, false);
    const size = 24;

    // Diamond shape
    g.fillStyle(0x42a5f5, 1);
    g.fillTriangle(size / 2, 0, size, size / 2, size / 2, size);
    g.fillTriangle(size / 2, 0, 0, size / 2, size / 2, size);

    // Highlight
    g.fillStyle(0x90caf9, 0.6);
    g.fillTriangle(size / 2, 2, size / 2 + 4, size / 2, size / 2, size / 2);

    // Border
    g.lineStyle(1, 0x1565c0, 1);
    g.strokeTriangle(size / 2, 0, size, size / 2, size / 2, size);
    g.strokeTriangle(size / 2, 0, 0, size / 2, size / 2, size);

    g.generateTexture('energy_crystal', size, size);
    g.destroy();
  }

  private generateEndTurnButton(): void {
    const g = this.make.graphics({}, false);
    const w = 140;
    const h = 40;

    // Button body
    g.fillStyle(0xc62828, 1);
    g.fillRoundedRect(0, 0, w, h, 8);

    // Border
    g.lineStyle(2, 0xef5350, 1);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 8);

    // Highlight on top
    g.fillStyle(0xe53935, 1);
    g.fillRoundedRect(2, 2, w - 4, h / 2 - 2, { tl: 6, tr: 6, bl: 0, br: 0 });

    g.generateTexture('end_turn_button', w, h);
    g.destroy();
  }

  private generateMinisterPortrait(): void {
    const g = this.make.graphics({}, false);
    const size = 60;

    // Background circle
    g.fillStyle(0x4e342e, 1);
    g.fillCircle(size / 2, size / 2, size / 2);

    // Border ring
    g.lineStyle(2, 0x8d6e63, 1);
    g.strokeCircle(size / 2, size / 2, size / 2 - 2);

    // Inner area
    g.fillStyle(0x6d4c41, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 5);

    // Placeholder scroll icon
    g.fillStyle(0x8d6e63, 1);
    g.fillRect(size / 2 - 8, size / 2 - 12, 16, 24);
    g.lineStyle(1, 0xd7ccc8, 0.8);
    g.lineBetween(size / 2 - 4, size / 2 - 6, size / 2 + 4, size / 2 - 6);
    g.lineBetween(size / 2 - 4, size / 2 - 1, size / 2 + 4, size / 2 - 1);
    g.lineBetween(size / 2 - 4, size / 2 + 4, size / 2 + 4, size / 2 + 4);

    g.generateTexture('minister_portrait', size, size);
    g.destroy();
  }

  private generateBattleSlot(): void {
    const g = this.make.graphics({}, false);
    const w = 80;
    const h = 100;

    // Slot background (semi-transparent)
    g.fillStyle(0x2e2e4e, 0.6);
    g.fillRoundedRect(0, 0, w, h, 6);

    // Dashed border
    g.lineStyle(2, 0x5c6bc0, 0.5);
    g.strokeRoundedRect(2, 2, w - 4, h - 4, 6);

    // Plus sign in center
    g.lineStyle(2, 0x7986cb, 0.4);
    g.lineBetween(w / 2 - 10, h / 2, w / 2 + 10, h / 2);
    g.lineBetween(w / 2, h / 2 - 10, w / 2, h / 2 + 10);

    g.generateTexture('battle_slot', w, h);
    g.destroy();
  }

  private generateHandSlot(): void {
    const g = this.make.graphics({}, false);
    const w = 70;
    const h = 100;

    // Slot background
    g.fillStyle(0x1a237e, 0.5);
    g.fillRoundedRect(0, 0, w, h, 4);

    // Border
    g.lineStyle(1, 0x3f51b5, 0.5);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 4);

    g.generateTexture('hand_slot', w, h);
    g.destroy();
  }
}
