import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LOCALE_STORAGE_KEY, useLocaleStore } from './localeStore.js';

describe('localeStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useLocaleStore.setState({ locale: 'zh-CN' });
  });

  afterEach(() => {
    window.localStorage.clear();
    useLocaleStore.setState({ locale: 'zh-CN' });
  });

  it('defaults to zh-CN', () => {
    expect(useLocaleStore.getState().locale).toBe('zh-CN');
  });

  it('persists locale changes to localStorage', () => {
    useLocaleStore.getState().setLocale('en-US');

    expect(useLocaleStore.getState().locale).toBe('en-US');
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en-US');
  });

  it('toggles between zh-CN and en-US', () => {
    useLocaleStore.getState().toggleLocale();
    expect(useLocaleStore.getState().locale).toBe('en-US');

    useLocaleStore.getState().toggleLocale();
    expect(useLocaleStore.getState().locale).toBe('zh-CN');
  });
});