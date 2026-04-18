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

    // Note: Player.deck is currently typed Card[] (Task 12 will refine);
    // each element is a plain Card here per game-engine.create's deck overwrite.
    const spells = player.deck.filter(
      (c) => c.civilization === civ && (c.type === 'SORCERY' || c.type === 'STRATAGEM'),
    );

    if (spells.length === 0) return [];

    const randomSpell = rng.pick(spells);
    mutator.addCardToHand(playerIndex, randomSpell);

    return [];
  },
};

export function registerResearch(): void {
  registerEffectHandler(researchHandler);
}

registerResearch();
