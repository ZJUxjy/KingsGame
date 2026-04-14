import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

/**
 * BattleScene - Core battlefield scene with zone container layout.
 *
 * Zone layout (top to bottom):
 *   enemyInfoZone:      y=0,    h=80    - Enemy hero, energy, minister
 *   enemyBattlefield:   y=80,   h=180   - Enemy minions (max 7)
 *   turnInfoBar:        y=260,  h=40    - Turn info + end turn button
 *   playerBattlefield:  y=300,  h=180   - Player minions (max 7)
 *   playerInfoZone:     y=480,  h=80    - Player hero, energy, minister
 *   handZone:           y=560,  h=160   - Hand cards at bottom
 */
export class BattleScene extends Phaser.Scene {
  // Zone containers
  enemyInfoZone!: Phaser.GameObjects.Container;
  enemyBattlefieldZone!: Phaser.GameObjects.Container;
  turnInfoBar!: Phaser.GameObjects.Container;
  playerBattlefieldZone!: Phaser.GameObjects.Container;
  playerInfoZone!: Phaser.GameObjects.Container;
  handZone!: Phaser.GameObjects.Container;

  // Layout constants
  private readonly ZONE_PADDING = 4;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    // Background
    this.drawBackground();

    // Create all zone containers
    this.createEnemyInfoZone();
    this.createEnemyBattlefieldZone();
    this.createTurnInfoBar();
    this.createPlayerBattlefieldZone();
    this.createPlayerInfoZone();
    this.createHandZone();

