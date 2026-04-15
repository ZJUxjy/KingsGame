import type { EffectHandler } from '@king-card/shared';
import { executeCardEffects } from './execute-card-effects.js';
import { registerEffectHandler } from './registry.js';

/**
 * DEATHRATTLE keyword handler.
 *
 * Phase 1: empty placeholder. Card-specific deathrattle effects
 * will be implemented in Task 12 (card data definitions).
 */
export const deathrattleHandler: EffectHandler = {
  keyword: 'DEATHRATTLE',
  onDeath(ctx) {
    if (!ctx.source.card.keywords.includes('DEATHRATTLE')) {
      return [];
    }

    executeCardEffects('ON_DEATH', ctx);
    return [];
  },
};

registerEffectHandler(deathrattleHandler);
