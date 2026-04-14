# 《帝王牌》Phase 1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可热座双人对战的历史题材数字卡牌游戏原型，包含完整游戏规则引擎 + Phaser 3 前端 + 中国文明 21 张卡牌。

**Architecture:** Monorepo 三包结构（shared 类型 → core 纯逻辑引擎 → ui-phaser 渲染层）。core 通过事件总线通知 UI 状态变更。引擎保证操作原子性（失败时不修改状态）。

**Tech Stack:** TypeScript 5.x, pnpm workspace, tsup, Vite, Phaser 3, Vitest, ESLint + Prettier

**Spec:** `docs/superpowers/specs/2026-04-14-king-card-phase1-design.md`

---

## 文件结构总览

```
king_card/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.js
├── packages/
│   ├── shared/src/
│   │   ├── types.ts           # 枚举 + 类型别名（Keyword, CardType, etc.）
│   │   ├── constants.ts       # GAME_CONSTANTS
│   │   ├── events.ts          # GameEvent 联合类型, EventBus, EngineResult, RNG
│   │   ├── engine-types.ts    # 完整模型接口（Card, CardInstance, Player, GameState, etc.）
│   │   └── index.ts           # 显式选择性导出（避免命名冲突）
│   ├── core/src/
│   │   ├── models/
│   │   │   ├── card-instance.ts # createCardInstance() 工厂函数
│   │   │   ├── player.ts      # createPlayer() 工厂函数
│   │   │   └── game.ts        # createGameState() 工厂函数
│   │   ├── engine/
│   │   │   ├── event-bus.ts   # EventBus 实现
│   │   │   ├── rng.ts         # RNG 接口 + DefaultRNG
│   │   │   ├── state-mutator.ts # StateMutator 实现
│   │   │   ├── game-engine.ts # GameEngine 主类
│   │   │   ├── game-loop.ts   # 回合流程
│   │   │   ├── action-executor.ts # 操作执行
│   │   │   ├── win-condition.ts   # 胜负判定
│   │   │   └── effect-resolver.ts # 效果结算
│   │   ├── cards/
│   │   │   ├── registry.ts    # CardRegistry
│   │   │   ├── effects/
│   │   │   │   ├── battlecry.ts
│   │   │   │   ├── deathrattle.ts
│   │   │   │   ├── on-kill.ts
│   │   │   │   ├── aura.ts
│   │   │   │   ├── taunt.ts
│   │   │   │   ├── rush.ts
│   │   │   │   ├── charge.ts
│   │   │   │   ├── assassin.ts
│   │   │   │   ├── combo-strike.ts
│   │   │   │   ├── mobilize.ts
│   │   │   │   ├── garrison.ts
│   │   │   │   └── index.ts
│   │   │   └── definitions/
│   │   │       ├── china-emperors.ts
│   │   │       ├── china-ministers.ts
│   │   │       ├── china-generals.ts
│   │   │       ├── china-minions.ts
│   │   │       ├── china-stratagems.ts
│   │   │       ├── china-sorceries.ts
│   │   │       └── index.ts
│   │   └── index.ts
│   └── ui-phaser/src/
│       ├── main.ts
│       ├── config.ts
│       ├── scenes/
│       │   ├── BootScene.ts
│       │   ├── MenuScene.ts
│       │   └── BattleScene.ts
│       ├── components/
│       │   ├── CardSprite.ts
│       │   ├── HandZone.ts
│       │   ├── BoardZone.ts
│       │   ├── HeroPanel.ts
│       │   ├── EnergyBar.ts
│       │   ├── MinisterPanel.ts
│       │   └── TurnIndicator.ts
│       ├── animations/
│       │   └── AnimationQueue.ts
│       └── input/
│           └── InputHandler.ts
```

---

## Task 1: 项目脚手架搭建
**Depends on:** None

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/ui-phaser/package.json`
- Create: `packages/ui-phaser/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/core/src/index.ts`

- [ ] **Step 1: 初始化 git 仓库和 root package.json**

```bash
cd /home/xjingyao/code/king_card
git init
```

创建 `package.json`:
```json
{
  "name": "king-card",
  "private": true,
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "eslint packages/",
    "dev": "pnpm --filter ui-phaser dev"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "prettier": "^3.3.0",
    "vitest": "^2.0.0"
  },
  "packageManager": "pnpm@9.5.0"
}
```

- [ ] **Step 2: 创建 pnpm workspace 配置**

创建 `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 3: 创建 tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: 创建 shared 包**

创建 `packages/shared/package.json`:
```json
{
  "name": "@king-card/shared",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

创建 `packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

创建 `packages/shared/src/index.ts` (空占位):
```typescript
// @king-card/shared - 共享类型和常量
export {};
```

- [ ] **Step 5: 创建 core 包**

创建 `packages/core/package.json`:
```json
{
  "name": "@king-card/core",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@king-card/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

创建 `packages/core/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

创建 `packages/core/src/index.ts` (空占位):
```typescript
// @king-card/core - 游戏规则引擎
export {};
```

- [ ] **Step 6: 创建 ui-phaser 包（基础占位）**

创建 `packages/ui-phaser/package.json`:
```json
{
  "name": "@king-card/ui-phaser",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@king-card/core": "workspace:*",
    "@king-card/shared": "workspace:*",
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

创建 `packages/ui-phaser/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

