import { describe, it, expect } from 'vitest';
import { getDeckCopyLimit } from '@king-card/shared';
import {
  CHINA_MINIONS,
  CHINA_STRATAGEMS,
  CHINA_SORCERIES,
  CHINA_EMPERORS,
  CHINA_MINISTERS,
  CHINA_GENERALS,
  CHINA_ALL_CARDS,
  EMPEROR_QIN,
  EMPEROR_HAN,
  EMPEROR_TANG,
  CHINA_EMPEROR_DATA_LIST,
} from '../../../src/cards/definitions/index.js';

function getQinLegalEditableCopyTotal(): number {
  const excludedCardIds = new Set([
    ...EMPEROR_QIN.boundGenerals.map((card) => card.id),
    ...EMPEROR_QIN.boundSorceries.map((card) => card.id),
  ]);

  return CHINA_ALL_CARDS
    .filter((card) => !excludedCardIds.has(card.id))
    .reduce((total, card) => total + getDeckCopyLimit(card), 0);
}

describe('China Card Definitions', () => {
  // ─── Total count: 3 emperors + 9 ministers + 2 generals + 8 minions + 4 stratagems + 2 sorceries = 28 ───

  it('should have exactly 28 entities (19 Card + 9 Minister)', () => {
    // Card objects: 8 minions + 4 stratagems + 2 sorceries + 3 emperors + 2 generals = 19
    // Minister objects: 9 (3 per emperor, separate from Card)
    // Total "cards" in the card sense: 19 Card instances + 9 Minister = 28 game entities
    const cardCount = CHINA_MINIONS.length
      + CHINA_STRATAGEMS.length
      + CHINA_SORCERIES.length
      + CHINA_EMPERORS.length
      + CHINA_GENERALS.length
      + CHINA_MINISTERS.length;
    expect(cardCount).toBe(28);
  });

  it('CHINA_ALL_CARDS should contain all 19 Card objects', () => {
    expect(CHINA_ALL_CARDS).toHaveLength(19);
  });

  it('Qin should have at least 27 legal editable copies after excluding bound cards', () => {
    expect(getQinLegalEditableCopyTotal()).toBeGreaterThanOrEqual(27);
  });

  // ─── Unique IDs ───────────────────────────────────────────────────

  it('all cards should have unique ids', () => {
    const allIds: string[] = [
      ...CHINA_ALL_CARDS.map((c) => c.id),
      ...CHINA_MINISTERS.map((m) => m.id),
    ];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  // ─── Civilization ─────────────────────────────────────────────────

  it('all Card objects should have civilization CHINA', () => {
    for (const card of CHINA_ALL_CARDS) {
      expect(card.civilization).toBe('CHINA');
    }
  });

  // ─── ID format ────────────────────────────────────────────────────

  it('all Card ids should follow china_{pinyin_name} format', () => {
    for (const card of CHINA_ALL_CARDS) {
      expect(card.id).toMatch(/^china_[a-z_]+$/);
    }
  });

  it('all Minister ids should follow china_{pinyin_name} format', () => {
    for (const minister of CHINA_MINISTERS) {
      expect(minister.id).toMatch(/^china_[a-z_]+$/);
    }
  });

  // ─── Minion Cards (8) ─────────────────────────────────────────────

  describe('Minions', () => {
    it('should have exactly 8 minion cards', () => {
      expect(CHINA_MINIONS).toHaveLength(8);
    });

    it('all minions should be type MINION', () => {
      for (const card of CHINA_MINIONS) {
        expect(card.type).toBe('MINION');
      }
    });

    it('all minions should have attack and health', () => {
      for (const card of CHINA_MINIONS) {
        expect(card.attack).toBeDefined();
        expect(card.health).toBeDefined();
      }
    });
  });

  // ─── Stratagem Cards (4) ──────────────────────────────────────────

  describe('Stratagems', () => {
    it('should have exactly 4 stratagem cards', () => {
      expect(CHINA_STRATAGEMS).toHaveLength(4);
    });

    it('all stratagems should be type STRATAGEM', () => {
      for (const card of CHINA_STRATAGEMS) {
        expect(card.type).toBe('STRATAGEM');
      }
    });
  });

  // ─── Sorcery Cards (2) ────────────────────────────────────────────

  describe('Sorceries', () => {
    it('should have exactly 2 sorcery cards', () => {
      expect(CHINA_SORCERIES).toHaveLength(2);
    });

    it('all sorceries should be type SORCERY', () => {
      for (const card of CHINA_SORCERIES) {
        expect(card.type).toBe('SORCERY');
      }
    });

    it('all sorceries should be EPIC rarity', () => {
      for (const card of CHINA_SORCERIES) {
        expect(card.rarity).toBe('EPIC');
      }
    });
  });

  // ─── Emperor Cards (3) ────────────────────────────────────────────

  describe('Emperors', () => {
    it('should have exactly 3 emperor cards', () => {
      expect(CHINA_EMPERORS).toHaveLength(3);
    });

    it('all emperors should be type EMPEROR', () => {
      for (const card of CHINA_EMPERORS) {
        expect(card.type).toBe('EMPEROR');
      }
    });

    it('all emperors should be LEGENDARY rarity', () => {
      for (const card of CHINA_EMPERORS) {
        expect(card.rarity).toBe('LEGENDARY');
      }
    });

    it('all emperors should have a heroSkill', () => {
      for (const card of CHINA_EMPERORS) {
        expect(card.heroSkill).toBeDefined();
        expect(card.heroSkill!.name).toBeTruthy();
        expect(card.heroSkill!.cost).toBeGreaterThanOrEqual(0);
        expect(card.heroSkill!.effect).toBeDefined();
      }
    });
  });

  // ─── General Cards (2) ────────────────────────────────────────────

  describe('Generals', () => {
    it('should have exactly 2 general cards', () => {
      expect(CHINA_GENERALS).toHaveLength(2);
    });

    it('all generals should be type GENERAL', () => {
      for (const card of CHINA_GENERALS) {
        expect(card.type).toBe('GENERAL');
      }
    });

    it('all generals should be LEGENDARY rarity', () => {
      for (const card of CHINA_GENERALS) {
        expect(card.rarity).toBe('LEGENDARY');
      }
    });

    it('all generals should have exactly 3 generalSkills', () => {
      for (const card of CHINA_GENERALS) {
        expect(card.generalSkills).toBeDefined();
        expect(card.generalSkills!).toHaveLength(3);
      }
    });

    it('each general skill should have usesPerTurn', () => {
      for (const card of CHINA_GENERALS) {
        for (const skill of card.generalSkills!) {
          expect(skill.usesPerTurn).toBe(1);
        }
      }
    });
  });

  // ─── Minister Cards (9) ───────────────────────────────────────────

  describe('Ministers', () => {
    it('should have exactly 9 ministers', () => {
      expect(CHINA_MINISTERS).toHaveLength(9);
    });

    it('all ministers should have an activeSkill', () => {
      for (const minister of CHINA_MINISTERS) {
        expect(minister.activeSkill).toBeDefined();
        expect(minister.activeSkill.name).toBeTruthy();
        expect(minister.activeSkill.cost).toBeGreaterThanOrEqual(0);
      }
    });

    it('all ministers should have a cooldown >= 0', () => {
      for (const minister of CHINA_MINISTERS) {
        expect(minister.cooldown).toBeGreaterThanOrEqual(0);
      }
    });

    it('all ministers should start with skillUsedThisTurn false', () => {
      for (const minister of CHINA_MINISTERS) {
        expect(minister.skillUsedThisTurn).toBe(false);
      }
    });

    it('minister types should cover all four types', () => {
      const types = CHINA_MINISTERS.map((m) => m.type);
      expect(types).toContain('STRATEGIST');
      expect(types).toContain('WARRIOR');
      expect(types).toContain('ADMINISTRATOR');
      expect(types).toContain('ENVOY');
    });
  });

  // ─── Effects ──────────────────────────────────────────────────────

  it('all cards with effects should have valid EffectType', () => {
    const validEffectTypes = [
      'DAMAGE', 'HEAL', 'DRAW', 'DISCARD', 'SUMMON', 'DESTROY',
      'MODIFY_STAT', 'APPLY_BUFF', 'REMOVE_BUFF', 'GAIN_ARMOR', 'SPEND_ENERGY',
      'ACTIVATE_STRATAGEM', 'SET_DRAW_LOCK', 'GRANT_EXTRA_ATTACK',
      'EMPEROR_SWITCH', 'MINISTER_SWITCH', 'RANDOM_DESTROY', 'RANDOM_DISCARD',
      'CONDITIONAL_BUFF', 'GARRISON_MARK',
    ];
    for (const card of CHINA_ALL_CARDS) {
      for (const effect of card.effects) {
        expect(validEffectTypes).toContain(effect.type);
      }
    }
  });

  // ─── EmperorData ──────────────────────────────────────────────────

  describe('EmperorData', () => {
    it('should have exactly 3 emperor data assemblies', () => {
      expect(CHINA_EMPEROR_DATA_LIST).toHaveLength(3);
    });

    for (const emperorData of CHINA_EMPEROR_DATA_LIST) {
      describe(`EmperorData for ${emperorData.emperorCard.name}`, () => {
        it('should have at least 3 ministers', () => {
          expect(emperorData.ministers.length).toBeGreaterThanOrEqual(3);
        });

        it('should have exactly 2 bound generals', () => {
          expect(emperorData.boundGenerals).toHaveLength(2);
        });

        it('should have exactly 2 bound sorceries', () => {
          expect(emperorData.boundSorceries).toHaveLength(2);
        });

        it('ministers should reference valid ministers', () => {
          for (const minister of emperorData.ministers) {
            expect(minister.id).toMatch(/^china_[a-z_]+$/);
            expect(minister.activeSkill).toBeDefined();
          }
        });

        it('bound generals should be GENERAL type', () => {
          for (const general of emperorData.boundGenerals) {
            expect(general.type).toBe('GENERAL');
          }
        });

        it('bound sorceries should be SORCERY type', () => {
          for (const sorcery of emperorData.boundSorceries) {
            expect(sorcery.type).toBe('SORCERY');
          }
        });
      });
    }

    // ─── Emperor-specific minister differentiation ──────────────────
    it('each emperor should have a unique minister pool', () => {
      const qinIds = EMPEROR_QIN.ministers.map((m) => m.id).sort();
      const hanIds = EMPEROR_HAN.ministers.map((m) => m.id).sort();
      const tangIds = EMPEROR_TANG.ministers.map((m) => m.id).sort();

      expect(qinIds).not.toEqual(hanIds);
      expect(qinIds).not.toEqual(tangIds);
      expect(hanIds).not.toEqual(tangIds);
    });

    it('no minister should appear in more than one emperor pool', () => {
      const allMinisterIds = [
        ...EMPEROR_QIN.ministers.map((m) => m.id),
        ...EMPEROR_HAN.ministers.map((m) => m.id),
        ...EMPEROR_TANG.ministers.map((m) => m.id),
      ];
      expect(new Set(allMinisterIds).size).toBe(allMinisterIds.length);
    });

    it('each emperor minister pool should cover multiple minister types', () => {
      for (const emperorData of CHINA_EMPEROR_DATA_LIST) {
        const types = new Set(emperorData.ministers.map((m) => m.type));
        expect(types.size).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ─── Specific Card Checks ─────────────────────────────────────────

  it('Bingmayong should be a 1-cost 1/1 deathrattle minion that draws a card', () => {
    const card = CHINA_MINIONS.find((c) => c.id === 'china_bingmayong')!;
    expect(card.cost).toBe(1);
    expect(card.attack).toBe(1);
    expect(card.health).toBe(1);
    expect(card.keywords).toContain('DEATHRATTLE');
    expect(card.effects).toHaveLength(1);
    expect(card.effects[0]).toMatchObject({
      trigger: 'ON_DEATH',
      type: 'DRAW',
      params: { count: 1 },
    });
  });

  it('Qinjun Bubing should have MOBILIZE keyword', () => {
    const card = CHINA_MINIONS.find((c) => c.id === 'china_qinjun_bubing')!;
    expect(card.keywords).toContain('MOBILIZE');
  });

  it('Changcheng Shouwei should have TAUNT keyword', () => {
    const card = CHINA_MINIONS.find((c) => c.id === 'china_changcheng_shouwei')!;
    expect(card.keywords).toContain('TAUNT');
    expect(card.health).toBe(6);
  });

  it('Jinjun Tongling should have BATTLECRY keyword', () => {
    const card = CHINA_MINIONS.find((c) => c.id === 'china_jinjun_tongling')!;
    expect(card.keywords).toContain('BATTLECRY');
  });

  it('Huoqubing should have RUSH and CHARGE', () => {
    const card = CHINA_GENERALS.find((c) => c.id === 'china_huoqubing')!;
    expect(card.keywords).toContain('RUSH');
    expect(card.keywords).toContain('CHARGE');
  });

  it('Weiqing should have TAUNT', () => {
    const card = CHINA_GENERALS.find((c) => c.id === 'china_weiqing')!;
    expect(card.keywords).toContain('TAUNT');
  });
});
