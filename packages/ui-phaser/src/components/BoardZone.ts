import Phaser from 'phaser';
import { CardSprite } from './CardSprite.js';
import type { CardInstance, Card } from '@king-card/shared';

/**
 * BoardZone - Dynamic battlefield container with drag-preview placement.
 *
 * Features:
 *   - N minions evenly distributed, centered
 *   - Drag preview: semi-transparent card shown at insertion point
 *   - Max 7 units; rejects placement if full
 *   - Easing animations on rearrange
 *
 * Placement rules:
 *   - Empty board: new minion appears at center
 *   - Drag to left of a minion: insert left of that minion
 *   - Drag to right of a minion: insert right of that minion
 *   - Drag to far left/right empty area: insert at beginning/end
 *   - 1 minion on board: center X is the boundary
 *   - Board full (7): reject, emit onBoardFull callback
 *
 * Components emit events; the scene bridges to GameEngine.
 */
export class BoardZone extends Phaser.GameObjects.Container {
  // ─── Constants ─────────────────────────────────────────────────────
  private static readonly MAX_UNITS = 7;
  private static readonly CARD_SCALE = 0.9;
  private static readonly CARD_Y = 90; // vertical center of cards within zone
  private static readonly ANIM_DURATION = 200;
  private static readonly MARGIN = 80; // horizontal margin from zone edges

  // ─── Internal state ───────────────────────────────────────────────
  private cardSprites: CardSprite[] = [];
  private previewSprite: CardSprite | null = null;
  private previewPosition: number = -1;
  private zoneWidth: number;
  private zoneHeight: number;
  private backgroundSlots: Phaser.GameObjects.Image[] = [];

