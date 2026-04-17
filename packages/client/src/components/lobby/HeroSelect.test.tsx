import { ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HeroSelect from './HeroSelect.js';
import { useDeckStore } from '../../stores/deckStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useLocaleStore } from '../../stores/localeStore.js';
import { getCivilizationMeta } from '@king-card/shared';

const initialState = useGameStore.getState();
const initialDeckState = useDeckStore.getState();
const qinIndex = ALL_EMPEROR_DATA_LIST.findIndex(
  (emperorData) => emperorData.emperorCard.id === 'china_qin_shihuang',
);

describe('HeroSelect', () => {
  const joinGame = vi.fn();
  const joinPvp = vi.fn();

  beforeEach(() => {
    joinGame.mockReset();
    joinPvp.mockReset();
    useLocaleStore.setState({ locale: 'zh-CN' });
    useDeckStore.setState(initialDeckState, true);
    window.localStorage.clear();
    useGameStore.setState({
      ...initialState,
      connected: true,
      error: null,
      gameMode: 'pve',
      joinGame,
      joinPvp,
    });
  });

  afterEach(() => {
    cleanup();
    useGameStore.setState(initialState, true);
    useDeckStore.setState(initialDeckState, true);
    useLocaleStore.setState({ locale: 'zh-CN' });
    window.localStorage.clear();
  });

  it('shows localized civilization names when locale is en-US', () => {
    useLocaleStore.setState({ locale: 'en-US' });
    render(<HeroSelect />);

    const chinaName = getCivilizationMeta('CHINA', 'en-US').name;
    expect(screen.getByRole('button', { name: new RegExp(chinaName) })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /华夏/ })).toBeNull();
  });

  it('shows all civilizations and reveals emperors only for the selected civilization', () => {
    render(<HeroSelect />);

    expect(screen.getByText('步骤 1')).toBeTruthy();
    expect(screen.getByText('步骤 2')).toBeTruthy();
    expect(screen.getByRole('button', { name: /华夏/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /大和/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /美利坚/ })).toBeTruthy();
    expect(screen.getAllByText(/3 位帝王/)).toHaveLength(5);
    expect(screen.queryByRole('button', { name: /亚伯拉罕·林肯/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /美利坚/ }));

    expect(screen.getByRole('button', { name: /亚伯拉罕·林肯/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /乔治·华盛顿/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /富兰克林·罗斯福/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /秦始皇/ })).toBeNull();
  });

  it('starts a pve game with the selected emperor index and deck payload', () => {
    const qinDeck = useDeckStore.getState().getOrCreateDeck(ALL_EMPEROR_DATA_LIST[qinIndex]!);

    render(<HeroSelect />);

    fireEvent.click(screen.getByRole('button', { name: /华夏/ }));
    fireEvent.click(screen.getByRole('button', { name: /秦始皇/ }));
    expect(screen.getByText('套牌已就绪')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '开始对战' }));

    expect(joinGame).toHaveBeenCalledWith(
      qinIndex,
      expect.objectContaining({ emperorCardId: qinDeck.emperorCardId }),
    );
    expect(joinPvp).not.toHaveBeenCalled();
  });

  it('starts pvp matching with the selected emperor index and deck payload', () => {
    useGameStore.setState({ gameMode: 'pvp', joinGame, joinPvp });
    const qinDeck = useDeckStore.getState().getOrCreateDeck(ALL_EMPEROR_DATA_LIST[qinIndex]!);

    render(<HeroSelect />);

    fireEvent.click(screen.getByRole('button', { name: /华夏/ }));
    fireEvent.click(screen.getByRole('button', { name: /秦始皇/ }));
    expect(screen.getByText('套牌已就绪')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '匹配对手' }));

    expect(joinPvp).toHaveBeenCalledWith(
      qinIndex,
      expect.objectContaining({ emperorCardId: qinDeck.emperorCardId }),
    );
    expect(joinGame).not.toHaveBeenCalled();
  });

  it('disables start when the selected emperor deck is missing or invalid', () => {
    useDeckStore.setState({
      ...initialDeckState,
      decksByEmperorId: {},
      editingEmperorCardId: null,
    });

    render(<HeroSelect />);

    fireEvent.click(screen.getByRole('button', { name: /华夏/ }));
    fireEvent.click(screen.getByRole('button', { name: /秦始皇/ }));

    expect(qinIndex).toBeGreaterThanOrEqual(0);
    expect(screen.getByText('尚未准备合法套牌')).toBeTruthy();
    expect(screen.getByRole('button', { name: '开始对战' }).hasAttribute('disabled')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: '开始对战' }));

    expect(joinGame).not.toHaveBeenCalled();
    expect(joinPvp).not.toHaveBeenCalled();
  });

  it('keeps start disabled when the selected emperor has a saved but illegal deck', () => {
    useDeckStore.setState({
      ...initialDeckState,
      decksByEmperorId: {
        china_qin_shihuang: {
          id: 'illegal-qin-deck',
          name: '非法秦套牌',
          civilization: 'CHINA',
          emperorCardId: 'china_qin_shihuang',
          mainCardIds: ['bingmayong'],
        },
      },
      editingEmperorCardId: null,
    });

    render(<HeroSelect />);

    fireEvent.click(screen.getByRole('button', { name: /华夏/ }));
    fireEvent.click(screen.getByRole('button', { name: /秦始皇/ }));

    expect(screen.getByText('尚未准备合法套牌')).toBeTruthy();
    expect(screen.getByRole('button', { name: '开始对战' }).hasAttribute('disabled')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: '开始对战' }));

    expect(joinGame).not.toHaveBeenCalled();
    expect(joinPvp).not.toHaveBeenCalled();
  });

  it('routes to deck builder for the selected emperor when edit deck is clicked', () => {
    render(<HeroSelect />);

    const editDeckButton = screen.getByRole('button', { name: '编辑套牌' });
    expect(editDeckButton.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('请选择帝王以查看已保存套牌。')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /华夏/ }));
    fireEvent.click(screen.getByRole('button', { name: /秦始皇/ }));
    fireEvent.click(editDeckButton);

    expect(useDeckStore.getState().editingEmperorCardId).toBe('china_qin_shihuang');
    expect(useGameStore.getState().uiPhase).toBe('deck-builder');
  });

  it('preserves connection feedback and disables the start button while disconnected', () => {
    useGameStore.setState({ connected: false, error: null, joinGame, joinPvp });

    render(<HeroSelect />);

    fireEvent.click(screen.getByRole('button', { name: /华夏/ }));
    fireEvent.click(screen.getByRole('button', { name: /秦始皇/ }));

    expect(screen.getByText('正在连接服务器...')).toBeTruthy();
    expect(screen.getByRole('button', { name: '开始对战' }).hasAttribute('disabled')).toBe(true);
  });

  it('returns to the main menu and resets transient mode state', () => {
    useGameStore.setState({
      connected: true,
      error: '匹配失败',
      gameMode: 'pvp',
      uiPhase: 'hero-select',
      joinGame,
      joinPvp,
    });

    render(<HeroSelect />);

    fireEvent.click(screen.getByRole('button', { name: '返回主菜单' }));

    expect(useGameStore.getState().uiPhase).toBe('lobby');
    expect(useGameStore.getState().connected).toBe(false);
    expect(useGameStore.getState().gameMode).toBe('pve');
    expect(useGameStore.getState().error).toBeNull();
  });
});