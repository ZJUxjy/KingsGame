import type {
  AppliedEffect,
  Buff,
  Card,
  CardEffect,
  CardInstance,
  EffectContext,
} from '@king-card/shared';
import { CHINA_ALL_CARDS } from '../definitions/index.js';

let buffCounter = 0;

function findCardById(cardId: string): Card | undefined {
  return CHINA_ALL_CARDS.find((card) => card.id === cardId);
}

function getOpponentIndex(playerIndex: number): 0 | 1 {
  return (1 - playerIndex) as 0 | 1;
}

function getNumericParam(params: Record<string, unknown>, key: string, fallback = 0): number {
  const value = params[key];
  return typeof value === 'number' ? value : fallback;
}

function resolveTargetPlayerIndex(
  params: Record<string, unknown>,
  playerIndex: number,
): number {
  const targetPlayer = params.targetPlayer;
  if (targetPlayer === 'OPPONENT') {
    return getOpponentIndex(playerIndex);
  }

  return playerIndex;
}

function findSourceOnBattlefield(ctx: EffectContext): CardInstance | undefined {
  return ctx.state.players[ctx.playerIndex].battlefield.find(
    (minion) => minion.instanceId === ctx.source.instanceId,
  );
}

function findMinionByInstanceId(
  ctx: EffectContext,
  instanceId: string,
): CardInstance | undefined {
  for (const player of ctx.state.players) {
    const minion = player.battlefield.find((candidate) => candidate.instanceId === instanceId);
    if (minion) {
      return minion;
    }
  }

  return undefined;
}

function resolveMinionTargets(
  ctx: EffectContext,
  params: Record<string, unknown>,
): CardInstance[] {
  const targetFilter = params.targetFilter;
  const player = ctx.state.players[ctx.playerIndex];
  const opponent = ctx.state.players[getOpponentIndex(ctx.playerIndex)];

  switch (targetFilter) {
    case 'ALL_FRIENDLY_MINIONS':
      return [...player.battlefield];
    case 'ALL_ENEMY_MINIONS':
      return [...opponent.battlefield];
    case 'RANDOM_FRIENDLY_MINION':
      return [...player.battlefield];
    case 'RANDOM_ENEMY_MINION':
      return [...opponent.battlefield];
    default: {
      const source = findSourceOnBattlefield(ctx);
      return source ? [source] : [];
    }
  }
}

function createBuff(effect: CardEffect, source: CardInstance): Buff {
  const attackBonus = getNumericParam(effect.params, 'attackBonus', getNumericParam(effect.params, 'attackDelta'));
  const healthBonus = getNumericParam(effect.params, 'healthBonus');
  const maxHealthBonus = getNumericParam(effect.params, 'maxHealthBonus', healthBonus);

  return {
    id: `buff_${++buffCounter}`,
    sourceInstanceId: source.instanceId,
    sourceCardId: source.card.id,
    attackBonus,
    healthBonus,
    maxHealthBonus,
    remainingTurns: typeof effect.params.remainingTurns === 'number'
      ? effect.params.remainingTurns
      : undefined,
    keywordsGranted: Array.isArray(effect.params.keywordsGranted)
      ? effect.params.keywordsGranted.filter((keyword): keyword is Buff['keywordsGranted'][number] => typeof keyword === 'string')
      : [],
    type: effect.params.type === 'AURA' || effect.params.type === 'PERMANENT'
      ? effect.params.type
      : 'TEMPORARY',
  };
}

function resolveSummonCard(effect: CardEffect, ctx: EffectContext): Card | undefined {
  const { cardId, cloneOfInstanceId } = effect.params;

  if (typeof cardId === 'string') {
    return findCardById(cardId);
  }

  let cloneSource: CardInstance | undefined;
  if (cloneOfInstanceId === 'TARGET') {
    cloneSource = ctx.target;
  } else if (typeof cloneOfInstanceId === 'string') {
    cloneSource = findMinionByInstanceId(ctx, cloneOfInstanceId);
  }

  if (!cloneSource) {
    return undefined;
  }

  return {
    ...cloneSource.card,
    attack: 1,
    health: 1,
  };
}

function applySummonEffect(effect: CardEffect, ctx: EffectContext): void {
  const count = getNumericParam(effect.params, 'count', 1);
  const card = resolveSummonCard(effect, ctx);
  if (!card) {
    return;
  }

  for (let index = 0; index < count; index += 1) {
    ctx.mutator.summonMinion(card, ctx.playerIndex);
  }
}

