// @king-card/shared - 完整模型接口
// 依赖方向: types.ts → engine-types.ts → events.ts (单向，无循环)
// 本文件仅从 types.ts 导入，不从 events.ts 导入

import type {
  CardType,
  Rarity,
  Keyword,
  EffectTrigger,
  EffectType,
  GamePhase,
  MinisterType,
  BuffType,
  AuraScope,
  Civilization,
} from './types.js';

// ─── Card Definition ─────────────────────────────────────────────

export interface Card {
  id: string;
  name: string;
  civilization: Civilization;
  type: CardType;
  rarity: Rarity;
  cost: number;
  attack?: number;
  health?: number;
  description: string;
  keywords: Keyword[];
  effects: CardEffect[];
  heroSkill?: HeroSkill;
  generalSkills?: GeneralSkill[];
}

export interface CardEffect {
  trigger: EffectTrigger;
  type: EffectType;
  params: Record<string, unknown>;
}

export interface GeneralSkill {
  name: string;
  description: string;
  cost: number;
  usesPerTurn: number;
  effect: CardEffect;
}

// ─── Buff & Persistent Effect ────────────────────────────────────

export interface Buff {
  id: string;
  sourceInstanceId?: string;
  sourceCardId?: string;
  attackBonus: number;
  healthBonus: number;
  maxHealthBonus: number;
  remainingTurns?: number;
  keywordsGranted: Keyword[];
  type: BuffType;
}

export interface PersistentEffect {
  id: string;
  sourceEmperorId: string;
  description: string;
  data: Record<string, unknown>;
}

// ─── Hero ────────────────────────────────────────────────────────

export interface HeroState {
  health: number;
  maxHealth: number;
  armor: number;
  heroSkill: HeroSkill;
  skillUsedThisTurn: boolean;
  skillCooldownRemaining: number;
}

export interface HeroSkill {
  name: string;
  description: string;
  cost: number;
  cooldown: number;
  effect: CardEffect;
}

// ─── Emperor System ──────────────────────────────────────────────

export interface EmperorData {
  emperorCard: Card;
  ministers: Minister[];
  boundGenerals: Card[];
  boundSorceries: Card[];
}

export interface ActiveStratagem {
  card: Card;
  instanceId: string;
  ownerIndex: number;
  remainingTurns: number;
  appliedEffects: AppliedEffect[];
}

export interface AppliedEffect {
  type: EffectType;
  params: Record<string, unknown>;
}

// ─── Cost Modifier ───────────────────────────────────────────────

export interface CostModifier {
  sourceId: string;
  modifier: (baseCost: number) => number;
  condition: (card: Card) => boolean;
  expiresAtTurn?: number;
}

// ─── Minister ────────────────────────────────────────────────────

export interface MinisterSkill {
  name: string;
  description: string;
  cost: number;
  effect: CardEffect;
}

export interface Minister {
  id: string;
  emperorId: string;
  name: string;
  type: MinisterType;
  activeSkill: MinisterSkill;
  skillUsedThisTurn: boolean;
  cooldown: number;
}

// ─── Card Instance (board/hand) ──────────────────────────────────

export interface CardInstance {
  card: Card;
  instanceId: string;
  ownerIndex: number;
  baseKeywords?: Keyword[];
  currentAttack: number;
  currentHealth: number;
  currentMaxHealth: number;
  remainingAttacks: number;
  justPlayed: boolean;
  sleepTurns: number;
  garrisonTurns: number;
  /**
   * True once the GARRISON ON_TURN_START buff has been applied so it is not
   * re-applied every subsequent turn while garrisonTurns remains at 0.
   */
  garrisonActivated?: boolean;
  frozenTurns: number;
  usedGeneralSkills: number;
  buffs: Buff[];
  position?: number;
}

export interface SummonMinionResult {
  instance: CardInstance | null;
  error: import('./types.js').EngineErrorCode | null;
}

// ─── Player ──────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  hero: HeroState;
  civilization: Civilization;
  hand: Card[];
  handLimit: number;
  deck: Card[];
  graveyard: Card[];
  battlefield: CardInstance[];
  activeStratagems: ActiveStratagem[];
  costModifiers: CostModifier[];
  energyCrystal: number;
  maxEnergy: number;
  cardsPlayedThisTurn?: number;
  cannotDrawNextTurn: boolean;
  costReduction: number;
  ministerPool: Minister[];
  activeMinisterIndex: number;
  boundCards: Card[];
}

// ─── Game State ──────────────────────────────────────────────────

export interface GameState {
  players: [Player, Player];
  currentPlayerIndex: 0 | 1;
  turnNumber: number;
  phase: GamePhase;
  isGameOver: boolean;
  winnerIndex: number | null;
  winReason: import('./types.js').WinReason | null;
}

// ─── Valid Actions ───────────────────────────────────────────────

