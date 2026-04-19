import type { Card, EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * REBORN keyword handler.
 *
 * When a minion with REBORN dies, it is summoned back at 1 HP with the
 * REBORN keyword removed (preventing infinite revival). Buffs and damage
 * are reset — the revived minion uses the card's base attack and a fresh
 * 1-HP body, just like Hearthstone's Reborn.
 *
 * Co-exists with DEATHRATTLE: deathrattle resolves first because it is
 * registered earlier in effects/index.ts (deathrattle.js is imported above
 * reborn.js), then this revival runs.
 */
const rebornHandler: EffectHandler = {
  keyword: 'REBORN',
  onDeath(ctx) {
    const { source, mutator, playerIndex } = ctx;
    if (!source.card.keywords.includes('REBORN')) return [];

    // Use baseKeywords (snapshot taken in createCardInstance) so buff-granted
    // keywords like WINDFURY do not leak into the revived body. Falls back to
    // the live keywords array only for hand-built test fixtures that omit the
    // optional baseKeywords field.
    const baseKeywords = source.baseKeywords ?? source.card.keywords;
    const revivedCard: Card = {
      ...source.card,
      keywords: baseKeywords.filter((k) => k !== 'REBORN'),
      health: 1,
    };

    mutator.summonMinion(revivedCard, playerIndex, source.position);
    return [];
  },
};

registerEffectHandler(rebornHandler);
