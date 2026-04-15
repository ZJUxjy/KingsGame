import type { GameEngine } from '@king-card/core';
import type { ValidAction, TargetRef } from '@king-card/shared';

export const AI_PLAYER_INDEX = 1 as const;

const AI_ACTION_DELAY = 500;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function convertTargetInstanceId(targetInstanceId: string | 'HERO', playerIndex: number): TargetRef {
  if (targetInstanceId === 'HERO') {
    return { type: 'HERO', playerIndex: 1 - playerIndex };
  }
  return { type: 'MINION', instanceId: targetInstanceId };
}

function isGameOver(engine: GameEngine): boolean {
  return engine.getGameState().isGameOver;
}

export async function runAiTurn(engine: GameEngine, playerIndex: number): Promise<void> {
  // 1. Play cards (highest cost first)
  let actions = engine.getValidActions(playerIndex);
  const playCardActions = actions
    .filter((a): a is Extract<ValidAction, { type: 'PLAY_CARD' }> => a.type === 'PLAY_CARD')
    .sort((a, b) => {
      const state = engine.getGameState();
      const cardA = state.players[playerIndex].hand[a.handIndex];
      const cardB = state.players[playerIndex].hand[b.handIndex];
      return (cardB?.cost ?? 0) - (cardA?.cost ?? 0);
    });

  for (const action of playCardActions) {
    if (isGameOver(engine)) return;
    engine.playCard(playerIndex, action.handIndex);
    await delay(AI_ACTION_DELAY);
  }

  // 2. Attack with all minions that can attack
  actions = engine.getValidActions(playerIndex);
  const attackActions = actions.filter(
    (a): a is Extract<ValidAction, { type: 'ATTACK' }> => a.type === 'ATTACK',
  );

  for (const action of attackActions) {
    if (isGameOver(engine)) return;
    const target = convertTargetInstanceId(action.targetInstanceId, playerIndex);
    engine.attack(action.attackerInstanceId, target);
    await delay(AI_ACTION_DELAY);
  }

  // 3. Use hero skill if available
  actions = engine.getValidActions(playerIndex);
  if (actions.some(a => a.type === 'USE_HERO_SKILL')) {
    if (isGameOver(engine)) return;
    engine.useHeroSkill(playerIndex);
    await delay(AI_ACTION_DELAY);
  }

  // 4. End turn
  if (isGameOver(engine)) return;
  engine.endTurn();
}