  // ─── Callbacks ─────────────────────────────────────────────────────
  /** Fired when a card is confirmed for placement: (card, insertionIndex) */
  onCardPlace?: (card: Card, insertionIndex: number) => void;
  /** Fired when board is full and placement is rejected: (card) */
  onBoardFull?: (card: Card) => void;
  /** Fired when a minion on the board is clicked: (instance) */
  onMinionClick?: (instance: CardInstance) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.zoneWidth = width;
    this.zoneHeight = height;
    this.setSize(width, height);
    this.createBackgroundSlots();
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Refresh the board zone with current battlefield data.
   */
  refresh(instances: CardInstance[]): void {
    this.clearBoard();
    this.backgroundSlots = [];

    // Recreate background slots
    this.createBackgroundSlots();

    if (instances.length === 0) return;

    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      const pos = this.getPositionForIndex(i, instances.length);

      const sprite = new CardSprite(this.scene, pos.x, pos.y);
      sprite.render(instance.card, instance);
      sprite.setScale(BoardZone.CARD_SCALE);
      sprite.setDepth(10 + i);

      const instRef = instance;
      sprite.onPointerDown = () => {
        this.onMinionClick?.(instRef);
      };

      this.add(sprite);
      this.cardSprites.push(sprite);
    }
  }

  /**
   * Show a drag preview of a card at the given insertion index.
   * Returns false if board is full.
   */
  showDragPreview(card: Card, worldX: number, _worldY: number): boolean {
    if (this.cardSprites.length >= BoardZone.MAX_UNITS) {
      return false;
    }

    const insertionIndex = this.calculateInsertionIndex(worldX);

    // Remove existing preview
    this.hideDragPreview();

    // Calculate position
    const totalCount = this.cardSprites.length + 1;
    const pos = this.getPositionForIndex(insertionIndex, totalCount);

    this.previewSprite = new CardSprite(this.scene, pos.x, pos.y);
    this.previewSprite.render(card);
    this.previewSprite.setScale(BoardZone.CARD_SCALE);
    this.previewSprite.setAlpha(0.5);
    this.previewSprite.setDepth(5);

    // Disable interactivity on preview
    this.previewSprite.disableInteractive();

    this.add(this.previewSprite);
    this.previewPosition = insertionIndex;

    // Shift existing cards to make room visually
    this.shiftCardsForPreview(insertionIndex, totalCount);

    return true;
  }

  /**
   * Hide the drag preview and restore card positions.
   */
  hideDragPreview(): void {
    if (this.previewSprite) {
      this.remove(this.previewSprite, true);
      this.previewSprite = null;
      this.previewPosition = -1;
    }

    // Restore existing card positions
    const count = this.cardSprites.length;
    for (let i = 0; i < count; i++) {
      const pos = this.getPositionForIndex(i, count);
      this.scene.tweens.add({
        targets: this.cardSprites[i],
        x: pos.x,
        y: pos.y,
        duration: BoardZone.ANIM_DURATION,
        ease: 'Cubic.easeOut',
      });
    }
  }

  /**
   * Confirm placement at the current preview position.
   */
  confirmPlacement(card: Card): number {
    const index = this.previewPosition;
    this.hideDragPreview();
    return index >= 0 ? index : this.cardSprites.length;
  }

  /**
   * Check if the board is full.
   */
  isFull(): boolean {
    return this.cardSprites.length >= BoardZone.MAX_UNITS;
  }

  /**
   * Get the current count of units on the board.
   */
  getUnitCount(): number {
    return this.cardSprites.length;
  }

  /**
   * Calculate where a dragged card would be inserted based on X position.
   */
  calculateInsertionIndex(worldX: number): number {
    // Convert world X to local X
    const localX = worldX - this.x;
    const count = this.cardSprites.length;

    if (count === 0) return 0;

    // Get the positions of existing cards
    const positions = this.cardSprites.map(s => s.x);

    // If only 1 card, use its center as boundary
    if (count === 1) {
      return localX < positions[0] ? 0 : 1;
    }

    // Check if dragged to far left or far right
    const leftMost = positions[0];
    const rightMost = positions[count - 1];
    const usableWidth = this.zoneWidth - 2 * BoardZone.MARGIN;

    if (localX < leftMost - 30) return 0;
    if (localX > rightMost + 30) return count;

    // Find the insertion point between two existing cards
    for (let i = 0; i < count - 1; i++) {
      const midX = (positions[i] + positions[i + 1]) / 2;
      if (localX < midX) return i + 1;
    }

    return count;
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private createBackgroundSlots(): void {
    const slotWidth = 80;
    const slotHeight = 100;
    const totalSlotsWidth = BoardZone.MAX_UNITS * slotWidth + (BoardZone.MAX_UNITS - 1) * 10;
    const slotStartX = (this.zoneWidth - totalSlotsWidth) / 2;
    const slotY = 40;

    for (let i = 0; i < BoardZone.MAX_UNITS; i++) {
      const slot = this.scene.add.image(
        slotStartX + i * (slotWidth + 10) + slotWidth / 2,
        slotY + slotHeight / 2,
        'battle_slot',
      );
      slot.setAlpha(0.3);
      this.add(slot);
      this.backgroundSlots.push(slot);
    }
  }

  /**
   * Get the (x, y) position for a card at a given index out of totalCount.
   * Cards are evenly distributed and centered.
   */
  private getPositionForIndex(index: number, totalCount: number): { x: number; y: number } {
    if (totalCount === 0) {
      return { x: this.zoneWidth / 2, y: BoardZone.CARD_Y };
    }

    if (totalCount === 1) {
      return { x: this.zoneWidth / 2, y: BoardZone.CARD_Y };
    }

    const usableWidth = this.zoneWidth - 2 * BoardZone.MARGIN;
    const cardSpacing = usableWidth / (totalCount - 1);
    const startX = BoardZone.MARGIN;

    return {
      x: startX + index * cardSpacing,
      y: BoardZone.CARD_Y,
    };
  }

  /**
   * Shift existing cards to make room for the preview.
   */
  private shiftCardsForPreview(insertionIndex: number, totalCount: number): void {
    for (let i = 0; i < this.cardSprites.length; i++) {
      const displayIndex = i >= insertionIndex ? i + 1 : i;
      const pos = this.getPositionForIndex(displayIndex, totalCount);

      this.scene.tweens.add({
        targets: this.cardSprites[i],
        x: pos.x,
        y: pos.y,
        duration: BoardZone.ANIM_DURATION,
        ease: 'Cubic.easeOut',
      });
    }
  }

  private clearBoard(): void {
    for (const sprite of this.cardSprites) {
      this.remove(sprite, true);
    }
    this.cardSprites = [];
    if (this.previewSprite) {
      this.remove(this.previewSprite, true);
      this.previewSprite = null;
      this.previewPosition = -1;
    }
    for (const slot of this.backgroundSlots) {
      this.remove(slot, true);
    }
    this.backgroundSlots = [];
  }
}
