import { describe, it, expect } from 'vitest';
import type { Card, CardEffect, GeneralSkill, HeroSkill, Minister, MinisterSkill } from '@king-card/shared';
import {
  onPlay,
  onDeath,
  onKill,
  onTurnStart,
  onTurnEnd,
  onAttack,
  createMinisterSkill,
  createGeneralSkill,
  createHeroSkill,
  createMinister,
  createGeneralCard,
  createEmperorCard,
} from '../../../src/cards/definitions/builders.js';

describe('Effect Helpers', () => {
  it('onPlay returns CardEffect with ON_PLAY trigger', () => {
    const effect = onPlay('DRAW', { count: 1 });
    expect(effect.trigger).toBe('ON_PLAY');
    expect(effect.type).toBe('DRAW');
    expect(effect.params).toEqual({ count: 1 });
    // TypeScript type check
    const _: CardEffect = effect;
  });

  it('onDeath returns CardEffect with ON_DEATH trigger', () => {
    const effect = onDeath('DAMAGE', { target: 'ENEMY_MINION', amount: 2 });
    expect(effect.trigger).toBe('ON_DEATH');
    expect(effect.type).toBe('DAMAGE');
    expect(effect.params).toEqual({ target: 'ENEMY_MINION', amount: 2 });
  });

  it('onKill returns CardEffect with ON_KILL trigger', () => {
    const effect = onKill('HEAL', { target: 'HERO', amount: 3 });
    expect(effect.trigger).toBe('ON_KILL');
    expect(effect.type).toBe('HEAL');
  });

  it('onTurnStart returns CardEffect with ON_TURN_START trigger', () => {
    const effect = onTurnStart('DRAW', { count: 2 });
    expect(effect.trigger).toBe('ON_TURN_START');
    expect(effect.type).toBe('DRAW');
  });

  it('onTurnEnd returns CardEffect with ON_TURN_END trigger', () => {
    const effect = onTurnEnd('MODIFY_STAT', { attackDelta: 1 });
    expect(effect.trigger).toBe('ON_TURN_END');
    expect(effect.type).toBe('MODIFY_STAT');
  });

  it('onAttack returns CardEffect with ON_ATTACK trigger', () => {
    const effect = onAttack('DAMAGE', { amount: 1 });
    expect(effect.trigger).toBe('ON_ATTACK');
    expect(effect.type).toBe('DAMAGE');
  });
});

describe('Skill Helpers', () => {
  const baseEffect = onPlay('DRAW', { count: 1 });

  describe('createMinisterSkill', () => {
    it('returns MinisterSkill with all provided fields', () => {
      const skill = createMinisterSkill({ name: '上书', description: '抽一张牌', cost: 1, effect: baseEffect });
      expect(skill.name).toBe('上书');
      expect(skill.description).toBe('抽一张牌');
      expect(skill.cost).toBe(1);
      expect(skill.effect).toBe(baseEffect);
      // TypeScript type check
      const _: MinisterSkill = skill;
    });
  });

  describe('createGeneralSkill', () => {
    it('applies default cost=0 and usesPerTurn=1', () => {
      const skill = createGeneralSkill({ name: '长驱直入', description: '造成伤害', effect: baseEffect });
      expect(skill.cost).toBe(0);
      expect(skill.usesPerTurn).toBe(1);
      // TypeScript type check
      const _: GeneralSkill = skill;
    });

    it('respects provided cost and usesPerTurn', () => {
      const skill = createGeneralSkill({ name: '封狼居胥', description: '强化', effect: baseEffect, cost: 2, usesPerTurn: 2 });
      expect(skill.cost).toBe(2);
      expect(skill.usesPerTurn).toBe(2);
    });
  });

  describe('createHeroSkill', () => {
    it('returns HeroSkill with all provided fields', () => {
      const skill = createHeroSkill({ name: '召唤兵马俑', description: '召唤一个兵马俑', cost: 1, cooldown: 1, effect: baseEffect });
      expect(skill.name).toBe('召唤兵马俑');
      expect(skill.cooldown).toBe(1);
      expect(skill.cost).toBe(1);
      expect(skill.effect).toBe(baseEffect);
      // TypeScript type check
      const _: HeroSkill = skill;
    });
  });
});

