import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * BLOCKADE keyword handler.
 *
 * While a BLOCKADE minion is alive, the opponent gains 1 less energy
 * per turn.  Implemented by spending 1 energy from the opponent at
 * the owner's turn start.
 */
const blockadeHandler: EffectHandler = {
  keyword: 'BLOCKADE',

  onTurnStart(ctx) {
    const { source, state, mutator, playerIndex } = ctx;

    if (!source.card.keywords.includes('BLOCKADE')) return [];

    const opponentIndex = (1 - playerIndex) as 0 | 1;
    const opponent = state.players[opponentIndex];

    if (opponent.energyCrystal > 0) {
      mutator.spendEnergy(opponentIndex, 1);
    }

    return [];
  },
};

export function registerBlockade(): void {
  registerEffectHandler(blockadeHandler);
}

// Auto-register on module import
registerBlockade();
