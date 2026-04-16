import { describe, it, expect } from 'vitest';
import type { Card, Minister, EmperorData } from '@king-card/shared';
import {
  UK_MINIONS,
  UK_STRATAGEMS,
  UK_SORCERIES,
  UK_EMPERORS,
  UK_MINISTERS,
  UK_GENERALS,
  UK_ALL_CARDS,
  EMPEROR_VICTORIA,
  UK_EMPEROR_DATA_LIST,
} from '../../../src/cards/definitions/index.js';

describe('UK Card Definitions', () => {
  // ─── Total count: 3 emperors + 9 ministers + 6 generals + 6 minions + 4 stratagems + 6 sorceries = 34 ───

  it('should have exactly 34 entities (25 Card + 9 Minister)', () => {
    const count = UK_MINIONS.length
      + UK_STRATAGEMS.length
      + UK_SORCERIES.length
      + UK_EMPERORS.length
      + UK_GENERALS.length
      + UK_MINISTERS.length;
    expect(count).toBe(34);
  });

  it('UK_ALL_CARDS should contain all 25 Card objects', () => {
    expect(UK_ALL_CARDS).toHaveLength(25);
  });

  // ─── Unique IDs ───────────────────────────────────────────────────

  it('all cards should have unique ids', () => {
    const allIds: string[] = [
      ...UK_ALL_CARDS.map((c) => c.id),
      ...UK_MINISTERS.map((m) => m.id),
    ];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  // ─── Civilization ─────────────────────────────────────────────────

  it('all Card objects should have civilization UK', () => {
    for (const card of UK_ALL_CARDS) {
      expect(card.civilization).toBe('UK');
    }
  });

  // ─── ID format ────────────────────────────────────────────────────

  it('all Card ids should follow uk_ prefix format', () => {
    for (const card of UK_ALL_CARDS) {
      expect(card.id).toMatch(/^uk_/);
    }
  });

  it('all Minister ids should follow uk_ prefix format', () => {
    for (const minister of UK_MINISTERS) {
      expect(minister.id).toMatch(/^uk_/);
    }
  });

  // ─── Card type counts ─────────────────────────────────────────────

  describe('Card type counts', () => {
    it('should have 3 emperors', () => { expect(UK_EMPERORS).toHaveLength(3); });
    it('should have 6 generals', () => { expect(UK_GENERALS).toHaveLength(6); });
    it('should have 6 minions', () => { expect(UK_MINIONS).toHaveLength(6); });
    it('should have 4 stratagems', () => { expect(UK_STRATAGEMS).toHaveLength(4); });
    it('should have 6 sorceries', () => { expect(UK_SORCERIES).toHaveLength(6); });
  });

  // ─── Ministers ─────────────────────────────────────────────────────

  describe('Ministers', () => {
    it('should have 9 ministers', () => { expect(UK_MINISTERS).toHaveLength(9); });

    it('all ministers should have an activeSkill', () => {
      for (const m of UK_MINISTERS) {
        expect(m.activeSkill).toBeDefined();
        expect(m.activeSkill.name).toBeTruthy();
        expect(m.activeSkill.cost).toBeGreaterThanOrEqual(0);
      }
    });

    it('all ministers should have cooldown >= 0', () => {
      for (const m of UK_MINISTERS) {
        expect(m.cooldown).toBeGreaterThanOrEqual(0);
      }
    });

    it('all ministers should start with skillUsedThisTurn false', () => {
      for (const minister of UK_MINISTERS) {
        expect(minister.skillUsedThisTurn).toBe(false);
      }
    });
  });

  // ─── EmperorData ──────────────────────────────────────────────────

  describe('EmperorData', () => {
    it('should have 3 emperor data entries', () => {
      expect(UK_EMPEROR_DATA_LIST).toHaveLength(3);
    });

    it('Victoria should expose localized emperor and hero skill text', () => {
      expect(EMPEROR_VICTORIA.emperorCard.description).toContain('帝王技能');
      expect(EMPEROR_VICTORIA.emperorCard.heroSkill?.name).toBe('帝国号令');
      expect(EMPEROR_VICTORIA.emperorCard.heroSkill?.description).toBe('所有友方生物获得+1/+1');
    });

    it('should include Victoria, Elizabeth I, and Winston Churchill', () => {
      expect(UK_EMPEROR_DATA_LIST.map((entry) => entry.emperorCard.name)).toEqual([
        '维多利亚女王',
        '伊丽莎白一世',
        '温斯顿·丘吉尔',
      ]);
    });

    for (const ed of UK_EMPEROR_DATA_LIST) {
      describe(`EmperorData for ${ed.emperorCard.name}`, () => {
        it('should have at least 3 ministers', () => {
          expect(ed.ministers.length).toBeGreaterThanOrEqual(3);
        });

        it('should have 2 bound generals', () => {
          expect(ed.boundGenerals).toHaveLength(2);
        });

        it('should have 2 bound sorceries', () => {
          expect(ed.boundSorceries).toHaveLength(2);
        });

        it('ministers should reference valid IDs', () => {
          for (const m of ed.ministers) {
            expect(m.id).toMatch(/^uk_/);
            expect(m.activeSkill).toBeDefined();
          }
        });

        it('bound generals should be GENERAL type', () => {
          for (const g of ed.boundGenerals) {
            expect(g.type).toBe('GENERAL');
          }
        });

        it('bound sorceries should be SORCERY type', () => {
          for (const s of ed.boundSorceries) {
            expect(s.type).toBe('SORCERY');
          }
        });
      });
    }
  });
});
