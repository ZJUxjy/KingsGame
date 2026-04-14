import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * TAUNT keyword handler.
 *
 * TAUNT does not need onPlay/onDeath handling -- its effect is
 * enforced during attack target validation in action-executor.ts.
 */
const tauntHandler: EffectHandler = {
  keyword: 'TAUNT',
};

registerEffectHandler(tauntHandler);
