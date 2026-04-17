import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SkillTooltip } from './SkillTooltip';
import { useLocaleStore } from '../../stores/localeStore';

// Helper to render SkillTooltip with default props
function renderTooltip(overrides: Partial<Parameters<typeof SkillTooltip>[0]> = {}) {
  return render(
    <SkillTooltip
      name="斜线阵"
      description="对一个敌方生物造成2点伤害"
      cost={1}
      {...overrides}
    >
      <button type="button">Skill Button</button>
    </SkillTooltip>,
  );
}

describe('SkillTooltip', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'zh-CN' });
  });

  afterEach(cleanup);

  it('renders children without tooltip initially', () => {
    renderTooltip();
    expect(screen.getByText('Skill Button')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on pointer enter', () => {
    renderTooltip();
    const wrapper = screen.getByText('Skill Button').parentElement!;
    fireEvent.pointerEnter(wrapper);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('斜线阵');
    expect(tooltip).toHaveTextContent('对一个敌方生物造成2点伤害');
  });

  it('hides tooltip on pointer leave', () => {
    renderTooltip();
    const wrapper = screen.getByText('Skill Button').parentElement!;
    fireEvent.pointerEnter(wrapper);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.pointerLeave(wrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows cooldown badge with localized text', () => {
    renderTooltip({ cooldown: 2 });
    const wrapper = screen.getByText('Skill Button').parentElement!;
    fireEvent.pointerEnter(wrapper);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('冷却 2 回合');
  });

  it('shows uses-per-turn badge with localized text', () => {
    renderTooltip({ usesPerTurn: 1 });
    const wrapper = screen.getByText('Skill Button').parentElement!;
    fireEvent.pointerEnter(wrapper);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('每回合 1 次');
  });

  it('tooltip has pointer-events: none', () => {
    renderTooltip();
    const wrapper = screen.getByText('Skill Button').parentElement!;
    fireEvent.pointerEnter(wrapper);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.style.pointerEvents).toBe('none');
  });

  it('does not show tooltip when name is empty', () => {
    renderTooltip({ name: '' });
    const wrapper = screen.getByText('Skill Button').parentElement!;
    fireEvent.pointerEnter(wrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
