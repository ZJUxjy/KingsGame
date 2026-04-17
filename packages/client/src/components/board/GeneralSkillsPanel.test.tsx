import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GeneralSkillsPanel } from './GeneralSkillsPanel';
import { useLocaleStore } from '../../stores/localeStore';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);

describe('GeneralSkillsPanel', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'zh-CN' });
  });

  it('shows tooltip on general skill button hover', () => {
    const generals = [
      {
        instanceId: 'gen-1',
        card: {
          name: '霍去病',
          generalSkills: [
            { name: '突袭', description: '对一个敌方生物造成3点伤害', cost: 0, usesPerTurn: 1 },
          ],
        },
      },
    ];
    render(
      <GeneralSkillsPanel
        generals={generals}
        availableSkillKeys={new Set(['gen-1:0'])}
        pendingSkillKey={null}
        onSkillPointerDown={() => {}}
      />,
    );
    const button = screen.getByRole('button', { name: /突袭/ });
    fireEvent.pointerEnter(button.parentElement!);
    expect(screen.getByRole('tooltip')).toHaveTextContent('对一个敌方生物造成3点伤害');
  });
});
