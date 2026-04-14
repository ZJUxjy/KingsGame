import Phaser from 'phaser';
import type { Card, CardInstance, Rarity } from '@king-card/shared';

/**
 * CardSprite - Renders a single card with frame, artwork area, stats, and text.
 *
 * Uses the placeholder textures generated in BootScene:
 *   card_frame_common / rare / epic / legendary
 *   card_back (for face-down rendering)
 *
 * Components render data and emit events -- they do NOT call GameEngine directly.
 */
export class CardSprite extends Phaser.GameObjects.Container {
  // ─── Constants ─────────────────────────────────────────────────────
  static readonly CARD_WIDTH = 100;
  static readonly CARD_HEIGHT = 140;

  private static readonly RARITY_TEXTURE_MAP: Record<Rarity, string> = {
    COMMON: 'card_frame_common',
    RARE: 'card_frame_rare',
    EPIC: 'card_frame_epic',
    LEGENDARY: 'card_frame_legendary',
  };

  // ─── Internal game objects ─────────────────────────────────────────
  private frameImage!: Phaser.GameObjects.Image;
  private costText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private attackText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private descriptionText!: Phaser.GameObjects.Text;
  private keywordText!: Phaser.GameObjects.Text;
  private cardData!: Card;
  private instanceData?: CardInstance;
  private _isFaceDown: boolean = false;

