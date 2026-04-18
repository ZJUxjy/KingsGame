/**
 * Per-engine ID generator. Replaces the old module-level counters that
 * caused ID collisions between players within a game and across concurrent
 * games. A single IdCounter instance is created in `GameEngine.create` and
 * threaded through into player creation, summoning, buff application,
 * stratagem activation, and synthetic skill source construction.
 */
export class IdCounter {
  private instance = 0;
  private buff = 0;
  private stratagem = 0;
  private synthetic = 0;

  nextInstanceId(cardId: string): string {
    return `${cardId}_${++this.instance}`;
  }

  nextBuffId(): string {
    return `buff_${++this.buff}`;
  }

  nextStratagemId(): string {
    return `stratagem_${++this.stratagem}`;
  }

  nextSyntheticSourceId(prefix: string): string {
    return `${prefix}_${++this.synthetic}`;
  }
}
