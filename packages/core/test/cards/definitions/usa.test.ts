import { describe, it, expect } from 'vitest';
import type { Card, Minister, EmperorData } from '@king-card/shared';
import {
  USA_MINIONS,
  USA_STRATAGEMS,
  USA_SORCERIES,
  USA_EMPERORS,
  USA_MINISTERS,
  USA_GENERALS,
  USA_ALL_CARDS,
  EMPEROR_LINCOLN,
  USA_EMPEROR_DATA_LIST,
} from '../../../src/cards/definitions/index.js';

describe('USA Card Definitions', () => {
  // ─── Total count: 3 emperors + 9 ministers + 6 generals + 8 minions + 4 stratagems + 6 sorceries = 36 ───

  it('should have exactly 36 entities (27 Card + 9 Minister)', () => {
    const count = USA_MINIONS.length
      + USA_STRATAGEMS.length
      + USA_SORCERIES.length
      + USA_EMPERORS.length
      + USA_GENERALS.length
      + USA_MINISTERS.length;
    expect(count).toBe(36);
  });

  it('USA_ALL_CARDS should contain all 27 Card objects', () => {
    expect(USA_ALL_CARDS).toHaveLength(27);
  });

  // ─── Unique IDs ───────────────────────────────────────────────────

  it('all cards should have unique ids', () => {
    const allIds: string[] = [
      ...USA_ALL_CARDS.map((c) => c.id),
      ...USA_MINISTERS.map((m) => m.id),
    ];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  // ─── Civilization ─────────────────────────────────────────────────

  it('all Card objects should have civilization USA', () => {
    for (const card of USA_ALL_CARDS) {
      expect(card.civilization).toBe('USA');
    }
  });

  // ─── ID format ────────────────────────────────────────────────────

  it('all Card ids should follow usa_ prefix format', () => {
    for (const card of USA_ALL_CARDS) {
      expect(card.id).toMatch(/^usa_/);
    }
  });

  it('all Minister ids should follow usa_ prefix format', () => {
    for (const minister of USA_MINISTERS) {
      expect(minister.id).toMatch(/^usa_/);
    }
  });

  // ─── Card type counts ─────────────────────────────────────────────

  describe('Card type counts', () => {
    it('should have 3 emperors', () => { expect(USA_EMPERORS).toHaveLength(3); });
    it('should have 6 generals', () => { expect(USA_GENERALS).toHaveLength(6); });
    it('should have 8 minions', () => { expect(USA_MINIONS).toHaveLength(8); });
    it('should have 4 stratagems', () => { expect(USA_STRATAGEMS).toHaveLength(4); });
    it('should have 6 sorceries', () => { expect(USA_SORCERIES).toHaveLength(6); });
  });

  it('Eisenhower logistics skill description should match its draw-only effect', () => {
    const eisenhower = USA_GENERALS.find((card) => card.id === 'usa_dwight_eisenhower');

    expect(eisenhower).toBeDefined();
    expect(eisenhower?.generalSkills?.[2].name).toBe('后勤大师');
    expect(eisenhower?.generalSkills?.[2].description).toBe('抽一张牌');
    expect(eisenhower?.generalSkills?.[2].effect.type).toBe('DRAW');
    expect(eisenhower?.generalSkills?.[2].effect.params).toEqual({ count: 1 });
  });

  // ─── Ministers ─────────────────────────────────────────────────────

  describe('Ministers', () => {
    it('should have 9 ministers', () => { expect(USA_MINISTERS).toHaveLength(9); });

    it('all ministers should have an activeSkill', () => {
      for (const m of USA_MINISTERS) {
        expect(m.activeSkill).toBeDefined();
        expect(m.activeSkill.name).toBeTruthy();
        expect(m.activeSkill.cost).toBeGreaterThanOrEqual(0);
      }
    });

    it('all ministers should have cooldown >= 0', () => {
      for (const m of USA_MINISTERS) {
        expect(m.cooldown).toBeGreaterThanOrEqual(0);
      }
    });

    it('all ministers should start with skillUsedThisTurn false', () => {
      for (const minister of USA_MINISTERS) {
        expect(minister.skillUsedThisTurn).toBe(false);
      }
    });
  });

  // ─── EmperorData ──────────────────────────────────────────────────

  describe('EmperorData', () => {
    it('should have 3 emperor data entries', () => {
      expect(USA_EMPEROR_DATA_LIST).toHaveLength(3);
    });

    it('Lincoln should expose localized emperor and hero skill text', () => {
      expect(EMPEROR_LINCOLN.emperorCard.description).toContain('帝王技能');
      expect(EMPEROR_LINCOLN.emperorCard.heroSkill?.name).toBe('解放宣言');
      expect(EMPEROR_LINCOLN.emperorCard.heroSkill?.description).toBe('所有友方生物恢复2点生命');
    });

    it('should include Lincoln, George Washington, and Franklin Roosevelt', () => {
      expect(USA_EMPEROR_DATA_LIST.map((entry) => entry.emperorCard.name)).toEqual([
        '亚伯拉罕·林肯',
        '乔治·华盛顿',
        '富兰克林·罗斯福',
      ]);
    });

    for (const ed of USA_EMPEROR_DATA_LIST) {
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
            expect(m.id).toMatch(/^usa_/);
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
