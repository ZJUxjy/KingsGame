import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * BLOCKADE keyword.
 *
 * While a BLOCKADE minion is alive, the opponent loses 1 usable energy
 * after their ENERGY_GAIN phase each turn. The actual reduction is
 * implemented inline in game-loop.ts (see ENERGY_GAIN phase) so that
 * the on-turn-start lifecycle is not perturbed for other keywords that
 * lack owner guards (IRON_FIST, MOBILIZATION_ORDER, GARRISON).
 *
 * This handler is kept registered as a no-op to preserve the BLOCKADE
 * keyword in the registry for tooling/queries.
 */
const blockadeHandler: EffectHandler = {
  keyword: 'BLOCKADE',
};

export function registerBlockade(): void {
  registerEffectHandler(blockadeHandler);
}

registerBlockade();
