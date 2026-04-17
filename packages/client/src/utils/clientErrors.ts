import type { SupportedLocale } from './locale.js';

const CONNECT_FAILED = 'CONNECT_FAILED';
const NOT_CONNECTED_RETRY = 'NOT_CONNECTED_RETRY';
const NOT_CONNECTED_LOBBY = 'NOT_CONNECTED_LOBBY';

export const CLIENT_ERROR_CODE = {
  CONNECT_FAILED,
  NOT_CONNECTED_RETRY,
  NOT_CONNECTED_LOBBY,
} as const;

const MESSAGES: Record<
  (typeof CLIENT_ERROR_CODE)[keyof typeof CLIENT_ERROR_CODE],
  Record<SupportedLocale, string>
> = {
  [CONNECT_FAILED]: {
    'zh-CN': '连接服务器失败',
    'en-US': 'Failed to connect to server',
  },
  [NOT_CONNECTED_RETRY]: {
    'zh-CN': '未连接到服务器，请稍候重试',
    'en-US': 'Not connected to server. Please try again.',
  },
  [NOT_CONNECTED_LOBBY]: {
    'zh-CN': '未连接到服务器，请返回大厅重试',
    'en-US': 'Not connected to server. Return to the lobby and try again.',
  },
};

export function getClientErrorMessage(
  code: (typeof CLIENT_ERROR_CODE)[keyof typeof CLIENT_ERROR_CODE],
  locale: SupportedLocale,
  detail?: string,
): string {
  const base = MESSAGES[code][locale];
  if (code === CONNECT_FAILED && detail) {
    return locale === 'en-US' ? `${base}: ${detail}` : `${base}：${detail}`;
  }
  return base;
}