- [ ] **Step 7: 安装依赖并验证编译**

```bash
pnpm install
pnpm --filter @king-card/shared build
pnpm --filter @king-card/core build
```

Expected: 三个包都编译通过，无错误。

- [ ] **Step 8: 初始提交**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json pnpm-lock.yaml packages/
git commit -m "chore: initialize monorepo with shared, core, ui-phaser packages"
```

---

## Task 2: 共享类型定义 (shared)
**Depends on:** Task 1

**Files:**
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/src/events.ts`
- Create: `packages/shared/src/engine-types.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/test/types.test.ts`

- [ ] **Step 1: 创建核心类型定义**

创建 `packages/shared/src/types.ts`:
```typescript
// ===== 文明 =====
export type Civilization = 'CHINA' | 'JAPAN' | 'USA' | 'UK' | 'GERMANY' | 'NEUTRAL';

// ===== 卡牌类型 =====
export type CardType = 'MINION' | 'GENERAL' | 'STRATAGEM' | 'SORCERY' | 'EMPEROR';

// ===== 品质 =====
export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

// ===== 关键词 =====
export type Keyword =
  | 'BATTLECRY'
  | 'DEATHRATTLE'
  | 'AURA'
  | 'TAUNT'
  | 'RUSH'
  | 'CHARGE'
  | 'ASSASSIN'
  | 'COMBO_STRIKE'
  | 'STEALTH_KILL'
  | 'IRON_FIST'
  | 'MOBILIZE'
  | 'GARRISON'
  | 'RESEARCH'
  | 'BLOCKADE'
  | 'COLONY'
  | 'BLITZ'
  | 'MOBILIZATION_ORDER';

// ===== 效果触发时机 =====
export type EffectTrigger =
  | 'ON_PLAY'
  | 'ON_DEATH'
  | 'ON_KILL'
  | 'ON_TURN_START'
  | 'ON_TURN_END'
  | 'ON_ATTACK'
  | 'AURA';

// ===== 效果类型 =====
export type EffectType =
  | 'DAMAGE'
  | 'HEAL'
  | 'DRAW'
  | 'DISCARD'
  | 'SUMMON'
  | 'DESTROY'
  | 'MODIFY_STAT'
  | 'APPLY_BUFF'
  | 'REMOVE_BUFF'
  | 'GAIN_ARMOR'
  | 'SPEND_ENERGY'
  | 'ACTIVATE_STRATAGEM'
  | 'SET_DRAW_LOCK'
  | 'GRANT_EXTRA_ATTACK'
  | 'EMPEROR_SWITCH'
  | 'MINISTER_SWITCH'
  | 'RANDOM_DESTROY'
  | 'RANDOM_DISCARD'
  | 'CONDITIONAL_BUFF'
  | 'GARRISON_MARK';

// ===== 游戏阶段 =====
export type GamePhase =
  | 'ENERGY_GAIN'
  | 'DRAW'
  | 'UPKEEP'
  | 'MAIN'
  | 'END';

// ===== 文臣类型 =====
export type MinisterType = 'STRATEGIST' | 'WARRIOR' | 'ADMINISTRATOR' | 'ENVOY';

// ===== Buff 类型 =====
export type BuffType = 'AURA' | 'TEMPORARY' | 'PERMANENT';

// ===== 光环范围 =====
export type AuraScope = 'ALL_FRIENDLY' | 'ALL_ENEMY' | 'ADJACENT' | 'SELF';

// ===== 目标引用 =====
export type TargetRef =
  | { type: 'MINION'; instanceId: string }
  | { type: 'HERO'; playerIndex: number };

// ===== 引擎错误码 =====
export type EngineErrorCode =
  | 'INVALID_PHASE'
  | 'INSUFFICIENT_ENERGY'
  | 'INVALID_TARGET'
  | 'BOARD_FULL'
  | 'NO_VALID_ACTIONS'
  | 'CARD_NOT_IN_HAND'
  | 'MINION_CANNOT_ATTACK'
  | 'SKILL_ON_COOLDOWN'
  | 'GAME_ALREADY_OVER';

// ===== 胜利原因 =====
export type WinReason = 'HERO_KILLED' | 'DECK_EMPTY';
```

- [ ] **Step 2: 创建游戏常量**

创建 `packages/shared/src/constants.ts`:
```typescript
export const GAME_CONSTANTS = {
  INITIAL_HEALTH: 30,
  DECK_SIZE: 30,
  STARTING_HAND_SIZE: 4,
  MAX_HAND_SIZE: 10,
  MAX_BOARD_SIZE: 7,
  MAX_ENERGY: 10,
  EMPEROR_SOFT_LIMIT: 4,
  GENERAL_DECK_LIMIT: 2,
  SORCERY_DECK_LIMIT: 2,
  FIRST_TURN_ENERGY: 1,
  ENERGY_PER_TURN: 1,
} as const;
```

- [ ] **Step 3: 创建事件类型**

