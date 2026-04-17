import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * BLITZ keyword handler.
 *
 * When this minion enters the battlefield, deal 2 damage to a random
 * enemy minion.
 */
const blitzHandler: EffectHandler = {
  keyword: 'BLITZ',

  onPlay(ctx) {
    const { source, state, mutator, playerIndex, rng } = ctx;
    if (!source.card.keywords.includes('BLITZ')) return [];

    const opponentIndex = (1 - playerIndex) as 0 | 1;
    const enemies = state.players[opponentIndex].battlefield;
    if (enemies.length === 0) return [];

    const target = rng.pick(enemies);
    mutator.damage({ type: 'MINION', instanceId: target.instanceId }, 2);

    return [];
  },
};

export function registerBlitz(): void {
  registerEffectHandler(blitzHandler);
}

// Auto-register on module import
registerBlitz();
