import { describe, it, expect } from 'vitest';
import {
  JAPAN_MINIONS,
  JAPAN_STRATAGEMS,
  JAPAN_SORCERIES,
  JAPAN_EMPERORS,
  JAPAN_MINISTERS,
  JAPAN_GENERALS,
  JAPAN_ALL_CARDS,
  JAPAN_EMPEROR_DATA_LIST,
} from '../../../src/cards/definitions/index.js';

describe('Japan Card Definitions', () => {
  // ─── Total count: 3 emperors + 9 ministers + 6 generals + 11 minions + 4 stratagems + 6 sorceries = 39 ───

  it('should have exactly 39 entities (30 Card + 9 Minister)', () => {
    const count = JAPAN_MINIONS.length
      + JAPAN_STRATAGEMS.length
      + JAPAN_SORCERIES.length
      + JAPAN_EMPERORS.length
      + JAPAN_GENERALS.length
      + JAPAN_MINISTERS.length;
    expect(count).toBe(39);
  });

  it('JAPAN_ALL_CARDS should contain all 30 Card objects', () => {
    expect(JAPAN_ALL_CARDS).toHaveLength(30);
  });

  // ─── Unique IDs ───────────────────────────────────────────────────

  it('all cards should have unique ids', () => {
    const allIds: string[] = [
      ...JAPAN_ALL_CARDS.map((c) => c.id),
      ...JAPAN_MINISTERS.map((m) => m.id),
    ];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  // ─── Civilization ─────────────────────────────────────────────────

  it('all Card objects should have civilization JAPAN', () => {
    for (const card of JAPAN_ALL_CARDS) {
      expect(card.civilization).toBe('JAPAN');
    }
  });

  // ─── ID format ────────────────────────────────────────────────────

  it('all Card ids should follow japan_ prefix format', () => {
    for (const card of JAPAN_ALL_CARDS) {
      expect(card.id).toMatch(/^japan_/);
    }
  });

  it('all Minister ids should follow japan_ prefix format', () => {
    for (const minister of JAPAN_MINISTERS) {
      expect(minister.id).toMatch(/^japan_/);
    }
  });

  // ─── Card type counts ─────────────────────────────────────────────

  describe('Card type counts', () => {
    it('should have 3 emperors', () => { expect(JAPAN_EMPERORS).toHaveLength(3); });
    it('should have 6 generals', () => { expect(JAPAN_GENERALS).toHaveLength(6); });
    it('should have 11 minions', () => { expect(JAPAN_MINIONS).toHaveLength(11); });
    it('should have 4 stratagems', () => { expect(JAPAN_STRATAGEMS).toHaveLength(4); });
    it('should have 6 sorceries', () => { expect(JAPAN_SORCERIES).toHaveLength(6); });
  });

  // ─── Ministers ─────────────────────────────────────────────────────

  describe('Ministers', () => {
    it('should have 9 ministers', () => { expect(JAPAN_MINISTERS).toHaveLength(9); });

    it('all ministers should have an activeSkill', () => {
      for (const m of JAPAN_MINISTERS) {
        expect(m.activeSkill).toBeDefined();
        expect(m.activeSkill.name).toBeTruthy();
        expect(m.activeSkill.cost).toBeGreaterThanOrEqual(0);
      }
    });

    it('all ministers should have cooldown >= 0', () => {
      for (const m of JAPAN_MINISTERS) {
        expect(m.cooldown).toBeGreaterThanOrEqual(0);
      }
    });

    it('all ministers should start with skillUsedThisTurn false', () => {
      for (const minister of JAPAN_MINISTERS) {
        expect(minister.skillUsedThisTurn).toBe(false);
      }
    });
  });

  // ─── EmperorData ──────────────────────────────────────────────────

  describe('EmperorData', () => {
    it('should have 3 emperor data entries', () => {
      expect(JAPAN_EMPEROR_DATA_LIST).toHaveLength(3);
    });

    it('should include Oda Nobunaga, Tokugawa Ieyasu, and Emperor Meiji', () => {
      expect(JAPAN_EMPEROR_DATA_LIST.map((entry) => entry.emperorCard.name)).toEqual([
        '織田信長',
        '德川家康',
        '明治天皇',
      ]);
    });

    for (const ed of JAPAN_EMPEROR_DATA_LIST) {
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
            expect(m.id).toMatch(/^japan_/);
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
