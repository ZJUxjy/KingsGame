import { describe, it, expect } from 'vitest';
import { DefaultRNG, SeededRNG } from '../../../src/engine/rng.js';

describe('DefaultRNG', () => {
  it('should return values in range [0, 1) for next()', () => {
    const rng = new DefaultRNG();
    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
  it('should return integers in correct range for nextInt()', () => {
    const rng = new DefaultRNG();
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      expect(Number.isInteger(val)).toBe(true);
    }
  });
  it('should pick an element from the array', () => {
    const rng = new DefaultRNG();
    const arr = [1, 2, 3, 4, 5];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(rng.pick(arr));
    }
  });
  it('should shuffle without changing length', () => {
    const rng = new DefaultRNG();
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(arr);
    expect(shuffled).toHaveLength(5);
    expect(shuffled.sort()).toEqual(arr.sort());
  });
  it('should not mutate original array in shuffle', () => {
    const rng = new DefaultRNG();
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    rng.shuffle(arr);
    expect(arr).toEqual(copy);
  });
});

describe('SeededRNG', () => {
  it('should produce deterministic results with same seed', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);
    for (let i = 0; i < 20; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });
  it('should produce different results with different seeds', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(99);
    let same = true;
    for (let i = 0; i < 20; i++) {
      if (rng1.next() !== rng2.next()) { same = false; break; }
    }
    expect(same).toBe(false);
  });
});
