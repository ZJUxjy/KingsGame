import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../../src/engine/event-bus.js';

describe('EventBus', () => {
  it('should emit and receive events', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('TURN_START', handler);
    bus.emit({ type: 'TURN_START', playerIndex: 0, turnNumber: 1 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: 'TURN_START', playerIndex: 0, turnNumber: 1 });
  });
  it('should support multiple listeners for same event type', () => {
    const bus = new EventBus();
    const h1 = vi.fn(); const h2 = vi.fn();
    bus.on('TURN_START', h1);
    bus.on('TURN_START', h2);
    bus.emit({ type: 'TURN_START', playerIndex: 0, turnNumber: 1 });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
  it('should unsubscribe via returned function', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsub = bus.on('TURN_START', handler);
    unsub();
    bus.emit({ type: 'TURN_START', playerIndex: 0, turnNumber: 1 });
    expect(handler).not.toHaveBeenCalled();
  });
  it('should not call listeners for different event types', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('TURN_START', handler);
    bus.emit({ type: 'TURN_END', playerIndex: 0 });
    expect(handler).not.toHaveBeenCalled();
  });
  it('should clear all listeners', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('TURN_START', handler);
    bus.removeAllListeners();
    bus.emit({ type: 'TURN_START', playerIndex: 0, turnNumber: 1 });
    expect(handler).not.toHaveBeenCalled();
  });
});