创建 `packages/shared/src/events.ts`:
```typescript
import type { GamePhase, TargetRef, EngineErrorCode } from './types.js';
import type { CardInstance, HeroState, ActiveStratagem, Buff, GameState } from './engine-types.js';

// ===== 事件联合类型 =====
// 注意：这里引用 engine-types.ts 中的完整模型接口
// 依赖链：types.ts → engine-types.ts → events.ts（单向，无循环）
export type GameEvent =
  | { type: 'GAME_START'; initialState: Readonly<GameState> }
  | { type: 'TURN_START'; playerIndex: number; turnNumber: number }
  | { type: 'ENERGY_GAINED'; playerIndex: number; amount: number; newMax: number }
  | { type: 'CARD_DRAWN'; playerIndex: number; card: CardInstance }
  | { type: 'CARD_DISCARDED'; playerIndex: number; card: CardInstance; reason: 'HAND_LIMIT' | 'EFFECT' }
  | { type: 'PHASE_CHANGE'; playerIndex: number; newPhase: GamePhase }
  | { type: 'CARD_PLAYED'; playerIndex: number; card: CardInstance; position: number; targets?: TargetRef[] }
  | { type: 'MINION_SUMMONED'; playerIndex: number; minion: CardInstance; position: number }
  | { type: 'ATTACK_DECLARED'; attackerId: string; target: TargetRef }
  | { type: 'DAMAGE_DEALT'; target: TargetRef; amount: number; source: TargetRef }
  | { type: 'HEALING'; target: TargetRef; amount: number }
  | { type: 'ARMOR_CHANGED'; playerIndex: number; delta: number; newArmor: number }
  | { type: 'MINION_DEATH'; playerIndex: number; minion: CardInstance }
  | { type: 'MINION_KILLED'; attackerInstanceId: string; targetInstanceId: string }
  | { type: 'HERO_DAMAGE'; playerIndex: number; amount: number }
  | { type: 'HERO_HEALING'; playerIndex: number; amount: number }
  | { type: 'EMPEROR_CHANGED'; playerIndex: number; oldEmperor: string | null; newEmperor: string }
  | { type: 'MINISTER_CHANGED'; playerIndex: number; newMinisterId: string }
  | { type: 'GENERAL_SKILL_USED'; generalId: string; skillIndex: number }
  | { type: 'HERO_SKILL_USED'; playerIndex: number }
  | { type: 'ENERGY_SPENT'; playerIndex: number; amount: number; remaining: number }
  | { type: 'STRATAGEM_ACTIVATED'; playerIndex: number; stratagem: ActiveStratagem }
  | { type: 'STRATAGEM_EXPIRED'; playerIndex: number; stratagemId: string }
  | { type: 'BUFF_APPLIED'; targetInstanceId: string; buff: Buff }
  | { type: 'BUFF_REMOVED'; targetInstanceId: string; buffId: string }
  | { type: 'TURN_END'; playerIndex: number }
  | { type: 'GAME_OVER'; winnerIndex: number; reason: string };

// ===== EventBus 接口 =====
export interface EventBus {
  emit(event: GameEvent): void;
  on(eventType: string, handler: (event: GameEvent) => void): () => void;
  removeAllListeners(): void;
}

// ===== 操作结果 =====
export type EngineResult<T = GameEvent[]> =
  | { success: true; events: T }
  | { success: false; errorCode: EngineErrorCode; message: string };

// ===== RNG 接口 =====
export interface RNG {
  nextInt(min: number, max: number): number;
  next(): number;
  pick<T>(array: T[]): T;
  shuffle<T>(array: T[]): T[];
}
```

- [ ] **Step 4: 创建引擎相关类型**