    // Display selected emperors from registry
    this.displayEmperorInfo();
  }

  // ─── Background ──────────────────────────────────────────────────

  private drawBackground(): void {
    const bg = this.add.graphics();

    // Main battlefield gradient
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle grid pattern for visual reference
    bg.lineStyle(1, 0x222244, 0.3);
    for (let x = 0; x < GAME_WIDTH; x += 80) {
      bg.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 80) {
      bg.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  // ─── Zone creation ───────────────────────────────────────────────

  private createEnemyInfoZone(): void {
    const x = 0;
    const y = 0;
    const w = GAME_WIDTH;
    const h = 80;

    this.enemyInfoZone = this.add.container(x, y);
    this.enemyInfoZone.setSize(w, h);

    // Zone background
    const zoneBg = this.add.graphics();
    zoneBg.fillStyle(0x1e1e3a, 0.8);
    zoneBg.fillRect(0, 0, w, h);
    zoneBg.lineStyle(1, 0x5c6bc0, 0.3);
    zoneBg.lineBetween(0, h, w, h);
    this.enemyInfoZone.add(zoneBg);

    // Zone label
    const label = this.add.text(w - 10, 10, '敌方信息区', {
      fontSize: '12px',
      color: '#666688',
      fontFamily: 'sans-serif',
    }).setOrigin(1, 0);
    this.enemyInfoZone.add(label);

    // Hero portrait placeholder
    const heroPortrait = this.add.image(50, h / 2, 'hero_portrait').setScale(0.8);
    this.enemyInfoZone.add(heroPortrait);

    // HP text
    const hpText = this.add.text(50, h - 10, 'HP: 30', {
      fontSize: '14px',
      color: '#ef5350',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 1);
    this.enemyInfoZone.add(hpText);

    // Energy crystals area
    for (let i = 0; i < 5; i++) {
      const crystal = this.add.image(160 + i * 28, h / 2 - 10, 'energy_crystal').setScale(0.7);
      this.enemyInfoZone.add(crystal);
    }
    const energyLabel = this.add.text(160, h - 10, '能量水晶: 3/5', {
      fontSize: '12px',
      color: '#64b5f6',
      fontFamily: 'sans-serif',
    }).setOrigin(0, 1);
    this.enemyInfoZone.add(energyLabel);

    // Hand count
    const handLabel = this.add.text(310, h / 2, '手牌: [3张]', {
      fontSize: '14px',
      color: '#aaaacc',
      fontFamily: 'sans-serif',
    }).setOrigin(0, 0.5);
    this.enemyInfoZone.add(handLabel);

    // Minister portrait placeholder
    const ministerPortrait = this.add.image(w - 100, h / 2, 'minister_portrait').setScale(0.9);
    this.enemyInfoZone.add(ministerPortrait);
    const ministerLabel = this.add.text(w - 60, h / 2, '文臣', {
      fontSize: '12px',
      color: '#bcaaa4',
      fontFamily: 'sans-serif',
    }).setOrigin(0, 0.5);
    this.enemyInfoZone.add(ministerLabel);
  }

  private createEnemyBattlefieldZone(): void {
    const x = 0;
    const y = 80;
    const w = GAME_WIDTH;
    const h = 180;

    this.enemyBattlefieldZone = this.add.container(x, y);
    this.enemyBattlefieldZone.setSize(w, h);

    // Zone background
    const zoneBg = this.add.graphics();
    zoneBg.fillStyle(0x2a1a1a, 0.4);
    zoneBg.fillRect(0, 0, w, h);
    zoneBg.lineStyle(1, 0x5c6bc0, 0.2);
    zoneBg.lineBetween(0, 0, w, 0);
    zoneBg.lineBetween(0, h, w, h);
    this.enemyBattlefieldZone.add(zoneBg);

    // Zone label
    const label = this.add.text(w / 2, 15, '敌 方 战 场', {
      fontSize: '14px',
      color: '#555577',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    this.enemyBattlefieldZone.add(label);

    // Placeholder battle slots (max 7)
    const slotWidth = 80;
    const slotHeight = 100;
    const totalSlotsWidth = 7 * slotWidth + 6 * 10;
    const slotStartX = (w - totalSlotsWidth) / 2;
    const slotY = 40;

    for (let i = 0; i < 7; i++) {
      const slot = this.add.image(
        slotStartX + i * (slotWidth + 10) + slotWidth / 2,
        slotY + slotHeight / 2,
        'battle_slot',
      );
      this.enemyBattlefieldZone.add(slot);
    }
  }

  private createTurnInfoBar(): void {
    const x = 0;
    const y = 260;
    const w = GAME_WIDTH;
    const h = 40;

    this.turnInfoBar = this.add.container(x, y);
    this.turnInfoBar.setSize(w, h);

    // Zone background
    const zoneBg = this.add.graphics();
    zoneBg.fillStyle(0x1a1a3e, 0.9);
    zoneBg.fillRect(0, 0, w, h);
    zoneBg.lineStyle(1, 0xffd700, 0.4);
    zoneBg.lineBetween(0, 0, w, 0);
    zoneBg.lineBetween(0, h, w, h);
    this.turnInfoBar.add(zoneBg);

    // Turn info text
    const turnText = this.add.text(w / 2 - 80, h / 2, '第1回合 · 玩家1的回合', {
      fontSize: '16px',
      color: '#ffd700',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.turnInfoBar.add(turnText);

    // End turn button
    const btnBg = this.add.image(w / 2 + 140, h / 2, 'end_turn_button');
    this.turnInfoBar.add(btnBg);

    const btnText = this.add.text(w / 2 + 140, h / 2, '结束回合', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.turnInfoBar.add(btnText);

    // Make end turn button interactive
    const hitArea = this.add.rectangle(w / 2 + 140, h / 2, 140, 36, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.turnInfoBar.add(hitArea);

    hitArea.on('pointerover', () => {
      btnBg.setScale(1.05);
    });
    hitArea.on('pointerout', () => {
      btnBg.setScale(1);
    });
    hitArea.on('pointerdown', () => {
      // TODO: Hook up to game engine endTurn()
      turnText.setText('第2回合 · 玩家2的回合');
    });
  }

  private createPlayerBattlefieldZone(): void {
    const x = 0;
    const y = 300;
    const w = GAME_WIDTH;
    const h = 180;

    this.playerBattlefieldZone = this.add.container(x, y);
    this.playerBattlefieldZone.setSize(w, h);

    // Zone background
    const zoneBg = this.add.graphics();
    zoneBg.fillStyle(0x1a2a1a, 0.4);
    zoneBg.fillRect(0, 0, w, h);
    zoneBg.lineStyle(1, 0x5c6bc0, 0.2);
    zoneBg.lineBetween(0, 0, w, 0);
    zoneBg.lineBetween(0, h, w, h);
    this.playerBattlefieldZone.add(zoneBg);

    // Zone label
    const label = this.add.text(w / 2, 15, '己 方 战 场', {
      fontSize: '14px',
      color: '#557755',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    this.playerBattlefieldZone.add(label);

    // Placeholder battle slots (max 7)
    const slotWidth = 80;
    const slotHeight = 100;
    const totalSlotsWidth = 7 * slotWidth + 6 * 10;
    const slotStartX = (w - totalSlotsWidth) / 2;
    const slotY = 40;

    for (let i = 0; i < 7; i++) {
      const slot = this.add.image(
        slotStartX + i * (slotWidth + 10) + slotWidth / 2,
        slotY + slotHeight / 2,
        'battle_slot',
      );
      this.playerBattlefieldZone.add(slot);
    }
  }

  private createPlayerInfoZone(): void {
    const x = 0;
    const y = 480;
    const w = GAME_WIDTH;
    const h = 80;

    this.playerInfoZone = this.add.container(x, y);
    this.playerInfoZone.setSize(w, h);

    // Zone background
    const zoneBg = this.add.graphics();
    zoneBg.fillStyle(0x1e1e3a, 0.8);
    zoneBg.fillRect(0, 0, w, h);
    zoneBg.lineStyle(1, 0x5c6bc0, 0.3);
    zoneBg.lineBetween(0, 0, w, 0);
    zoneBg.lineBetween(0, h, w, h);
    this.playerInfoZone.add(zoneBg);

    // Zone label
    const label = this.add.text(w - 10, 10, '己方信息区', {
      fontSize: '12px',
      color: '#666688',
      fontFamily: 'sans-serif',
    }).setOrigin(1, 0);
    this.playerInfoZone.add(label);

    // Hero portrait placeholder
    const heroPortrait = this.add.image(50, h / 2, 'hero_portrait').setScale(0.8);
    this.playerInfoZone.add(heroPortrait);

    // HP text
    const hpText = this.add.text(50, h - 10, 'HP: 30', {
      fontSize: '14px',
      color: '#ef5350',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 1);
    this.playerInfoZone.add(hpText);

    // Energy crystals area
    for (let i = 0; i < 5; i++) {
      const crystal = this.add.image(160 + i * 28, h / 2 - 10, 'energy_crystal').setScale(0.7);
      this.playerInfoZone.add(crystal);
    }
    const energyLabel = this.add.text(160, h - 10, '能量水晶: 1/1', {
      fontSize: '12px',
      color: '#64b5f6',
      fontFamily: 'sans-serif',
    }).setOrigin(0, 1);
    this.playerInfoZone.add(energyLabel);

    // Hand count
    const handLabel = this.add.text(310, h / 2, '手牌: [4张]', {
      fontSize: '14px',
      color: '#aaaacc',
      fontFamily: 'sans-serif',
    }).setOrigin(0, 0.5);
    this.playerInfoZone.add(handLabel);

    // Minister portrait placeholder
    const ministerPortrait = this.add.image(w - 100, h / 2, 'minister_portrait').setScale(0.9);
    this.playerInfoZone.add(ministerPortrait);
    const ministerLabel = this.add.text(w - 60, h / 2, '文臣', {
      fontSize: '12px',
      color: '#bcaaa4',
      fontFamily: 'sans-serif',
    }).setOrigin(0, 0.5);
    this.playerInfoZone.add(ministerLabel);
  }

  private createHandZone(): void {
    const x = 0;
    const y = 560;
    const w = GAME_WIDTH;
    const h = 160;

    this.handZone = this.add.container(x, y);
    this.handZone.setSize(w, h);

    // Zone background
    const zoneBg = this.add.graphics();
    zoneBg.fillStyle(0x0d0d1a, 0.6);
    zoneBg.fillRect(0, 0, w, h);
    zoneBg.lineStyle(1, 0x5c6bc0, 0.3);
    zoneBg.lineBetween(0, 0, w, 0);
    this.handZone.add(zoneBg);

    // Zone label
    const label = this.add.text(w / 2, 10, '手 牌 区', {
      fontSize: '14px',
      color: '#555577',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    this.handZone.add(label);

    // Placeholder hand card backs (fan layout)
    const cardCount = 5;
    const cardWidth = 100;
    const cardHeight = 140;
    const fanSpread = 30; // degrees total spread
    const startAngle = -fanSpread / 2;
    const angleStep = fanSpread / Math.max(cardCount - 1, 1);
    const radius = 300; // radius of the arc
    const centerX = w / 2;
    const centerY = h + 120; // center of arc below the zone

    for (let i = 0; i < cardCount; i++) {
      const angle = Phaser.Math.DegToRad(startAngle + i * angleStep - 90);
      const cardX = centerX + Math.cos(angle) * radius - cardWidth / 2;
      const cardY = centerY + Math.sin(angle) * radius - cardHeight / 2;
      const rotation = startAngle + i * angleStep;

      const cardBack = this.add.image(cardX, cardY, 'card_back');
      cardBack.setRotation(Phaser.Math.DegToRad(rotation));
      cardBack.setOrigin(0.5, 1); // pivot at bottom center for fan effect
      cardBack.setPosition(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius,
      );
      this.handZone.add(cardBack);
    }
  }

  // ─── Emperor info display ────────────────────────────────────────

  private displayEmperorInfo(): void {
    const p1Data = this.registry.get('player1EmperorData');
    const p2Data = this.registry.get('player2EmperorData');

    if (p1Data) {
      // Update player info zone with emperor name
      const playerName = this.add.text(100, 10, p1Data.emperorCard.name, {
        fontSize: '16px',
        color: '#ffd700',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      });
      this.playerInfoZone.add(playerName);
    }

    if (p2Data) {
      // Update enemy info zone with emperor name
      const enemyName = this.add.text(100, 10, p2Data.emperorCard.name, {
        fontSize: '16px',
        color: '#ffd700',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      });
      this.enemyInfoZone.add(enemyName);
    }
  }
}
