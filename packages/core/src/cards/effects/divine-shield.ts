import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * DIVINE_SHIELD keyword handler.
 *
 * The shield itself is consumed inside state-mutator.damage() — it absorbs
 * the first positive-damage hit, removes the keyword, and emits
 * DIVINE_SHIELD_BROKEN. This handler exists so registry sweeps see the
 * keyword and so future ON_PLAY-style enrichments have a mount point.
 */
const divineShieldHandler: EffectHandler = {
  keyword: 'DIVINE_SHIELD',
};

registerEffectHandler(divineShieldHandler);
