import { describe, expect, it, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, within, cleanup } from '@testing-library/react';
import { CardComponent } from './CardComponent.js';
import { useLocaleStore } from '../../stores/localeStore.js';

afterEach(() => {
  cleanup();
  useLocaleStore.setState({ locale: 'zh-CN' });
});

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

  it('renders localized card-back mark when locale is en-US', () => {
    useLocaleStore.setState({ locale: 'en-US' });
    const { container } = render(<CardComponent card={makeCard()} isHidden />);
    expect(container.textContent).toContain('K');
    expect(container.textContent).not.toContain('帝');
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

describe('CardComponent – locale', () => {
  it('uses English type badge abbreviations when locale is en-US', () => {
    useLocaleStore.setState({ locale: 'en-US' });
    const { container } = render(
      <CardComponent card={makeCard()} instance={makeInstance()} />,
    );
    const badge = within(container).getByTestId('card-type-badge');
    expect(badge.textContent).not.toContain('兵');
    expect(badge.textContent).toContain('M');
  });
});

describe('CardComponent – redesign structure', () => {
  it('renders 120×172 card dimensions', () => {
    const { container } = render(
      <CardComponent card={makeCard()} instance={makeInstance()} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe('120px');
    expect(root.style.height).toBe('172px');
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

  it('renders a description snippet for non-detail cards', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          type: 'STRATAGEM',
          description: '持续妙计：所有友方生物获得+2攻击力直到回合结束。',
        })}
        size="collection"
      />,
    );

    const snippet = within(container).getByTestId('card-description-snippet');
    expect(snippet.textContent).toContain('持续妙计');
  });

  it('preserves whitespace between English words in mixed-language snippets', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          type: 'STRATAGEM',
          description: 'Rush. 突袭突袭突袭突袭突袭',
        })}
        size="collection"
      />,
    );

    const snippet = within(container).getByTestId('card-description-snippet');
    expect(snippet.textContent).toBe('Rush. 突袭突袭突袭突袭突袭');
  });

  it('shows a detailed description tooltip on hover', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          type: 'STRATAGEM',
          description: '持续妙计：所有友方生物获得+2攻击力直到回合结束。',
        })}
        size="collection"
      />,
    );

    const root = within(container).getByTestId('card');
    expect(screen.queryByTestId('card-description-tooltip')).toBeNull();

    fireEvent.pointerEnter(root);

    const tooltip = screen.getByTestId('card-description-tooltip');
    expect(tooltip.getAttribute('role')).toBe('tooltip');
    expect(root.getAttribute('aria-describedby')).toBe(tooltip.getAttribute('id'));
    expect(tooltip.textContent).toContain('持续妙计');

    fireEvent.pointerLeave(root);
    expect(screen.queryByTestId('card-description-tooltip')).toBeNull();
  });

  it('flips the tooltip below the card when there is not enough space above', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          type: 'SORCERY',
          description: '随机消灭一个敌方生物，然后令对手随机弃一张牌。',
        })}
        size="collection"
      />,
    );

    const root = within(container).getByTestId('card') as HTMLDivElement;
    root.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 8,
      top: 8,
      right: 168,
      bottom: 254,
      left: 0,
      width: 168,
      height: 246,
      toJSON() {
        return {};
      },
    })) as () => DOMRect;

    fireEvent.pointerEnter(root);

    const tooltip = screen.getByTestId('card-description-tooltip');
    expect(tooltip.getAttribute('data-tooltip-placement')).toBe('below');

    fireEvent.pointerLeave(root);
  });

  it('uses three-line clamp for stratagem cards in collection size', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          type: 'STRATAGEM',
          description: '持续妙计：令所有友方生物在本回合获得+2攻击力并抽一张牌，然后使一个敌方生物本回合无法攻击。',
        })}
        size="collection"
      />,
    );

    const snippet = within(container).getByTestId('card-description-snippet') as HTMLElement;
    expect(snippet.style.webkitLineClamp).toBe('3');
    expect(snippet.textContent).toBe(
      '持续妙计：令所有友方生物在本回合获得+2攻击力并抽一张牌，然后使一个敌方生物本回合无法攻击。',
    );
  });

  it('renders punctuation in its original position without manual rewriting', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          type: 'STRATAGEM',
          description: '一二三四五六七八九十。十二三四五六七八九十',
        })}
        size="collection"
      />,
    );

    const snippet = within(container).getByTestId('card-description-snippet');
    expect(snippet.textContent).toBe('一二三四五六七八九十。十二三四五六七八九十');
  });

  it('does not render a description snippet when description is empty', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({ type: 'STRATAGEM', description: '' })}
        size="collection"
      />,
    );

    expect(container.querySelector('[data-testid="card-description-snippet"]')).toBeNull();
  });

  it('does not add an ellipsis when the summary fits exactly on one line', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          type: 'STRATAGEM',
          description: '一二三四五六七八九十',
        })}
        size="collection"
      />,
    );

    expect(container.querySelector('[data-testid="card-description-snippet"]')?.textContent).toBe('一二三四五六七八九十');
  });

  it('uses a wider tooltip preset for sorcery cards', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          type: 'SORCERY',
          description: '随机消灭一个敌方生物，然后令对手随机弃一张牌。',
        })}
        size="collection"
      />,
    );

    fireEvent.pointerEnter(within(container).getByTestId('card'));

    const tooltip = screen.getByTestId('card-description-tooltip');
    expect(tooltip.getAttribute('data-tooltip-size')).toBe('wide');

    fireEvent.pointerLeave(within(container).getByTestId('card'));
  });

  it('uses a large tooltip preset for general cards and shows their skills', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          type: 'GENERAL',
          description: '冲锋。技能：强袭、号令、坚守。',
          generalSkills: [
            { name: '强袭', description: '对一个敌方生物造成4点伤害', cost: 2, usesPerTurn: 1, effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} } },
            { name: '号令', description: '所有友方生物获得+2攻击力', cost: 3, usesPerTurn: 2, effect: { trigger: 'ON_PLAY', type: 'MODIFY_STAT', params: {} } },
          ],
        })}
        size="collection"
      />,
    );

    fireEvent.pointerEnter(within(container).getByTestId('card'));

    const tooltip = screen.getByTestId('card-description-tooltip');
    expect(tooltip.getAttribute('data-tooltip-size')).toBe('large');
    const skills = document.querySelectorAll('[data-testid="card-tooltip-skill"]');
    expect(skills.length).toBe(2);
    expect(tooltip.textContent).toContain('将领技能');
    expect(tooltip.textContent).toContain('强袭');
    expect(tooltip.textContent).toContain('号令');
    expect(tooltip.textContent).toContain('费用 2');
    expect(tooltip.textContent).toContain('每回合 1 次');
    expect(tooltip.textContent).toContain('费用 3');
    expect(tooltip.textContent).toContain('每回合 2 次');

    fireEvent.pointerLeave(within(container).getByTestId('card'));
  });

  it('uses a large tooltip preset for emperor cards and shows hero skill metadata', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          name: '秦始皇',
          type: 'EMPEROR',
          description: '雄才大略的帝王。',
          heroSkill: {
            name: '书同文',
            description: '抽两张牌，然后弃一张牌。',
            cost: 2,
            cooldown: 1,
            effect: { trigger: 'ON_PLAY', type: 'DRAW', params: {} },
          },
        })}
        size="collection"
      />,
    );

    fireEvent.pointerEnter(within(container).getByTestId('card'));

    const tooltip = screen.getByTestId('card-description-tooltip');
    expect(tooltip.getAttribute('data-tooltip-size')).toBe('large');
    expect(tooltip.textContent).toContain('帝王技能');
    expect(tooltip.textContent).toContain('书同文');
    expect(tooltip.textContent).toContain('抽两张牌');
    expect(tooltip.textContent).toContain('费用 2');
    expect(tooltip.textContent).toContain('冷却 1 回合');

    fireEvent.pointerLeave(within(container).getByTestId('card'));
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

  it('uses a larger portrait ellipse that occupies most of the card face', () => {
    const { container } = render(
      <CardComponent card={makeCard()} instance={makeInstance()} />,
    );

    const artGroup = container.querySelector('[data-testid="card-art"]') as SVGElement;
    const ellipse = artGroup.querySelector('ellipse') as SVGElement;
    expect(Number(ellipse.getAttribute('rx'))).toBeGreaterThanOrEqual(28);
    expect(Number(ellipse.getAttribute('ry'))).toBeGreaterThanOrEqual(24);
  });

  it('localizes english card copy before rendering', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({
          name: 'Marine',
          type: 'MINION',
          description: 'Rush.',
          keywords: ['RUSH'],
        })}
      />,
    );

    expect(container.textContent).toContain('海军陆战队');
    expect(container.textContent).toContain('突袭');
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

