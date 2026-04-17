import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * IRON_FIST keyword handler.
 *
 * At the start of each turn, if the owning hero's health is ≤15,
 * the minion receives +2/+2.
 */
const ironFistHandler: EffectHandler = {
  keyword: 'IRON_FIST',

  onTurnStart(ctx) {
    const { source, state, mutator, playerIndex } = ctx;
    if (!source.card.keywords.includes('IRON_FIST')) return [];

    const hero = state.players[playerIndex].hero;
    if (hero.health <= 15) {
      mutator.modifyStat({ type: 'MINION', instanceId: source.instanceId }, 'attack', 2);
      mutator.modifyStat({ type: 'MINION', instanceId: source.instanceId }, 'health', 2);
    }

    return [];
  },
};

export function registerIronFist(): void {
  registerEffectHandler(ironFistHandler);
}

// Auto-register on module import
registerIronFist();
