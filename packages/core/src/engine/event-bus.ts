import type { GameEvent, EventBus } from '@king-card/shared';

type GameEventHandler = (event: GameEvent) => void;

export class EventBusImpl implements EventBus {
  private listeners = new Map<string, Set<GameEventHandler>>();

  emit(event: GameEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  on(eventType: string, handler: GameEventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// Re-export as EventBus for convenience (matches the interface name)
export { EventBusImpl as EventBus };
