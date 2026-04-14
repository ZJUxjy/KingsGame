import Phaser from 'phaser';
import type { HeroState } from '@king-card/shared';

/**
 * HeroPanel - Displays hero info: portrait, HP, armor, emperor name, skill button.
 *
 * Layout (within the container):
 *   [Portrait(60x60)] [Emperor Name] [HP/Armor] [Skill Button]
 *
 * The panel is designed to fit in the info zones (80px tall).
 */
export class HeroPanel extends Phaser.GameObjects.Container {
  // ─── Internal game objects ─────────────────────────────────────────
  private portraitImage!: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private armorText!: Phaser.GameObjects.Text;
  private skillButton!: Phaser.GameObjects.Container;
  private skillButtonText!: Phaser.GameObjects.Text;
  private skillButtonBg!: Phaser.GameObjects.Image;
  private skillCooldownText!: Phaser.GameObjects.Text;
  private emperorName: string = '';
  private isEnemy: boolean;

  // ─── Callbacks ─────────────────────────────────────────────────────
  onHeroSkillClick?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, isEnemy: boolean = false) {
    super(scene, x, y);
    this.isEnemy = isEnemy;
    this.setSize(280, 70);
    this.buildUI();
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Refresh the hero panel with current hero state data.
   */
  refresh(heroState: HeroState, emperorName?: string): void {
    if (emperorName !== undefined) {
      this.emperorName = emperorName;
    }

    // Update name
    this.nameText.setText(this.emperorName || '帝王');

    // Update HP
    const hpColor = heroState.health <= 10 ? '#ff1744' :
                    heroState.health <= 20 ? '#ff9100' : '#69f0ae';
    this.hpText.setText(`HP: ${heroState.health}/${heroState.maxHealth}`);
    this.hpText.setColor(hpColor);

    // Update armor
    if (heroState.armor > 0) {
      this.armorText.setText(`护甲: ${heroState.armor}`);
      this.armorText.setVisible(true);
    } else {
      this.armorText.setVisible(false);
    }

    // Update skill button state
    const skill = heroState.heroSkill;
    if (skill) {
      this.skillButton.setVisible(true);
      this.skillButtonText.setText(skill.name);
      this.skillButtonText.setColor('#ffffff');

      if (heroState.skillUsedThisTurn) {
        // Skill already used this turn - greyed out
        this.skillButtonBg.setTint(0x666666);
        this.skillButton.setAlpha(0.5);
        this.skillCooldownText.setText('已使用');
      } else if (heroState.skillCooldownRemaining > 0) {
        // On cooldown
        this.skillButtonBg.setTint(0x666666);
        this.skillButton.setAlpha(0.5);
        this.skillCooldownText.setText(`冷却:${heroState.skillCooldownRemaining}`);
      } else {
        // Ready
        this.skillButtonBg.clearTint();
        this.skillButton.setAlpha(1);
        this.skillCooldownText.setText(`费用:${skill.cost}`);
      }
    } else {
      this.skillButton.setVisible(false);
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private buildUI(): void {
    // Hero portrait
    this.portraitImage = this.scene.add.image(30, 35, 'hero_portrait').setScale(0.7);
    this.add(this.portraitImage);

    // Emperor name
    this.nameText = this.scene.add.text(70, 10, this.isEnemy ? '敌方帝王' : '己方帝王', {
      fontSize: '14px',
      color: '#ffd700',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    });
    this.add(this.nameText);

    // HP text
    this.hpText = this.scene.add.text(70, 30, 'HP: 30/30', {
      fontSize: '13px',
      color: '#69f0ae',
      fontFamily: 'sans-serif',
    });
    this.add(this.hpText);

    // Armor text
    this.armorText = this.scene.add.text(70, 48, '护甲: 0', {
      fontSize: '12px',
      color: '#90caf9',
      fontFamily: 'sans-serif',
    }).setVisible(false);
    this.add(this.armorText);

    // Skill button
    this.skillButton = this.scene.add.container(210, 35);
    this.skillButton.setSize(100, 50);

    // Skill button background (reuse end_turn_button texture as a generic button)
    this.skillButtonBg = this.scene.add.image(0, 0, 'end_turn_button').setScale(0.7);
    this.skillButton.add(this.skillButtonBg);

    // Skill name
    this.skillButtonText = this.scene.add.text(0, -5, '帝王技', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.skillButton.add(this.skillButtonText);

    // Skill cost/cooldown
    this.skillCooldownText = this.scene.add.text(0, 10, '', {
      fontSize: '10px',
      color: '#bbdefb',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0.5);
    this.skillButton.add(this.skillCooldownText);

    // Make skill button interactive
    const hitArea = this.scene.add.rectangle(0, 0, 90, 30, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.skillButton.add(hitArea);

    hitArea.on('pointerover', () => {
      this.skillButtonBg.setScale(0.75);
    });
    hitArea.on('pointerout', () => {
      this.skillButtonBg.setScale(0.7);
    });
    hitArea.on('pointerdown', () => {
      this.onHeroSkillClick?.();
    });

    this.add(this.skillButton);
  }
}
