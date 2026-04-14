import type { EffectHandler, EffectTrigger, EffectContext } from '@king-card/shared';

// ─── Effect Handler Registry ─────────────────────────────────────

const handlers: EffectHandler[] = [];

/**
 * Register an effect handler for a keyword.
 * All keyword handlers call this during module initialization.
 */
export function registerEffectHandler(handler: EffectHandler): void {
  handlers.push(handler);
}

/**
 * Resolve all registered effect handlers for a given trigger.
 * Iterates through every registered handler and invokes the
 * matching lifecycle hook (onPlay, onDeath, onKill, etc.).
 */
export function resolveEffects(trigger: EffectTrigger, ctx: EffectContext): void {
  for (const handler of handlers) {
    switch (trigger) {
      case 'ON_PLAY':
        handler.onPlay?.(ctx);
        break;
      case 'ON_DEATH':
        handler.onDeath?.(ctx);
        break;
      case 'ON_KILL':
        handler.onKill?.(ctx);
        break;
      case 'ON_TURN_START':
        handler.onTurnStart?.(ctx);
        break;
      case 'ON_TURN_END':
        handler.onTurnEnd?.(ctx);
        break;
      case 'ON_ATTACK':
        handler.onAttack?.(ctx);
        break;
    }
  }
}

/**
 * Get all registered effect handlers (for testing/debugging).
 */
export function getRegisteredHandlers(): readonly EffectHandler[] {
  return handlers;
}

/**
 * Clear all registered handlers (for testing teardown).
 */
export function clearEffectHandlers(): void {
  handlers.length = 0;
}
