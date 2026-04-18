import type { Card, Player } from './engine-types.js';

/**
 * Compute the effective playable cost of a card for a given player.
 *
 * Applies (in order):
 *   1. Each matching modifier in player.costModifiers
 *   2. Subtracts player.costReduction
 *   3. Floors at 0
 *
 * Used by both the engine (validating play actions / deducting cost)
 * and the server serializer (showing the player a consistent cost).
 */
export function getEffectiveCardCost(player: Player, card: Card): number {
  const modified = player.costModifiers.reduce(
    (cost, modifier) => (modifier.condition(card) ? modifier.modifier(cost) : cost),
    card.cost,
  );
  return Math.max(0, modified - player.costReduction);
}
