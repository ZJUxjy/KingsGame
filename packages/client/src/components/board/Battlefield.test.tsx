import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Battlefield } from './Battlefield.js';

function makeMinion(id: string, overrides: Record<string, unknown> = {}) {
  return {
    instanceId: id,
    currentAttack: 3,
    currentHealth: 4,
    currentMaxHealth: 4,
    garrisonTurns: 0,
    card: {
      id: `card-${id}`,
      name: `随从${id}`,
      type: 'MINION',
      cost: 2,
      attack: 3,
      health: 4,
      rarity: 'COMMON',
      keywords: [],
      description: '',
      civilization: 'CHINA',
    },
    ...overrides,
  };
}

describe('Battlefield target highlighting', () => {
  it('calls onTargetHover with instanceId when hovering a valid target', () => {
    const onTargetHover = vi.fn();
    const minions = [makeMinion('m1'), makeMinion('m2')];
    const validTargetIds = new Set(['m1']);

    const { container } = render(
      <Battlefield
        minions={minions}
        isOpponent
        validTargetIds={validTargetIds}
        hoveredTargetId={null}
        onTargetHover={onTargetHover}
      />,
    );

    // Find the wrapper divs with data-anchor-id
    const m1Wrapper = container.querySelector('[data-anchor-id="minion:m1"]') as HTMLElement;
    expect(m1Wrapper).not.toBeNull();

    fireEvent.pointerEnter(m1Wrapper);
    expect(onTargetHover).toHaveBeenCalledWith('m1');
  });

  it('does NOT call onTargetHover when hovering a non-valid target', () => {
    const onTargetHover = vi.fn();
    const minions = [makeMinion('m1'), makeMinion('m2')];
    const validTargetIds = new Set(['m1']); // only m1 is valid

    const { container } = render(
      <Battlefield
        minions={minions}
        isOpponent
        validTargetIds={validTargetIds}
        hoveredTargetId={null}
        onTargetHover={onTargetHover}
      />,
    );

    const m2Wrapper = container.querySelector('[data-anchor-id="minion:m2"]') as HTMLElement;
    expect(m2Wrapper).not.toBeNull();

    fireEvent.pointerEnter(m2Wrapper);
    expect(onTargetHover).not.toHaveBeenCalled();
  });

  it('calls onTargetHover(null) on pointerLeave from hovered target', () => {
    const onTargetHover = vi.fn();
    const minions = [makeMinion('m1')];
    const validTargetIds = new Set(['m1']);

    const { container } = render(
      <Battlefield
        minions={minions}
        isOpponent
        validTargetIds={validTargetIds}
        hoveredTargetId="m1"
        onTargetHover={onTargetHover}
      />,
    );

    const m1Wrapper = container.querySelector('[data-anchor-id="minion:m1"]') as HTMLElement;
    fireEvent.pointerLeave(m1Wrapper);
    expect(onTargetHover).toHaveBeenCalledWith(null);
  });

  it('does NOT call onTargetHover(null) on pointerLeave if minion is not hovered', () => {
    const onTargetHover = vi.fn();
    const minions = [makeMinion('m1')];
    const validTargetIds = new Set(['m1']);

    // hoveredTargetId is null — the minion is not currently hovered
    const { container } = render(
      <Battlefield
        minions={minions}
        isOpponent
        validTargetIds={validTargetIds}
        hoveredTargetId={null}
        onTargetHover={onTargetHover}
      />,
    );

    const m1Wrapper = container.querySelector('[data-anchor-id="minion:m1"]') as HTMLElement;
    fireEvent.pointerLeave(m1Wrapper);
    expect(onTargetHover).not.toHaveBeenCalled();
  });

  it('passes validTarget prop to CardComponent for highlighted rendering', () => {
    const minions = [makeMinion('m1')];
    const validTargetIds = new Set(['m1']);

    const { container } = render(
      <Battlefield
        minions={minions}
        isOpponent
        validTargetIds={validTargetIds}
        hoveredTargetId="m1"
      />,
    );

    // The CardComponent renders with ring-2 ring-red-400 when validTarget=true
    const cardEl = container.querySelector('.ring-red-400');
    expect(cardEl).not.toBeNull();
  });

  it('does not show red ring when minion is not hovered', () => {
    const minions = [makeMinion('m1')];
    const validTargetIds = new Set(['m1']);

    const { container } = render(
      <Battlefield
        minions={minions}
        isOpponent
        validTargetIds={validTargetIds}
        hoveredTargetId={null}
      />,
    );

    const cardEl = container.querySelector('.ring-red-400');
    expect(cardEl).toBeNull();
  });

  it('shows green glow for actionable own minions', () => {
    const minions = [makeMinion('m1')];
    const actionableIds = new Set(['m1']);

    const { container } = render(
      <Battlefield
        minions={minions}
        actionableIds={actionableIds}
      />,
    );

    // actionable cards get emerald ring
    const cardEl = container.querySelector('.ring-emerald-400\\/70');
    expect(cardEl).not.toBeNull();
  });
});
