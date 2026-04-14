import Phaser from 'phaser';

// ─── Animation Task ─────────────────────────────────────────────────

interface AnimationTask {
  /** Serial tasks wait for previous task to complete. Parallel tasks start immediately. */
  mode: 'serial' | 'parallel';
  /** Factory function that creates a Phaser tween and returns it. */
  create: (scene: Phaser.Scene) => Phaser.Tweens.Tween | Phaser.Tweens.Tween[];
  /** Resolve is called when the tween(s) complete. */
  resolve: () => void;
}

// ─── Damage Text Config ─────────────────────────────────────────────

export interface DamageTextConfig {
  x: number;
  y: number;
  text: string;
  color?: string;
  fontSize?: string;
  duration?: number;
}

// ─── Attack Animation Config ────────────────────────────────────────

export interface AttackAnimConfig {
  attackerContainer: Phaser.GameObjects.Container;
  defenderContainer: Phaser.GameObjects.Container;
  /** Original position of attacker (will return here after animation). */
  attackerOriginX: number;
  attackerOriginY: number;
  /** Offset toward target during the lunge. */
  lungeX: number;
  lungeY: number;
  duration?: number;
}

// ─── Card Play Animation Config ─────────────────────────────────────

export interface CardPlayAnimConfig {
  cardSprite: Phaser.GameObjects.Container;
  targetX: number;
  targetY: number;
  targetScale?: number;
  targetRotation?: number;
  duration?: number;
}

// ─── Death Animation Config ─────────────────────────────────────────

export interface DeathAnimConfig {
  target: Phaser.GameObjects.Container;
  duration?: number;
}

// ─── AnimationQueue ─────────────────────────────────────────────────

/**
 * AnimationQueue manages a queue of animation tasks that execute
 * either serially (one after another) or in parallel (overlapping).
 *
 * While animations are playing, input is considered locked.
 */
export class AnimationQueue {
  private queue: AnimationTask[] = [];
  private activeTweens: (Phaser.Tweens.Tween | null)[] = [];
  private _isPlaying = false;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Whether any animation is currently playing.
   */
  isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Enqueue a serial animation task. It will wait for the previous serial
   * task to complete before starting.
   */
  enqueueSerial(
    create: (scene: Phaser.Scene) => Phaser.Tweens.Tween | Phaser.Tweens.Tween[],
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      this.queue.push({ mode: 'serial', create, resolve });
      this.processNext();
    });
  }

  /**
   * Enqueue a parallel animation task. It starts immediately without
   * waiting for the current serial task to finish.
   */
  enqueueParallel(
    create: (scene: Phaser.Scene) => Phaser.Tweens.Tween | Phaser.Tweens.Tween[],
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      this.queue.push({ mode: 'parallel', create, resolve });
      this.processNext();
    });
  }

  /**
   * Show a floating damage/heal text that rises and fades.
   * Runs in parallel so it does not block the main animation chain.
   */
  showDamageText(config: DamageTextConfig): void {
    const {
      x, y, text,
      color = '#ff4444',
      fontSize = '24px',
      duration = 800,
    } = config;

    const damageText = this.scene.add.text(x, y, text, {
      fontSize,
      color,
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(1000);

    this.scene.tweens.add({
      targets: damageText,
      y: y - 60,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        damageText.destroy();
      },
    });
  }

  /**
   * Animate an attack: attacker lunges toward defender, pauses briefly,
   * then returns to original position.
   */
  playAttackAnimation(config: AttackAnimConfig): Promise<void> {
    const {
      attackerContainer,
      attackerOriginX,
      attackerOriginY,
      lungeX,
      lungeY,
      duration = 400,
    } = config;

    return this.enqueueSerial((scene) => {
      const halfDur = duration / 2;
      // Use a chained tween: lunge forward then return
      const tween = scene.tweens.add({
        targets: attackerContainer,
        x: { from: attackerOriginX, to: attackerOriginX + lungeX },
        y: { from: attackerOriginY, to: attackerOriginY + lungeY },
        duration: halfDur,
        ease: 'Quad.easeIn',
        yoyo: true,
        hold: 50,
        easeParams: undefined,
      });
      return tween;
    });
  }

  /**
   * Animate a card moving from hand to board position.
   */
  playCardAnimation(config: CardPlayAnimConfig): Promise<void> {
    const {
      cardSprite,
      targetX,
      targetY,
      targetScale = 0.9,
      targetRotation = 0,
      duration = 300,
    } = config;

    return this.enqueueSerial((scene) => {
      return scene.tweens.add({
        targets: cardSprite,
        x: targetX,
        y: targetY,
        scaleX: targetScale,
        scaleY: targetScale,
        rotation: targetRotation,
        duration,
        ease: 'Cubic.easeOut',
      });
    });
  }

  /**
   * Animate a minion dying: scale down + fade out.
   */
  playDeathAnimation(config: DeathAnimConfig): Promise<void> {
    const { target, duration = 500 } = config;

    return this.enqueueSerial((scene) => {
      return scene.tweens.add({
        targets: target,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration,
        ease: 'Cubic.easeIn',
      });
    });
  }

  /**
   * Clear all queued animations and kill active tweens.
   */
  clear(): void {
    // Kill active tweens
    for (const tween of this.activeTweens) {
      if (tween) tween.stop();
    }
    this.activeTweens = [];
    this.queue = [];
    this._isPlaying = false;
  }

  // ─── Private ───────────────────────────────────────────────────────

  private processNext(): void {
    if (this.queue.length === 0) {
      this._isPlaying = false;
      return;
    }

    this._isPlaying = true;

    const task = this.queue[0];

    if (task.mode === 'parallel') {
      // Remove from queue immediately, run concurrently
      this.queue.shift();
      this.runTask(task);
    } else {
      // Serial: remove from queue and run
      this.queue.shift();
      this.runTask(task);
    }
  }

  private runTask(task: AnimationTask): void {
    const tweens = task.create(this.scene);
    const tweenArray = Array.isArray(tweens) ? tweens : [tweens];

    this.activeTweens.push(...tweenArray);

    let completedCount = 0;
    const totalTweens = tweenArray.length;

    const onComplete = () => {
      completedCount++;
      if (completedCount >= totalTweens) {
        // Remove from active list
        for (const t of tweenArray) {
          const idx = this.activeTweens.indexOf(t);
          if (idx >= 0) this.activeTweens.splice(idx, 1);
        }
        task.resolve();
        // Process next serial task
        this.processNext();
      }
    };

    for (const tween of tweenArray) {
      if (!tween) {
        // Null tween (e.g., no-op) counts as completed
        completedCount++;
        if (completedCount >= totalTweens) {
          task.resolve();
          this.processNext();
        }
        continue;
      }
      tween.on('complete', onComplete);
      tween.on('stop', onComplete);
    }
  }
}
