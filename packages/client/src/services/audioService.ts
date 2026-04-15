export type SoundEffect =
  | 'card-play'
  | 'attack'
  | 'damage'
  | 'heal'
  | 'turn-start'
  | 'game-over';

const POOL_SIZE = 4;

/**
 * Lightweight audio service for game sound effects.
 * Uses a pool of Audio elements per effect to allow overlapping playback.
 * Gracefully degrades if audio is unavailable (e.g. in tests, SSR).
 */
class AudioService {
  private _muted = false;
  private _volume = 0.5;
  private _pool = new Map<string, HTMLAudioElement[]>();

  get muted(): boolean {
    return this._muted;
  }

  get volume(): number {
    return this._volume;
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
  }

  private getAudioElement(effect: SoundEffect): HTMLAudioElement | null {
    try {
      if (typeof Audio === 'undefined') return null;
      let pool = this._pool.get(effect);
      if (!pool) {
        pool = Array.from({ length: POOL_SIZE }, () => new Audio(`/audio/${effect}.mp3`));
        this._pool.set(effect, pool);
      }
      // Find an idle element (ended or not started)
      const idle = pool.find((a) => a.paused || a.ended);
      return idle ?? pool[0];
    } catch {
      return null;
    }
  }

  play(effect: SoundEffect): void {
    if (this._muted) return;

    try {
      const audio = this.getAudioElement(effect);
      if (!audio) return;

      audio.volume = this._volume;
      if (typeof audio.currentTime === 'number') audio.currentTime = 0;
      audio.play().catch(() => {
        // Silently ignore — browser may block autoplay
      });
    } catch {
      // Graceful degradation — no audio available
    }
  }
}

export const audioService = new AudioService();
