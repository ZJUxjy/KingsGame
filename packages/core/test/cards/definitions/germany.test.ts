import { describe, it, expect } from 'vitest';
import type { Card, Minister, EmperorData } from '@king-card/shared';
import {
  GERMANY_MINIONS,
  GERMANY_STRATAGEMS,
  GERMANY_SORCERIES,
  GERMANY_EMPERORS,
  GERMANY_MINISTERS,
  GERMANY_GENERALS,
  GERMANY_ALL_CARDS,
  EMPEROR_FRIEDRICH,
  GERMANY_EMPEROR_DATA_LIST,
} from '../../../src/cards/definitions/index.js';

describe('Germany Card Definitions', () => {
  // ─── Total count: 3 emperors + 9 ministers + 6 generals + 9 minions + 4 stratagems + 6 sorceries = 37 ───

  it('should have exactly 37 entities (28 Card + 9 Minister)', () => {
    const count = GERMANY_MINIONS.length
      + GERMANY_STRATAGEMS.length
      + GERMANY_SORCERIES.length
      + GERMANY_EMPERORS.length
      + GERMANY_GENERALS.length
      + GERMANY_MINISTERS.length;
    expect(count).toBe(37);
  });

  it('GERMANY_ALL_CARDS should contain all 28 Card objects', () => {
    expect(GERMANY_ALL_CARDS).toHaveLength(28);
  });

  // ─── Unique IDs ───────────────────────────────────────────────────

  it('all cards should have unique ids', () => {
    const allIds: string[] = [
      ...GERMANY_ALL_CARDS.map((c) => c.id),
      ...GERMANY_MINISTERS.map((m) => m.id),
    ];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  // ─── Civilization ─────────────────────────────────────────────────

  it('all Card objects should have civilization GERMANY', () => {
    for (const card of GERMANY_ALL_CARDS) {
      expect(card.civilization).toBe('GERMANY');
    }
  });

  // ─── ID format ────────────────────────────────────────────────────

  it('all Card ids should follow germany_ prefix format', () => {
    for (const card of GERMANY_ALL_CARDS) {
      expect(card.id).toMatch(/^germany_/);
    }
  });

  it('all Minister ids should follow germany_ prefix format', () => {
    for (const minister of GERMANY_MINISTERS) {
      expect(minister.id).toMatch(/^germany_/);
    }
  });

  // ─── Card type counts ─────────────────────────────────────────────

  describe('Card type counts', () => {
    it('should have 3 emperors', () => { expect(GERMANY_EMPERORS).toHaveLength(3); });
    it('should have 6 generals', () => { expect(GERMANY_GENERALS).toHaveLength(6); });
    it('should have 9 minions', () => { expect(GERMANY_MINIONS).toHaveLength(9); });
    it('should have 4 stratagems', () => { expect(GERMANY_STRATAGEMS).toHaveLength(4); });
    it('should have 6 sorceries', () => { expect(GERMANY_SORCERIES).toHaveLength(6); });
  });

  // ─── Ministers ─────────────────────────────────────────────────────

  describe('Ministers', () => {
    it('should have 9 ministers', () => { expect(GERMANY_MINISTERS).toHaveLength(9); });

    it('all ministers should have an activeSkill', () => {
      for (const m of GERMANY_MINISTERS) {
        expect(m.activeSkill).toBeDefined();
        expect(m.activeSkill.name).toBeTruthy();
        expect(m.activeSkill.cost).toBeGreaterThanOrEqual(0);
      }
    });

    it('all ministers should have cooldown >= 0', () => {
      for (const m of GERMANY_MINISTERS) {
        expect(m.cooldown).toBeGreaterThanOrEqual(0);
      }
    });

    it('all ministers should start with skillUsedThisTurn false', () => {
      for (const minister of GERMANY_MINISTERS) {
        expect(minister.skillUsedThisTurn).toBe(false);
      }
    });

    it('Wilhelm II should keep a strategist minister and distinct minister names', () => {
      const wilhelmII = GERMANY_EMPEROR_DATA_LIST.find((entry) => entry.emperorCard.id === 'germany_wilhelm_ii');

      expect(wilhelmII).toBeDefined();

      const ministerTypes = new Set(wilhelmII?.ministers.map((minister) => minister.type));
      expect(ministerTypes.has('STRATEGIST')).toBe(true);

      const generalNames = new Set(wilhelmII?.boundGenerals.map((general) => general.name));
      for (const minister of wilhelmII?.ministers ?? []) {
        expect(generalNames.has(minister.name)).toBe(false);
      }
    });
  });

  // ─── EmperorData ──────────────────────────────────────────────────

  describe('EmperorData', () => {
    it('should have 3 emperor data entries', () => {
      expect(GERMANY_EMPEROR_DATA_LIST).toHaveLength(3);
    });

    it('Friedrich should expose localized emperor and hero skill text', () => {
      expect(EMPEROR_FRIEDRICH.emperorCard.description).toContain('帝王技能');
      expect(EMPEROR_FRIEDRICH.emperorCard.heroSkill?.name).toBe('斜线阵');
      expect(EMPEROR_FRIEDRICH.emperorCard.heroSkill?.description).toBe('对一个敌方生物造成2点伤害');
    });

    it('should include Friedrich, Wilhelm I, and Wilhelm II', () => {
      expect(GERMANY_EMPEROR_DATA_LIST.map((entry) => entry.emperorCard.name)).toEqual([
        '腓特烈大帝',
        '威廉一世',
        '威廉二世',
      ]);
    });

    for (const ed of GERMANY_EMPEROR_DATA_LIST) {
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
            expect(m.id).toMatch(/^germany_/);
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
