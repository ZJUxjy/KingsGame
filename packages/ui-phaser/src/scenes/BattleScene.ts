import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import {
  HandZone,
  BoardZone,
  HeroPanel,
  EnergyBar,
  MinisterPanel,
  TurnIndicator,
} from '../components/index.js';
import type { Card, CardInstance, GameState, Player, EmperorData } from '@king-card/shared';
import { GameEngine, CHINA_EMPEROR_DATA_LIST } from '@king-card/core';
import { AnimationQueue } from '../animations/AnimationQueue.js';
import { InputHandler } from '../input/InputHandler.js';
import { HotSeatOverlay } from '../input/HotSeatOverlay.js';
import { VictoryScreen } from '../input/VictoryScreen.js';
import { buildDeck } from '../utils/deck-builder.js';

/**
 * BattleScene - Core battlefield scene with real GameEngine integration.
 *
 * Layout:
 *   enemyInfoZone:      y=0,    h=80    - Enemy HeroPanel, EnergyBar, MinisterPanel
 *   enemyBattlefield:   y=80,   h=180   - Enemy BoardZone
 *   turnInfoBar:        y=260,  h=40    - TurnIndicator
 *   playerBattlefield:  y=300,  h=180   - Player BoardZone
 *   playerInfoZone:     y=480,  h=80    - Player HeroPanel, EnergyBar, MinisterPanel
 *   handZone:           y=560,  h=160   - HandZone
 */
export class BattleScene extends Phaser.Scene {
  // Zone containers
  enemyInfoZone!: Phaser.GameObjects.Container;
  enemyBattlefieldZone!: Phaser.GameObjects.Container;
  turnInfoBar!: Phaser.GameObjects.Container;
  playerBattlefieldZone!: Phaser.GameObjects.Container;
  playerInfoZone!: Phaser.GameObjects.Container;
  handZoneContainer!: Phaser.GameObjects.Container;

  // Rendering components
  private enemyHeroPanel!: HeroPanel;
  private enemyEnergyBar!: EnergyBar;
  private enemyMinisterPanel!: MinisterPanel;
  private enemyBoardZone!: BoardZone;
  private turnIndicator!: TurnIndicator;
  private playerBoardZone!: BoardZone;
  private playerHeroPanel!: HeroPanel;
  private playerEnergyBar!: EnergyBar;
  private playerMinisterPanel!: MinisterPanel;
  private handZoneComponent!: HandZone;

  // Game engine
  private engine!: GameEngine;

  // Animation & Input
  private animationQueue!: AnimationQueue;
  private inputHandler!: InputHandler;

  // Overlays
  private hotSeatOverlay!: HotSeatOverlay;
  private victoryScreen!: VictoryScreen;

  // Emperor data from MenuScene
  private emperor1!: EmperorData;
  private emperor2!: EmperorData;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    // Read emperor data from registry
    this.emperor1 = this.registry.get('player1EmperorData');
    this.emperor2 = this.registry.get('player2EmperorData');

    if (!this.emperor1 || !this.emperor2) {
      console.error('Missing emperor data in registry, falling back to defaults');
      this.emperor1 = CHINA_EMPEROR_DATA_LIST[0];
      this.emperor2 = CHINA_EMPEROR_DATA_LIST[1];
    }

    // Create GameEngine
    this.initEngine();

    // Create animation queue
    this.animationQueue = new AnimationQueue(this);

    // Background
    this.drawBackground();

    // Create all zone containers with components
    this.createEnemyInfoZone();
    this.createEnemyBattlefieldZone();
    this.createTurnInfoBar();
    this.createPlayerBattlefieldZone();
    this.createPlayerInfoZone();
    this.createHandZone();

    // Create overlays
    this.hotSeatOverlay = new HotSeatOverlay(this);
    this.add.existing(this.hotSeatOverlay);

    this.victoryScreen = new VictoryScreen(this);
    this.add.existing(this.victoryScreen);

    // Populate components with real game state
    this.refreshAllComponents();

