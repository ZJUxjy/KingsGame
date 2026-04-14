import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import type { EmperorData } from '@king-card/shared';
import { CHINA_EMPEROR_DATA_LIST } from '@king-card/core';

interface EmperorSelection {
  player1: number; // index into CHINA_EMPEROR_DATA_LIST
  player2: number;
}

/**
 * MenuScene - Emperor selection and game start screen.
 * Both players select their emperor before starting the battle.
 */
export class MenuScene extends Phaser.Scene {
  private emperorCards: Phaser.GameObjects.Container[] = [];
  private selection: EmperorSelection = { player1: 0, player2: 0 };
  private currentPlayer: 1 | 2 = 1;
  private emperorDataList: EmperorData[] = [];
  private startButton!: Phaser.GameObjects.Container;
  private playerLabel!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.emperorDataList = CHINA_EMPEROR_DATA_LIST;
    this.selection = { player1: 0, player2: 0 };
    this.currentPlayer = 1;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative top/bottom borders
    bg.fillStyle(0xffd700, 0.15);
    bg.fillRect(0, 0, GAME_WIDTH, 4);
    bg.fillRect(0, GAME_HEIGHT - 4, GAME_WIDTH, 4);

    // Title
    this.add.text(GAME_WIDTH / 2, 50, '帝王牌', {
      fontSize: '56px',
      color: '#ffd700',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      stroke: '#b8860b',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    // Subtitle
    this.subtitleText = this.add.text(GAME_WIDTH / 2, 105, '以史为鉴，逐鹿天下', {
      fontSize: '18px',
      color: '#aaaacc',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0.5);

    // Player selection label
    this.playerLabel = this.add.text(GAME_WIDTH / 2, 150, '玩家1 - 选择帝王', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // Emperor selection cards
    this.createEmperorCards();

    // Start button (initially hidden)
    this.startButton = this.createStartButton();
    this.startButton.setVisible(false);

    // Selection summary (initially hidden)
    this.createSelectionSummary();
  }

  private createEmperorCards(): void {
    const cardWidth = 280;
    const cardHeight = 300;
    const cardSpacing = 40;
    const totalWidth = this.emperorDataList.length * cardWidth + (this.emperorDataList.length - 1) * cardSpacing;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const cardY = 200;

    const rarityColors: Record<string, number> = {
      COMMON: 0x9e9e9e,
      RARE: 0x2196f3,
      EPIC: 0x9c27b0,
      LEGENDARY: 0xff9800,
    };

    this.emperorCards = [];

    for (let i = 0; i < this.emperorDataList.length; i++) {
      const emperor = this.emperorDataList[i];
      const x = startX + i * (cardWidth + cardSpacing) + cardWidth / 2;
      const y = cardY + cardHeight / 2;

      const container = this.add.container(x, y);
      container.setSize(cardWidth, cardHeight);

      const rarityColor = rarityColors[emperor.emperorCard.rarity] ?? 0xff9800;

      // Card background
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x2a2a4a, 1);
      cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 10);
      // Rarity top strip
      cardBg.fillStyle(rarityColor, 1);
      cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, 40, { tl: 10, tr: 10, bl: 0, br: 0 });
      container.add(cardBg);

      // Emperor portrait (using the hero_portrait texture)
      const portrait = this.add.image(0, -cardHeight / 2 + 100, 'hero_portrait');
      portrait.setScale(1.5);
      container.add(portrait);

      // Emperor name
      const nameText = this.add.text(0, -cardHeight / 2 + 170, emperor.emperorCard.name, {
        fontSize: '28px',
        color: '#ffd700',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      container.add(nameText);

      // Health display
      const healthText = this.add.text(0, -cardHeight / 2 + 200, `HP: ${emperor.emperorCard.health}`, {
        fontSize: '18px',
        color: '#ef5350',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5, 0.5);
      container.add(healthText);

      // Hero skill name
      if (emperor.emperorCard.heroSkill) {
        const skillText = this.add.text(0, -cardHeight / 2 + 230, `技能: ${emperor.emperorCard.heroSkill.name}`, {
          fontSize: '16px',
          color: '#81c784',
          fontFamily: 'sans-serif',
        }).setOrigin(0.5, 0.5);
        container.add(skillText);
      }

      // Description
      const descText = this.add.text(0, -cardHeight / 2 + 265, emperor.emperorCard.description, {
        fontSize: '12px',
        color: '#b0b0cc',
        fontFamily: 'sans-serif',
        wordWrap: { width: cardWidth - 30 },
        align: 'center',
      }).setOrigin(0.5, 0.5);
      container.add(descText);

      // Selection highlight border (hidden by default)
      const highlight = this.add.graphics();
      highlight.lineStyle(3, 0xffd700, 1);
      highlight.strokeRoundedRect(-cardWidth / 2 - 3, -cardHeight / 2 - 3, cardWidth + 6, cardHeight + 6, 12);
      highlight.setVisible(false);
      container.add(highlight);
      container.setData('highlight', highlight);

      // Make interactive
      const hitArea = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      container.add(hitArea);
      container.setInteractive();

      container.setData('index', i);
      container.on('pointerover', () => {
        container.setScale(1.05);
      });
      container.on('pointerout', () => {
        container.setScale(1);
      });
      container.on('pointerdown', () => {
        this.selectEmperor(i);
      });

      this.emperorCards.push(container);
    }
  }

  private selectEmperor(index: number): void {
    // Update selection for current player
    if (this.currentPlayer === 1) {
      this.selection.player1 = index;
      this.currentPlayer = 2;
      this.playerLabel.setText('玩家2 - 选择帝王');
    } else {
      this.selection.player2 = index;
      this.currentPlayer = 1;
    }

    // Update visual highlights
    this.updateHighlights();

    // Show start button after both players have selected
    if (this.selection.player1 !== undefined && this.selection.player2 !== undefined) {
      this.showStartButton();
    }
  }

  private updateHighlights(): void {
    for (let i = 0; i < this.emperorCards.length; i++) {
      const highlight = this.emperorCards[i].getData('highlight') as Phaser.GameObjects.Graphics;
      if (i === this.selection.player1 || i === this.selection.player2) {
        highlight.setVisible(true);
        // Different colors for different players
        const color = i === this.selection.player1 ? 0x4caf50 : 0x2196f3;
        highlight.clear();
        highlight.lineStyle(3, color, 1);
        highlight.strokeRoundedRect(-143, -153, 286, 306, 12);
      } else {
        highlight.setVisible(false);
      }
    }
  }

  private createStartButton(): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 70);

    const bg = this.add.graphics();
    bg.fillStyle(0xc62828, 1);
    bg.fillRoundedRect(-80, -22, 160, 44, 10);
    bg.lineStyle(2, 0xef5350, 1);
    bg.strokeRoundedRect(-80, -22, 160, 44, 10);
    container.add(bg);

    const text = this.add.text(0, 0, '开始对战', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    container.add(text);

    const hitArea = this.add.rectangle(0, 0, 160, 44, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);
    container.setSize(160, 44);
    container.setInteractive();

    container.on('pointerover', () => {
      container.setScale(1.08);
    });
    container.on('pointerout', () => {
      container.setScale(1);
    });
    container.on('pointerdown', () => {
      this.startGame();
    });

    return container;
  }

  private showStartButton(): void {
    this.startButton.setVisible(true);

    // Update subtitle with selection summary
    const p1 = this.emperorDataList[this.selection.player1].emperorCard.name;
    const p2 = this.emperorDataList[this.selection.player2].emperorCard.name;
    this.subtitleText.setText(`玩家1: ${p1}  vs  玩家2: ${p2}`);
    this.subtitleText.setColor('#ffd700');
  }

  private createSelectionSummary(): void {
    // This will be populated when start button is shown
  }

  private startGame(): void {
    // Store selected emperors in the game registry for BattleScene to use
    this.registry.set('player1EmperorIndex', this.selection.player1);
    this.registry.set('player2EmperorIndex', this.selection.player2);
    this.registry.set('player1EmperorData', this.emperorDataList[this.selection.player1]);
    this.registry.set('player2EmperorData', this.emperorDataList[this.selection.player2]);

    this.scene.start('BattleScene');
  }
}
