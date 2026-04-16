import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useLocaleStore } from '../../stores/localeStore.js';
import { LocaleSwitcher } from './LocaleSwitcher.js';

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useLocaleStore.setState({ locale: 'zh-CN' });
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    useLocaleStore.setState({ locale: 'zh-CN' });
  });

  it('switches the locale when clicking the English option', () => {
    render(<LocaleSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(useLocaleStore.getState().locale).toBe('en-US');
  });

  it('marks the active locale button as pressed', () => {
    useLocaleStore.setState({ locale: 'en-US' });

    render(<LocaleSwitcher />);

    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '中文' }).getAttribute('aria-pressed')).toBe('false');
  });
});