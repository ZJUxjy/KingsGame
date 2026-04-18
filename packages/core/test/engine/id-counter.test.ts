import { describe, it, expect } from 'vitest';
import { IdCounter } from '../../src/engine/id-counter.js';
import { createCardInstance } from '../../src/models/card-instance.js';
import type { Card } from '@king-card/shared';

const baseCard: Card = {
  id: 'shared_minion', name: 'Shared', civilization: 'CHINA', type: 'MINION',
  rarity: 'COMMON', cost: 1, attack: 1, health: 1,
  description: '', keywords: [], effects: [],
};

describe('IdCounter / createCardInstance', () => {
  it('produces unique instanceIds when shared by both players in one engine', () => {
    const counter = new IdCounter();
    const a = createCardInstance(baseCard, 0, counter);
    const b = createCardInstance(baseCard, 1, counter);
    const c = createCardInstance(baseCard, 0, counter);
    const ids = new Set([a.instanceId, b.instanceId, c.instanceId]);
    expect(ids.size).toBe(3);
  });

  it('two separate IdCounter instances are independent', () => {
    const c1 = new IdCounter();
    const c2 = new IdCounter();
    const a1 = createCardInstance(baseCard, 0, c1);
    const a2 = createCardInstance(baseCard, 0, c2);
    expect(a1.instanceId).toBe(a2.instanceId);
  });

  it('IdCounter.nextBuffId / nextStratagemId are monotonic per instance', () => {
    const c = new IdCounter();
    expect(c.nextBuffId()).toBe('buff_1');
    expect(c.nextBuffId()).toBe('buff_2');
    expect(c.nextStratagemId()).toBe('stratagem_1');
    const c2 = new IdCounter();
    expect(c2.nextBuffId()).toBe('buff_1');
  });
});
