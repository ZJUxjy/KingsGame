import { describe, expect, it } from 'vitest';
import type { Keyword } from '../src/types.js';

describe('Keyword enum (Phase 1 flavor keywords)', () => {
  it('includes the 5 new flavor keywords', () => {
    const requiredKeywords: Keyword[] = [
      'DIVINE_SHIELD',
      'POISONOUS',
      'WINDFURY',
      'LIFESTEAL',
      'REBORN',
    ];

    // Compile-time check: if any string is not in the union, this fails to type-check.
    // Runtime guard: ensure they're all string literals so JSON serialization works.
    for (const kw of requiredKeywords) {
      expect(typeof kw).toBe('string');
      expect(kw).toMatch(/^[A-Z_]+$/);
    }
  });
});
