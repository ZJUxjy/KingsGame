export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'zh-CN';

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value === 'zh-CN' || value === 'en-US';
}