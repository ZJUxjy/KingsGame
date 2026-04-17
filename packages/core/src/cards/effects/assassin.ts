import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * ASSASSIN keyword handler.
 *
 * After killing a minion, the ASSASSIN can make one extra attack
 * targeting the hero.
 */
const assassinHandler: EffectHandler = {
  keyword: 'ASSASSIN',

  onKill(ctx) {
    const { source } = ctx;
    if (!source.card.keywords.includes('ASSASSIN')) return [];
    // Grant one extra attack after killing a minion
    ctx.mutator.grantExtraAttack(source.instanceId);
    return [];
  },
};

export function registerAssassin(): void {
  registerEffectHandler(assassinHandler);
}

// Auto-register on module import
registerAssassin();
