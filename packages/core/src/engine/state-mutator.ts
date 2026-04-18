import { GAME_CONSTANTS } from '@king-card/shared';
import type {
  GameState,
  Card,
  CardInstance,
  Buff,
  ActiveStratagem,
  TargetRef,
  GameEvent,
  EngineErrorCode,
  StateMutator,
  SummonMinionResult,
  Keyword,
  EffectContext,
} from '@king-card/shared';
import { createCardInstance } from '../models/card-instance.js';
import { DefaultRNG } from './rng.js';
import { resolveEffects } from '../cards/effects/index.js';
import { IdCounter } from './id-counter.js';

// ─── Helpers ─────────────────────────────────────────────────────

function findMinion(state: GameState, instanceId: string): CardInstance | undefined {
  for (const player of state.players) {
    const minion = player.battlefield.find((m) => m.instanceId === instanceId);
    if (minion) return minion;
  }
  return undefined;
}

function emit(eventBus: { emit: (event: GameEvent) => void }, event: GameEvent): void {
  eventBus.emit(event);
}

// ─── Factory ─────────────────────────────────────────────────────

export function createStateMutator(
  state: GameState,
  eventBus: { emit: (event: GameEvent) => void },
  rng: EffectContext['rng'] = new DefaultRNG(),
  counter: IdCounter = new IdCounter(),
): StateMutator {
  return {
    // ── damage ────────────────────────────────────────────────────
    damage(target: TargetRef, amount: number): EngineErrorCode | null {
      if (target.type === 'HERO') {
        const player = state.players[target.playerIndex];
        let remaining = amount;

        // Armor absorbs damage first
        if (player.hero.armor > 0) {
          if (player.hero.armor >= remaining) {
            player.hero.armor -= remaining;
            remaining = 0;
          } else {
            remaining -= player.hero.armor;
            player.hero.armor = 0;
          }
        }

        // Remaining damage goes to health
        player.hero.health -= remaining;

        emit(eventBus, { type: 'HERO_DAMAGED', playerIndex: target.playerIndex, amount });
        emit(eventBus, { type: 'DAMAGE_DEALT', target, amount });
        return null;
      }

      // MINION
      const minion = findMinion(state, target.instanceId);
      if (!minion) return 'INVALID_TARGET';

      minion.currentHealth -= amount;

      emit(eventBus, { type: 'DAMAGE_DEALT', target, amount });

      if (minion.currentHealth <= 0) {
        // destroyMinion is called internally via the mutator itself
        const destroyResult = createStateMutator(state, eventBus, rng, counter).destroyMinion(target.instanceId);
        return destroyResult;
      }

      return null;
    },

    // ── heal ──────────────────────────────────────────────────────
    heal(target: TargetRef, amount: number): EngineErrorCode | null {
      if (target.type === 'HERO') {
        const player = state.players[target.playerIndex];
        const before = player.hero.health;
        player.hero.health = Math.min(player.hero.health + amount, player.hero.maxHealth);
        const healed = player.hero.health - before;

        emit(eventBus, { type: 'HERO_HEALED', playerIndex: target.playerIndex, amount: healed });
        emit(eventBus, { type: 'HEAL_APPLIED', target, amount: healed });
        return null;
      }

      // MINION
      const minion = findMinion(state, target.instanceId);
      if (!minion) return 'INVALID_TARGET';

      const before = minion.currentHealth;
      minion.currentHealth = Math.min(minion.currentHealth + amount, minion.currentMaxHealth);
      const healed = minion.currentHealth - before;

      emit(eventBus, { type: 'HEAL_APPLIED', target, amount: healed });
      return null;
    },

    // ── drawCards ─────────────────────────────────────────────────
    drawCards(playerIndex: number, count: number): EngineErrorCode | null {
      const player = state.players[playerIndex];
      if (!player) return 'INVALID_TARGET';

      // Check draw lock
      if (player.cannotDrawNextTurn) {
        emit(eventBus, { type: 'DRAW_LOCKED', playerIndex });
        player.cannotDrawNextTurn = false;
        return null;
      }

      for (let i = 0; i < count; i++) {
        if (player.deck.length === 0) {
          // Deck empty: game over
          state.isGameOver = true;
          state.winnerIndex = playerIndex === 0 ? 1 : 0;
          state.winReason = 'DECK_EMPTY';
          emit(eventBus, { type: 'DECK_EMPTY', playerIndex });
          emit(eventBus, { type: 'GAME_OVER', winnerIndex: state.winnerIndex, reason: 'DECK_EMPTY' });
          return null;
        }

        const card = player.deck.shift()!;

        if (player.hand.length >= player.handLimit) {
          // Hand full: discard the drawn card
          player.graveyard.push(card);
          emit(eventBus, { type: 'CARD_DISCARDED', playerIndex, card });
        } else {
          player.hand.push(card);
          emit(eventBus, { type: 'CARD_DRAWN', playerIndex, card });
        }
      }

      return null;
    },

    // ── addCardToHand ─────────────────────────────────────────────
    addCardToHand(playerIndex: number, card: Card): EngineErrorCode | null {
      const player = state.players[playerIndex];
      if (!player) return 'INVALID_TARGET';

      const copy: Card = { ...card };

      if (player.hand.length >= player.handLimit) {
        player.graveyard.push(copy);
        emit(eventBus, { type: 'CARD_DISCARDED', playerIndex, card: copy });
      } else {
        player.hand.push(copy);
        emit(eventBus, { type: 'CARD_DRAWN', playerIndex, card: copy });
      }

      return null;
    },

    // ── discardCard ───────────────────────────────────────────────
    discardCard(playerIndex: number, handIndex: number): EngineErrorCode | null {
      const player = state.players[playerIndex];
      if (!player) return 'INVALID_TARGET';
      if (handIndex < 0 || handIndex >= player.hand.length) return 'CARD_NOT_IN_HAND';

      const card = player.hand.splice(handIndex, 1)[0];
      player.graveyard.push(card);

      emit(eventBus, { type: 'CARD_DISCARDED', playerIndex, card });
      return null;
    },

    // ── summonMinion ──────────────────────────────────────────────
    summonMinion(card: Card, ownerIndex: number, position?: number): SummonMinionResult {
      const player = state.players[ownerIndex];
      if (!player) return { instance: null, error: 'INVALID_TARGET' };

      if (player.battlefield.length >= GAME_CONSTANTS.MAX_BOARD_SIZE) return { instance: null, error: 'BOARD_FULL' };

      const instance = createCardInstance(card, ownerIndex as 0 | 1, counter);
      instance.position = position ?? player.battlefield.length;

      if (position !== undefined) {
        player.battlefield.splice(position, 0, instance);
      } else {
        player.battlefield.push(instance);
      }

      // Update positions for all minions on the battlefield
      player.battlefield.forEach((m, idx) => {
        m.position = idx;
      });

      emit(eventBus, { type: 'MINION_SUMMONED', instance });
      return { instance, error: null };
    },

    // ── destroyMinion ─────────────────────────────────────────────
    destroyMinion(instanceId: string): EngineErrorCode | null {
      for (const player of state.players) {
        const idx = player.battlefield.findIndex((m) => m.instanceId === instanceId);
        if (idx !== -1) {
          const [minion] = player.battlefield.splice(idx, 1);

          const effectCtx: EffectContext = {
            state,
            mutator: createStateMutator(state, eventBus, rng, counter),
            source: minion,
            playerIndex: minion.ownerIndex,
            eventBus: {
              emit: (event: unknown) => eventBus.emit(event as GameEvent),
              on: () => () => {},
              removeAllListeners: () => {},
            },
            rng,
            counter,
          };

          resolveEffects('ON_DEATH', effectCtx);
          player.graveyard.push(minion.card);

          // Update positions
          player.battlefield.forEach((m, i) => {
            m.position = i;
          });

          emit(eventBus, { type: 'MINION_DESTROYED', instance: minion });
          return null;
        }
      }
      return 'INVALID_TARGET';
    },

    // ── modifyStat ────────────────────────────────────────────────
    modifyStat(target: TargetRef, stat: 'attack' | 'health', delta: number): EngineErrorCode | null {
      if (target.type !== 'MINION') return 'INVALID_TARGET';
      const minion = findMinion(state, target.instanceId);
      if (!minion) return 'INVALID_TARGET';

      if (stat === 'attack') {
        minion.currentAttack += delta;
      } else {
        minion.currentHealth += delta;
        // If health increased and exceeds currentMaxHealth, update max
        if (delta > 0 && minion.currentHealth > minion.currentMaxHealth) {
          minion.currentMaxHealth = minion.currentHealth;
        }
        // If health dropped to 0 or below, destroy the minion
        if (minion.currentHealth <= 0) {
          createStateMutator(state, eventBus, rng, counter).destroyMinion(minion.instanceId);
        }
      }

      return null;
    },

    // ── applyBuff ─────────────────────────────────────────────────
    applyBuff(target: TargetRef, buff: Buff): EngineErrorCode | null {
      if (target.type !== 'MINION') return 'INVALID_TARGET';
      const minion = findMinion(state, target.instanceId);
      if (!minion) return 'INVALID_TARGET';

      minion.buffs.push(buff);

      minion.currentAttack += buff.attackBonus;
      minion.currentMaxHealth += buff.maxHealthBonus;
      minion.currentHealth += buff.healthBonus;

      // Add keywords, avoiding duplicates
      for (const kw of buff.keywordsGranted) {
        if (!minion.card.keywords.includes(kw)) {
          minion.card.keywords = [...minion.card.keywords, kw as Keyword];
        }
      }

      emit(eventBus, { type: 'BUFF_APPLIED', target: minion, buff });
      return null;
    },

    // ── removeBuff ────────────────────────────────────────────────
    removeBuff(target: TargetRef, buffId: string): EngineErrorCode | null {
      if (target.type !== 'MINION') return 'INVALID_TARGET';
      const minion = findMinion(state, target.instanceId);
      if (!minion) return 'INVALID_TARGET';

      const idx = minion.buffs.findIndex((b) => b.id === buffId);
      if (idx === -1) return 'INVALID_TARGET';

      const [removed] = minion.buffs.splice(idx, 1);

      // Reverse stat changes
      minion.currentAttack -= removed.attackBonus;
      minion.currentMaxHealth -= removed.maxHealthBonus;
      minion.currentHealth -= removed.healthBonus;
      if (minion.currentHealth > minion.currentMaxHealth) {
        minion.currentHealth = minion.currentMaxHealth;
      }

      // Remove granted keywords
      for (const kw of removed.keywordsGranted) {
        const grantedByBaseCard = minion.baseKeywords?.includes(kw) ?? false;
        const grantedByRemainingBuff = minion.buffs.some((buff) => buff.keywordsGranted.includes(kw));

        if (!grantedByBaseCard && !grantedByRemainingBuff) {
          minion.card.keywords = minion.card.keywords.filter((k) => k !== kw);
        }
      }

      emit(eventBus, { type: 'BUFF_REMOVED', target: minion, buff: removed });

      if (minion.currentHealth <= 0) {
        return createStateMutator(state, eventBus, rng, counter).destroyMinion(target.instanceId);
      }

      return null;
    },

    // ── gainArmor ─────────────────────────────────────────────────
    gainArmor(playerIndex: number, amount: number): EngineErrorCode | null {
      const player = state.players[playerIndex];
      if (!player) return 'INVALID_TARGET';

      player.hero.armor += amount;

      // Note: ARMOR_CHANGED is not a defined event in the shared events.ts.
      // We emit HERO_DAMAGED-equivalent is not appropriate. No event matches.
      // The spec says "emit ARMOR_CHANGED" but shared only has ENERGY_GAINED/SPENT, etc.
      // For now we skip emitting an event since there's no matching event type.
      return null;
    },

    // ── spendEnergy ───────────────────────────────────────────────
    spendEnergy(playerIndex: number, amount: number): EngineErrorCode | null {
      const player = state.players[playerIndex];
      if (!player) return 'INVALID_TARGET';

      player.energyCrystal -= amount;

      emit(eventBus, {
        type: 'ENERGY_SPENT',
        playerIndex,
        amount,
        remainingEnergy: player.energyCrystal,
      });
      return null;
    },

    // ── activateStratagem ─────────────────────────────────────────
    activateStratagem(card: Card, ownerIndex: number): EngineErrorCode | null {
      const player = state.players[ownerIndex];
      if (!player) return 'INVALID_TARGET';

      const stratagem: ActiveStratagem = {
        card,
        instanceId: counter.nextStratagemId(),
        ownerIndex,
        remainingTurns: 2, // Default: lasts 2 turns
        appliedEffects: [],
      };

      player.activeStratagems.push(stratagem);

      emit(eventBus, { type: 'STRATAGEM_ACTIVATED', stratagem });
      return null;
    },

    // ── setDrawLock ───────────────────────────────────────────────
    setDrawLock(playerIndex: number, locked: boolean): EngineErrorCode | null {
      const player = state.players[playerIndex];
      if (!player) return 'INVALID_TARGET';

      player.cannotDrawNextTurn = locked;
      return null;
    },

    // ── grantExtraAttack ──────────────────────────────────────────
    grantExtraAttack(instanceId: string): EngineErrorCode | null {
      const minion = findMinion(state, instanceId);
      if (!minion) return 'INVALID_TARGET';

      minion.remainingAttacks += 1;
      return null;
    },
  };
}
