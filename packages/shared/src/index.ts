// @king-card/shared - 显式选择性导出
// 注意: events.ts 和 engine-types.ts 有类型名称重叠，不能使用 export *

export * from './types.js';
export { GAME_CONSTANTS } from './constants.js';
export type {
  Card,
  CardEffect,
  GeneralSkill,
  Buff,
  HeroState,
  HeroSkill,
  PersistentEffect,
  EmperorData,
  ActiveStratagem,
  AppliedEffect,
  CostModifier,
  MinisterSkill,
  Minister,
  Player,
  GameState,
  ValidAction,
  TargetSelectionRequest,
  AuraEffect,
  EffectContext,
  EffectHandler,
  StateMutator,
  CardInstance,
} from './engine-types.js';
export type { GameEvent, EventBus, EngineResult, RNG } from './events.js';
