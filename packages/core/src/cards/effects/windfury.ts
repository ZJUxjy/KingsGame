import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * WINDFURY keyword handler.
 *
 * Resolution lives in:
 *  - card-instance.createCardInstance: fresh-played CHARGE/RUSH/ASSASSIN+WINDFURY
 *    get remainingAttacks = 2 instead of 1 (so they can attack twice the same
 *    turn they arrive).
 *  - game-loop.resetMinionAttacksPerTurn: shared helper used by both turn-start
 *    reset (Phase 4a) and sleep-wake reset (Phase 3d) to give WINDFURY minions
 *    remainingAttacks = 2 each turn instead of 1.
 *
 * This handler exists for registry parity (matches TAUNT/CHARGE/DIVINE_SHIELD
 * pattern of placeholder + inline engine logic).
 */
const windfuryHandler: EffectHandler = {
  keyword: 'WINDFURY',
};

registerEffectHandler(windfuryHandler);
