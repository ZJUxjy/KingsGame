import type { RNG } from '@king-card/shared';

export class DefaultRNG implements RNG {
  next(): number {
    return Math.random();
  }

  nextInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

export class SeededRNG implements RNG {
  private state: number;

  // LCG constants
  private static readonly A = 1664525;
  private static readonly C = 1013904223;
  private static readonly M = 2 ** 32;

  constructor(seed: number) {
    this.state = seed >>> 0; // Ensure unsigned 32-bit
  }

  private nextRaw(): number {
    this.state = (SeededRNG.A * this.state + SeededRNG.C) % SeededRNG.M;
    return this.state >>> 0;
  }

  next(): number {
    return this.nextRaw() / SeededRNG.M;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
