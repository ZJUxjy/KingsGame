import type { EffectHandler, Buff } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * MOBILIZATION_ORDER keyword handler.
 *
 * At the start of each turn, if there are >=3 friendly minions on the
 * battlefield, all friendly minions get +1 attack for THIS TURN ONLY
 * (TEMPORARY buff with remainingTurns=1, expires at the next owner
 * turn start via expireTemporaryBuffs).
 *
 * Multiple MOBILIZATION_ORDER minions on the same side are deduped per
 * turn via a sourceInstanceId tag tied to the turn number, so the buff
 * is only applied once per turn regardless of how many MOBILIZATION_ORDER
 * minions are present.
 */
const mobilizationOrderHandler: EffectHandler = {
  keyword: 'MOBILIZATION_ORDER',

  onTurnStart(ctx) {
    const { source, state, mutator, playerIndex } = ctx;

    if (!source.card.keywords.includes('MOBILIZATION_ORDER')) return [];

    // Owner guard: only fire when the source belongs to the active player.
    // Defensive — game-loop currently only iterates the active player's
    // battlefield, but explicit guard avoids spurious cross-player triggers
    // if that contract changes.
    if (source.ownerIndex !== state.currentPlayerIndex) return [];

    const battlefield = state.players[playerIndex].battlefield;

    // Per-turn dedupe tag: if any minion already carries a buff with this
    // turn's tag, another MOBILIZATION_ORDER source already fired this turn.
    const tag = `mobilization_order_turn_${state.turnNumber}`;
    const alreadyApplied = battlefield.some((m) =>
      m.buffs.some((b) => b.sourceInstanceId === tag),
    );
    if (alreadyApplied) return [];

    if (battlefield.length < 3) return [];

    for (const minion of battlefield) {
      const buff: Buff = {
        id: ctx.counter.nextBuffId(),
        sourceInstanceId: tag,
        sourceCardId: source.card.id,
        attackBonus: 1,
        healthBonus: 0,
        maxHealthBonus: 0,
        keywordsGranted: [],
        type: 'TEMPORARY',
        remainingTurns: 1,
      };
      mutator.applyBuff(
        { type: 'MINION', instanceId: minion.instanceId },
        buff,
      );
    }

    return [];
  },
};

export function registerMobilizationOrder(): void {
  registerEffectHandler(mobilizationOrderHandler);
}

// Auto-register on module import
registerMobilizationOrder();
