import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * RUSH keyword handler.
 *
 * RUSH is already handled in createCardInstance (remainingAttacks = 1).
 * No runtime effect resolution needed.
 */
const rushHandler: EffectHandler = {
  keyword: 'RUSH',
};

registerEffectHandler(rushHandler);
