// packages/client/test/hooks/useTargeting.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTargeting } from '../../src/hooks/useTargeting.js';

describe('useTargeting', () => {
  const defaultDeps = {
    selectedAttacker: null as string | null,
    pendingSkillAction: null as any,
    playerIndex: 0 as number | null,
    validActions: [] as any[],
    attack: vi.fn(),
    useHeroSkill: vi.fn(),
    useMinisterSkill: vi.fn(),
    useGeneralSkill: vi.fn(),
    clearTargetingSelection: vi.fn(),
  };

  it('initializes with null pointer and hovered target', () => {
    const { result } = renderHook(() => useTargeting(defaultDeps));
    expect(result.current.pointerPosition).toBeNull();
    expect(result.current.hoveredTarget).toBeNull();
    expect(result.current.arrowSourceAnchorId).toBeNull();
  });

  it('computes arrowSourceAnchorId from selectedAttacker', () => {
    const { result } = renderHook(() =>
      useTargeting({ ...defaultDeps, selectedAttacker: 'minion-1' }),
    );
    expect(result.current.arrowSourceAnchorId).toBe('minion:minion-1');
  });

  it('computes arrowSourceAnchorId from pendingSkillAction HERO', () => {
    const { result } = renderHook(() =>
      useTargeting({ ...defaultDeps, pendingSkillAction: { type: 'HERO' } }),
    );
    expect(result.current.arrowSourceAnchorId).toBe('hero-skill:me');
  });

  it('computes arrowSourceAnchorId from pendingSkillAction MINISTER', () => {
    const { result } = renderHook(() =>
      useTargeting({ ...defaultDeps, pendingSkillAction: { type: 'MINISTER' } }),
    );
    expect(result.current.arrowSourceAnchorId).toBe('minister-skill:me');
  });

  it('computes arrowSourceAnchorId from pendingSkillAction GENERAL', () => {
    const { result } = renderHook(() =>
      useTargeting({ ...defaultDeps, pendingSkillAction: { type: 'GENERAL', instanceId: 'g1', skillIndex: 2 } }),
    );
    expect(result.current.arrowSourceAnchorId).toBe('general-skill:g1:2');
  });

  it('sets hovered target via setHoveredTarget', () => {
    const { result } = renderHook(() =>
      useTargeting({ ...defaultDeps, selectedAttacker: 'a1' }),
    );
    act(() => {
      result.current.setHoveredTarget({ type: 'MINION', instanceId: 'e1' });
    });
    expect(result.current.hoveredTarget).toEqual({ type: 'MINION', instanceId: 'e1' });
  });

  it('clearTargetingUiState resets hovered and pointer', () => {
    const clearFn = vi.fn();
    const { result } = renderHook(() =>
      useTargeting({ ...defaultDeps, selectedAttacker: 'a1', clearTargetingSelection: clearFn }),
    );
    act(() => {
      result.current.setHoveredTarget({ type: 'MINION', instanceId: 'e1' });
    });
    act(() => {
      result.current.clearTargetingUiState();
    });
    expect(result.current.hoveredTarget).toBeNull();
    expect(result.current.pointerPosition).toBeNull();
    expect(clearFn).toHaveBeenCalled();
  });
});
