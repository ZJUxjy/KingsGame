import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MinisterPanel } from './MinisterPanel.js';

describe('MinisterPanel', () => {
  it('localizes minister names and active skill labels before rendering', () => {
    const { getByText } = render(
      <MinisterPanel
        ministers={[
          {
            id: 'usa_franklin',
            name: 'Benjamin Franklin',
            type: 'STRATEGIST',
            activeSkill: {
              name: 'Diplomacy',
              cost: 1,
              description: 'Draw 1 card',
            },
            skillUsedThisTurn: false,
            cooldown: 0,
          },
          {
            id: 'uk_pitt',
            name: 'William Pitt',
            type: 'STRATEGIST',
            activeSkill: {
              name: 'Parliament Act',
              cost: 1,
              description: 'Draw a card',
            },
            skillUsedThisTurn: false,
            cooldown: 1,
          },
        ]}
        activeIndex={0}
        canUseSkill
        canSwitch
      />,
    );

    expect(getByText('本杰明·富兰克林')).toBeTruthy();
    expect(getByText('外交斡旋(1)')).toBeTruthy();
    expect(getByText('小威廉·皮特')).toBeTruthy();
  });
});