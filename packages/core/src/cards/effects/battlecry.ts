import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * BATTLECRY keyword handler.
 *
 * Phase 1: empty placeholder. Card-specific battlecry effects
 * will be implemented in Task 12 (card data definitions).
 */
const battlecryHandler: EffectHandler = {
  keyword: 'BATTLECRY',
  // onPlay will be populated when card-specific effects are defined
};

registerEffectHandler(battlecryHandler);
