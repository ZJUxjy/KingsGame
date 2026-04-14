import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * GARRISON keyword handler.
 *
 * At the start of each turn, grants stat bonuses to minions
 * whose garrisonTurns has reached 0 (countdown managed by game-loop.ts).
 *
 * Note: game-loop.ts handles the garrisonTurns countdown (decrementing
 * each upkeep phase). This handler only applies the buff when
 * garrisonTurns === 0 to avoid duplicating the countdown logic.
 */
const garrisonHandler: EffectHandler = {
  keyword: 'GARRISON',

  onTurnStart(ctx) {
    const { mutator, state, playerIndex } = ctx;

    const player = state.players[playerIndex];

    for (const minion of player.battlefield) {
      // Only trigger for minions that have the GARRISON keyword
      // and whose garrisonTurns have just reached 0
      if (
        minion.card.keywords.includes('GARRISON') &&
        minion.garrisonTurns === 0
      ) {
        // Find effect params for stat bonuses
        const effect = minion.card.effects.find(
          (e) => e.type === 'GARRISON' || e.trigger === 'ON_TURN_START',
        );
        const params = effect?.params ?? {};
        const attackBonus = (params.garrisonAttackBonus as number) ?? 2;
        const healthBonus = (params.garrisonHealthBonus as number) ?? 2;

        mutator.modifyStat(
          { type: 'MINION', instanceId: minion.instanceId },
          'attack',
          attackBonus,
        );
        mutator.modifyStat(
          { type: 'MINION', instanceId: minion.instanceId },
          'health',
          healthBonus,
        );
      }
    }

    return [];
  },
};

export function registerGarrison(): void {
  registerEffectHandler(garrisonHandler);
}

// Auto-register on module import
registerGarrison();
