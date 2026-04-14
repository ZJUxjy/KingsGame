import Phaser from 'phaser';

/**
 * EnergyBar - Visual display of energy crystals.
 *
 * Shows an array of gem icons, with filled gems for available energy
 * and empty/faded gems for spent or unavailable energy.
 */
export class EnergyBar extends Phaser.GameObjects.Container {
  // ─── Constants ─────────────────────────────────────────────────────
  private static readonly CRYSTAL_SIZE = 0.55; // scale factor
  private static readonly CRYSTAL_SPACING = 22;

  // ─── Internal state ───────────────────────────────────────────────
  private crystals: Phaser.GameObjects.Image[] = [];
  private labelText!: Phaser.GameObjects.Text;
  private crystalCount: number = 0;
  private filledCount: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.setSize(240, 30);
    this.buildUI();
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Refresh the energy bar display.
   * @param current - Current available energy
   * @param max - Maximum energy this turn
   */
  refresh(current: number, max: number): void {
    this.filledCount = current;
    this.crystalCount = max;

    this.ensureCrystals(max);

    // Update crystal visuals
    for (let i = 0; i < this.crystals.length; i++) {
      const crystal = this.crystals[i];
      if (i < current) {
        // Filled (available) crystal
        crystal.setAlpha(1);
        crystal.clearTint();
        crystal.setScale(EnergyBar.CRYSTAL_SIZE);
      } else if (i < max) {
        // Empty (spent) crystal
        crystal.setAlpha(0.35);
        crystal.setTint(0x555555);
        crystal.setScale(EnergyBar.CRYSTAL_SIZE * 0.9);
      } else {
        // Beyond max (shouldn't happen, but hide just in case)
        crystal.setVisible(false);
      }
    }

    // Update label
    this.labelText.setText(`能量: ${current}/${max}`);
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private buildUI(): void {
    // Label text
    this.labelText = this.scene.add.text(0, 16, '能量: 0/0', {
      fontSize: '11px',
      color: '#64b5f6',
      fontFamily: 'sans-serif',
    });
    this.add(this.labelText);

    // Initialize with 0 crystals (will be populated on refresh)
  }

  private ensureCrystals(count: number): void {
    // Add more crystals if needed
    while (this.crystals.length < count) {
      const idx = this.crystals.length;
      const crystal = this.scene.add.image(
        80 + idx * EnergyBar.CRYSTAL_SPACING,
        8,
        'energy_crystal',
      ).setScale(EnergyBar.CRYSTAL_SIZE);
      this.add(crystal);
      this.crystals.push(crystal);
    }

    // Hide extra crystals if count decreased
    for (let i = count; i < this.crystals.length; i++) {
      this.crystals[i].setVisible(false);
    }

    // Show active crystals
    for (let i = 0; i < count; i++) {
      this.crystals[i].setVisible(true);
    }
  }
}
