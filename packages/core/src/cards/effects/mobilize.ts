import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * MOBILIZE keyword handler.
 *
 * When a minion with MOBILIZE is played, if the controlling player
 * has >= mobilizeThreshold friendly minions on the battlefield,
 * the minion gains attack and health bonuses.
 */
const mobilizeHandler: EffectHandler = {
  keyword: 'MOBILIZE',

  onPlay(ctx) {
    const { source, mutator, state, playerIndex } = ctx;

    if (!source.card.keywords.includes('MOBILIZE')) {
      return [];
    }

    // Find the effect params for mobilize
    const effect = source.card.effects.find(
      (e) => e.type === 'MOBILIZE' || e.trigger === 'ON_PLAY',
    );
    const params = effect?.params ?? {};
    const threshold = (params.mobilizeThreshold as number) ?? 2;
    const attackBonus = (params.mobilizeAttackBonus as number) ?? 1;
    const healthBonus = (params.mobilizeHealthBonus as number) ?? 1;

    const player = state.players[playerIndex];
    const friendlyMinionCount = player.battlefield.length;

    if (friendlyMinionCount >= threshold) {
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
    }

    return [];
  },
};

export function registerMobilize(): void {
  registerEffectHandler(mobilizeHandler);
}

// Auto-register on module import
registerMobilize();
