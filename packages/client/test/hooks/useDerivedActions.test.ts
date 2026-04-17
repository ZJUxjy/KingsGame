import { describe, it, expect } from 'vitest';
import { deriveSets } from '../../src/hooks/useDerivedActions.js';
import type { ValidAction } from '@king-card/shared';

describe('deriveSets', () => {
  it('returns empty sets when validActions is empty', () => {
    const result = deriveSets([], null);
    expect(result.validPlayIndices.size).toBe(0);
    expect(result.validAttackerIds.size).toBe(0);
    expect(result.attackTargetIds.size).toBe(0);
    expect(result.canUseHeroSkill).toBe(false);
    expect(result.canUseMinisterSkill).toBe(false);
    expect(result.canAttackHero).toBe(false);
    expect(result.validSwitchMinisters.size).toBe(0);
    expect(result.availableGeneralSkillKeys.size).toBe(0);
  });

  it('collects PLAY_CARD hand indices', () => {
    const actions: ValidAction[] = [
      { type: 'PLAY_CARD', handIndex: 0 },
      { type: 'PLAY_CARD', handIndex: 2 },
    ];
    const result = deriveSets(actions, null);
    expect(result.validPlayIndices).toEqual(new Set([0, 2]));
  });

  it('collects ATTACK attacker IDs and target IDs for selected attacker', () => {
    const actions: ValidAction[] = [
      { type: 'ATTACK', attackerInstanceId: 'a1', targetInstanceId: 'e1' },
      { type: 'ATTACK', attackerInstanceId: 'a1', targetInstanceId: 'HERO' },
      { type: 'ATTACK', attackerInstanceId: 'a2', targetInstanceId: 'e1' },
    ];
    const result = deriveSets(actions, 'a1');
    expect(result.validAttackerIds).toEqual(new Set(['a1', 'a2']));
    expect(result.attackTargetIds).toEqual(new Set(['e1']));
    expect(result.canAttackHero).toBe(true);
  });

  it('detects hero skill, minister skill, general skill keys', () => {
    const actions: ValidAction[] = [
      { type: 'USE_HERO_SKILL' },
      { type: 'USE_MINISTER_SKILL' },
      { type: 'USE_GENERAL_SKILL', instanceId: 'g1', skillIndex: 0 },
      { type: 'USE_GENERAL_SKILL', instanceId: 'g1', skillIndex: 1 },
    ];
    const result = deriveSets(actions, null);
    expect(result.canUseHeroSkill).toBe(true);
    expect(result.canUseMinisterSkill).toBe(true);
    expect(result.availableGeneralSkillKeys).toEqual(new Set(['g1:0', 'g1:1']));
  });

  it('collects SWITCH_MINISTER indices', () => {
    const actions: ValidAction[] = [
      { type: 'SWITCH_MINISTER', ministerIndex: 1 },
      { type: 'SWITCH_MINISTER', ministerIndex: 2 },
    ];
    const result = deriveSets(actions, null);
    expect(result.validSwitchMinisters).toEqual(new Set([1, 2]));
  });
});
