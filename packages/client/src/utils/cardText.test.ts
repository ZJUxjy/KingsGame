import { ALL_EMPEROR_DATA_LIST, USA_ALL_CARDS } from '@king-card/core';
import { describe, expect, it } from 'vitest';
import { getCardDisplayText, getMinisterDisplayText } from './cardText.js';

const gi = USA_ALL_CARDS.find((card) => card.id === 'usa_gi')!;
const grant = USA_ALL_CARDS.find((card) => card.id === 'usa_grant')!;
const eisenhower = USA_ALL_CARDS.find((card) => card.id === 'usa_dwight_eisenhower')!;
const newDeal = USA_ALL_CARDS.find((card) => card.id === 'usa_new_deal')!;
const tirpitzMinister = ALL_EMPEROR_DATA_LIST
  .find((entry) => entry.emperorCard.id === 'germany_wilhelm_ii')!
  .ministers.find((minister) => minister.id === 'germany_tirpitz_minister')!;

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

  it('returns english card copy when locale is en-US', () => {
    const text = getCardDisplayText(gi, 'en-US');

    expect(text.name).toBe('GI (American Soldier)');
    expect(text.description).toBe('A standard American soldier.');
  });

  it('translates newly added Chinese-source card copy into English display text', () => {
    const generalText = getCardDisplayText(eisenhower, 'en-US');
    const sorceryText = getCardDisplayText(newDeal, 'en-US');

    expect(generalText.name).toBe('Dwight D. Eisenhower');
    expect(generalText.generalSkills?.[2].description).toBe('Draw 1 card');
    expect(sorceryText.name).toBe('New Deal');
    expect(sorceryText.description).toBe('Draw 1 card and gain 4 armor.');
  });

  it('translates minister names and active skill text into Chinese display text', () => {
    const minister = getMinisterDisplayText({
      id: 'usa_franklin',
      emperorId: 'usa_lincoln',
      name: 'Benjamin Franklin',
      type: 'STRATEGIST',
      activeSkill: {
        name: 'Diplomacy',
        description: 'Draw 1 card',
        cost: 1,
        effect: {
          trigger: 'ON_PLAY',
          type: 'DRAW',
          params: { count: 1 },
        },
      },
      skillUsedThisTurn: false,
      cooldown: 0,
    });

    expect(minister.name).toBe('本杰明·富兰克林');
    expect(minister.activeSkill.name).toBe('外交斡旋');
    expect(minister.activeSkill.description).toBe('抽一张牌');
  });

  it('translates newly added minister names into English display text', () => {
    const minister = getMinisterDisplayText(tirpitzMinister, 'en-US');

    expect(minister.name).toBe('Grand Admiral Tirpitz');
    expect(minister.activeSkill.name).toBe('Fleet Expansion');
    expect(minister.activeSkill.description).toBe('Deal 3 damage to an enemy minion');
  });
});