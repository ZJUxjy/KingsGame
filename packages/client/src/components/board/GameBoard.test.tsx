/**
 * GameBoard layout tests – purely structural/visual concerns.
 * Deep gameplay logic is covered by integration and store tests.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { StarParticleLayer, BoardMidlineDivider } from './GameBoard.js';

afterEach(cleanup);

// ---------------------------------------------------------------------------
// StarParticleLayer – purely decorative background
// ---------------------------------------------------------------------------
describe('StarParticleLayer', () => {
  it('renders a layer that is pointer-events-none and aria-hidden', () => {
    const { container } = render(<StarParticleLayer />);
    const layer = container.firstChild as HTMLElement;
    expect(layer).not.toBeNull();
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    // pointer-events-none comes from Tailwind class
    expect(layer.className).toContain('pointer-events-none');
  });

  it('renders multiple particle dots', () => {
    const { container } = render(<StarParticleLayer />);
    const particles = container.querySelectorAll('[data-particle]');
    expect(particles.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// BoardMidlineDivider – glowing midline between battlefields
// ---------------------------------------------------------------------------
describe('BoardMidlineDivider', () => {
  it('renders with data-board-midline attribute', () => {
    const { container } = render(<BoardMidlineDivider />);
    const el = container.querySelector('[data-board-midline]');
    expect(el).not.toBeNull();
  });

  it('is aria-hidden', () => {
    const { container } = render(<BoardMidlineDivider />);
    const el = container.querySelector('[data-board-midline]');
    expect(el!.getAttribute('aria-hidden')).toBe('true');
  });
});
