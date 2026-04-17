import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * COLONY keyword handler.
 *
 * At turn end, if the owner controls 3 or more minions with distinct
 * mana costs, draw a card.
 */
const colonyHandler: EffectHandler = {
  keyword: 'COLONY',

  onTurnEnd(ctx) {
    const { source, state, mutator, playerIndex } = ctx;

    if (!source.card.keywords.includes('COLONY')) return [];

    const battlefield = state.players[playerIndex].battlefield;
    const distinctCosts = new Set(battlefield.map((m) => m.card.cost));

    if (distinctCosts.size >= 3) {
      mutator.drawCards(playerIndex, 1);
    }

    return [];
  },
};

export function registerColony(): void {
  registerEffectHandler(colonyHandler);
}

// Auto-register on module import
registerColony();
