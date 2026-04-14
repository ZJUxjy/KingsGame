import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * COMBO_STRIKE keyword handler.
 *
 * When a minion with COMBO_STRIKE kills another minion,
 * it gains an extra attack (remainingAttacks += 1).
 */
const comboStrikeHandler: EffectHandler = {
  keyword: 'COMBO_STRIKE',

  onKill(ctx) {
    const { source, mutator } = ctx;

    if (!source.card.keywords.includes('COMBO_STRIKE')) {
      return [];
    }

    mutator.grantExtraAttack(source.instanceId);

    return [];
  },
};

export function registerComboStrike(): void {
  registerEffectHandler(comboStrikeHandler);
}

// Auto-register on module import
registerComboStrike();
