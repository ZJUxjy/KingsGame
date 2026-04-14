// @king-card/shared - 基础枚举与类型别名

export type Civilization = 'CHINA' | 'JAPAN' | 'USA' | 'UK' | 'GERMANY' | 'NEUTRAL';
export type CardType = 'MINION' | 'GENERAL' | 'STRATAGEM' | 'SORCERY' | 'EMPEROR';
export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type Keyword =
  | 'BATTLECRY' | 'DEATHRATTLE' | 'AURA' | 'TAUNT' | 'RUSH' | 'CHARGE'
  | 'ASSASSIN' | 'COMBO_STRIKE' | 'STEALTH_KILL' | 'IRON_FIST'
  | 'MOBILIZE' | 'GARRISON' | 'RESEARCH' | 'BLOCKADE' | 'COLONY'
  | 'BLITZ' | 'MOBILIZATION_ORDER';
export type EffectTrigger =
  | 'ON_PLAY' | 'ON_DEATH' | 'ON_KILL' | 'ON_TURN_START' | 'ON_TURN_END' | 'ON_ATTACK' | 'AURA';
export type EffectType =
  | 'DAMAGE' | 'HEAL' | 'DRAW' | 'DISCARD' | 'SUMMON' | 'DESTROY'
  | 'MODIFY_STAT' | 'APPLY_BUFF' | 'REMOVE_BUFF' | 'GAIN_ARMOR' | 'SPEND_ENERGY'
  | 'ACTIVATE_STRATAGEM' | 'SET_DRAW_LOCK' | 'GRANT_EXTRA_ATTACK'
  | 'EMPEROR_SWITCH' | 'MINISTER_SWITCH' | 'RANDOM_DESTROY' | 'RANDOM_DISCARD'
  | 'CONDITIONAL_BUFF' | 'GARRISON_MARK';
export type GamePhase = 'ENERGY_GAIN' | 'DRAW' | 'UPKEEP' | 'MAIN' | 'END';
export type MinisterType = 'STRATEGIST' | 'WARRIOR' | 'ADMINISTRATOR' | 'ENVOY';
export type BuffType = 'AURA' | 'TEMPORARY' | 'PERMANENT';
export type AuraScope = 'ALL_FRIENDLY' | 'ALL_ENEMY' | 'ADJACENT' | 'SELF';
export type TargetRef =
  | { type: 'MINION'; instanceId: string }
  | { type: 'HERO'; playerIndex: number };
export type EngineErrorCode =
  | 'INVALID_PHASE' | 'INSUFFICIENT_ENERGY' | 'INVALID_TARGET'
  | 'BOARD_FULL' | 'NO_VALID_ACTIONS' | 'CARD_NOT_IN_HAND'
  | 'MINION_CANNOT_ATTACK' | 'SKILL_ON_COOLDOWN' | 'GAME_ALREADY_OVER';
export type WinReason = 'HERO_KILLED' | 'DECK_EMPTY';