    // Create input handler (wires all component callbacks)
    this.inputHandler = new InputHandler(
      this.engine,
      this.animationQueue,
      {
        handZone: this.handZoneComponent,
        playerBoard: this.playerBoardZone,
        enemyBoard: this.enemyBoardZone,
        playerHeroPanel: this.playerHeroPanel,
        enemyHeroPanel: this.enemyHeroPanel,
        playerMinisterPanel: this.playerMinisterPanel,
        turnIndicator: this.turnIndicator,
      },
      this,
      {
        onRefreshUI: () => this.refreshAllComponents(),
        onShowHotSeat: (nextPlayerName, onDismiss) => {
          this.hotSeatOverlay.show(nextPlayerName, onDismiss);
        },
        onShowVictory: (winnerName, winnerIndex, winReason) => {
          this.victoryScreen.show(winnerName, winnerIndex, winReason, () => {
            this.victoryScreen.hide();
            this.inputHandler.destroy();
            this.animationQueue.clear();
            this.scene.start('MenuScene');
          });
        },
      },
    );
  }

  // ─── Engine Initialization ─────────────────────────────────────────

  private initEngine(): void {
    const deck1 = buildDeck(this.emperor1);
    const deck2 = buildDeck(this.emperor2);
    this.engine = GameEngine.create(deck1, deck2, this.emperor1, this.emperor2);
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

  // ─── Zone creation with components ────────────────────────────────

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

    // Enemy HeroPanel
    this.enemyHeroPanel = new HeroPanel(this, 10, 5, true);
    this.enemyInfoZone.add(this.enemyHeroPanel);

    // Enemy EnergyBar
    this.enemyEnergyBar = new EnergyBar(this, 300, 5);
    this.enemyInfoZone.add(this.enemyEnergyBar);

    // Enemy MinisterPanel
    this.enemyMinisterPanel = new MinisterPanel(this, w - 220, 5);
    this.enemyInfoZone.add(this.enemyMinisterPanel);
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
    const label = this.add.text(w / 2, 8, '敌 方 战 场', {
      fontSize: '14px',
      color: '#555577',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    this.enemyBattlefieldZone.add(label);

    // Enemy BoardZone
    this.enemyBoardZone = new BoardZone(this, 0, 20, w, h - 20);
    this.enemyBattlefieldZone.add(this.enemyBoardZone);
  }

  private createTurnInfoBar(): void {
    const x = 0;
    const y = 260;
    const w = GAME_WIDTH;
    const h = 40;

    this.turnInfoBar = this.add.container(x, y);
    this.turnInfoBar.setSize(w, h);

    // TurnIndicator component
    this.turnIndicator = new TurnIndicator(this, 0, 0, w, h);
    this.turnInfoBar.add(this.turnIndicator);
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
    const label = this.add.text(w / 2, 8, '己 方 战 场', {
      fontSize: '14px',
      color: '#557755',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    this.playerBattlefieldZone.add(label);

    // Player BoardZone
    this.playerBoardZone = new BoardZone(this, 0, 20, w, h - 20);
    this.playerBattlefieldZone.add(this.playerBoardZone);
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

    // Player HeroPanel
    this.playerHeroPanel = new HeroPanel(this, 10, 5, false);
    this.playerInfoZone.add(this.playerHeroPanel);

    // Player EnergyBar
    this.playerEnergyBar = new EnergyBar(this, 300, 5);
    this.playerInfoZone.add(this.playerEnergyBar);

    // Player MinisterPanel
    this.playerMinisterPanel = new MinisterPanel(this, w - 220, 5);
    this.playerInfoZone.add(this.playerMinisterPanel);
  }

  private createHandZone(): void {
    const x = 0;
    const y = 560;
    const w = GAME_WIDTH;
    const h = 160;

    this.handZoneContainer = this.add.container(x, y);
    this.handZoneContainer.setSize(w, h);

    // Zone background
    const zoneBg = this.add.graphics();
    zoneBg.fillStyle(0x0d0d1a, 0.6);
    zoneBg.fillRect(0, 0, w, h);
    zoneBg.lineStyle(1, 0x5c6bc0, 0.3);
    zoneBg.lineBetween(0, 0, w, 0);
    this.handZoneContainer.add(zoneBg);

    // Zone label
    const label = this.add.text(w / 2, 5, '手 牌 区', {
      fontSize: '14px',
      color: '#555577',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    this.handZoneContainer.add(label);

    // HandZone component
    this.handZoneComponent = new HandZone(this, 0, 20, w, h - 20);
    this.handZoneContainer.add(this.handZoneComponent);
  }

  // ─── Component refresh ────────────────────────────────────────────

  /**
   * Refresh all components with current game state.
   * Maps the engine state to UI components based on the local player perspective.
   */
  refreshAllComponents(): void {
    const state = this.engine.getGameState();
    const localPlayerIndex = this.inputHandler ? this.inputHandler.getLocalPlayerIndex() : 0;
    const enemyPlayerIndex = 1 - localPlayerIndex;

    const localPlayer = state.players[localPlayerIndex];
    const enemyPlayer = state.players[enemyPlayerIndex];

    // Enemy info (top of screen)
    this.enemyHeroPanel.refresh(enemyPlayer.hero, enemyPlayer.name);
    this.enemyEnergyBar.refresh(enemyPlayer.energyCrystal, enemyPlayer.maxEnergy);
    this.enemyMinisterPanel.refresh(enemyPlayer.ministerPool, enemyPlayer.activeMinisterIndex);

    // Enemy battlefield (top board)
    this.enemyBoardZone.refresh(enemyPlayer.battlefield);

    // Player info (bottom of screen)
    this.playerHeroPanel.refresh(localPlayer.hero, localPlayer.name);
    this.playerEnergyBar.refresh(localPlayer.energyCrystal, localPlayer.maxEnergy);
    this.playerMinisterPanel.refresh(localPlayer.ministerPool, localPlayer.activeMinisterIndex);

    // Player battlefield (bottom board)
    this.playerBoardZone.refresh(localPlayer.battlefield);

    // Player hand (face up)
    this.handZoneComponent.refresh(localPlayer.hand);

    // Turn indicator
    const currentPlayerName = state.players[state.currentPlayerIndex].name;
    this.turnIndicator.refresh(
      state.turnNumber,
      currentPlayerName,
      state.phase,
      state.currentPlayerIndex === localPlayerIndex,
    );
  }
}
