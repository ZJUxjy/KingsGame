import { describe, expect, it } from 'vitest';
import { ALL_CARDS } from '@king-card/core';
import { getCardDisplayText } from './cardText.js';

function hasCjk(s: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9fff]/.test(s);
}

describe('cardText CHINA and JAPAN en-US has no CJK in displayed fields', () => {
  const cards = ALL_CARDS.filter(
    (c) => c.civilization === 'CHINA' || c.civilization === 'JAPAN',
  );

  it.each(cards)('card $id en-US copy', (card) => {
    const d = getCardDisplayText(card, 'en-US');
    expect(hasCjk(d.name), `name still CJK: ${d.name}`).toBe(false);
    expect(hasCjk(d.description), `description CJK on ${card.id}`).toBe(false);
    if (d.heroSkill) {
      expect(hasCjk(d.heroSkill.name), `heroSkill.name on ${card.id}`).toBe(false);
      expect(hasCjk(d.heroSkill.description), `heroSkill.desc on ${card.id}`).toBe(false);
    }
    if (d.generalSkills?.length) {
      for (const s of d.generalSkills) {
        expect(hasCjk(s.name), `generalSkill.name on ${card.id}`).toBe(false);
        expect(hasCjk(s.description), `generalSkill.desc on ${card.id}`).toBe(false);
      }
    }
  });
});