describe('Entity Builders', () => {
  const baseEffect = onPlay('DRAW', { count: 1 });

  describe('createMinister', () => {
    it('sets skillUsedThisTurn to false', () => {
      const minister = createMinister({
        id: 'test_minister',
        emperorId: 'test_emperor',
        name: '李斯',
        type: 'STRATEGIST',
        activeSkill: createMinisterSkill({ name: '上书', description: '抽一张牌', cost: 1, effect: baseEffect }),
        cooldown: 1,
      });
      expect(minister.skillUsedThisTurn).toBe(false);
      expect(minister.id).toBe('test_minister');
      expect(minister.type).toBe('STRATEGIST');
      // TypeScript type check
      const _: Minister = minister;
    });

    it('preserves all provided fields', () => {
      const skill = createMinisterSkill({ name: '北击匈奴', description: '造成伤害', cost: 2, effect: baseEffect });
      const minister = createMinister({
        id: 'china_mengtian',
        emperorId: 'china_qin_shihuang',
        name: '蒙恬',
        type: 'WARRIOR',
        activeSkill: skill,
        cooldown: 2,
      });
      expect(minister.emperorId).toBe('china_qin_shihuang');
      expect(minister.cooldown).toBe(2);
      expect(minister.activeSkill).toBe(skill);
    });
  });

  describe('createGeneralCard', () => {
    const generalSkill = createGeneralSkill({ name: '技能', description: '描述', effect: baseEffect });

    it('sets type to GENERAL', () => {
      const card = createGeneralCard({
        id: 'test_general',
        name: '霍去病',
        civilization: 'CHINA',
        cost: 7,
        attack: 6,
        health: 6,
        description: '描述',
        generalSkills: [generalSkill],
      });
      expect(card.type).toBe('GENERAL');
      // TypeScript type check
      const _: Card = card;
    });

    it('defaults rarity to LEGENDARY', () => {
      const card = createGeneralCard({
        id: 'test_general',
        name: '霍去病',
        civilization: 'CHINA',
        cost: 7,
        attack: 6,
        health: 6,
        description: '描述',
        generalSkills: [generalSkill],
      });
      expect(card.rarity).toBe('LEGENDARY');
    });

    it('defaults keywords to []', () => {
      const card = createGeneralCard({
        id: 'test_general',
        name: '霍去病',
        civilization: 'CHINA',
        cost: 7,
        attack: 6,
        health: 6,
        description: '描述',
        generalSkills: [generalSkill],
      });
      expect(card.keywords).toEqual([]);
    });

    it('defaults effects to []', () => {
      const card = createGeneralCard({
        id: 'test_general',
        name: '霍去病',
        civilization: 'CHINA',
        cost: 7,
        attack: 6,
        health: 6,
        description: '描述',
        generalSkills: [generalSkill],
      });
      expect(card.effects).toEqual([]);
    });

    it('respects provided rarity, keywords, and effects', () => {
      const effect = onPlay('DAMAGE', { amount: 1 });
      const card = createGeneralCard({
        id: 'test_general',
        name: '卫青',
        civilization: 'CHINA',
        cost: 6,
        attack: 5,
        health: 7,
        description: '描述',
        rarity: 'EPIC',
        keywords: ['TAUNT'],
        effects: [effect],
        generalSkills: [generalSkill],
      });
      expect(card.rarity).toBe('EPIC');
      expect(card.keywords).toEqual(['TAUNT']);
      expect(card.effects).toEqual([effect]);
    });
  });

  describe('createEmperorCard', () => {
    const heroSkill = createHeroSkill({ name: '召唤兵马俑', description: '描述', cost: 1, cooldown: 1, effect: baseEffect });

    it('sets type to EMPEROR', () => {
      const card = createEmperorCard({
        id: 'test_emperor',
        name: '秦始皇',
        civilization: 'CHINA',
        cost: 4,
        description: '描述',
        heroSkill,
      });
      expect(card.type).toBe('EMPEROR');
      // TypeScript type check
      const _: Card = card;
    });

    it('sets attack to 0', () => {
      const card = createEmperorCard({
        id: 'test_emperor',
        name: '秦始皇',
        civilization: 'CHINA',
        cost: 4,
        description: '描述',
        heroSkill,
      });
      expect(card.attack).toBe(0);
    });

    it('defaults health to 30', () => {
      const card = createEmperorCard({
        id: 'test_emperor',
        name: '秦始皇',
        civilization: 'CHINA',
        cost: 4,
        description: '描述',
        heroSkill,
      });
      expect(card.health).toBe(30);
    });

    it('defaults rarity to LEGENDARY', () => {
      const card = createEmperorCard({
        id: 'test_emperor',
        name: '秦始皇',
        civilization: 'CHINA',
        cost: 4,
        description: '描述',
        heroSkill,
      });
      expect(card.rarity).toBe('LEGENDARY');
    });

    it('defaults keywords to []', () => {
      const card = createEmperorCard({
        id: 'test_emperor',
        name: '秦始皇',
        civilization: 'CHINA',
        cost: 4,
        description: '描述',
        heroSkill,
      });
      expect(card.keywords).toEqual([]);
    });

    it('defaults effects to []', () => {
      const card = createEmperorCard({
        id: 'test_emperor',
        name: '秦始皇',
        civilization: 'CHINA',
        cost: 4,
        description: '描述',
        heroSkill,
      });
      expect(card.effects).toEqual([]);
    });

    it('respects provided health, rarity, keywords, and effects', () => {
      const effect = onPlay('SUMMON', { cardId: 'china_bingmayong' });
      const card = createEmperorCard({
        id: 'test_emperor',
        name: '汉武帝',
        civilization: 'CHINA',
        cost: 6,
        health: 25,
        description: '描述',
        heroSkill,
        rarity: 'EPIC',
        keywords: ['AURA'],
        effects: [effect],
      });
      expect(card.health).toBe(25);
      expect(card.rarity).toBe('EPIC');
      expect(card.keywords).toEqual(['AURA']);
      expect(card.effects).toEqual([effect]);
    });
  });
});
