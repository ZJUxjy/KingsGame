import { describe, it, expect, beforeEach } from 'vitest';
import { createCardInstance, resetInstanceCounter } from '../../../src/models/card-instance.js';
import type { Card } from '@king-card/shared';

const dummyCard: Card = {
  id: 'test_minion',
  name: 'Test Minion',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 3,
  attack: 4,
  health: 5,
  description: 'A test minion',
  keywords: [],
  effects: [],
};

describe('createCardInstance', () => {
  beforeEach(() => {
    resetInstanceCounter();
  });

  it('should set currentAttack/currentHealth/currentMaxHealth from card', () => {
    const instance = createCardInstance(dummyCard, 0);
    expect(instance.currentAttack).toBe(4);
    expect(instance.currentHealth).toBe(5);
    expect(instance.currentMaxHealth).toBe(5);
  });

  it('should set remainingAttacks to 0 for minion without RUSH/CHARGE/ASSASSIN', () => {
    const instance = createCardInstance(dummyCard, 0);
    expect(instance.remainingAttacks).toBe(0);
  });

  it('should set remainingAttacks to 1 for RUSH minion', () => {
    const rushCard: Card = { ...dummyCard, id: 'rush_minion', keywords: ['RUSH'] };
    const instance = createCardInstance(rushCard, 0);
    expect(instance.remainingAttacks).toBe(1);
  });

  it('should set remainingAttacks to 1 for CHARGE minion', () => {
    const chargeCard: Card = { ...dummyCard, id: 'charge_minion', keywords: ['CHARGE'] };
    const instance = createCardInstance(chargeCard, 0);
    expect(instance.remainingAttacks).toBe(1);
  });

  it('should set remainingAttacks to 1 for ASSASSIN minion', () => {
    const assassinCard: Card = { ...dummyCard, id: 'assassin_minion', keywords: ['ASSASSIN'] };
    const instance = createCardInstance(assassinCard, 0);
    expect(instance.remainingAttacks).toBe(1);
  });

  it('should set justPlayed to true', () => {
    const instance = createCardInstance(dummyCard, 0);
    expect(instance.justPlayed).toBe(true);
  });

  it('should generate unique instanceId', () => {
    const inst1 = createCardInstance(dummyCard, 0);
    const inst2 = createCardInstance(dummyCard, 0);
    expect(inst1.instanceId).not.toBe(inst2.instanceId);
    expect(inst1.instanceId).toBe('test_minion_1');
    expect(inst2.instanceId).toBe('test_minion_2');
  });

  it('should initialize buffs as empty array', () => {
    const instance = createCardInstance(dummyCard, 0);
    expect(instance.buffs).toEqual([]);
  });

  it('should set sleepTurns to 0 for non-RESEARCH minion', () => {
    const instance = createCardInstance(dummyCard, 0);
    expect(instance.sleepTurns).toBe(0);
  });

  it('should set sleepTurns to 1 for RESEARCH minion', () => {
    const researchCard: Card = { ...dummyCard, id: 'research_minion', keywords: ['RESEARCH'] };
    const instance = createCardInstance(researchCard, 0);
    expect(instance.sleepTurns).toBe(1);
  });
});
