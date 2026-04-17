import { useMemo } from 'react';
import type { ValidAction } from '@king-card/shared';

export interface DerivedActionSets {
  validPlayIndices: Set<number>;
  validAttackerIds: Set<string>;
  attackTargetIds: Set<string>;
  canUseHeroSkill: boolean;
  canUseMinisterSkill: boolean;
  validSwitchMinisters: Set<number>;
  canAttackHero: boolean;
  availableGeneralSkillKeys: Set<string>;
}

export function deriveSets(
  validActions: ValidAction[],
  selectedAttacker: string | null,
): DerivedActionSets {
  const playIndices = new Set<number>();
  const attackerIds = new Set<string>();
  const targetIds = new Set<string>();
  let heroSkill = false;
  let ministerSkill = false;
  const switchIndices = new Set<number>();
  let attackHero = false;
  const generalSkillKeys = new Set<string>();

  for (const action of validActions) {
    switch (action.type) {
      case 'PLAY_CARD':
        playIndices.add(action.handIndex);
        break;
      case 'ATTACK':
        attackerIds.add(action.attackerInstanceId);
        if (selectedAttacker && action.attackerInstanceId === selectedAttacker) {
          const tid = action.targetInstanceId;
          if (tid === 'HERO') {
            attackHero = true;
          } else {
            targetIds.add(tid);
          }
        }
        break;
      case 'USE_HERO_SKILL':
        heroSkill = true;
        break;
      case 'USE_MINISTER_SKILL':
        ministerSkill = true;
        break;
      case 'USE_GENERAL_SKILL':
        generalSkillKeys.add(`${action.instanceId}:${action.skillIndex}`);
        break;
      case 'SWITCH_MINISTER':
        switchIndices.add(action.ministerIndex);
        break;
    }
  }

  return {
    validPlayIndices: playIndices,
    validAttackerIds: attackerIds,
    attackTargetIds: targetIds,
    canUseHeroSkill: heroSkill,
    canUseMinisterSkill: ministerSkill,
    validSwitchMinisters: switchIndices,
    canAttackHero: attackHero,
    availableGeneralSkillKeys: generalSkillKeys,
  };
}

export function useDerivedActions(
  validActions: ValidAction[],
  selectedAttacker: string | null,
): DerivedActionSets {
  return useMemo(
    () => deriveSets(validActions, selectedAttacker),
    [validActions, selectedAttacker],
  );
}
