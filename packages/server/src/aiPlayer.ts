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

  // 2. Attack with all minions that can attack.
  // Re-fetch valid actions between iterations: a previous attack may have
  // killed the target (or the attacker), invalidating later entries in a
  // stale snapshot. Without this, the engine would silently reject the
  // follow-up attacks with INVALID_TARGET.
  while (true) {
    if (isGameOver(engine)) return;
    const fresh = engine.getValidActions(playerIndex);
    const next = fresh.find(
      (a): a is Extract<ValidAction, { type: 'ATTACK' }> => a.type === 'ATTACK',
    );
    if (!next) break;

    const target = convertTargetInstanceId(next.targetInstanceId, playerIndex);
    engine.attack(next.attackerInstanceId, target);
    await delay(AI_ACTION_DELAY);
  }

  // 3. Use hero skill if available
  actions = engine.getValidActions(playerIndex);
  const heroSkillAction = actions.find(
    (action): action is Extract<ValidAction, { type: 'USE_HERO_SKILL' }> => action.type === 'USE_HERO_SKILL',
  );
  if (heroSkillAction) {
    if (isGameOver(engine)) return;
    engine.useHeroSkill(playerIndex, heroSkillAction.target);
    await delay(AI_ACTION_DELAY);
  }

  // 4. Use minister skill if available
  actions = engine.getValidActions(playerIndex);
  const ministerSkillAction = actions.find(
    (action): action is Extract<ValidAction, { type: 'USE_MINISTER_SKILL' }> => action.type === 'USE_MINISTER_SKILL',
  );
  if (ministerSkillAction) {
    if (isGameOver(engine)) return;
    engine.useMinisterSkill(playerIndex, ministerSkillAction.target);
    await delay(AI_ACTION_DELAY);
  }

  // 5. Use each available general skill once.
  actions = engine.getValidActions(playerIndex);
  const generalSkillActions = actions.filter(
    (action): action is Extract<ValidAction, { type: 'USE_GENERAL_SKILL' }> => action.type === 'USE_GENERAL_SKILL',
  );
  const usedSkills = new Set<string>();

  for (const action of generalSkillActions) {
    const skillKey = `${action.instanceId}:${action.skillIndex}`;
    if (usedSkills.has(skillKey)) {
      continue;
    }

    if (isGameOver(engine)) return;
    engine.useGeneralSkill(playerIndex, action.instanceId, action.skillIndex, action.target);
    usedSkills.add(skillKey);
    await delay(AI_ACTION_DELAY);
  }

  // 6. End turn
  if (isGameOver(engine)) return;
  engine.endTurn();
}
