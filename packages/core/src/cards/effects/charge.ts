import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * CHARGE keyword handler.
 *
 * CHARGE is already handled in createCardInstance (remainingAttacks = 1)
 * and attack validation (allows attacking hero directly).
 */
const chargeHandler: EffectHandler = {
  keyword: 'CHARGE',
};

registerEffectHandler(chargeHandler);
