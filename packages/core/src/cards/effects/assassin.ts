import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * ASSASSIN keyword handler.
 *
 * ASSASSIN is already handled in createCardInstance (remainingAttacks = 1)
 * and attack validation (allows attacking hero directly, bypasses taunt).
 */
const assassinHandler: EffectHandler = {
  keyword: 'ASSASSIN',
};

registerEffectHandler(assassinHandler);
