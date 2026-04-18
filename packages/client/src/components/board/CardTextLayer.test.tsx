import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { CardTextLayer } from './CardTextLayer.js';
import { useLocaleStore } from '../../stores/localeStore.js';

afterEach(() => {
  cleanup();
  useLocaleStore.setState({ locale: 'zh-CN' });
});

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

describe('CardTextLayer', () => {
  it('renders the full card name without truncation in the DOM', () => {
    const { container } = render(
      <CardTextLayer
        card={makeCard({ name: '一个非常非常非常非常长的卡名' })}
        size="battlefield"
      />,
    );
    const name = within(container).getByTestId('card-name');
    expect(name.textContent).toBe('一个非常非常非常非常长的卡名');
  });

  it('renders the full description without manual ellipsis or whitespace stripping', () => {
    const { container } = render(
      <CardTextLayer
        card={makeCard({
          type: 'STRATAGEM',
          description: 'Opponent discards a random card. You gain 1 mana.',
        })}
        size="collection"
      />,
    );
    const snippet = within(container).getByTestId('card-description-snippet');
    expect(snippet.textContent).toBe('Opponent discards a random card. You gain 1 mana.');
    expect(snippet.textContent).not.toContain('Opponentdiscards');
  });

  it('omits the description block when description is empty', () => {
    const { container } = render(
      <CardTextLayer card={makeCard({ description: '' })} size="battlefield" />,
    );
    expect(container.querySelector('[data-testid="card-description-snippet"]')).toBeNull();
  });

  it('omits the keyword row when there are no keywords', () => {
    const { container } = render(
      <CardTextLayer card={makeCard({ keywords: [] })} size="battlefield" />,
    );
    expect(container.querySelector('[data-testid="card-keywords"]')).toBeNull();
  });

  it('renders the keyword row when keywords are present', () => {
    const { container } = render(
      <CardTextLayer
        card={makeCard({ keywords: ['CHARGE'] })}
        size="battlefield"
      />,
    );
    const keywords = within(container).getByTestId('card-keywords');
    expect(keywords.textContent).toContain('冲锋');
  });

  it('applies line-clamp 2 for battlefield/hand and 3 for collection', () => {
    const { container: hand } = render(
      <CardTextLayer
        card={makeCard({ description: '长描述' })}
        size="battlefield"
      />,
    );
    const handSnippet = within(hand).getByTestId('card-description-snippet');
    expect((handSnippet as HTMLElement).style.webkitLineClamp).toBe('2');

    const { container: coll } = render(
      <CardTextLayer
        card={makeCard({ description: '长描述' })}
        size="collection"
      />,
    );
    const collSnippet = within(coll).getByTestId('card-description-snippet');
    expect((collSnippet as HTMLElement).style.webkitLineClamp).toBe('3');
  });

  it('uses pointer-events-none so the SVG layer keeps receiving clicks', () => {
    const { container } = render(
      <CardTextLayer card={makeCard()} size="battlefield" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('pointer-events-none');
  });
});
