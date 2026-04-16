import { create } from 'zustand';
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '../utils/locale.js';

export const LOCALE_STORAGE_KEY = 'king-card-locale';

interface LocaleState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  toggleLocale: () => void;
}

function readStoredLocale(): SupportedLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isSupportedLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE;
}

function persistLocale(locale: SupportedLocale) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: readStoredLocale(),
  setLocale: (locale) => {
    persistLocale(locale);
    set({ locale });
  },
  toggleLocale: () => {
    set((state) => {
      const nextLocale: SupportedLocale = state.locale === 'zh-CN' ? 'en-US' : 'zh-CN';
      persistLocale(nextLocale);
      return { locale: nextLocale };
    });
  },
}));