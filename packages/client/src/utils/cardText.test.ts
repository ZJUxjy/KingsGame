import { USA_ALL_CARDS } from '@king-card/core';
import { describe, expect, it } from 'vitest';
import { getCardDisplayText, getMinisterDisplayText } from './cardText.js';

const gi = USA_ALL_CARDS.find((card) => card.id === 'usa_gi')!;
const grant = USA_ALL_CARDS.find((card) => card.id === 'usa_grant')!;

describe('getCardDisplayText', () => {
  it('keeps existing Chinese card copy unchanged', () => {
    const text = getCardDisplayText({
      id: 'china_test',
      name: '兵马俑',
      description: '亡语：抽一张牌。',
    });

    expect(text.name).toBe('兵马俑');
    expect(text.description).toBe('亡语：抽一张牌。');
  });

  it('translates english usa minion copy into Chinese display text', () => {
    const text = getCardDisplayText(gi);

    expect(text.name).toBe('大兵');
    expect(text.description).toBe('标准的美军士兵。');
  });

  it('translates english general names and skill copy into Chinese display text', () => {
    const text = getCardDisplayText(grant);

    expect(text.name).toBe('尤利西斯·格兰特');
    expect(text.description).toContain('冲锋');
    expect(text.generalSkills?.[0].name).toBe('总体战');
    expect(text.generalSkills?.[0].description).toBe('对所有敌方生物造成3点伤害');
  });

  it('translates minister names and active skill copy into Chinese display text', () => {
    const text = getMinisterDisplayText({
      name: 'Benjamin Franklin',
      activeSkill: {
        name: 'Diplomacy',
        description: 'Draw 1 card',
      },
    });

    expect(text.name).toBe('本杰明·富兰克林');
    expect(text.activeSkill.name).toBe('外交斡旋');
    expect(text.activeSkill.description).toBe('抽一张牌');
  });
});
