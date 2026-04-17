import { describe, expect, it } from 'vitest';
import {
  CIVILIZATION_META,
  CIVILIZATION_ORDER,
  getCivilizationMeta,
} from '../src/civilization-meta.js';

describe('civilization metadata', () => {
  it('orders the playable civilizations for selector UI', () => {
    expect(CIVILIZATION_ORDER).toEqual(['CHINA', 'JAPAN', 'USA', 'UK', 'GERMANY']);
  });

  it('provides display metadata for all civilizations including neutral', () => {
    expect(CIVILIZATION_META.CHINA.name).toBe('华夏');
    expect(CIVILIZATION_META.JAPAN.name).toBe('大和');
    expect(CIVILIZATION_META.USA.name).toBe('美利坚');
    expect(CIVILIZATION_META.UK.name).toBe('不列颠');
    expect(CIVILIZATION_META.GERMANY.name).toBe('普鲁士');
    expect(CIVILIZATION_META.NEUTRAL.name).toBe('中立');
  });
});

describe('getCivilizationMeta', () => {
  it('returns English display for CHINA when locale is en-US', () => {
    const meta = getCivilizationMeta('CHINA', 'en-US');
    expect(meta.name).toBe('China');
    expect(meta.description.length).toBeGreaterThan(0);
    expect(meta.icon.length).toBeGreaterThan(0);
  });

  it('returns legacy Chinese display when locale is zh-CN', () => {
    const meta = getCivilizationMeta('CHINA', 'zh-CN');
    expect(meta.name).toBe('华夏');
  });
});

describe('getCivilizationMeta en-US coverage', () => {
  it.each(CIVILIZATION_ORDER.filter((c) => c !== 'NEUTRAL'))(
    'has a non-CJK name and non-empty description for %s',
    (civ) => {
      const meta = getCivilizationMeta(civ, 'en-US');
      expect(meta.name).not.toMatch(/[\u4e00-\u9fff]/);
      expect(meta.description.length).toBeGreaterThan(0);
    },
  );
});

describe('CIVILIZATION_META matches zh-CN view', () => {
  it.each(CIVILIZATION_ORDER)('matches getCivilizationMeta(%s, zh-CN)', (civ) => {
    expect(CIVILIZATION_META[civ]).toEqual(getCivilizationMeta(civ, 'zh-CN'));
  });
});