创建 `packages/shared/src/engine-types.ts`:
```typescript
import type { CardType, Rarity, Civilization, Keyword, EffectTrigger, EffectType, MinisterType, AuraScope, BuffType, TargetRef, GamePhase } from './types.js';

// ===== 卡牌 =====
export interface Card {
  id: string;
  name: string;
  civilization: Civilization;
  type: CardType;
  rarity: Rarity;
  cost: number;
  attack?: number;
  health?: number;
  keywords: Keyword[];
  effects: CardEffect[];
  generalSkills?: GeneralSkill[];
  emperorData?: EmperorData;
  heroSkill?: HeroSkill;  // 仅 EMPEROR 类型卡牌有此字段
}

export interface CardEffect {
  trigger: EffectTrigger;
  type: EffectType;
  params: Record<string, unknown>;
}

export interface GeneralSkill {
  name: string;
  description: string;
  cost?: number;
  effect: CardEffect;
}

// ===== Buff =====
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

// ===== 英雄与帝王 =====
export interface PersistentEffect {
  id: string;
  sourceEmperorId: string;
  description: string;
  data: Record<string, unknown>;
}

export interface HeroState {
  emperorId: string | null;
  emperorName: string;
  health: number;
  maxHealth: number;
  armor: number;
  heroSkill: HeroSkill | null;
  heroSkillUsedThisTurn: boolean;
  heroSkillCooldown: boolean;
  persistentEffects: PersistentEffect[];
}

export interface HeroSkill {
  name: string;
  description: string;
  cost: number;
  effect: CardEffect;
}

export interface EmperorData {
  emperorCard: Card;
  ministers: Minister[];
  boundGenerals: Card[];
  boundSorceries: Card[];
}

// ===== 持续妙计 =====
export interface ActiveStratagem {
  card: Card;
  instanceId: string;
  ownerIndex: number;
  remainingTurns: number;
  appliedEffects: AppliedEffect[];
}

export interface AppliedEffect {
  type: 'COST_MODIFIER' | 'STAT_MODIFIER' | 'RESTRICTION';
  params: Record<string, unknown>;
}

export interface CostModifier {
  sourceId: string;
  modifier: (baseCost: number) => number;
  condition: (card: Card, context: Readonly<GameState>) => boolean;
  expiresAtTurn?: number;
}

// ===== 文臣 =====
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
  cooldown: boolean;
}

// ===== 玩家 =====
export interface Player {
  id: string;
  name: string;
  hero: HeroState;
  civilization: Civilization;
  hand: CardInstance[];
  handLimit: number;
  deck: CardInstance[];
  graveyard: CardInstance[];
  battlefield: CardInstance[];
  activeStratagems: ActiveStratagem[];
  costModifiers: CostModifier[];
  energyCrystal: number;
  maxEnergy: number;
  cannotDrawNextTurn: boolean;
  ministerPool: Minister[];
  activeMinisterIndex: number;
  boundCards: CardInstance[];
}

// ===== 游戏状态 =====
export interface GameState {
  players: [Player, Player];
  currentPlayerIndex: 0 | 1;
  turnNumber: number;
  phase: GamePhase;
  isGameOver: boolean;
  winnerIndex: number | null;
  winReason: string | null;
}

// ===== 有效操作 =====
export type ValidAction =
  | { type: 'PLAY_CARD'; handIndex: number; card: Card }
  | { type: 'ATTACK'; attackerId: string; validTargets: TargetRef[] }
  | { type: 'USE_HERO_SKILL'; validTargets?: TargetRef[] }
  | { type: 'USE_MINISTER_SKILL'; validTargets?: TargetRef[] }
  | { type: 'USE_GENERAL_SKILL'; generalId: string; skillIndex: number; validTargets?: TargetRef[] }
  | { type: 'SWITCH_MINISTER'; ministerIndex: number }
  | { type: 'END_TURN' };

// ===== 目标选择 =====
export interface TargetSelectionRequest {
  source: CardInstance;
  effect: CardEffect;
  validTargets: TargetRef[];
  requiredCount: number;
  optionalCount: number;
  allowSameTargetMultipleTimes?: boolean;
  selectionMode: 'SINGLE' | 'MULTIPLE' | 'RANDOM';
}

// ===== 效果系统 =====
export interface AuraEffect {
  scope: AuraScope;
  apply(target: CardInstance): Partial<Buff>;
}

export interface EffectContext {
  state: Readonly<GameState>;
  mutator: StateMutator;
  source: CardInstance;
  target?: CardInstance | HeroState;
  playerIndex: number;
  eventBus: EventBus;
  rng: RNG;
}

export interface EffectHandler {
  keyword: Keyword;
  onPlay?(ctx: EffectContext): void;
  onDeath?(ctx: EffectContext): void;
  onKill?(ctx: EffectContext): void;
  onTurnStart?(ctx: EffectContext): void;
  onTurnEnd?(ctx: EffectContext): void;
  onAttack?(ctx: EffectContext): void;
  aura?: AuraEffect;
}

export interface StateMutator {
  damage(target: TargetRef, amount: number): void;
  heal(target: TargetRef, amount: number): void;
  drawCards(playerIndex: number, count: number): void;
  discardCard(playerIndex: number, handIndex: number): void;
  summonMinion(playerIndex: number, card: Card, position: number): CardInstance;
  destroyMinion(instanceId: string): void;
  modifyStat(targetInstanceId: string, attackDelta?: number, healthDelta?: number): void;
  applyBuff(targetInstanceId: string, buff: Buff): void;
  removeBuff(targetInstanceId: string, buffId: string): void;
  gainArmor(playerIndex: number, amount: number): void;
  spendEnergy(playerIndex: number, amount: number): void;
  activateStratagem(playerIndex: number, card: Card): ActiveStratagem;
  setDrawLock(playerIndex: number, locked: boolean): void;
  grantExtraAttack(instanceId: string): void;
}
```

- [ ] **Step 5: 更新 shared/index.ts 显式选择性导出**

> **注意**：不能使用 `export *` 因为 `events.ts` 和 `engine-types.ts` 的类型有依赖关系。必须显式选择导出。

```typescript
// 基础类型和常量
export * from './types.js';
export { GAME_CONSTANTS } from './constants.js';

// 完整模型接口（engine-types.ts 定义，events.ts 引用）
export type {
  Card, CardEffect, GeneralSkill, Buff, HeroState, HeroSkill,
  PersistentEffect, EmperorData, ActiveStratagem, AppliedEffect,
  CostModifier, MinisterSkill, Minister, Player, GameState,
  ValidAction, TargetSelectionRequest, AuraEffect, EffectContext,
  EffectHandler, StateMutator, CardInstance,
} from './engine-types.js';

// 事件、EventBus、EngineResult、RNG
export type { GameEvent, EventBus, EngineResult, RNG } from './events.js';
```

- [ ] **Step 6: 编写基础类型测试**

