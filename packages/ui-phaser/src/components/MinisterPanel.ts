import Phaser from 'phaser';
import type { Minister } from '@king-card/shared';

/**
 * MinisterPanel - Displays the active minister with portrait, name, and skill button.
 *
 * Also shows a small indicator for switching ministers.
 */
export class MinisterPanel extends Phaser.GameObjects.Container {
  // ─── Internal game objects ─────────────────────────────────────────
  private portraitImage!: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.Text;
  private skillButton!: Phaser.GameObjects.Container;
  private skillButtonText!: Phaser.GameObjects.Text;
  private skillButtonBg!: Phaser.GameObjects.Image;
  private skillStatusText!: Phaser.GameObjects.Text;
  private switchButton!: Phaser.GameObjects.Container;
  private switchButtonText!: Phaser.GameObjects.Text;
  private switchButtonBg!: Phaser.GameObjects.Graphics;
  private typeText!: Phaser.GameObjects.Text;

  // ─── Callbacks ─────────────────────────────────────────────────────
  onMinisterSkillClick?: () => void;
  onSwitchMinister?: (ministerIndex: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.setSize(200, 70);
    this.buildUI();
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Refresh the minister panel with current minister data.
   */
  refresh(
    ministers: Minister[],
    activeMinisterIndex: number,
  ): void {
    const minister = ministers[activeMinisterIndex];
    if (!minister) return;

    // Update portrait
    this.portraitImage.setTexture('minister_portrait');

    // Update name
    this.nameText.setText(minister.name);

    // Update type
    this.typeText.setText(MINISTER_TYPE_LABELS[minister.type] || minister.type);

    // Update skill button
    const skill = minister.activeSkill;
    if (skill) {
      this.skillButton.setVisible(true);
      this.skillButtonText.setText(skill.name);

      if (minister.skillUsedThisTurn) {
        this.skillButtonBg.setTint(0x666666);
        this.skillButton.setAlpha(0.5);
        this.skillStatusText.setText('已使用');
      } else {
        this.skillButtonBg.clearTint();
        this.skillButton.setAlpha(1);
        this.skillStatusText.setText(`费用:${skill.cost}`);
      }
    }

    // Show/hide switch button based on available ministers
    this.switchButton.setVisible(ministers.length > 1);
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private buildUI(): void {
    // Portrait
    this.portraitImage = this.scene.add.image(25, 35, 'minister_portrait').setScale(0.8);
    this.add(this.portraitImage);

    // Minister name
    this.nameText = this.scene.add.text(55, 10, '文臣', {
      fontSize: '13px',
      color: '#bcaaa4',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    });
    this.add(this.nameText);

    // Minister type
    this.typeText = this.scene.add.text(55, 28, '谋士', {
      fontSize: '11px',
      color: '#8d6e63',
      fontFamily: 'sans-serif',
    });
    this.add(this.typeText);

    // Skill button
    this.skillButton = this.scene.add.container(130, 20);
    this.skillButton.setSize(80, 40);

    this.skillButtonBg = this.scene.add.image(0, 0, 'end_turn_button').setScale(0.55);
    this.skillButton.add(this.skillButtonBg);

    this.skillButtonText = this.scene.add.text(0, -5, '文臣技', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.skillButton.add(this.skillButtonText);

    this.skillStatusText = this.scene.add.text(0, 8, '', {
      fontSize: '9px',
      color: '#bbdefb',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0.5);
    this.skillButton.add(this.skillStatusText);

    const skillHitArea = this.scene.add.rectangle(0, 0, 70, 22, 0x000000, 0);
    skillHitArea.setInteractive({ useHandCursor: true });
    this.skillButton.add(skillHitArea);

    skillHitArea.on('pointerover', () => {
      this.skillButtonBg.setScale(0.6);
    });
    skillHitArea.on('pointerout', () => {
      this.skillButtonBg.setScale(0.55);
    });
    skillHitArea.on('pointerdown', () => {
      this.onMinisterSkillClick?.();
    });

    this.add(this.skillButton);

    // Switch minister button
    this.switchButton = this.scene.add.container(130, 50);
    this.switchButton.setSize(60, 22);

    this.switchButtonBg = this.scene.add.graphics();
    this.switchButtonBg.fillStyle(0x5d4037, 1);
    this.switchButtonBg.fillRoundedRect(-30, -11, 60, 22, 4);
    this.switchButtonBg.lineStyle(1, 0x8d6e63, 1);
    this.switchButtonBg.strokeRoundedRect(-30, -11, 60, 22, 4);
    this.switchButton.add(this.switchButtonBg);

    this.switchButtonText = this.scene.add.text(0, 0, '切换文臣', {
      fontSize: '10px',
      color: '#efebe9',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0.5);
    this.switchButton.add(this.switchButtonText);

    const switchHitArea = this.scene.add.rectangle(0, 0, 60, 22, 0x000000, 0);
    switchHitArea.setInteractive({ useHandCursor: true });
    this.switchButton.add(switchHitArea);

    switchHitArea.on('pointerover', () => {
      this.switchButtonBg.clear();
      this.switchButtonBg.fillStyle(0x6d4c41, 1);
      this.switchButtonBg.fillRoundedRect(-30, -11, 60, 22, 4);
      this.switchButtonBg.lineStyle(1, 0xa1887f, 1);
      this.switchButtonBg.strokeRoundedRect(-30, -11, 60, 22, 4);
    });
    switchHitArea.on('pointerout', () => {
      this.switchButtonBg.clear();
      this.switchButtonBg.fillStyle(0x5d4037, 1);
      this.switchButtonBg.fillRoundedRect(-30, -11, 60, 22, 4);
      this.switchButtonBg.lineStyle(1, 0x8d6e63, 1);
      this.switchButtonBg.strokeRoundedRect(-30, -11, 60, 22, 4);
    });
    switchHitArea.on('pointerdown', () => {
      // Cycle to next minister (will be connected to engine in Task 16)
      this.onSwitchMinister?.(0);
    });

    this.add(this.switchButton);
  }
}

// ─── Minister type labels (Chinese) ─────────────────────────────────

const MINISTER_TYPE_LABELS: Record<string, string> = {
  STRATEGIST: '谋士',
  WARRIOR: '武将',
  ADMINISTRATOR: '行政',
  ENVOY: '使节',
};
