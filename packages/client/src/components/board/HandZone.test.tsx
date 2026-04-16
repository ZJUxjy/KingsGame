import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { HandZone } from './HandZone.js';

// Minimal card fixture matching the props expected by HandZone / CardComponent
function makeCard(overrides: Record<string, unknown> = {}) {
  return {
    id: 'card-1',
    name: '步兵',
    type: 'MINION',
    cost: 2,
    attack: 2,
    health: 3,
    rarity: 'COMMON',
    keywords: [],
    description: '一个普通步兵',
    civilization: 'CHINA',
    ...overrides,
  };
}

// Stub ResizeObserver (jsdom doesn't implement it)
class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = StubResizeObserver;

// Polyfill PointerEvent for jsdom
if (typeof PointerEvent === 'undefined') {
  (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
    pointerId: number;
    constructor(type: string, params: PointerEventInit & { pointerId?: number } = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  };
}

describe('HandZone drag interactions', () => {
  let onPlayCard: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onPlayCard = vi.fn();
  });

  function renderHand(count = 3) {
    const cards = Array.from({ length: count }, (_, i) =>
      makeCard({ id: `card-${i}`, name: `卡牌${i}` }),
    );
    const validPlayIndices = new Set(cards.map((_, i) => i));
    return render(
      <HandZone
        cards={cards}
        onPlayCard={onPlayCard}
        validPlayIndices={validPlayIndices}
        containerWidth={800}
      />,
    );
  }

  // Mock getBoundingClientRect globally so containerRef.current picks it up.
  // Hand zone container: top=480, card elements: top=500
  const HAND_RECT = { left: 0, top: 480, right: 800, bottom: 660, width: 800, height: 180, x: 0, y: 480, toJSON() {} };
  const CARD_RECT = { left: 100, top: 500, right: 220, bottom: 670, width: 120, height: 170, x: 100, y: 500, toJSON() {} };

  /**
   * Helper: simulate a full drag sequence on the first card.
   * @param releaseClientY - the clientY at which to release the pointer
   */
  function simulateDrag(container: HTMLElement, releaseClientY: number) {
    const handContainer = container.firstElementChild as HTMLElement;

    const origGetBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (this === handContainer) return HAND_RECT as DOMRect;
      return CARD_RECT as DOMRect;
    };

    // Find the first CardComponent root div (the actual element with onPointerDown)
    const cardWrappers = handContainer.querySelectorAll(':scope > div');
    const firstCardRoot = cardWrappers[0]?.querySelector('[data-testid="card"]') as HTMLElement;

    act(() => {
      fireEvent.pointerDown(firstCardRoot, {
        clientX: 160,
        clientY: 560,
        pointerId: 1,
      });
    });

    act(() => {
      fireEvent(window, new PointerEvent('pointermove', {
        clientX: 160, clientY: 540, pointerId: 1, bubbles: true,
      }));
    });

    act(() => {
      fireEvent(window, new PointerEvent('pointermove', {
        clientX: 160, clientY: releaseClientY, pointerId: 1, bubbles: true,
      }));
    });

    act(() => {
      fireEvent(window, new PointerEvent('pointerup', {
        clientX: 160, clientY: releaseClientY, pointerId: 1, bubbles: true,
      }));
    });

    Element.prototype.getBoundingClientRect = origGetBCR;
  }

  it('cancels drag when card is released inside hand zone (above threshold not met)', () => {
    const { container } = renderHand();
    // Release at Y=490, which is >= handRect.top(480) - 16 = 464 → NOT above hand
    simulateDrag(container, 490);
    expect(onPlayCard).not.toHaveBeenCalled();
  });

  it('plays card when dragged above the hand zone', () => {
    const { container } = renderHand();
    // Release at Y=400, which is < handRect.top(480) - 16 = 464 → above hand → play
    simulateDrag(container, 400);
    expect(onPlayCard).toHaveBeenCalledTimes(1);
    expect(onPlayCard).toHaveBeenCalledWith(0);
  });

  it('does not initiate drag on opponent cards', () => {
    const cards = [makeCard()];
    const { container } = render(
      <HandZone
        cards={cards}
        isOpponent
        onPlayCard={onPlayCard}
        validPlayIndices={new Set([0])}
        containerWidth={800}
      />,
    );

    const cardWrappers = container.firstElementChild!.querySelectorAll(':scope > div');
    const firstCard = cardWrappers[0] as HTMLElement;

    act(() => {
      fireEvent.pointerDown(firstCard, {
        clientX: 160, clientY: 560, pointerId: 1,
      });
    });

    act(() => {
      fireEvent(window, new PointerEvent('pointerup', {
        clientX: 160, clientY: 400, pointerId: 1, bubbles: true,
      }));
    });

    expect(onPlayCard).not.toHaveBeenCalled();
  });

  it('does not play non-playable cards even when dragged above hand', () => {
    const cards = [makeCard(), makeCard({ id: 'card-1', name: '昂贵卡' })];
    // Only card 0 is playable
    const { container } = render(
      <HandZone
        cards={cards}
        onPlayCard={onPlayCard}
        validPlayIndices={new Set([0])}
        containerWidth={800}
      />,
    );

    const handContainer = container.firstElementChild as HTMLElement;
    const origGetBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (this === handContainer) return HAND_RECT as DOMRect;
      return CARD_RECT as DOMRect;
    };

    // Find all CardComponent root divs (identified by data-testid="card")
    const allCardRoots = handContainer.querySelectorAll('[data-testid="card"]');
    const secondCardRoot = allCardRoots[1] as HTMLElement;
    expect(secondCardRoot).toBeTruthy();

    act(() => {
      fireEvent.pointerDown(secondCardRoot, {
        clientX: 260, clientY: 560, pointerId: 1,
      });
    });

    act(() => {
      fireEvent(window, new PointerEvent('pointermove', {
        clientX: 260, clientY: 400, pointerId: 1, bubbles: true,
      }));
    });

    act(() => {
      fireEvent(window, new PointerEvent('pointerup', {
        clientX: 260, clientY: 400, pointerId: 1, bubbles: true,
      }));
    });

    Element.prototype.getBoundingClientRect = origGetBCR;
    expect(onPlayCard).not.toHaveBeenCalled();
  });

  it('cancels drag on pointercancel event (inside hand zone)', () => {
    const { container } = renderHand();
    const handContainer = container.firstElementChild as HTMLElement;
    const firstCardRoot = handContainer.querySelector('[data-testid="card"]') as HTMLElement;

    const origGetBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (this === handContainer) return HAND_RECT as DOMRect;
      return CARD_RECT as DOMRect;
    };

    act(() => {
      fireEvent.pointerDown(firstCardRoot, {
        clientX: 160, clientY: 560, pointerId: 1,
      });
    });

    act(() => {
      fireEvent(window, new PointerEvent('pointermove', {
        clientX: 160, clientY: 490, pointerId: 1, bubbles: true,
      }));
    });

    // pointercancel inside hand zone → should not play
    act(() => {
      fireEvent(window, new PointerEvent('pointercancel', {
        clientX: 160, clientY: 490, pointerId: 1, bubbles: true,
      }));
    });

    Element.prototype.getBoundingClientRect = origGetBCR;
    expect(onPlayCard).not.toHaveBeenCalled();
  });
});
