import { describe, expect, it } from 'vitest';
import { CIVILIZATION_META, CIVILIZATION_ORDER } from '../src/civilization-meta.js';

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