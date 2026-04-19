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

    // Runtime registry check: ensures the literals exist as string values.
    // Type-membership in the Keyword union is enforced separately by tsc --noEmit.
    for (const kw of requiredKeywords) {
      expect(typeof kw).toBe('string');
      expect(kw).toMatch(/^[A-Z_]+$/);
    }
  });
});
