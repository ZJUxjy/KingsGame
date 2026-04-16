import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useLocaleStore } from '../../stores/localeStore.js';
import { MinisterPanel } from './MinisterPanel.js';

describe('MinisterPanel', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'zh-CN' });
  });

  afterEach(() => {
    cleanup();
    useLocaleStore.setState({ locale: 'zh-CN' });
  });

  it('localizes minister names and active skill labels in zh-CN mode', () => {
    render(
      <MinisterPanel
        ministers={[
          {
            id: 'usa_franklin',
            emperorId: 'usa_lincoln',
            name: 'Benjamin Franklin',
            type: 'STRATEGIST',
            activeSkill: {
              name: 'Diplomacy',
              description: 'Draw 1 card',
              cost: 1,
              effect: {
                trigger: 'ON_PLAY',
                type: 'DRAW',
                params: { count: 1 },
              },
            },
            skillUsedThisTurn: false,
            cooldown: 0,
          },
          {
            id: 'usa_hamilton',
            emperorId: 'usa_lincoln',
            name: 'Alexander Hamilton',
            type: 'ADMINISTRATOR',
            activeSkill: {
              name: 'National Bank',
              description: 'Gain 1 armor',
              cost: 1,
              effect: {
                trigger: 'ON_PLAY',
                type: 'GAIN_ARMOR',
                params: { amount: 1 },
              },
            },
            skillUsedThisTurn: false,
            cooldown: 0,
          },
        ]}
        activeIndex={0}
        canUseSkill
        canSwitch
      />,
    );

    expect(screen.getByText('本杰明·富兰克林')).toBeTruthy();
    expect(screen.getByRole('button', { name: '外交斡旋(1)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '亚历山大·汉密尔顿' })).toBeTruthy();
  });
});