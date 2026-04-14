// @king-card/shared - 事件系统
// 依赖方向: types.ts → engine-types.ts → events.ts (单向)
// 本文件从 types.ts 和 engine-types.ts 导入

import type { GamePhase, TargetRef, EngineErrorCode } from './types.js';
import type { CardInstance, HeroState, ActiveStratagem, Buff, GameState } from './engine-types.js';

// ─── Game Event Union (28种事件类型) ─────────────────────────────

export type GameEvent =
  // 回合流程
  | { type: 'GAME_START'; state: GameState }
  | { type: 'TURN_START'; playerIndex: number; turnNumber: number }
  | { type: 'TURN_END'; playerIndex: number; turnNumber: number }
  | { type: 'PHASE_CHANGE'; phase: GamePhase; previousPhase: GamePhase }
  // 能量
  | { type: 'ENERGY_GAINED'; playerIndex: number; amount: number; totalEnergy: number }
  | { type: 'ENERGY_SPENT'; playerIndex: number; amount: number; remainingEnergy: number }
  // 抽牌
  | { type: 'CARD_DRAWN'; playerIndex: number; card: import('./engine-types.js').Card }
  | { type: 'DRAW_LOCKED'; playerIndex: number }
  | { type: 'DECK_EMPTY'; playerIndex: number }
  // 手牌
  | { type: 'CARD_PLAYED'; playerIndex: number; card: import('./engine-types.js').Card; instanceId?: string }
  | { type: 'CARD_DISCARDED'; playerIndex: number; card: import('./engine-types.js').Card }
  // 战场
  | { type: 'MINION_SUMMONED'; instance: CardInstance }
  | { type: 'MINION_DESTROYED'; instance: CardInstance }
  | { type: 'MINION_ENTERED_GARRISON'; instance: CardInstance; turns: number }
  // 攻击
  | { type: 'ATTACK_DECLARED'; attacker: CardInstance; defender: TargetRef }
  | { type: 'ATTACK_RESOLVED'; attacker: CardInstance; defender: TargetRef; damage: number }
  | { type: 'ATTACK_BLOCKED'; attacker: CardInstance; defender: CardInstance }
  // 生命值
  | { type: 'DAMAGE_DEALT'; target: TargetRef; amount: number; source?: CardInstance }
  | { type: 'HEAL_APPLIED'; target: TargetRef; amount: number; source?: CardInstance }
  | { type: 'HERO_DAMAGED'; playerIndex: number; amount: number }
  | { type: 'HERO_HEALED'; playerIndex: number; amount: number }
  // Buff
  | { type: 'BUFF_APPLIED'; target: CardInstance; buff: Buff }
  | { type: 'BUFF_REMOVED'; target: CardInstance; buff: Buff }
  // 技能
  | { type: 'HERO_SKILL_USED'; playerIndex: number; hero: HeroState }
  | { type: 'MINISTER_SKILL_USED'; playerIndex: number; ministerId: string }
  | { type: 'GENERAL_SKILL_USED'; instance: CardInstance }
  // 谋略
  | { type: 'STRATAGEM_ACTIVATED'; stratagem: ActiveStratagem }
  | { type: 'STRATAGEM_EXPIRED'; stratagem: ActiveStratagem }
  // 游戏结束
  | { type: 'GAME_OVER'; winnerIndex: number; reason: import('./types.js').WinReason };

// ─── Event Bus ───────────────────────────────────────────────────

export interface EventBus {
  emit(event: GameEvent): void;
  on(eventType: string, handler: (event: GameEvent) => void): () => void;
  removeAllListeners(): void;
}

// ─── Engine Result ───────────────────────────────────────────────

export type EngineResult<T = GameEvent[]> =
  | { success: true; events: T }
  | { success: false; errorCode: EngineErrorCode; message: string };

// ─── RNG ─────────────────────────────────────────────────────────

export interface RNG {
  nextInt(min: number, max: number): number;
  next(): number;
  pick<T>(array: T[]): T;
  shuffle<T>(array: T[]): T[];
}
