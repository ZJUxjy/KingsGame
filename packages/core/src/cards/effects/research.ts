import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * RESEARCH keyword handler.
 *
 * When a card with RESEARCH is played, find a random same-civilization
 * sorcery or stratagem from the player's deck and add a copy to hand
 * via mutator.addCardToHand (respects handLimit, emits CARD_DRAWN /
 * CARD_DISCARDED).
 */
const researchHandler: EffectHandler = {
  keyword: 'RESEARCH',

  onPlay(ctx) {
    const { source, state, playerIndex, rng, mutator } = ctx;

    if (!source.card.keywords.includes('RESEARCH')) return [];

    const civ = source.card.civilization;
    const player = state.players[playerIndex];

    const spells = player.deck.filter(
      (inst) => inst.card.civilization === civ
        && (inst.card.type === 'SORCERY' || inst.card.type === 'STRATAGEM'),
    );

    if (spells.length === 0) return [];

    const randomSpell = rng.pick(spells);
    mutator.addCardToHand(playerIndex, randomSpell.card);

    return [];
  },
};

export function registerResearch(): void {
  registerEffectHandler(researchHandler);
}

registerResearch();
