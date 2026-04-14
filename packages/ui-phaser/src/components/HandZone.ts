import Phaser from 'phaser';
import { CardSprite } from './CardSprite.js';
import type { Card, CardInstance } from '@king-card/shared';

/**
 * HandZone - Container for hand cards with fan layout.
 *
 * Features:
 *   - Fan arc layout
 *   - Hover: card rises (Y-axis) and scales to 1.15x
 *   - Draggable card support (emits events, does NOT call engine)
 *
 * Layout math:
 *   Cards are placed on an arc whose center is below the zone.
 *   Angle spread adapts to card count (capped at 40 degrees total).
 */
export class HandZone extends Phaser.GameObjects.Container {
  // ─── Layout constants ─────────────────────────────────────────────
  private static readonly ARC_RADIUS = 320;
  private static readonly MAX_FAN_SPREAD = 40; // degrees
  private static readonly HOVER_Y_OFFSET = -40;
  private static readonly HOVER_SCALE = 1.15;
  private static readonly ANIM_DURATION = 150; // ms

  // ─── Internal state ───────────────────────────────────────────────
  private cardSprites: CardSprite[] = [];
  private hoveredIndex: number = -1;
  private dragging: boolean = false;
  private dragCardIndex: number = -1;
  private dragCard!: CardSprite;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private zoneWidth: number;
  private zoneHeight: number;

