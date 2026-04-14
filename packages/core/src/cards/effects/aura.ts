import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * AURA keyword handler.
 *
 * When a minion with AURA is played, it grants temporary buffs
 * to all minions matching the aura scope.
 *
 * Phase 1 simplification: buff persists after the aura source leaves
 * the battlefield (no removal tracking).
 */
const auraHandler: EffectHandler = {
  keyword: 'AURA',

  onPlay(ctx) {
    const { source, mutator, state, playerIndex } = ctx;

    if (!source.card.keywords.includes('AURA')) {
      return [];
    }

    // Find the effect params for aura
    const effect = source.card.effects.find(
      (e) => e.type === 'AURA' || e.trigger === 'ON_PLAY',
    );
    const params = effect?.params ?? {};
    const scope = (params.auraScope as string) ?? 'ALL_FRIENDLY';
    const attackBonus = (params.auraAttackBonus as number) ?? 1;
    const healthBonus = (params.auraHealthBonus as number) ?? 1;

    // Collect targets based on aura scope
    const targets = getAuraTargets(scope, source, state, playerIndex);

    for (const target of targets) {
      const buffId = `aura_${source.instanceId}_${target.instanceId}`;
      mutator.applyBuff(
        { type: 'MINION', instanceId: target.instanceId },
        {
          id: buffId,
          sourceInstanceId: source.instanceId,
          sourceCardId: source.card.id,
          attackBonus,
          healthBonus,
          maxHealthBonus: healthBonus,
          keywordsGranted: [],
          type: 'AURA',
        },
      );
    }

    return [];
  },
};

function getAuraTargets(
  scope: string,
  source: { instanceId: string; ownerIndex: number },
  state: { players: { battlefield: Array<{ instanceId: string; ownerIndex: number }> }[] },
  playerIndex: number,
) {
  switch (scope) {
    case 'ALL_FRIENDLY': {
      return state.players[playerIndex].battlefield;
    }
    case 'ALL_ENEMY': {
      const enemyIndex = playerIndex === 0 ? 1 : 0;
      return state.players[enemyIndex].battlefield;
    }
    case 'ADJACENT': {
      const battlefield = state.players[playerIndex].battlefield;
      const sourceIdx = battlefield.findIndex(
        (m) => m.instanceId === source.instanceId,
      );
      if (sourceIdx === -1) return [];
      const adjacent: typeof battlefield = [];
      if (sourceIdx > 0) adjacent.push(battlefield[sourceIdx - 1]);
      if (sourceIdx < battlefield.length - 1) adjacent.push(battlefield[sourceIdx + 1]);
      return adjacent;
    }
    case 'SELF': {
      const battlefield = state.players[playerIndex].battlefield;
      return battlefield.filter(
        (m) => m.instanceId === source.instanceId,
      );
    }
    default:
      return [];
  }
}

export function registerAura(): void {
  registerEffectHandler(auraHandler);
}

// Auto-register on module import
registerAura();
