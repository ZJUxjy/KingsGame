import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { SidePanel } from './SidePanel.js';

afterEach(cleanup);

function defaultProps(overrides: Partial<Parameters<typeof SidePanel>[0]> = {}) {
  return {
    enemyDeckCount: 15,
    playerDeckCount: 20,
    energyCrystal: 3,
    maxEnergy: 5,
    turnNumber: 4,
    isMyTurn: true,
    onEndTurn: vi.fn(),
    ...overrides,
  };
}

describe('SidePanel', () => {
  it('renders enemy deck count', () => {
    const { getByText } = render(<SidePanel {...defaultProps({ enemyDeckCount: 12 })} />);
    expect(getByText('12')).toBeTruthy();
  });

  it('renders player deck count', () => {
    const { getByText } = render(<SidePanel {...defaultProps({ playerDeckCount: 18 })} />);
    expect(getByText('18')).toBeTruthy();
  });

  it('renders mana crystals filled/empty', () => {
    const { container } = render(<SidePanel {...defaultProps({ energyCrystal: 2, maxEnergy: 4 })} />);
    const filled = container.querySelectorAll('[data-mana="filled"]');
    const empty = container.querySelectorAll('[data-mana="empty"]');
    expect(filled.length).toBe(2);
    expect(empty.length).toBe(2);
  });

  it('renders turn number', () => {
    const { getByText } = render(<SidePanel {...defaultProps({ turnNumber: 7 })} />);
    expect(getByText(/7/)).toBeTruthy();
  });

  it('shows my-turn label when isMyTurn is true', () => {
    const { getByText } = render(<SidePanel {...defaultProps({ isMyTurn: true })} />);
    expect(getByText(/你的回合/)).toBeTruthy();
  });

  it('shows enemy-turn label when isMyTurn is false', () => {
    const { getByText } = render(<SidePanel {...defaultProps({ isMyTurn: false })} />);
    expect(getByText(/对方回合/)).toBeTruthy();
  });

  it('calls onEndTurn when end-turn button clicked while isMyTurn', () => {
    const onEndTurn = vi.fn();
    const { getByRole } = render(<SidePanel {...defaultProps({ isMyTurn: true, onEndTurn })} />);
    const btn = getByRole('button', { name: /结束回合/ });
    fireEvent.click(btn);
    expect(onEndTurn).toHaveBeenCalledTimes(1);
  });

  it('end-turn button is disabled when not my turn', () => {
    const onEndTurn = vi.fn();
    const { getByRole } = render(<SidePanel {...defaultProps({ isMyTurn: false, onEndTurn })} />);
    const btn = getByRole('button', { name: /结束回合/ });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(btn);
    expect(onEndTurn).not.toHaveBeenCalled();
  });

  it('renders enemy deck widget with stacked card shapes', () => {
    const { container } = render(<SidePanel {...defaultProps()} />);
    const deckWidgets = container.querySelectorAll('[data-deck-widget]');
    expect(deckWidgets.length).toBe(2);
  });

  it('renders player deck widget with stacked card shapes', () => {
    const { container } = render(<SidePanel {...defaultProps({ playerDeckCount: 5 })} />);
    const playerWidget = container.querySelector('[data-deck-widget="player"]');
    expect(playerWidget).not.toBeNull();
    expect(playerWidget!.textContent).toContain('5');
  });

  it('renders two gold midline accent dividers', () => {
    const { container } = render(<SidePanel {...defaultProps()} />);
    const dividers = container.querySelectorAll('[data-midline-divider]');
    expect(dividers.length).toBe(2);
  });

  it('TurnIndicator inside SidePanel does NOT have its own end-turn button', () => {
    // SidePanel omits onEndTurn from TurnIndicator; the sidebar end-turn button is separate
    const { getAllByRole } = render(<SidePanel {...defaultProps()} />);
    const buttons = getAllByRole('button');
    // Only one button: the SidePanel's own end-turn button
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain('结束回合');
  });

  it('renders 法力水晶 mana label', () => {
    const { getByText } = render(<SidePanel {...defaultProps()} />);
    expect(getByText('法力水晶')).toBeTruthy();
  });
});
