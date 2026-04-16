import { describe, expect, it } from 'vitest';
import type { Card, Minister } from '@king-card/shared';
import {
  applied,
  aura,
  china,
  createCivilization,
  onDeath,
  onPlay,
  onTurnEnd,
} from '../../src/cards/builders/index.js';

describe('Typed Effect DSL', () => {
  it('onPlay.draw produces CardEffect with ON_PLAY trigger and DRAW type', () => {
    const effect = onPlay.draw(2);
    expect(effect.trigger).toBe('ON_PLAY');
    expect(effect.type).toBe('DRAW');
    expect(effect.params).toEqual({ count: 2 });
  });

  it('damage with a SingleTarget sets params.target', () => {
    const effect = onPlay.damage('ENEMY_MINION', 3);
    expect(effect.params).toEqual({ target: 'ENEMY_MINION', amount: 3 });
  });

  it('damage with a TargetFilter sets params.targetFilter', () => {
    const effect = onPlay.damage('ALL_ENEMY_MINIONS', 2);
    expect(effect.params).toEqual({ targetFilter: 'ALL_ENEMY_MINIONS', amount: 2 });
  });

  it('heal supports group targeting via TargetFilter', () => {
    const effect = onDeath.heal('ALL_FRIENDLY_MINIONS', 1);
    expect(effect.trigger).toBe('ON_DEATH');
    expect(effect.params).toEqual({ targetFilter: 'ALL_FRIENDLY_MINIONS', amount: 1 });
  });

  it('modifyStat emits only the provided fields', () => {
    const effect = onTurnEnd.modifyStat({ attackDelta: 1 });
    expect(effect.trigger).toBe('ON_TURN_END');
    expect(effect.type).toBe('MODIFY_STAT');
    expect(effect.params).toEqual({ attackDelta: 1 });
  });

  it('applyBuff defaults type to TEMPORARY when omitted', () => {
    const effect = onPlay.applyBuff({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackBonus: 2,
      remainingTurns: 1,
    });
    expect(effect.type).toBe('APPLY_BUFF');
    expect(effect.params).toMatchObject({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackBonus: 2,
      remainingTurns: 1,
      type: 'TEMPORARY',
    });
  });

  it('summon with count > 1 emits params.count', () => {
    const effect = onPlay.summon('china_bingmayong', { count: 3 });
    expect(effect.params).toEqual({ cardId: 'china_bingmayong', count: 3 });
  });

  it('summon without count omits the count field', () => {
    const effect = onPlay.summon('china_bingmayong');
    expect(effect.params).toEqual({ cardId: 'china_bingmayong' });
  });

  it('summonCloneOfTarget encodes cloneOfInstanceId: TARGET', () => {
    const effect = onPlay.summonCloneOfTarget();
    expect(effect.type).toBe('SUMMON');
    expect(effect.params).toEqual({ cloneOfInstanceId: 'TARGET' });
  });

  it('activateStratagem wraps appliedEffects built via applied.*', () => {
    const effect = onPlay.activateStratagem({
      duration: 2,
      appliedEffects: [applied.costModifier(1)],
    });
    expect(effect.type).toBe('ACTIVATE_STRATAGEM');
    expect(effect.params).toEqual({
      duration: 2,
      appliedEffects: [{ type: 'COST_MODIFIER', params: { costReduction: 1 } }],
    });
  });

  it('aura builders produce AURA trigger', () => {
    const effect = aura.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
    });
    expect(effect.trigger).toBe('AURA');
    expect(effect.type).toBe('MODIFY_STAT');
  });

  it('custom escape hatch preserves arbitrary params', () => {
    const effect = onPlay.custom('DAMAGE', {
      target: 'RANDOM_ENEMY_MINION',
      amount: 3,
    });
    expect(effect.trigger).toBe('ON_PLAY');
    expect(effect.params).toEqual({ target: 'RANDOM_ENEMY_MINION', amount: 3 });
  });
});

describe('Civilization Factory', () => {
  it('minion fills civilization and id from factory config', () => {
    const card = china.minion({
      slug: 'test_minion',
      name: 'Tester',
      rarity: 'COMMON',
      cost: 1,
      attack: 1,
      health: 1,
      description: 'x',
    });
    expect(card.id).toBe('china_test_minion');
    expect(card.civilization).toBe('CHINA');
    expect(card.type).toBe('MINION');
    expect(card.keywords).toEqual([]);
    expect(card.effects).toEqual([]);
    const _: Card = card;
  });

  it('sorcery defaults rarity to EPIC', () => {
    const card = china.sorcery({
      slug: 'test_sorcery',
      name: 'x',
      cost: 2,
      description: 'x',
    });
    expect(card.rarity).toBe('EPIC');
    expect(card.type).toBe('SORCERY');
  });

  it('emperor forces LEGENDARY + attack=0 + default health 30', () => {
    const card = china.emperor({
      slug: 'test_emperor',
      name: 'x',
      cost: 4,
      description: 'x',
      heroSkill: china.heroSkill({
        name: 's',
        description: 'd',
        cost: 1,
        cooldown: 1,
        effect: onPlay.draw(1),
      }),
    });
    expect(card.type).toBe('EMPEROR');
    expect(card.rarity).toBe('LEGENDARY');
    expect(card.attack).toBe(0);
    expect(card.health).toBe(30);
    expect(card.heroSkill).toBeDefined();
  });

  it('general forces LEGENDARY and captures generalSkills', () => {
    const skill = china.generalSkill({
      name: 's',
      description: 'd',
      effect: onPlay.draw(1),
    });
    const card = china.general({
      slug: 'test_general',
      name: 'x',
      cost: 6,
      attack: 5,
      health: 5,
      description: 'x',
      generalSkills: [skill],
    });
    expect(card.rarity).toBe('LEGENDARY');
    expect(card.type).toBe('GENERAL');
    expect(card.generalSkills).toEqual([skill]);
  });

  it('generalSkill defaults cost=0 and usesPerTurn=1', () => {
    const skill = china.generalSkill({
      name: 's',
      description: 'd',
      effect: onPlay.draw(1),
    });
    expect(skill.cost).toBe(0);
    expect(skill.usesPerTurn).toBe(1);
  });

  it('minister derives emperorId from the provided emperor and sets skillUsedThisTurn=false', () => {
    const emperor = china.emperor({
      slug: 'e',
      name: 'x',
      cost: 4,
      description: 'x',
      heroSkill: china.heroSkill({
        name: 's',
        description: 'd',
        cost: 1,
        cooldown: 1,
        effect: onPlay.draw(1),
      }),
    });
    const minister = china.minister({
      slug: 'm',
      emperor,
      name: 'Test',
      type: 'STRATEGIST',
      cooldown: 2,
      activeSkill: china.ministerSkill({
        name: 's',
        description: 'd',
        cost: 1,
        effect: onPlay.draw(1),
      }),
    });
    expect(minister.id).toBe('china_m');
    expect(minister.emperorId).toBe(emperor.id);
    expect(minister.skillUsedThisTurn).toBe(false);
    expect(minister.cooldown).toBe(2);
    const _: Minister = minister;
  });

  it('createCivilization honours a custom idPrefix', () => {
    const custom = createCivilization({ code: 'USA', idPrefix: 'custom' });
    const card = custom.minion({
      slug: 'unit',
      name: 'x',
      rarity: 'COMMON',
      cost: 1,
      attack: 1,
      health: 1,
      description: 'x',
    });
    expect(card.id).toBe('custom_unit');
    expect(card.civilization).toBe('USA');
  });
});
