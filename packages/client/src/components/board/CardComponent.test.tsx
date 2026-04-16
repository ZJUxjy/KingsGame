import { describe, expect, it } from 'vitest';
import { render, within } from '@testing-library/react';
import { CardComponent } from './CardComponent.js';

function collectIds(root: Element): string[] {
  return Array.from(root.querySelectorAll('[id]'))
    .map((node) => node.getAttribute('id') ?? '')
    .filter(Boolean);
}

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
    expect(container.querySelector('[data-testid="card-back"]')).not.toBeNull();
    // Decorative character should be visible
    expect(container.textContent).toContain('帝');
  });

  it('renders card-back design when no card provided', () => {
    const { container } = render(<CardComponent isHidden />);
    expect(container.textContent).toContain('帝');
  });

  it('creates unique SVG ids for duplicate hidden cards', () => {
    const { container } = render(
      <>
        <CardComponent card={makeCard({ id: 'duplicate-card' })} isHidden />
        <CardComponent card={makeCard({ id: 'duplicate-card' })} isHidden />
      </>,
    );

    const backs = container.querySelectorAll('[data-testid="card-back"]');
    expect(backs).toHaveLength(2);

    const firstIds = collectIds(backs[0]);
    const secondIds = collectIds(backs[1]);

    expect(firstIds.length).toBeGreaterThan(0);
    expect(secondIds.length).toBeGreaterThan(0);
    expect(firstIds.filter((id) => secondIds.includes(id))).toHaveLength(0);
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

  it('renders the collection size without throwing', () => {
    const { container } = render(
      <CardComponent card={makeCard()} size="collection" />,
    );

    expect(within(container).getByTestId('card')).toBeTruthy();
  });

  it('renders collection size for the real tile path without instance stats', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'STRATAGEM' })} size="collection" />,
    );

    expect(within(container).getByTestId('card')).toBeTruthy();
    expect(container.querySelector('[data-testid="card-atk"]')).toBeNull();
    expect(container.querySelector('[data-testid="card-hp"]')).toBeNull();
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
    expect(costEl.querySelector('path')).not.toBeNull();
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
    expect(artArea.querySelector('ellipse')).not.toBeNull();
  });

  it('renders type badge pill for MINION', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance()} />,
    );
    expect(within(container).getByTestId('card-type-badge')).not.toBeNull();
  });

  it('renders attack and health for hand cards without instance data', () => {
    const { container } = render(
      <CardComponent card={makeCard({ attack: 6, health: 7 })} />,
    );

    expect(within(container).getByTestId('card-atk').textContent).toBe('6');
    expect(within(container).getByTestId('card-hp').textContent).toBe('7');
  });

  it('renders Chinese type badge for STRATAGEM', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'STRATAGEM' })} />,
    );

    expect(within(container).getByTestId('card-type-badge').textContent).toBe('计');
  });

  it('renders Chinese type badge for SORCERY', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'SORCERY' })} />,
    );

    expect(within(container).getByTestId('card-type-badge').textContent).toBe('术');
  });

  it('renders ATK badge for MINION card', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance({ currentAttack: 3 })} />,
    );
    const atkBadge = within(container).getByTestId('card-atk');
    expect(atkBadge.textContent).toBe('3');
    expect(atkBadge.querySelector('path')).not.toBeNull();
  });

  it('renders HP badge for MINION card', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance({ currentHealth: 4 })} />,
    );
    const hpBadge = within(container).getByTestId('card-hp');
    expect(hpBadge.textContent).toBe('4');
    expect(hpBadge.querySelector('circle')).not.toBeNull();
  });

  it('applies damaged color token when HP is below max', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({ type: 'MINION' })}
        instance={makeInstance({ currentHealth: 2, currentMaxHealth: 4 })}
      />,
    );
    const hpBadge = within(container).getByTestId('card-hp');
    expect(hpBadge.querySelector('text')?.getAttribute('fill')).toBe('var(--hp-text-damaged)');
  });

  it('applies full-health color token when HP equals max', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({ type: 'MINION' })}
        instance={makeInstance({ currentHealth: 4, currentMaxHealth: 4 })}
      />,
    );
    const hpBadge = within(container).getByTestId('card-hp');
    expect(hpBadge.querySelector('text')?.getAttribute('fill')).toBe('var(--hp-text-full)');
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

  it('creates unique SVG ids for duplicate visible cards', () => {
    const { container } = render(
      <>
        <CardComponent
          card={makeCard({ id: 'duplicate-card', name: '重复牌' })}
          instance={makeInstance({ instanceId: 'inst-a' })}
        />
        <CardComponent
          card={makeCard({ id: 'duplicate-card', name: '重复牌' })}
          instance={makeInstance({ instanceId: 'inst-b' })}
        />
      </>,
    );

    const cards = container.querySelectorAll('[data-testid="card"]');
    expect(cards).toHaveLength(2);

    const firstIds = collectIds(cards[0]);
    const secondIds = collectIds(cards[1]);

    expect(firstIds.length).toBeGreaterThan(0);
    expect(secondIds.length).toBeGreaterThan(0);
    expect(firstIds.filter((id) => secondIds.includes(id))).toHaveLength(0);
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