创建 `packages/shared/test/types.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import type { Keyword, CardType, GamePhase, Civilization } from '../src/types.js';
import { GAME_CONSTANTS } from '../src/constants.js';

describe('shared types', () => {
  it('should have correct game constants', () => {
    expect(GAME_CONSTANTS.INITIAL_HEALTH).toBe(30);
    expect(GAME_CONSTANTS.MAX_BOARD_SIZE).toBe(7);
    expect(GAME_CONSTANTS.MAX_ENERGY).toBe(10);
    expect(GAME_CONSTANTS.MAX_HAND_SIZE).toBe(10);
    expect(GAME_CONSTANTS.STARTING_HAND_SIZE).toBe(4);
  });

  it('should accept valid keyword values', () => {
    const keywords: Keyword[] = ['BATTLECRY', 'DEATHRATTLE', 'TAUNT', 'RUSH', 'CHARGE', 'COMBO_STRIKE'];
    expect(keywords).toHaveLength(6);
  });

  it('should accept valid card type values', () => {
    const types: CardType[] = ['MINION', 'GENERAL', 'STRATAGEM', 'SORCERY', 'EMPEROR'];
    expect(types).toHaveLength(5);
  });

  it('should accept valid game phase values', () => {
    const phases: GamePhase[] = ['ENERGY_GAIN', 'DRAW', 'UPKEEP', 'MAIN', 'END'];
    expect(phases).toHaveLength(5);
  });

  it('should accept valid civilization values', () => {
    const civs: Civilization[] = ['CHINA', 'JAPAN', 'USA', 'UK', 'GERMANY', 'NEUTRAL'];
    expect(civs).toHaveLength(6);
  });
});
```

- [ ] **Step 7: 运行测试验证**

```bash
pnpm --filter @king-card/shared test
```

Expected: 5 tests passed.

- [ ] **Step 8: 提交**

```bash
git add packages/shared/
git commit -m "feat(shared): add core types, constants, events, and engine types"
```

---

## Task 3: EventBus 和 RNG 实现
**Depends on:** Task 2

**Files:**
- Create: `packages/core/src/engine/event-bus.ts`
- Create: `packages/core/src/engine/rng.ts`
- Test: `packages/core/test/engine/event-bus.test.ts`
- Test: `packages/core/test/engine/rng.test.ts`

- [ ] **Step 1: 编写 EventBus 测试**

创建 `packages/core/test/engine/event-bus.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../../src/engine/event-bus.js';

describe('EventBus', () => {
  it('should emit and receive events', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('TURN_START', handler);
    bus.emit({ type: 'TURN_START', playerIndex: 0, turnNumber: 1 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: 'TURN_START', playerIndex: 0, turnNumber: 1 });
  });

  it('should support multiple listeners', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('TURN_START', h1);
    bus.on('TURN_START', h2);
    bus.emit({ type: 'TURN_START', playerIndex: 0, turnNumber: 1 });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe via returned function', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsub = bus.on('TURN_START', handler);
    unsub();
    bus.emit({ type: 'TURN_START', playerIndex: 0, turnNumber: 1 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call listeners for different event types', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('TURN_START', handler);
    bus.emit({ type: 'TURN_END', playerIndex: 0 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should clear all listeners', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('TURN_START', handler);
    bus.removeAllListeners();
    bus.emit({ type: 'TURN_START', playerIndex: 0, turnNumber: 1 });
    expect(handler).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 实现 EventBus**

创建 `packages/core/src/engine/event-bus.ts`:
```typescript
import type { GameEvent } from '@king-card/shared';

export class EventBus {
  private listeners = new Map<string, Set<(event: GameEvent) => void>>();

