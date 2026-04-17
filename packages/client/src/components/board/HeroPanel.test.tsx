import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HeroPanel } from './HeroPanel';
import { useLocaleStore } from '../../stores/localeStore';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);

describe('HeroPanel', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'zh-CN' });
  });

  it('shows tooltip on skill button hover when skillDescription provided', () => {
    render(
      <HeroPanel
        heroName="腓特烈大帝"
        health={30}
        maxHealth={30}
        armor={0}
        skillName="斜线阵"
        skillCost={1}
        skillDescription="对一个敌方生物造成2点伤害"
        skillCooldown={1}
        canUseSkill
      />,
    );
    const button = screen.getByRole('button');
    fireEvent.pointerEnter(button.parentElement!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('对一个敌方生物造成2点伤害');
  });

  it('does not show tooltip when skillDescription is empty', () => {
    render(
      <HeroPanel
        heroName="腓特烈大帝"
        health={30}
        maxHealth={30}
        armor={0}
        skillName="斜线阵"
        skillCost={1}
        canUseSkill
      />,
    );
    const button = screen.getByRole('button');
    fireEvent.pointerEnter(button.parentElement!);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
