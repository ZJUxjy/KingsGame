import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * DEATHRATTLE keyword handler.
 *
 * Phase 1: empty placeholder. Card-specific deathrattle effects
 * will be implemented in Task 12 (card data definitions).
 */
const deathrattleHandler: EffectHandler = {
  keyword: 'DEATHRATTLE',
  // onDeath will be populated when card-specific effects are defined
};

registerEffectHandler(deathrattleHandler);
