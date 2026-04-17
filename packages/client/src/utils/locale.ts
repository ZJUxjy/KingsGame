import type { SupportedUiLocale } from '@king-card/shared';

/** Client UI locale — aligned with `SupportedUiLocale` in `@king-card/shared`. */
export type SupportedLocale = SupportedUiLocale;

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const satisfies readonly SupportedLocale[];

export const DEFAULT_LOCALE: SupportedLocale = 'zh-CN';

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value === 'zh-CN' || value === 'en-US';
}