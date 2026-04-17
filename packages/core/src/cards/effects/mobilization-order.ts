import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * MOBILIZATION_ORDER keyword handler.
 *
 * At the start of each turn, if there are ≥3 friendly minions on the
 * battlefield, all friendly minions get +1 attack.
 */
const mobilizationOrderHandler: EffectHandler = {
  keyword: 'MOBILIZATION_ORDER',

  onTurnStart(ctx) {
    const { source, state, mutator, playerIndex } = ctx;

    if (!source.card.keywords.includes('MOBILIZATION_ORDER')) return [];

    const battlefield = state.players[playerIndex].battlefield;

    if (battlefield.length >= 3) {
      for (const minion of battlefield) {
        mutator.modifyStat(
          { type: 'MINION', instanceId: minion.instanceId },
          'attack',
          1,
        );
      }
    }

    return [];
  },
};

export function registerMobilizationOrder(): void {
  registerEffectHandler(mobilizationOrderHandler);
}

// Auto-register on module import
registerMobilizationOrder();
