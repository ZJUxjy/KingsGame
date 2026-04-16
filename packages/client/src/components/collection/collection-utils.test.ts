import {
  ALL_EMPEROR_DATA_LIST,
  CHINA_ALL_CARDS,
  JAPAN_ALL_CARDS,
} from '@king-card/core';
import { describe, expect, it } from 'vitest';
import {
  getCollectionCards,
  getCopyLimit,
  getEmperorsForCivilization,
} from './collection-utils.js';

describe('collection-utils', () => {
  it('returns only the selected civilization cards plus neutral cards', () => {
    const cards = getCollectionCards({
      civilization: 'CHINA',
      type: 'ALL',
      search: '',
      emperorId: null,
      showBoundOnly: false,
    });

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((card) => card.civilization === 'CHINA' || card.civilization === 'NEUTRAL')).toBe(true);
    expect(cards.some((card) => card.civilization === 'JAPAN')).toBe(false);
  });

  it('filters by search text across name, description, and keywords', () => {
    const sampleChinaCard = CHINA_ALL_CARDS.find((card) => card.type !== 'EMPEROR');
    expect(sampleChinaCard).toBeTruthy();

    const cards = getCollectionCards({
      civilization: 'CHINA',
      type: 'ALL',
      search: sampleChinaCard!.name,
      emperorId: null,
      showBoundOnly: false,
    });

    expect(cards.some((card) => card.id === sampleChinaCard!.id)).toBe(true);
  });

  it('returns only bound cards when an emperor is selected and showBoundOnly is true', () => {
    const emperor = ALL_EMPEROR_DATA_LIST.find((item) => item.emperorCard.civilization === 'CHINA');
    expect(emperor).toBeTruthy();

    const cards = getCollectionCards({
      civilization: 'CHINA',
      type: 'ALL',
      search: '',
      emperorId: emperor!.emperorCard.id,
      showBoundOnly: true,
    });

    const boundIds = new Set([
      ...emperor!.boundGenerals.map((card) => card.id),
      ...emperor!.boundSorceries.map((card) => card.id),
    ]);

    expect(cards.length).toBe(boundIds.size);
    expect(cards.every((card) => boundIds.has(card.id))).toBe(true);
  });

  it('sorts cards by cost first and keeps names stable within the same cost bucket', () => {
    const cards = getCollectionCards({
      civilization: 'JAPAN',
      type: 'ALL',
      search: '',
      emperorId: null,
      showBoundOnly: false,
    });

    expect(cards.length).toBeGreaterThan(1);
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].cost).toBeGreaterThanOrEqual(cards[i - 1].cost);
    }
  });

  it('returns the rule-based copy limit for each collectible type', () => {
    expect(getCopyLimit(CHINA_ALL_CARDS.find((card) => card.type === 'MINION')!)).toBe(2);
    expect(getCopyLimit(CHINA_ALL_CARDS.find((card) => card.type === 'STRATAGEM')!)).toBe(2);
    expect(getCopyLimit(CHINA_ALL_CARDS.find((card) => card.type === 'GENERAL')!)).toBe(1);
    expect(getCopyLimit(CHINA_ALL_CARDS.find((card) => card.type === 'SORCERY')!)).toBe(1);
  });

  it('returns emperors only for the requested civilization', () => {
    const japanEmperors = getEmperorsForCivilization('JAPAN');

    expect(japanEmperors.length).toBeGreaterThan(0);
    expect(japanEmperors.every((item) => item.emperorCard.civilization === 'JAPAN')).toBe(true);
    expect(japanEmperors.some((item) => item.emperorCard.civilization === 'CHINA')).toBe(false);
    expect(japanEmperors.length).toBeLessThan(ALL_EMPEROR_DATA_LIST.length);
    expect(JAPAN_ALL_CARDS.some((card) => card.type === 'EMPEROR')).toBe(true);
  });
});