describe('CardComponent – bottom banner', () => {
  it('renders the ATK badge inside the bottom banner band (geometric center y=160)', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance()} />,
    );
    const atkPath = container.querySelector('[data-testid="card-atk"] path');
    expect(atkPath?.getAttribute('d')).toBe('M16 153 L28 160 L16 167 L4 160 Z');
  });

  it('renders the HP badge inside the bottom banner band (cy=160)', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance()} />,
    );
    const hpCircle = container.querySelector('[data-testid="card-hp"] circle');
    expect(hpCircle?.getAttribute('cy')).toBe('160');
  });

  it('renders a dedicated bottom banner rectangle for ATK/HP', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'MINION' })} instance={makeInstance()} />,
    );
    const banner = container.querySelector('[data-testid="card-bottom-banner"]');
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute('y')).toBe('148');
    expect(banner?.getAttribute('height')).toBe('24');
  });

  it('omits the bottom banner on cards without ATK/HP (e.g. stratagem)', () => {
    const { container } = render(
      <CardComponent card={makeCard({ type: 'STRATAGEM' })} size="collection" />,
    );
    expect(container.querySelector('[data-testid="card-bottom-banner"]')).toBeNull();
    expect(container.querySelector('[data-testid="card-atk"]')).toBeNull();
    expect(container.querySelector('[data-testid="card-hp"]')).toBeNull();
  });
});

describe('CardComponent – HTML text layer', () => {
  it('renders the description in an HTML overlay layer (not as SVG <text>)', () => {
    const { container } = render(
      <CardComponent
        card={makeCard({ type: 'STRATAGEM', description: 'Hello world description' })}
        size="collection"
      />,
    );
    const snippet = within(container).getByTestId('card-description-snippet');
    expect(snippet.tagName).toBe('DIV');
    expect(snippet.textContent).toBe('Hello world description');
  });
});