export type ValidAction =
  | { type: 'PLAY_CARD'; handIndex: number; targetIndex?: number }
  | { type: 'ATTACK'; attackerInstanceId: string; targetInstanceId: string | 'HERO' }
  | { type: 'USE_HERO_SKILL'; target?: import('./types.js').TargetRef }
  | { type: 'USE_MINISTER_SKILL'; target?: import('./types.js').TargetRef }
  | { type: 'USE_GENERAL_SKILL'; instanceId: string; skillIndex: number; target?: import('./types.js').TargetRef }
  | { type: 'SWITCH_MINISTER'; ministerIndex: number }
  | { type: 'END_TURN' };

// ─── Target Selection ────────────────────────────────────────────

export interface TargetSelectionRequest {
  source: CardInstance;
  effect: CardEffect;
  validTargets: import('./types.js').TargetRef[];
  requiredCount: number;
  optionalCount: number;
  allowSameTargetMultipleTimes?: boolean;
  selectionMode: 'SELECT' | 'AUTO';
}

// ─── Aura & Effect Handler ───────────────────────────────────────

export interface AuraEffect {
  scope: AuraScope;
  apply: (target: CardInstance, source: CardInstance, ctx: EffectContext) => CardEffect[];
}

export interface EffectHandler {
  keyword: Keyword;
  onPlay?: (ctx: EffectContext) => CardEffect[];
  onDeath?: (ctx: EffectContext) => CardEffect[];
  onKill?: (ctx: EffectContext) => CardEffect[];
  onTurnStart?: (ctx: EffectContext) => CardEffect[];
  onTurnEnd?: (ctx: EffectContext) => CardEffect[];
  onAttack?: (ctx: EffectContext) => CardEffect[];
  aura?: AuraEffect;
}

// ─── State Mutator ───────────────────────────────────────────────

export interface StateMutator {
  damage(target: import('./types.js').TargetRef, amount: number): import('./types.js').EngineErrorCode | null;
  heal(target: import('./types.js').TargetRef, amount: number): import('./types.js').EngineErrorCode | null;
  drawCards(playerIndex: number, count: number): import('./types.js').EngineErrorCode | null;
  /**
   * Add a card copy to the given player's hand.
   * - If hand has room: pushes the card and emits CARD_DRAWN.
   * - If hand is full: pushes to graveyard and emits CARD_DISCARDED (mirrors drawCards behavior).
   */
  addCardToHand(playerIndex: number, card: Card): import('./types.js').EngineErrorCode | null;
  discardCard(playerIndex: number, handIndex: number): import('./types.js').EngineErrorCode | null;
  summonMinion(card: Card, ownerIndex: number, position?: number): SummonMinionResult;
  destroyMinion(instanceId: string): import('./types.js').EngineErrorCode | null;
  modifyStat(target: import('./types.js').TargetRef, stat: 'attack' | 'health', delta: number): import('./types.js').EngineErrorCode | null;
  applyBuff(target: import('./types.js').TargetRef, buff: Buff): import('./types.js').EngineErrorCode | null;
  removeBuff(target: import('./types.js').TargetRef, buffId: string): import('./types.js').EngineErrorCode | null;
  gainArmor(playerIndex: number, amount: number): import('./types.js').EngineErrorCode | null;
  spendEnergy(playerIndex: number, amount: number): import('./types.js').EngineErrorCode | null;
  activateStratagem(card: Card, ownerIndex: number): import('./types.js').EngineErrorCode | null;
  setDrawLock(playerIndex: number, locked: boolean): import('./types.js').EngineErrorCode | null;
  grantExtraAttack(instanceId: string): import('./types.js').EngineErrorCode | null;
}

// ─── Effect Context ──────────────────────────────────────────────
// eventBus 和 rng 使用内联类型，避免从 events.ts 导入（防止循环依赖）

export interface EffectContext {
  state: Readonly<GameState>;
  mutator: StateMutator;
  source: CardInstance;
  target?: CardInstance;
  playerIndex: number;
  eventBus: {
    emit: (event: unknown) => void;
    on: (type: string, handler: (event: unknown) => void) => () => void;
    removeAllListeners: () => void;
  };
  rng: {
    nextInt: (min: number, max: number) => number;
    next: () => number;
    pick: <T>(arr: T[]) => T;
    shuffle: <T>(arr: T[]) => T[];
  };
  /**
   * Per-engine ID generator (structural type to avoid `shared -> core` dep).
   * Required: every EffectContext must carry the engine's IdCounter so that
   * buff/stratagem/synthetic ids stay collision-free within a game and across
   * concurrent games. Test fixtures that build EffectContext by hand should
   * pass `counter: new IdCounter()` (or share one per test).
   */
  counter: {
    nextBuffId(): string;
    nextStratagemId(): string;
    nextInstanceId(cardId: string): string;
    nextSyntheticSourceId(prefix: string): string;
  };
}
