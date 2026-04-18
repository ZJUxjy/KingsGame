import type {
  GameState,
  Player,
} from '@king-card/shared';
import { getEffectiveCardCost } from '@king-card/shared';
import type { SerializedGameState, SerializedPlayer } from './types.js';

function serializePlayer(player: Player, hideHand: boolean): SerializedPlayer {
  const visibleHand = hideHand
    ? player.hand.map(() => ({ hidden: true as const }))
    : player.hand.map((card) => ({
      ...card,
      cost: getEffectiveCardCost(player, card),
    }));

  return {
    id: player.id,
    name: player.name,
    civilization: player.civilization,
    hero: player.hero,
    hand: visibleHand,
    battlefield: player.battlefield,
    energyCrystal: player.energyCrystal,
    maxEnergy: player.maxEnergy,
    deckCount: player.deck.length,
    activeMinisterIndex: player.activeMinisterIndex,
    ministerPool: player.ministerPool,
    activeStratagems: player.activeStratagems,
    cannotDrawNextTurn: player.cannotDrawNextTurn,
    boundCards: player.boundCards,
    graveyard: player.graveyard,
  };
  // Note: costModifiers is intentionally omitted (contains functions, not JSON-serializable)
}

export function serializeForPlayer(
  state: Readonly<GameState>,
  playerIndex: 0 | 1,
): SerializedGameState {
  const me = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];

  return {
    turnNumber: state.turnNumber,
    currentPlayerIndex: state.currentPlayerIndex,
    phase: state.phase,
    isGameOver: state.isGameOver,
    winnerIndex: state.winnerIndex,
    winReason: state.winReason,
    me: serializePlayer(me, false),
    opponent: serializePlayer(opponent, true),
  };
}