  // ─── Callbacks ─────────────────────────────────────────────────────
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.setSize(CardSprite.CARD_WIDTH, CardSprite.CARD_HEIGHT);
    this.setInteractive({ useHandCursor: true });
    this.setupInputListeners();
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Populate the card sprite with Card data.
   * If an optional CardInstance is provided, it shows current attack/health values.
   */
  render(card: Card, instance?: CardInstance): this {
    this.cardData = card;
    this.instanceData = instance;
    this._isFaceDown = false;
    this.removeAll(true);

    // Frame background based on rarity
    const textureKey = CardSprite.RARITY_TEXTURE_MAP[card.rarity];
    this.frameImage = this.scene.add.image(0, 0, textureKey);
    this.add(this.frameImage);

    // Cost number (top-left circle)
    this.costText = this.scene.add.text(14, 14, String(card.cost), {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0.5);
    this.add(this.costText);

    // Card name (centered in name area, y ~85)
    const displayName = card.name.length > 6 ? card.name.substring(0, 6) + '..' : card.name;
    this.nameText = this.scene.add.text(CardSprite.CARD_WIDTH / 2, 85, displayName, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0.5);
    this.add(this.nameText);

    // Attack / Health display (only for MINION and GENERAL types)
    const showStats = card.type === 'MINION' || card.type === 'GENERAL';
    if (showStats && card.attack !== undefined && card.health !== undefined) {
      const atk = instance ? instance.currentAttack : card.attack;
      const hp = instance ? instance.currentHealth : card.health;
      const maxHp = instance ? instance.currentMaxHealth : card.health;

      // Attack (bottom-left)
      this.attackText = this.scene.add.text(12, CardSprite.CARD_HEIGHT - 14, String(atk), {
        fontSize: '16px',
        color: '#ffcc00',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      this.add(this.attackText);

      // Health (bottom-right)
      const hpColor = hp < maxHp ? '#ff5555' : '#44ff44';
      this.healthText = this.scene.add.text(CardSprite.CARD_WIDTH - 12, CardSprite.CARD_HEIGHT - 14, `${hp}/${maxHp}`, {
        fontSize: '12px',
        color: hpColor,
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      this.add(this.healthText);
    }

    // Description text (small, in the description area)
    const descLines = this.wrapText(card.description, 8);
    const descDisplay = descLines.length > 2 ? descLines.slice(0, 2).join('\n') + '..' : descLines.join('\n');
    this.descriptionText = this.scene.add.text(CardSprite.CARD_WIDTH / 2, 110, descDisplay, {
      fontSize: '8px',
      color: '#333333',
      fontFamily: 'sans-serif',
      align: 'center',
      wordWrap: { width: 80 },
    }).setOrigin(0.5, 0);
    this.add(this.descriptionText);

    // Keyword abbreviations (if any)
    if (card.keywords.length > 0) {
      const kwText = card.keywords.map(kw => KEYWORD_ABBR[kw] ?? kw).join(' ');
      this.keywordText = this.scene.add.text(CardSprite.CARD_WIDTH / 2, 76, kwText, {
        fontSize: '7px',
        color: '#ffab00',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5, 0.5);
      this.add(this.keywordText);
    }

    // Garrison overlay
    if (instance && instance.garrisonTurns > 0) {
      const garrisonOverlay = this.scene.add.graphics();
      garrisonOverlay.fillStyle(0x1565c0, 0.6);
      garrisonOverlay.fillRoundedRect(-CardSprite.CARD_WIDTH / 2, -CardSprite.CARD_HEIGHT / 2, CardSprite.CARD_WIDTH, CardSprite.CARD_HEIGHT, 6);
      this.add(garrisonOverlay);
      const garrisonText = this.scene.add.text(0, 0, `驻守${instance.garrisonTurns}`, {
        fontSize: '14px',
        color: '#90caf9',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      this.add(garrisonText);
    }

    // Sleep overlay (just-played minion that can't attack yet)
    if (instance && instance.sleepTurns > 0 && instance.garrisonTurns <= 0) {
      const sleepOverlay = this.scene.add.graphics();
      sleepOverlay.fillStyle(0x000000, 0.3);
      sleepOverlay.fillRoundedRect(-CardSprite.CARD_WIDTH / 2, -CardSprite.CARD_HEIGHT / 2, CardSprite.CARD_WIDTH, CardSprite.CARD_HEIGHT, 6);
      this.add(sleepOverlay);
    }

    // Buff indicator
    if (instance && instance.buffs.length > 0) {
      const buffIndicator = this.scene.add.graphics();
      buffIndicator.fillStyle(0x76ff03, 0.8);
      buffIndicator.fillCircle(CardSprite.CARD_WIDTH / 2 - 8, -CardSprite.CARD_HEIGHT / 2 + 8, 5);
      this.add(buffIndicator);
    }

    return this;
  }

  /**
   * Show the card face-down (card back).
   */
  showFaceDown(): this {
    this._isFaceDown = true;
    this.removeAll(true);

    this.frameImage = this.scene.add.image(0, 0, 'card_back');
    this.add(this.frameImage);

    return this;
  }

  /**
   * Update stats display if instance data changed (e.g. after buff/damage).
   */
  refreshStats(instance?: CardInstance): void {
    if (!instance || this._isFaceDown) return;
    this.instanceData = instance;

    if (this.attackText) {
      this.attackText.setText(String(instance.currentAttack));
    }
    if (this.healthText) {
      const hpColor = instance.currentHealth < instance.currentMaxHealth ? '#ff5555' : '#44ff44';
      this.healthText.setText(`${instance.currentHealth}/${instance.currentMaxHealth}`);
      this.healthText.setColor(hpColor);
    }
  }

  getCard(): Card {
    return this.cardData;
  }

  getInstance(): CardInstance | undefined {
    return this.instanceData;
  }

  isFaceDown(): boolean {
    return this._isFaceDown;
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private setupInputListeners(): void {
    this.on('pointerdown', () => {
      this.onPointerDown?.();
    });
    this.on('pointerup', () => {
      this.onPointerUp?.();
    });
    this.on('pointerover', () => {
      this.onPointerOver?.();
    });
    this.on('pointerout', () => {
      this.onPointerOut?.();
    });
  }

  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const lines: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxCharsPerLine) {
        lines.push(remaining);
        break;
      }
      lines.push(remaining.substring(0, maxCharsPerLine));
      remaining = remaining.substring(maxCharsPerLine);
    }
    return lines;
  }
}

// ─── Keyword abbreviation map (Chinese) ─────────────────────────────

const KEYWORD_ABBR: Record<string, string> = {
  BATTLECRY: '战吼',
  DEATHRATTLE: '亡语',
  AURA: '光环',
  TAUNT: '嘲讽',
  RUSH: '突袭',
  CHARGE: '冲锋',
  ASSASSIN: '刺杀',
  COMBO_STRIKE: '连击',
  STEALTH_KILL: '暗杀',
  IRON_FIST: '铁拳',
  MOBILIZE: '动员',
  GARRISON: '驻守',
  RESEARCH: '研究',
  BLOCKADE: '封锁',
  COLONY: '殖民',
  BLITZ: '闪电战',
  MOBILIZATION_ORDER: '动员令',
};
