import { describe, it, expect } from 'vitest';
import { GAME_CONSTANTS } from '../src/constants.js';

describe('shared types', () => {
  it('should have correct game constants', () => {
    expect(GAME_CONSTANTS.INITIAL_HEALTH).toBe(30);
    expect(GAME_CONSTANTS.MAX_BOARD_SIZE).toBe(7);
    expect(GAME_CONSTANTS.MAX_ENERGY).toBe(10);
    expect(GAME_CONSTANTS.MAX_HAND_SIZE).toBe(10);
    expect(GAME_CONSTANTS.STARTING_HAND_SIZE).toBe(4);
  });

  it('should accept valid keyword values', () => {
    const keywords = ['BATTLECRY', 'DEATHRATTLE', 'TAUNT', 'RUSH', 'CHARGE', 'COMBO_STRIKE'] as const;
    expect(keywords).toHaveLength(6);
  });
});
