import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { CardComponent } from './CardComponent.js';

function makeCard(overrides: Record<string, unknown> = {}) {
  return {
    id: 'card-1',
    name: '步兵',
    type: 'MINION',
    cost: 3,
    attack: 2,
    health: 4,
    rarity: 'COMMON',
    keywords: [],
    description: '一个普通步兵',
    civilization: 'CHINA',
    ...overrides,
  } as any;
}

function makeInstance(overrides: Record<string, unknown> = {}) {
  return {
    instanceId: 'inst-1',
    currentAttack: 2,
    currentHealth: 4,
    currentMaxHealth: 4,
    garrisonTurns: 0,
    ...overrides,
  } as any;
}

describe('CardComponent – card back', () => {
  it('renders card-back design for isHidden=true', () => {
    const { container } = render(
      <CardComponent card={makeCard()} isHidden />,
    );
    // No cost badge, no stats — just back decoration
    expect(container.querySelector('[data-testid="card-cost"]')).toBeNull();
    // Decorative character should be visible
    expect(container.textContent).toContain('帝');
  });

  it('renders card-back design when no card provided', () => {
    const { container } = render(<CardComponent isHidden />);
    expect(container.textContent).toContain('帝');
  });
});

describe('CardComponent – redesign structure', () => {
  it('renders 90×130 card dimensions', () => {
    const { container } = render(
      <CardComponent card={makeCard()} instance={makeInstance()} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe('90px');
    expect(root.style.height).toBe('130px');
  });

  it('renders cost badge with card cost value', () => {
    const { container } = render(
      <CardComponent card={makeCard({ cost: 5 })} instance={makeInstance()} />,
    );
    const costEl = within(container).getByTestId('card-cost');
    expect(costEl.textContent).toBe('5');
  });

  it('renders cost badge with blue glow styling', () => {
    const { container } = render(
      <CardComponent card={makeCard()} instance={makeInstance()} />,
    );
    const costEl = within(container).getByTestId('card-cost');
    expect(costEl.style.boxShadow).toContain('var(--cost-glow)');
  });

  it('renders rarity border color for EPIC card', () => {
    const { container } = render(
      <CardComponent card={makeCard({ rarity: 'EPIC' })} instance={makeInstance()} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.border).toContain('var(--rarity-epic)');
  });

  it('renders rarity border color for LEGENDARY card', () => {
    const { container } = render(
      <CardComponent card={makeCard({ rarity: 'LEGENDARY' })} instance={makeInstance()} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.border).toContain('var(--rarity-legendary)');
  });

  it('renders type art area with type-specific gradient', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'SPELL' })} instance={makeInstance()} />,
    );
    const artArea = container.querySelector('[data-testid="card-art"]') as HTMLElement;
    expect(artArea).not.toBeNull();
    expect(artArea.style.background).toContain('var(--type-spell-from)');
  });

  it('renders type badge pill for MINION', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance()} />,
    );
    expect(within(container).getByTestId('card-type-badge')).not.toBeNull();
  });

  it('renders ATK badge for MINION card', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance({ currentAttack: 3 })} />,
    );
    const atkBadge = within(container).getByTestId('card-atk');
    expect(atkBadge.textContent).toBe('3');
    expect(atkBadge.style.background).toContain('var(--atk-from)');
  });

  it('renders HP badge for MINION card', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance({ currentHealth: 4 })} />,
    );
    const hpBadge = within(container).getByTestId('card-hp');
    expect(hpBadge.textContent).toBe('4');
    expect(hpBadge.style.background).toContain('var(--hp-from)');
  });

  it('applies damaged color token when HP is below max', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({ type: 'MINION' })}
        instance={makeInstance({ currentHealth: 2, currentMaxHealth: 4 })}
      />,
    );
    const hpBadge = within(container).getByTestId('card-hp');
    expect(hpBadge.style.color).toContain('var(--hp-text-damaged)');
  });

  it('applies full-health color token when HP equals max', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({ type: 'MINION' })}
        instance={makeInstance({ currentHealth: 4, currentMaxHealth: 4 })}
      />,
    );
    const hpBadge = within(container).getByTestId('card-hp');
    expect(hpBadge.style.color).toContain('var(--hp-text-full)');
  });

  it('does not render ATK/HP badges for SPELL card', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'SPELL' })} />,
    );
    expect(container.querySelector('[data-testid="card-atk"]')).toBeNull();
    expect(container.querySelector('[data-testid="card-hp"]')).toBeNull();
  });

  it('renders garrison overlay when garrisonTurns > 0', () => {
    const { container } = render(
      <CardComponent
        card={makeCard()}
        instance={makeInstance({ garrisonTurns: 2 })}
      />,
    );
    const overlay = within(container).getByTestId('garrison-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.textContent).toContain('驻守2');
  });

  it('does not render garrison overlay when garrisonTurns = 0', () => {
    const { container } = render(
      <CardComponent card={makeCard()} instance={makeInstance({ garrisonTurns: 0 })} />,
    );
    expect(container.querySelector('[data-testid="garrison-overlay"]')).toBeNull();
  });
});

describe('CardComponent – interactive states', () => {
  it('applies yellow ring class when selected', () => {
    const { container } = render(
      <CardComponent card={makeCard()} instance={makeInstance()} selected />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('ring-yellow-400');
  });

  it('applies emerald ring class when actionable', () => {
    const { container } = render(
      <CardComponent card={makeCard()} instance={makeInstance()} actionable />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('ring-emerald-400/70');
  });

  it('applies red ring class when validTarget', () => {
    const { container } = render(
      <CardComponent card={makeCard()} instance={makeInstance()} validTarget />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('ring-red-400');
  });
});