function applyModifyStatEffect(effect: CardEffect, ctx: EffectContext): void {
  const targets = resolveMinionTargets(ctx, effect.params);
  const attackDelta = getNumericParam(effect.params, 'attackDelta');
  const healthDelta = getNumericParam(effect.params, 'healthDelta');

  for (const target of targets) {
    if (attackDelta !== 0) {
      ctx.mutator.modifyStat({ type: 'MINION', instanceId: target.instanceId }, 'attack', attackDelta);
    }

    if (healthDelta !== 0) {
      ctx.mutator.modifyStat({ type: 'MINION', instanceId: target.instanceId }, 'health', healthDelta);
    }
  }
}

function applyBuffEffect(effect: CardEffect, ctx: EffectContext): void {
  const targets = resolveMinionTargets(ctx, effect.params);
  const buff = createBuff(effect, ctx.source);

  for (const target of targets) {
    ctx.mutator.applyBuff({ type: 'MINION', instanceId: target.instanceId }, buff);
  }
}

function applyRandomDestroyEffect(effect: CardEffect, ctx: EffectContext): void {
  const targets = resolveMinionTargets(ctx, effect.params);
  if (targets.length === 0) {
    return;
  }

  const target = ctx.rng.pick(targets);
  ctx.mutator.destroyMinion(target.instanceId);
}

function applyRandomDiscardEffect(effect: CardEffect, ctx: EffectContext): void {
  const targetPlayerIndex = resolveTargetPlayerIndex(effect.params, ctx.playerIndex);
  const count = getNumericParam(effect.params, 'count', 1);

  for (let index = 0; index < count; index += 1) {
    const hand = ctx.state.players[targetPlayerIndex].hand;
    if (hand.length === 0) {
      return;
    }

    const handIndex = ctx.rng.nextInt(0, hand.length - 1);
    ctx.mutator.discardCard(targetPlayerIndex, handIndex);
  }
}

function applySetDrawLockEffect(effect: CardEffect, ctx: EffectContext): void {
  const targetPlayerIndex = resolveTargetPlayerIndex(effect.params, ctx.playerIndex);
  const locked = typeof effect.params.locked === 'boolean' ? effect.params.locked : true;

  ctx.mutator.setDrawLock(targetPlayerIndex, locked);
}

function applyActivateStratagemEffect(effect: CardEffect, ctx: EffectContext): void {
  ctx.mutator.activateStratagem(ctx.source.card, ctx.playerIndex);

  const player = ctx.state.players[ctx.playerIndex];
  const activeStratagem = player.activeStratagems[player.activeStratagems.length - 1];
  if (!activeStratagem || activeStratagem.card.id !== ctx.source.card.id) {
    return;
  }

  if (typeof effect.params.duration === 'number') {
    activeStratagem.remainingTurns = effect.params.duration;
  }

  if (Array.isArray(effect.params.appliedEffects)) {
    activeStratagem.appliedEffects = effect.params.appliedEffects as AppliedEffect[];
  }
}

function applyGarrisonMarkEffect(effect: CardEffect, ctx: EffectContext): void {
  const targets = resolveMinionTargets(ctx, effect.params);
  const garrisonTurns = getNumericParam(effect.params, 'garrisonTurns', 0);

  for (const target of targets) {
    target.garrisonTurns = garrisonTurns;
    ctx.eventBus.emit({
      type: 'MINION_ENTERED_GARRISON',
      instance: target,
      turns: garrisonTurns,
    });
  }
}

export function executeCardEffects(trigger: CardEffect['trigger'], ctx: EffectContext): void {
  const effects = ctx.source.card.effects.filter((effect) => effect.trigger === trigger);

  for (const effect of effects) {
    switch (effect.type) {
      case 'DRAW':
        ctx.mutator.drawCards(ctx.playerIndex, getNumericParam(effect.params, 'count', 1));
        break;
      case 'HEAL':
        if (effect.params.target === 'HERO') {
          ctx.mutator.heal({ type: 'HERO', playerIndex: ctx.playerIndex }, getNumericParam(effect.params, 'amount'));
        }
        break;
      case 'SUMMON':
        applySummonEffect(effect, ctx);
        break;
      case 'MODIFY_STAT':
        applyModifyStatEffect(effect, ctx);
        break;
      case 'APPLY_BUFF':
        applyBuffEffect(effect, ctx);
        break;
      case 'RANDOM_DESTROY':
        applyRandomDestroyEffect(effect, ctx);
        break;
      case 'RANDOM_DISCARD':
        applyRandomDiscardEffect(effect, ctx);
        break;
      case 'SET_DRAW_LOCK':
        applySetDrawLockEffect(effect, ctx);
        break;
      case 'ACTIVATE_STRATAGEM':
        applyActivateStratagemEffect(effect, ctx);
        break;
      case 'GARRISON_MARK':
        applyGarrisonMarkEffect(effect, ctx);
        break;
      default:
        break;
    }
  }
}