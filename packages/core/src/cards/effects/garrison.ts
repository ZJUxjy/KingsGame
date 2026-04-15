import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * GARRISON keyword handler.
 *
 * At the start of each turn, grants stat bonuses to the current
 * source minion when its garrison countdown has completed.
 *
 * Note: game-loop.ts handles the garrisonTurns countdown (decrementing
 * each upkeep phase) and iterates battlefield minions individually.
 * This handler must therefore operate only on ctx.source to avoid
 * re-applying the buff once per other friendly minion.
 */
const garrisonHandler: EffectHandler = {
  keyword: 'GARRISON',

  onTurnStart(ctx) {
    const { mutator, source } = ctx;

    if (!source.card.keywords.includes('GARRISON') || source.garrisonTurns !== 0) {
      return [];
    }

    const effect = source.card.effects.find((candidate) => candidate.type === 'GARRISON');
    const params = effect?.params ?? {};
    const attackBonus = (params.garrisonAttackBonus as number) ?? 2;
    const healthBonus = (params.garrisonHealthBonus as number) ?? 2;

    mutator.modifyStat(
      { type: 'MINION', instanceId: source.instanceId },
      'attack',
      attackBonus,
    );
    mutator.modifyStat(
      { type: 'MINION', instanceId: source.instanceId },
      'health',
      healthBonus,
    );

    return [];
  },
};

export function registerGarrison(): void {
  registerEffectHandler(garrisonHandler);
}

// Auto-register on module import
registerGarrison();
