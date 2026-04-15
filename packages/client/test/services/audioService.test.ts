import { describe, it, expect, beforeEach } from 'vitest';
import { audioService } from '../../src/services/audioService.js';

describe('AudioService', () => {
  beforeEach(() => {
    audioService.setMuted(false);
    audioService.setVolume(0.5);
  });

  it('should default to unmuted', () => {
    expect(audioService.muted).toBe(false);
  });

  it('should default volume to 0.5', () => {
    expect(audioService.volume).toBe(0.5);
  });

  it('should toggle mute', () => {
    audioService.setMuted(true);
    expect(audioService.muted).toBe(true);
    audioService.setMuted(false);
    expect(audioService.muted).toBe(false);
  });

  it('should set volume within bounds', () => {
    audioService.setVolume(1.0);
    expect(audioService.volume).toBe(1.0);
    audioService.setVolume(0);
    expect(audioService.volume).toBe(0);
  });

  it('should clamp volume to [0, 1]', () => {
    audioService.setVolume(-0.5);
    expect(audioService.volume).toBe(0);
    audioService.setVolume(2.0);
    expect(audioService.volume).toBe(1);
  });

  it('should not throw when playing sound while muted', () => {
    audioService.setMuted(true);
    expect(() => audioService.play('card-play')).not.toThrow();
  });

  it('should not throw when playing sound (graceful degradation)', () => {
    expect(() => audioService.play('attack')).not.toThrow();
  });
});
