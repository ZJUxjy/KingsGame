import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * RESEARCH keyword handler.
 *
 * When a card with RESEARCH is played, find a random same-civilization
 * sorcery or stratagem from the player's deck and add a copy to hand.
 */
const researchHandler: EffectHandler = {
  keyword: 'RESEARCH',

  onPlay(ctx) {
    const { source, state, playerIndex, rng } = ctx;

    if (!source.card.keywords.includes('RESEARCH')) return [];

    const civ = source.card.civilization;
    const player = state.players[playerIndex];

    // Find sorceries/stratagems from deck of same civilization
    const spells = player.deck.filter(
      (c) => c.civilization === civ && (c.type === 'SORCERY' || c.type === 'STRATAGEM'),
    );

    if (spells.length === 0) return [];

    const randomSpell = rng.pick(spells);

    // Add a copy to hand (shallow copy so original stays in deck)
    (player as any).hand.push({ ...randomSpell });

    return [];
  },
};

export function registerResearch(): void {
  registerEffectHandler(researchHandler);
}

// Auto-register on module import
registerResearch();
