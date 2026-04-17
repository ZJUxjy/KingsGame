import type { EngineErrorCode } from '@king-card/shared';
import type { SupportedLocale } from './locale.js';

type SocketErrorCode =
  | 'NOT_YOUR_TURN'
  | 'NO_ENGINE'
  | 'NO_GAME'
  | 'JOIN_FAILED'
  | 'PVP_JOIN_FAILED'
  | 'INTERNAL'
  | 'UNKNOWN'
  | EngineErrorCode;

const MESSAGES: Record<SocketErrorCode, Record<SupportedLocale, string>> = {
  NOT_YOUR_TURN: {
    'zh-CN': '当前不是你的回合',
    'en-US': 'It is not your turn',
  },
  NO_ENGINE: {
    'zh-CN': '对局尚未开始',
    'en-US': 'Game not started',
  },
  NO_GAME: {
    'zh-CN': '你不在对局中',
    'en-US': 'Not in a game',
  },
  JOIN_FAILED: {
    'zh-CN': '加入对局失败',
    'en-US': 'Failed to join game',
  },
  PVP_JOIN_FAILED: {
    'zh-CN': '匹配加入失败',
    'en-US': 'Failed to join PvP',
  },
  INTERNAL: {
    'zh-CN': '服务器内部错误',
    'en-US': 'Internal server error',
  },
  UNKNOWN: {
    'zh-CN': '未知错误',
    'en-US': 'Unknown error',
  },
  INVALID_PHASE: {
    'zh-CN': '当前阶段不允许该操作',
    'en-US': 'Invalid phase for this action',
  },
  INSUFFICIENT_ENERGY: {
    'zh-CN': '法力不足',
    'en-US': 'Insufficient energy',
  },
  INVALID_TARGET: {
    'zh-CN': '目标无效',
    'en-US': 'Invalid target',
  },
  BOARD_FULL: {
    'zh-CN': '战场已满',
    'en-US': 'Battlefield is full',
  },
  NO_VALID_ACTIONS: {
    'zh-CN': '没有可用行动',
    'en-US': 'No valid actions',
  },
  CARD_NOT_IN_HAND: {
    'zh-CN': '手牌中没有该牌',
    'en-US': 'Card not in hand',
  },
  MINION_CANNOT_ATTACK: {
    'zh-CN': '该随从无法攻击',
    'en-US': 'Minion cannot attack',
  },
  SKILL_ON_COOLDOWN: {
    'zh-CN': '技能冷却中',
    'en-US': 'Skill on cooldown',
  },
  GAME_ALREADY_OVER: {
    'zh-CN': '对局已结束',
    'en-US': 'Game already over',
  },
};

export function formatGameError(
  code: string,
  fallbackMessage: string,
  locale: SupportedLocale,
): string {
  const row = MESSAGES[code as SocketErrorCode];
  if (row) {
    return row[locale];
  }
  if (locale === 'zh-CN') {
    return `发生错误（${code}）`;
  }
  return fallbackMessage;
}