  emit(event: GameEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  on(eventType: string, handler: (event: GameEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);
    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
```

- [ ] **Step 3: 运行 EventBus 测试**

```bash
pnpm --filter @king-card/core test -- event-bus
```

Expected: 5 tests passed.

- [ ] **Step 4: 编写 RNG 测试**

创建 `packages/core/test/engine/rng.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { DefaultRNG, SeededRNG } from '../../../src/engine/rng.js';

describe('DefaultRNG', () => {
  it('should return values in range [0, 1) for next()', () => {
    const rng = new DefaultRNG();
    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should return integers in correct range for nextInt()', () => {
    const rng = new DefaultRNG();
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('should pick an element from the array', () => {
    const rng = new DefaultRNG();
    const arr = [1, 2, 3, 4, 5];
    for (let i = 0; i < 50; i++) {
      const val = rng.pick(arr);
      expect(arr).toContain(val);
    }
  });

  it('should shuffle without changing length', () => {
    const rng = new DefaultRNG();
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(arr);
    expect(shuffled).toHaveLength(5);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('should not mutate the original array in shuffle', () => {
    const rng = new DefaultRNG();
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    rng.shuffle(arr);
    expect(arr).toEqual(copy);
  });
});

describe('SeededRNG', () => {
  it('should produce deterministic results with same seed', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);
    for (let i = 0; i < 20; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });
});
```

- [ ] **Step 5: 实现 RNG**

创建 `packages/core/src/engine/rng.ts`:
```typescript
import type { RNG } from '@king-card/shared';

export class DefaultRNG implements RNG {
  next(): number {
    return Math.random();
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

// 简单的线性同余生成器（LCG），用于确定性测试
export class SeededRNG implements RNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // LCG: a=1664525, c=1013904223, m=2^32
    this.seed = (1664525 * this.seed + 1013904223) & 0xffffffff;
    return this.seed / 0xffffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
```

- [ ] **Step 6: 运行所有 core 测试**

```bash
pnpm --filter @king-card/core test
```

Expected: All tests passed.

- [ ] **Step 7: 提交**

```bash
git add packages/core/
git commit -m "feat(core): implement EventBus and RNG (default + seeded)"
```

---

## Task 4: Core 数据模型实现
**Depends on:** Task 2, Task 3

**Files:**
- Create: `packages/core/src/models/card.ts`
- Create: `packages/core/src/models/buff.ts`
- Create: `packages/core/src/models/card-instance.ts`
- Create: `packages/core/src/models/hero.ts`
- Create: `packages/core/src/models/minister.ts`
- Create: `packages/core/src/models/stratagem.ts`
- Create: `packages/core/src/models/player.ts`
- Create: `packages/core/src/models/game.ts`
- Test: `packages/core/test/models/card-instance.test.ts`
- Test: `packages/core/test/models/player.test.ts`
- Test: `packages/core/test/models/game.test.ts`

> **注意**: Card, Buff, HeroState, Minister, Player, GameState 等接口已在 shared/engine-types.ts 中定义。core/models 中的文件提供**工厂函数**（createCardInstance, createPlayer, createGameState）和**辅助方法**。

- [ ] **Step 1: 编写 CardInstance 工厂测试**

创建 `packages/core/test/models/card-instance.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createCardInstance } from '../../../src/models/card-instance.js';
import type { Card } from '@king-card/shared';

const dummyCard: Card = {
  id: 'test_minion',
  name: 'Test Minion',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 3,
  attack: 4,
  health: 5,
  keywords: [],
  effects: [],
};

describe('createCardInstance', () => {
  it('should create instance with correct base stats', () => {
    const inst = createCardInstance(dummyCard, 0);
    expect(inst.card).toBe(dummyCard);
    expect(inst.ownerIndex).toBe(0);
    expect(inst.currentAttack).toBe(4);
    expect(inst.currentHealth).toBe(5);
    expect(inst.currentMaxHealth).toBe(5);
  });

  it('should initialize remainingAttacks to 0 for non-charge/rush minions', () => {
    const inst = createCardInstance(dummyCard, 0);
    expect(inst.remainingAttacks).toBe(0);
  });

  it('should set justPlayed to true', () => {
    const inst = createCardInstance(dummyCard, 0);
    expect(inst.justPlayed).toBe(true);
  });

  it('should generate unique instance IDs', () => {
    const inst1 = createCardInstance(dummyCard, 0);
    const inst2 = createCardInstance(dummyCard, 0);
    expect(inst1.instanceId).not.toBe(inst2.instanceId);
  });

  it('should initialize buffs as empty array', () => {
    const inst = createCardInstance(dummyCard, 0);
    expect(inst.buffs).toEqual([]);
  });
});
```

- [ ] **Step 2: 实现 CardInstance 工厂**

创建 `packages/core/src/models/card-instance.ts`:
```typescript
import type { Card, CardInstance } from '@king-card/shared';

let instanceCounter = 0;

export function createCardInstance(card: Card, ownerIndex: 0 | 1): CardInstance {
  const hasRush = card.keywords.includes('RUSH');
  const hasCharge = card.keywords.includes('CHARGE');
  const hasAssassin = card.keywords.includes('ASSASSIN');

  return {
    card,
    instanceId: `${card.id}_${++instanceCounter}`,
    ownerIndex,
    currentAttack: card.attack ?? 0,
    currentHealth: card.health ?? 0,
    currentMaxHealth: card.health ?? 0,
    remainingAttacks: (hasRush || hasCharge || hasAssassin) ? 1 : 0,
    justPlayed: true,
    sleepTurns: card.keywords.includes('RESEARCH') ? 1 : 0,
    garrisonTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
    position: undefined,
  };
}

export function resetInstanceCounter(): void {
  instanceCounter = 0;
}
```

- [ ] **Step 3: 编写 Player 工厂测试**

创建 `packages/core/test/models/player.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createPlayer } from '../../../src/models/player.js';
import { resetInstanceCounter } from '../../../src/models/card-instance.js';
import type { Card, EmperorData } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';

const testEmperor: EmperorData = {
  emperorCard: {
    id: 'china_qin_shihuang', name: '秦始皇', civilization: 'CHINA',
    type: 'EMPEROR', rarity: 'LEGENDARY', cost: 4, keywords: [], effects: [],
    heroSkill: { name: '召唤兵马俑', description: '召唤一个1/1兵马俑', cost: 1, effect: { trigger: 'ON_PLAY', type: 'SUMMON', params: {} } },
  } as Card,
  ministers: [],
  boundGenerals: [],
  boundSorceries: [],
};

describe('createPlayer', () => {
  beforeEach(() => { resetInstanceCounter(); });

  it('should create player with correct initial state', () => {
    const deck: Card[] = Array(30).fill(null).map((_, i) => ({
      id: `card_${i}`, name: `Card ${i}`, civilization: 'CHINA' as const,
      type: 'MINION' as const, rarity: 'COMMON' as const, cost: 1,
      attack: 1, health: 1, keywords: [], effects: [],
    }));
    const player = createPlayer(0, 'p1', 'Player 1', 'CHINA', deck, testEmperor);
    expect(player.id).toBe('p1');
    expect(player.hero.health).toBe(GAME_CONSTANTS.INITIAL_HEALTH);
    expect(player.hero.emperorId).toBe('china_qin_shihuang');
    expect(player.deck).toHaveLength(30);
    expect(player.hand).toHaveLength(0);
    expect(player.energyCrystal).toBe(0);
    expect(player.maxEnergy).toBe(0);
    expect(player.handLimit).toBe(GAME_CONSTANTS.MAX_HAND_SIZE);
    expect(player.cannotDrawNextTurn).toBe(false);
  });
});
```

- [ ] **Step 4: 实现 Player 工厂**

创建 `packages/core/src/models/player.ts`:
```typescript
import type { Player, Card, EmperorData, Civilization } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';
import { createCardInstance } from './card-instance.js';
import { resetInstanceCounter } from './card-instance.js';

export function createPlayer(
  ownerIndex: 0 | 1,
  id: string,
  name: string,
  civilization: Civilization,
  deck: Card[],
  startingEmperor: EmperorData,
): Player {
  resetInstanceCounter();

  const deckInstances = deck.map(card => createCardInstance(card, ownerIndex));

  return {
    id,
    name,
    hero: {
      emperorId: startingEmperor.emperorCard.id,
      emperorName: startingEmperor.emperorCard.name,
      health: GAME_CONSTANTS.INITIAL_HEALTH,
      maxHealth: GAME_CONSTANTS.INITIAL_HEALTH,
      armor: 0,
      heroSkill: startingEmperor.emperorCard.heroSkill ?? null,
      heroSkillUsedThisTurn: false,
      heroSkillCooldown: false,
      persistentEffects: [],
    },
    civilization,
    hand: [],
    handLimit: GAME_CONSTANTS.MAX_HAND_SIZE,
    deck: deckInstances,
    graveyard: [],
    battlefield: [],
    activeStratagems: [],
    costModifiers: [],
    energyCrystal: 0,
    maxEnergy: 0,
    cannotDrawNextTurn: false,
    ministerPool: startingEmperor.ministers.map(m => ({
      ...m,
      skillUsedThisTurn: false,
      cooldown: false,
    })),
    activeMinisterIndex: startingEmperor.ministers.length > 0 ? 0 : -1,
    boundCards: [],
  };
}
```

- [ ] **Step 5: 编写 GameState 工厂测试**

创建 `packages/core/test/models/game.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createGameState } from '../../../src/models/game.js';
import type { Card, EmperorData } from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';

const dummyEmperor: EmperorData = {
  emperorCard: {
    id: 'emperor_1', name: 'Test Emperor', civilization: 'CHINA',
    type: 'EMPEROR', rarity: 'LEGENDARY', cost: 4, keywords: [], effects: [],
  } as Card,
  ministers: [],
  boundGenerals: [],
  boundSorceries: [],
};

function makeDeck(n: number): Card[] {
  return Array(n).fill(null).map((_, i) => ({
    id: `c${i}`, name: `Card ${i}`, civilization: 'CHINA' as const,
    type: 'MINION' as const, rarity: 'COMMON' as const, cost: 1,
    attack: 1, health: 1, keywords: [], effects: [],
  }));
}

describe('createGameState', () => {
  it('should create initial game state with two players', () => {
    const state = createGameState(makeDeck(30), makeDeck(30), dummyEmperor, dummyEmperor);
    expect(state.players).toHaveLength(2);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.turnNumber).toBe(0);
    expect(state.phase).toBe('ENERGY_GAIN');
    expect(state.isGameOver).toBe(false);
  });

  it('should initialize both heroes with 30 HP', () => {
    const state = createGameState(makeDeck(30), makeDeck(30), dummyEmperor, dummyEmperor);
    expect(state.players[0].hero.health).toBe(GAME_CONSTANTS.INITIAL_HEALTH);
    expect(state.players[1].hero.health).toBe(GAME_CONSTANTS.INITIAL_HEALTH);
  });

  it('should create 30 card instances per player deck', () => {
    const state = createGameState(makeDeck(30), makeDeck(30), dummyEmperor, dummyEmperor);
    expect(state.players[0].deck).toHaveLength(30);
    expect(state.players[1].deck).toHaveLength(30);
  });
});
```

- [ ] **Step 6: 实现 GameState 工厂**

创建 `packages/core/src/models/game.ts`:
```typescript
import type { GameState, Card, EmperorData } from '@king-card/shared';
import { createPlayer } from './player.js';

export function createGameState(
  deck1: Card[],
  deck2: Card[],
  emperor1: EmperorData,
  emperor2: EmperorData,
): GameState {
  return {
    players: [
      createPlayer(0, 'p1', 'Player 1', 'CHINA', deck1, emperor1),
      createPlayer(1, 'p2', 'Player 2', 'CHINA', deck2, emperor2),
    ],
    currentPlayerIndex: 0,
    turnNumber: 0,
    phase: 'ENERGY_GAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
  };
}
```

- [ ] **Step 7: 运行测试**

```bash
pnpm --filter @king-card/core test
```

Expected: All tests passed.

- [ ] **Step 8: 提交**

```bash
git add packages/core/src/models/ packages/core/test/models/
git commit -m "feat(core): implement data model factories (CardInstance, Player, GameState)"
```

---

## Task 5: StateMutator 实现
**Depends on:** Task 4
**Files:** `packages/core/src/engine/state-mutator.ts`, `packages/core/test/engine/state-mutator.test.ts`
**Scope:** 实现受控状态修改通道——damage, heal, drawCards, summonMinion, destroyMinion, modifyStat, applyBuff, gainArmor, spendEnergy, grantExtraAttack 等 15 个方法。每个方法直接修改传入的 Player/GameState 对象并发出对应事件。

## Task 6: WinCondition 实现
**Depends on:** Task 4
**Files:** `packages/core/src/engine/win-condition.ts`, `packages/core/test/engine/win-condition.test.ts`
**Scope:** 胜负判定逻辑——英雄HP<=0、牌库抽空且需抽牌时判负。

## Task 7: GameLoop 回合流程实现
**Depends on:** Task 5, Task 6
**Files:** `packages/core/src/engine/game-loop.ts`, `packages/core/test/engine/game-loop.test.ts`
**Scope:** ENERGY_GAIN(增加能量上限+1) → DRAW(抽1张牌，检查手牌上限和cannotDrawNextTurn) → UPKEEP(持续妙计倒计时、屯田计数) → MAIN → END。包含回合开始时的状态重置（remainingAttacks、justPlayed、heroSkillUsedThisTurn）。

## Task 8: ActionExecutor 基础操作实现
**Depends on:** Task 7
**Files:** `packages/core/src/engine/action-executor.ts`, `packages/core/test/engine/action-executor.test.ts`
**Scope:** playCard(出牌验证能量/战场/手牌)、attack(攻击验证嘲讽/突袭/冲锋/刺客)、endTurn。返回 EngineResult。原子性保证（先校验后执行）。

## Task 9: GameEngine 主类集成
**Depends on:** Task 7, Task 8
**Files:** `packages/core/src/engine/game-engine.ts`, `packages/core/test/engine/game-engine.test.ts`
**Scope:** GameEngine.create() 初始化（洗牌、发手牌、首发文臣）、getValidActions 查询、操作委托。集成测试：能跑完一个最小对局循环。

## Task 10: EffectResolver 框架 + 基础关键词处理器
**Depends on:** Task 5
**Files:** `packages/core/src/engine/effect-resolver.ts`, `packages/core/src/cards/effects/*.ts`, `packages/core/test/cards/effects/*.test.ts`
**Scope:** EffectRegistry 注册表。实现 BATTLECRY, DEATHRATTLE, TAUNT, RUSH, CHARGE, ASSASSIN 六个基础处理器。

## Task 11: 高级关键词处理器
**Depends on:** Task 10
**Files:** `packages/core/src/cards/effects/combo-strike.ts`, `mobilize.ts`, `garrison.ts`, `aura.ts`, `packages/core/test/cards/effects/*.test.ts`
**Scope:** COMBO_STRIKE(ON_KILL + grantExtraAttack), MOBILIZE(打出时条件检查), GARRISON(ON_TURN_START计数), AURA(持续光环)。

## Task 12: 中国文明卡牌数据定义
**Depends on:** Task 10, Task 11
**Files:** `packages/core/src/cards/definitions/china-*.ts`, `packages/core/test/cards/definitions/china.test.ts`
**Scope:** 3帝王 + 4文臣 + 2将领 + 6生物 + 4妙计 + 2巫术 = 21张卡牌的完整数据定义。CardRegistry 注册。

## Task 13: 帝王切换 + 文臣系统
**Depends on:** Task 9, Task 12
**Files:** `packages/core/test/engine/emperor-switch.test.ts`, `packages/core/test/engine/minister.test.ts`
**Scope:** playCard 帝王卡的完整流程（英雄替换、文臣替换、绑定卡发放、旧绑定卡消失）。useMinisterSkill / switchMinister 操作。

## Task 14: Phaser 3 项目初始化 + 场景框架
**Depends on:** Task 9
**Files:** `packages/ui-phaser/index.html`, `packages/ui-phaser/src/main.ts`, `packages/ui-phaser/src/config.ts`, `packages/ui-phaser/vite.config.ts`, `packages/ui-phaser/src/scenes/BootScene.ts`, `MenuScene.ts`, `BattleScene.ts`
**Scope:** Vite + Phaser 3 初始化。BootScene 加载占位资源。MenuScene 帝王选择按钮。BattleScene 区域容器划分。

## Task 15: 核心渲染组件
**Depends on:** Task 14
**Files:** `packages/ui-phaser/src/components/*.ts`
**Scope:** CardSprite(卡牌渲染)、HandZone(扇形+拖拽)、BoardZone(动态排列+预览放置)、HeroPanel、EnergyBar、MinisterPanel、TurnIndicator。

## Task 16: 前后端对接 + 热座模式 + 动画
**Depends on:** Task 13, Task 15
**Files:** `packages/ui-phaser/src/input/InputHandler.ts`, `packages/ui-phaser/src/animations/AnimationQueue.ts`
**Scope:** InputHandler ↔ GameEngine 对接。AnimationQueue 串行/并行调度。事件订阅→动画→UI更新管线。热座遮罩。胜利/失败画面。

---

> **执行方式**: 推荐使用 subagent-driven-development 模式，每个 Task 由独立 subagent 执行并审查。Task 1-4 有完整代码和测试步骤可直接执行；Task 5-16 在执行时展开为同等详细度的步骤。
