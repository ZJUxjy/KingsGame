import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { TurnIndicator } from './TurnIndicator.js';

afterEach(cleanup);

describe('TurnIndicator (display-only, for sidebar embedding)', () => {
  it('displays the turn number', () => {
    const { getByText } = render(
      <TurnIndicator turnNumber={5} isMyTurn={true} />,
    );
    expect(getByText(/5/)).toBeTruthy();
  });

  it('shows "你的回合" when isMyTurn is true', () => {
    const { getByText } = render(
      <TurnIndicator turnNumber={1} isMyTurn={true} />,
    );
    expect(getByText(/你的回合/)).toBeTruthy();
  });

  it('shows "对方回合" when isMyTurn is false', () => {
    const { getByText } = render(
      <TurnIndicator turnNumber={2} isMyTurn={false} />,
    );
    expect(getByText(/对方回合/)).toBeTruthy();
  });

  it('does NOT render an end-turn button when onEndTurn is omitted', () => {
    const { queryByRole } = render(
      <TurnIndicator turnNumber={3} isMyTurn={true} />,
    );
    expect(queryByRole('button')).toBeNull();
  });
});

describe('TurnIndicator (standalone with end-turn, for GameBoard path)', () => {
  it('renders an end-turn button when onEndTurn is provided', () => {
    const { getByRole } = render(
      <TurnIndicator turnNumber={1} isMyTurn={true} onEndTurn={vi.fn()} />,
    );
    expect(getByRole('button')).toBeTruthy();
  });

  it('calls onEndTurn when button is clicked', () => {
    const onEndTurn = vi.fn();
    const { getByRole } = render(
      <TurnIndicator turnNumber={1} isMyTurn={true} onEndTurn={onEndTurn} />,
    );
    fireEvent.click(getByRole('button'));
    expect(onEndTurn).toHaveBeenCalledTimes(1);
  });

  it('end-turn button is disabled when isMyTurn is false', () => {
    const onEndTurn = vi.fn();
    const { getByRole } = render(
      <TurnIndicator turnNumber={2} isMyTurn={false} onEndTurn={onEndTurn} />,
    );
    const btn = getByRole('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(onEndTurn).not.toHaveBeenCalled();
  });

  it('still displays the turn number alongside the button', () => {
    const { getByText } = render(
      <TurnIndicator turnNumber={7} isMyTurn={true} onEndTurn={vi.fn()} />,
    );
    expect(getByText(/7/)).toBeTruthy();
  });
});
