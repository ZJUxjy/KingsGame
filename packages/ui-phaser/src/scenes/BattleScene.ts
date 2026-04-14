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
import type { Card, CardInstance, HeroState, Minister, GameState, GamePhase, Player } from '@king-card/shared';

/**
 * BattleScene - Core battlefield scene with zone container layout.
 *
 * Uses rendering components for each zone:
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
  handZone!: Phaser.GameObjects.Container;

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

  // Mock game state for testing (will be replaced with real engine in Task 16)
  private mockState!: GameState;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    // Initialize mock state
    this.initMockState();

    // Background
    this.drawBackground();

    // Create all zone containers with components
    this.createEnemyInfoZone();
    this.createEnemyBattlefieldZone();
    this.createTurnInfoBar();
    this.createPlayerBattlefieldZone();
    this.createPlayerInfoZone();
    this.createHandZone();

    // Populate components with mock data
    this.refreshAllComponents();

    // Set up drag interaction between hand and board
    this.setupDragInteraction();
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
    const label = this.add.text(w / 2, 5, '手 牌 区', {
      fontSize: '14px',
      color: '#555577',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    this.handZone.add(label);

    // HandZone component
    this.handZoneComponent = new HandZone(this, 0, 20, w, h - 20);
    this.handZone.add(this.handZoneComponent);
  }

  // ─── Drag interaction ────────────────────────────────────────────

  private setupDragInteraction(): void {
    this.handZoneComponent.onCardDragStart = (_card, _handIndex) => {
      // Visual feedback only; engine calls happen on drag end
    };

    this.handZoneComponent.onCardDragEnd = (card, handIndex, worldX, worldY) => {
      // Check if dropped on player battlefield
      const boardLocalY = this.playerBattlefieldZone.y;
      if (worldY >= boardLocalY && worldY <= boardLocalY + 180) {
        const canPlace = this.playerBoardZone.showDragPreview(card, worldX, worldY);
        if (canPlace) {
          const insertionIndex = this.playerBoardZone.confirmPlacement(card);
          // TODO: In Task 16, call engine.playCard() here
          console.log(`[Mock] Place card "${card.name}" at board position ${insertionIndex}`);
          this.playerBoardZone.hideDragPreview();
          return;
        }
      }
      // If not placed on board or board is full, animate card back
      this.playerBoardZone.hideDragPreview();
      this.handZoneComponent.animateCardBack(handIndex);
    };

    this.handZoneComponent.onCardClick = (card, handIndex) => {
      // TODO: In Task 16, handle card click (e.g. select for targeting)
      console.log(`[Mock] Clicked card "${card.name}" at hand index ${handIndex}`);
    };

    // Track pointer move for live drag preview on board
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.handZoneComponent.isDragging()) {
        return;
      }
      // Show live preview while dragging over player board area
      const boardLocalY = this.playerBattlefieldZone.y;
      if (pointer.y >= boardLocalY && pointer.y <= boardLocalY + 180) {
        // Get the currently dragged card from hand
        // We can't easily get it here, so preview is handled on drag end
      }
    });

    // End turn button
    this.turnIndicator.onEndTurnClick = () => {
      // TODO: In Task 16, call engine.endTurn()
      console.log('[Mock] End turn clicked');
      this.mockState.turnNumber++;
      this.mockState.currentPlayerIndex = this.mockState.currentPlayerIndex === 0 ? 1 : 0;
      this.refreshAllComponents();
    };
  }

  // ─── Component refresh ────────────────────────────────────────────

  /**
   * Refresh all components with current game state.
   * This method will be called from the engine event bridge in Task 16.
   */
  refreshAllComponents(): void {
    const state = this.mockState;
    const player0 = state.players[0];
    const player1 = state.players[1];

    // Enemy (player 1) info
    this.enemyHeroPanel.refresh(player1.hero, this.getEmperorName(player1));
    this.enemyEnergyBar.refresh(player1.energyCrystal, player1.maxEnergy);
    this.enemyMinisterPanel.refresh(player1.ministerPool, player1.activeMinisterIndex);

    // Enemy battlefield
    this.enemyBoardZone.refresh(player1.battlefield);

    // Player (player 0) info
    this.playerHeroPanel.refresh(player0.hero, this.getEmperorName(player0));
    this.playerEnergyBar.refresh(player0.energyCrystal, player0.maxEnergy);
    this.playerMinisterPanel.refresh(player0.ministerPool, player0.activeMinisterIndex);

    // Player battlefield
    this.playerBoardZone.refresh(player0.battlefield);

    // Player hand
    this.handZoneComponent.refresh(player0.hand);

    // Turn indicator
    const currentPlayerName = state.currentPlayerIndex === 0 ? player0.name : player1.name;
    this.turnIndicator.refresh(
      state.turnNumber,
      currentPlayerName,
      state.phase,
      state.currentPlayerIndex === 0,
    );
  }

  /**
   * Get emperor name from player data (mock implementation).
   */
  private getEmperorName(player: Player): string {
    // In Task 16, this will come from the actual emperor card in player data
    return player.name || '帝王';
  }

  // ─── Mock State ──────────────────────────────────────────────────

  private initMockState(): void {
    // Create realistic mock card data for testing the UI
    const mockCards: Card[] = [
      {
        id: 'mock_bingmayong', name: '兵马俑', civilization: 'CHINA',
        type: 'MINION', rarity: 'COMMON', cost: 1, attack: 1, health: 1,
        description: '秦始皇陵墓中的陶土战士。', keywords: [], effects: [],
      },
      {
        id: 'mock_qinjun', name: '秦军步兵', civilization: 'CHINA',
        type: 'MINION', rarity: 'COMMON', cost: 2, attack: 2, health: 2,
        description: '动员：若本回合已使用>=2张牌，获得+1/+1。', keywords: ['MOBILIZE'], effects: [],
      },
      {
        id: 'mock_qibing', name: '汉朝骑兵', civilization: 'CHINA',
        type: 'MINION', rarity: 'COMMON', cost: 3, attack: 3, health: 2,
        description: '冲锋。动员：若本回合已使用>=3张牌，抽一张牌。', keywords: ['CHARGE', 'MOBILIZE'], effects: [],
      },
      {
        id: 'mock_shouwei', name: '长城守卫', civilization: 'CHINA',
        type: 'MINION', rarity: 'RARE', cost: 4, attack: 2, health: 6,
        description: '嘲讽。', keywords: ['TAUNT'], effects: [],
      },
      {
        id: 'mock_tongling', name: '晋军统领', civilization: 'CHINA',
        type: 'GENERAL', rarity: 'EPIC', cost: 5, attack: 4, health: 5,
        description: '战吼：对随机敌方造成2点伤害。', keywords: ['BATTLECRY'], effects: [],
      },
    ];

    // Create mock battlefield instances
    const mockBattlefield0: CardInstance[] = [
      this.createMockInstance(mockCards[0], 0, 0),
      this.createMockInstance(mockCards[1], 0, 1),
    ];

    const mockBattlefield1: CardInstance[] = [
      this.createMockInstance(mockCards[2], 1, 0),
    ];

    // Create mock hero state
    const mockHero0: HeroState = {
      health: 28,
      maxHealth: 30,
      armor: 2,
      heroSkill: {
        name: '召唤兵马俑',
        description: '召唤一个1/1兵马俑',
        cost: 1,
        cooldown: 1,
        effect: { trigger: 'ON_PLAY', type: 'SUMMON', params: { cardId: 'china_bingmayong' } },
      },
      skillUsedThisTurn: false,
      skillCooldownRemaining: 0,
    };

    const mockHero1: HeroState = {
      health: 30,
      maxHealth: 30,
      armor: 0,
      heroSkill: {
        name: '天威浩荡',
        description: '所有友方生物获得+1/+1',
        cost: 2,
        cooldown: 2,
        effect: { trigger: 'ON_PLAY', type: 'MODIFY_STAT', params: {} },
      },
      skillUsedThisTurn: true,
      skillCooldownRemaining: 0,
    };

    // Create mock ministers
    const mockMinisters: Minister[] = [
      {
        id: 'mock_lisi',
        emperorId: 'mock_emperor',
        name: '李斯',
        type: 'STRATEGIST',
        activeSkill: {
          name: '焚书坑儒',
          description: '随机弃掉对手一张手牌',
          cost: 2,
          effect: { trigger: 'ON_PLAY', type: 'RANDOM_DISCARD', params: { count: 1 } },
        },
        skillUsedThisTurn: false,
        cooldown: 1,
      },
      {
        id: 'mock_hanxin',
        emperorId: 'mock_emperor',
        name: '韩信',
        type: 'WARRIOR',
        activeSkill: {
          name: '背水一战',
          description: '一个友方生物获得+2/+2和冲锋',
          cost: 3,
          effect: { trigger: 'ON_PLAY', type: 'APPLY_BUFF', params: {} },
        },
        skillUsedThisTurn: true,
        cooldown: 2,
      },
    ];

    // Build full mock players
    const mockPlayer0: Player = {
      id: 'player0',
      name: '秦始皇',
      hero: mockHero0,
      civilization: 'CHINA',
      hand: mockCards,
      handLimit: 10,
      deck: [],
      graveyard: [],
      battlefield: mockBattlefield0,
      activeStratagems: [],
      costModifiers: [],
      energyCrystal: 3,
      maxEnergy: 4,
      cannotDrawNextTurn: false,
      ministerPool: mockMinisters,
      activeMinisterIndex: 0,
      boundCards: [],
    };

    const mockPlayer1: Player = {
      id: 'player1',
      name: '汉武帝',
      hero: mockHero1,
      civilization: 'CHINA',
      hand: [mockCards[3]],
      handLimit: 10,
      deck: [],
      graveyard: [],
      battlefield: mockBattlefield1,
      activeStratagems: [],
      costModifiers: [],
      energyCrystal: 5,
      maxEnergy: 5,
      cannotDrawNextTurn: false,
      ministerPool: mockMinisters,
      activeMinisterIndex: 0,
      boundCards: [],
    };

    this.mockState = {
      players: [mockPlayer0, mockPlayer1],
      currentPlayerIndex: 0,
      turnNumber: 4,
      phase: 'MAIN' as GamePhase,
      isGameOver: false,
      winnerIndex: null,
      winReason: null,
    };
  }

  private createMockInstance(card: Card, ownerIndex: number, position: number): CardInstance {
    return {
      card,
      instanceId: `inst_${card.id}_${position}_${ownerIndex}`,
      ownerIndex: ownerIndex as 0 | 1,
      currentAttack: card.attack ?? 0,
      currentHealth: card.health ?? 0,
      currentMaxHealth: card.health ?? 0,
      remainingAttacks: position === 0 ? 0 : 1,
      justPlayed: false,
      sleepTurns: position === 0 ? 1 : 0,
      garrisonTurns: 0,
      usedGeneralSkills: 0,
      buffs: [],
      position,
    };
  }
}
