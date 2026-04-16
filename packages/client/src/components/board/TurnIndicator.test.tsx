import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { TurnIndicator } from './TurnIndicator.js';

afterEach(cleanup);

describe('TurnIndicator (simplified for sidebar embedding)', () => {
  it('displays the turn number', () => {
    const { getByText } = render(
      <TurnIndicator turnNumber={5} isMyTurn={true} onEndTurn={vi.fn()} />,
    );
    expect(getByText(/5/)).toBeTruthy();
  });

  it('shows "你的回合" when isMyTurn is true', () => {
    const { getByText } = render(
      <TurnIndicator turnNumber={1} isMyTurn={true} onEndTurn={vi.fn()} />,
    );
    expect(getByText(/你的回合/)).toBeTruthy();
  });

  it('shows "对方回合" when isMyTurn is false', () => {
    const { getByText } = render(
      <TurnIndicator turnNumber={2} isMyTurn={false} onEndTurn={vi.fn()} />,
    );
    expect(getByText(/对方回合/)).toBeTruthy();
  });

  it('does NOT render an end-turn button', () => {
    const { queryByRole } = render(
      <TurnIndicator turnNumber={3} isMyTurn={true} onEndTurn={vi.fn()} />,
    );
    expect(queryByRole('button')).toBeNull();
  });
});
