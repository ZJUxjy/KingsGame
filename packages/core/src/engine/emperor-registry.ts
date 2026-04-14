import type { EmperorData } from '@king-card/shared';

// ─── Emperor Data Registry ─────────────────────────────────────────
// Provides a lookup from emperor card ID -> EmperorData so that
// executePlayCard can find the associated ministers, bound generals, etc.

const registry = new Map<string, EmperorData>();

/**
 * Register an EmperorData entry so it can be looked up by emperor card ID.
 */
export function registerEmperorData(data: EmperorData): void {
  registry.set(data.emperorCard.id, data);
}

/**
 * Register multiple EmperorData entries at once.
 */
export function registerEmperorDataList(list: EmperorData[]): void {
  for (const data of list) {
    registerEmperorData(data);
  }
}

/**
 * Look up EmperorData by emperor card ID.
 * Returns undefined if not found.
 */
export function getEmperorData(emperorCardId: string): EmperorData | undefined {
  return registry.get(emperorCardId);
}

/**
 * Clear all registered emperor data (for testing teardown).
 */
export function clearEmperorRegistry(): void {
  registry.clear();
}