  // ─── Callbacks ─────────────────────────────────────────────────────
  /** Fired when a card drag starts: (card, handIndex) */
  onCardDragStart?: (card: Card, handIndex: number) => void;
  /** Fired when a card is dragged and released: (card, handIndex, worldX, worldY) */
  onCardDragEnd?: (card: Card, handIndex: number, worldX: number, worldY: number) => void;
  /** Fired when a card is clicked (not dragged): (card, handIndex) */
  onCardClick?: (card: Card, handIndex: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.zoneWidth = width;
    this.zoneHeight = height;
    this.setSize(width, height);
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Refresh the hand zone with new card data.
   * @param cards - Array of cards in hand
   * @param instances - Optional array of CardInstance (parallel to cards)
   */
  refresh(cards: Card[], instances?: (CardInstance | undefined)[]): void {
    // Clear old sprites
    this.clearHand();

    if (cards.length === 0) return;

    const count = cards.length;
    const fanSpread = Math.min(HandZone.MAX_FAN_SPREAD, count * 5);
    const startAngle = -fanSpread / 2;
    const angleStep = count > 1 ? fanSpread / (count - 1) : 0;
    const centerX = this.zoneWidth / 2;
    const centerY = this.zoneHeight + HandZone.ARC_RADIUS;

    for (let i = 0; i < count; i++) {
      const angleDeg = count > 1 ? startAngle + i * angleStep : 0;
      const angleRad = Phaser.Math.DegToRad(angleDeg - 90);

      const cardX = centerX + Math.cos(angleRad) * HandZone.ARC_RADIUS;
      const cardY = centerY + Math.sin(angleRad) * HandZone.ARC_RADIUS;
      const rotation = Phaser.Math.DegToRad(angleDeg);

      const sprite = new CardSprite(this.scene, cardX, cardY);
      sprite.render(cards[i], instances?.[i]);
      sprite.setRotation(rotation);
      // Note: Container doesn't support setOrigin; the position calculation
      // already accounts for the pivot point being at bottom-center of the arc
      sprite.setDepth(i);

      // Store hand index for callbacks
      const handIndex = i;
      sprite.onPointerDown = () => this.handleCardPointerDown(handIndex);
      sprite.onPointerUp = () => this.handleCardPointerUp(handIndex);
      sprite.onPointerOver = () => this.handleCardHover(handIndex);
      sprite.onPointerOut = () => this.handleCardHoverOut(handIndex);

      this.add(sprite);
      this.cardSprites.push(sprite);
    }
  }

  /**
   * Animate a card back to its position in the hand (e.g. after cancelled drag).
   */
  animateCardBack(handIndex: number): void {
    const sprite = this.cardSprites[handIndex];
    if (!sprite) return;

    const count = this.cardSprites.length;
    const fanSpread = Math.min(HandZone.MAX_FAN_SPREAD, count * 5);
    const startAngle = -fanSpread / 2;
    const angleStep = count > 1 ? fanSpread / (count - 1) : 0;
    const centerX = this.zoneWidth / 2;
    const centerY = this.zoneHeight + HandZone.ARC_RADIUS;

    const angleDeg = count > 1 ? startAngle + handIndex * angleStep : 0;
    const angleRad = Phaser.Math.DegToRad(angleDeg - 90);
    const targetX = centerX + Math.cos(angleRad) * HandZone.ARC_RADIUS;
    const targetY = centerY + Math.sin(angleRad) * HandZone.ARC_RADIUS;
    const targetRotation = Phaser.Math.DegToRad(angleDeg);
    const targetScale = 1;

    this.scene.tweens.add({
      targets: sprite,
      x: targetX,
      y: targetY,
      rotation: targetRotation,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: HandZone.ANIM_DURATION,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Get the card sprite at a given hand index.
   */
  getCardSprite(index: number): CardSprite | undefined {
    return this.cardSprites[index];
  }

  /**
   * Get total card count in hand.
   */
  getCardCount(): number {
    return this.cardSprites.length;
  }

  /**
   * Check if currently dragging.
   */
  isDragging(): boolean {
    return this.dragging;
  }

  /**
   * Remove a card from the hand (e.g. after playing it).
   */
  removeCard(handIndex: number): void {
    if (handIndex < 0 || handIndex >= this.cardSprites.length) return;
    const sprite = this.cardSprites[handIndex];
    this.remove(sprite, true);
    this.cardSprites.splice(handIndex, 1);
    // Re-layout remaining cards
    if (this.cardSprites.length > 0) {
      this.refreshLayout();
    }
  }

  // ─── Private handlers ──────────────────────────────────────────────

  private handleCardPointerDown(handIndex: number): void {
    this.dragging = true;
    this.dragCardIndex = handIndex;
    this.dragCard = this.cardSprites[handIndex];

    // Bring to top
    this.dragCard.setDepth(100);

    const pointer = this.scene.input.activePointer;
    const worldPoint = this.getLocalPoint(pointer.x, pointer.y);
    this.dragOffsetX = worldPoint.x - this.dragCard.x;
    this.dragOffsetY = worldPoint.y - this.dragCard.y;

    // Remove hover effect on the dragged card
    if (this.hoveredIndex === handIndex) {
      this.hoveredIndex = -1;
    }

    this.scene.input.on('pointermove', this.onPointerMove, this);
  }

  private handleCardPointerUp(handIndex: number): void {
    this.scene.input.off('pointermove', this.onPointerMove, this);

    if (!this.dragging) return;

    const pointer = this.scene.input.activePointer;

    // Detect click vs drag (if barely moved, treat as click)
    const card = this.dragCard.getCard();
    const moved = Math.abs(pointer.x - (pointer.downX ?? pointer.x)) > 5 ||
                  Math.abs(pointer.y - (pointer.downY ?? pointer.y)) > 5;

    if (moved) {
      this.onCardDragEnd?.(card, handIndex, pointer.x, pointer.y);
    } else {
      this.onCardClick?.(card, handIndex);
    }

    this.dragging = false;
    this.dragCardIndex = -1;
  }

  private onPointerMove(_pointer: Phaser.Input.Pointer): void {
    if (!this.dragging || !this.dragCard) return;

    const pointer = this.scene.input.activePointer;
    const worldPoint = this.getLocalPoint(pointer.x, pointer.y);

    this.dragCard.x = worldPoint.x - this.dragOffsetX;
    this.dragCard.y = worldPoint.y - this.dragOffsetY;
    this.dragCard.setRotation(0);
    this.dragCard.setScale(1.1);
  }

  private handleCardHover(handIndex: number): void {
    if (this.dragging) return;
    this.hoveredIndex = handIndex;
    this.applyHoverEffect(handIndex);
  }

  private handleCardHoverOut(_handIndex: number): void {
    if (this.dragging) return;
    this.hoveredIndex = -1;
    this.clearAllHoverEffects();
  }

  private applyHoverEffect(index: number): void {
    const sprite = this.cardSprites[index];
    if (!sprite) return;

    this.scene.tweens.killTweensOf(sprite);
    this.scene.tweens.add({
      targets: sprite,
      y: sprite.y + HandZone.HOVER_Y_OFFSET,
      scaleX: HandZone.HOVER_SCALE,
      scaleY: HandZone.HOVER_SCALE,
      duration: HandZone.ANIM_DURATION,
      ease: 'Cubic.easeOut',
    });

    // Push adjacent cards apart slightly
    for (let i = 0; i < this.cardSprites.length; i++) {
      if (i === index) continue;
      const dist = Math.abs(i - index);
      const pushX = (i < index ? -1 : 1) * 15 / dist;
      this.scene.tweens.add({
        targets: this.cardSprites[i],
        x: this.cardSprites[i].x + pushX,
        duration: HandZone.ANIM_DURATION,
        ease: 'Cubic.easeOut',
      });
    }
  }

  private clearAllHoverEffects(): void {
    this.refreshLayout();
  }

  private refreshLayout(): void {
    const count = this.cardSprites.length;
    if (count === 0) return;

    const fanSpread = Math.min(HandZone.MAX_FAN_SPREAD, count * 5);
    const startAngle = -fanSpread / 2;
    const angleStep = count > 1 ? fanSpread / (count - 1) : 0;
    const centerX = this.zoneWidth / 2;
    const centerY = this.zoneHeight + HandZone.ARC_RADIUS;

    for (let i = 0; i < count; i++) {
      const sprite = this.cardSprites[i];
      const angleDeg = count > 1 ? startAngle + i * angleStep : 0;
      const angleRad = Phaser.Math.DegToRad(angleDeg - 90);
      const targetX = centerX + Math.cos(angleRad) * HandZone.ARC_RADIUS;
      const targetY = centerY + Math.sin(angleRad) * HandZone.ARC_RADIUS;
      const targetRotation = Phaser.Math.DegToRad(angleDeg);

      this.scene.tweens.add({
        targets: sprite,
        x: targetX,
        y: targetY,
        rotation: targetRotation,
        scaleX: 1,
        scaleY: 1,
        duration: HandZone.ANIM_DURATION,
        ease: 'Cubic.easeOut',
      });
    }
  }

  private clearHand(): void {
    for (const sprite of this.cardSprites) {
      this.remove(sprite, true);
    }
    this.cardSprites = [];
    this.hoveredIndex = -1;
  }
}
