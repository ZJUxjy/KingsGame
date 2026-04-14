# 《帝王牌》Phase 1 设计文档 — 核心引擎 + 单机原型

> 日期：2026-04-14
> 范围：游戏规则引擎（TypeScript）+ Phaser 3 前端 + 中国文明完整实现 + 热座双人对战

---

## 一、项目概述

### 1.1 目标

构建《帝王牌》数字卡牌游戏的第一个可玩原型：
- 完整的游戏规则引擎（纯逻辑，零 UI 依赖）
- 基于 Phaser 3 的战场 UI
- 中国文明的全部卡牌（约21张）
- 热座模式双人对战（同一设备轮流操作）

### 1.2 范围边界

**包含**：
- 5种卡牌类型的数据模型和效果系统
- 帝王切换机制、文臣系统、将领泰坦机制
- 完整的回合流程和效果结算
- 动态战场布局（仿炉石拖拽放置）
- 基础动画（出牌、攻击、死亡、伤害飘字）

**不包含**（后续阶段）：
- 网络多人对战
- 其他4个文明
- 匹配系统/账号系统
- 商店/卡牌收集
- 高级视觉特效（粒子、震屏等）

---

## 二、技术架构

### 2.1 技术选型

| 层级 | 选择 | 说明 |
|------|------|------|
| 包管理 | pnpm + workspace | Monorepo 支持 |
| 语言 | TypeScript 5.x | 全栈统一 |
| 构建工具 (core) | tsup | 轻量库打包 |
| 构建工具 (UI) | Vite | 对 Phaser 友好 |
| 前端引擎 | Phaser 3 | 2D 游戏框架 |
| 测试 | Vitest | 与 Vite 生态统一 |
| 代码规范 | ESLint + Prettier | 统一风格 |

### 2.2 项目结构

```
king_card/
├── packages/
│   ├── core/                    # 游戏引擎（纯逻辑，零 UI 依赖）
│   │   ├── src/
│   │   │   ├── models/          # 数据模型
│   │   │   │   ├── card.ts      # 卡牌基础模型
│   │   │   │   ├── card-instance.ts # 运行时卡牌实例
│   │   │   │   ├── player.ts    # 玩家状态
│   │   │   │   ├── battlefield.ts # 战场状态
│   │   │   │   ├── hero.ts      # 英雄/帝王状态
│   │   │   │   ├── minister.ts  # 文臣状态
│   │   │   │   └── game.ts      # 完整游戏状态
│   │   │   ├── engine/          # 规则引擎
│   │   │   │   ├── game-loop.ts # 回合流程控制器
│   │   │   │   ├── action-executor.ts # 操作执行器
│   │   │   │   ├── effect-resolver.ts # 效果结算系统
│   │   │   │   └── win-condition.ts # 胜负判定
│   │   │   ├── cards/           # 卡牌系统
│   │   │   │   ├── definitions/ # 中国文明卡牌数据定义
│   │   │   │   ├── effects/     # 关键词效果处理器
│   │   │   │   └── registry.ts  # 卡牌注册表
│   │   │   └── index.ts         # 公共 API 导出
│   │   ├── test/                # 单元/集成测试
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui-phaser/               # Phaser 3 前端
│   │   ├── src/
│   │   │   ├── main.ts          # 入口
│   │   │   ├── scenes/
│   │   │   │   ├── BootScene.ts    # 加载资源
│   │   │   │   ├── MenuScene.ts    # 主菜单
│   │   │   │   └── BattleScene.ts  # 战场主场景
│   │   │   ├── components/     # UI 组件
│   │   │   │   ├── CardSprite.ts   # 卡牌渲染组件
│   │   │   │   ├── HandZone.ts     # 手牌区域
│   │   │   │   ├── BoardZone.ts    # 战场（动态排列）
│   │   │   │   ├── HeroPanel.ts    # 英雄面板
│   │   │   │   ├── EnergyBar.ts    # 能量水晶条
│   │   │   │   ├── MinisterPanel.ts # 文臣面板
│   │   │   │   └── TurnIndicator.ts # 回合指示器
│   │   │   ├── animations/     # 动画系统
│   │   │   └── input/          # 输入处理（拖拽、点击）
│   │   ├── assets/             # 资源文件
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                 # 共享类型
│       ├── src/
│       │   ├── types.ts        # 核心类型定义
│       │   ├── constants.ts    # 游戏常量
│       │   ├── protocols.ts    # 通信协议（预留给网络版）
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                 # root workspace 配置
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.js
└── README.md
```

### 2.3 核心设计原则

1. **`core` 不导入任何 DOM/Canvas/WebGL 依赖**——纯数据 + 纯函数
2. **`ui-phaser` 导入 `core` 和 `shared`**——负责所有渲染和用户输入
3. **`shared` 被 `core` 和 `ui-phaser` 共同依赖**——类型、常量、协议
4. **事件驱动**：core 引擎通过事件通知状态变化，UI 订阅事件更新画面

---

## 三、核心数据模型

### 3.1 枚举与基础类型

```typescript
// 文明
type Civilization = 'CHINA' | 'JAPAN' | 'USA' | 'UK' | 'GERMANY' | 'NEUTRAL';

// 卡牌类型
type CardType = 'MINION' | 'GENERAL' | 'STRATAGEM' | 'SORCERY' | 'EMPEROR';

// 品质
type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

// 关键词（统一 SNAKE_CASE 大写风格）
type Keyword =
  | 'BATTLECRY'           // 战吼：打出时触发
  | 'DEATHRATTLE'         // 亡语：死亡时触发
  | 'AURA'                // 光环：在场上时持续生效
  | 'TAUNT'               // 嘲讽：敌方必须优先攻击此单位
  | 'RUSH'                // 突袭：打出当回合可攻击敌方生物
  | 'CHARGE'              // 冲锋：打出当回合可攻击敌方生物和英雄
  | 'ASSASSIN'            // 刺客：打出当回合不可攻击生物，但可攻击英雄
  | 'COMBO_STRIKE'        // 连斩：消灭敌方生物后可再次攻击（每回合限1次）
  | 'STEALTH_KILL'        // 忍杀：攻击英雄时无视嘲讽（日本专属）
  | 'IRON_FIST'           // 铁腕：造成伤害后目标攻击力永久-2（德国专属）
  | 'MOBILIZE'            // 动员：己方场上生物≥N时触发额外效果（中国专属）
  | 'GARRISON'            // 屯田：存活N回合后自动强化（中国专属）
  | 'RESEARCH'            // 研发：入场休眠1回合，苏醒后获得强化（美国专属）
  | 'BLOCKADE'            // 封锁：目标下回合无法攻击或使用技能（英国专属）
  | 'COLONY'              // 殖民地：召唤低费远程单位（英国专属）
  | 'BLITZ'               // 闪电战：高攻低血冲锋/突袭单位（德国专属）
  | 'MOBILIZATION_ORDER'; // 动员令：从牌库召唤低费生物（美国专属）

// 游戏阶段
type GamePhase =
  | 'ENERGY_GAIN'    // 获得能量水晶
  | 'DRAW'           // 抽牌
  | 'UPKEEP'         // 维持阶段（持续妙计倒计时、研发苏醒）
  | 'MAIN'           // 主要阶段
  | 'END'            // 结束阶段

// 文臣类型
type MinisterType = 'STRATEGIST' | 'WARRIOR' | 'ADMINISTRATOR' | 'ENVOY';
// 谋臣型 | 武将型 | 内政型 | 特使型
```

### 3.2 卡牌模型

```typescript
interface Card {
  id: string;                    // 唯一ID，如 "china_qin_shihuang"
  name: string;                  // 卡牌名称
  civilization: Civilization;
  type: CardType;
  rarity: Rarity;
  cost: number;                  // 能量消耗

  // 生物卡属性（非生物卡为 undefined）
  attack?: number;
  health?: number;

  // 关键词列表
  keywords: Keyword[];

  // 效果定义
  effects: CardEffect[];

  // 将领卡专属：3个主动技能
  generalSkills?: GeneralSkill[];

  // 帝王卡专属
  emperorData?: EmperorData;
}

// 效果定义
interface CardEffect {
  trigger: EffectTrigger;        // 触发时机
  type: EffectType;              // 效果类型
  params: Record<string, unknown>; // 效果参数
}

type EffectTrigger =
  | 'ON_PLAY'        // 打出时（战吼）
  | 'ON_DEATH'       // 死亡时（亡语）
  | 'ON_KILL'        // 击杀敌方生物后（连斩等）
  | 'ON_TURN_START'  // 回合开始时
  | 'ON_TURN_END'    // 回合结束时
  | 'ON_ATTACK'      // 攻击时
  | 'AURA';          // 持续生效（光环）

// 将领技能
interface GeneralSkill {
  name: string;
  description: string;
  cost?: number;                 // 技能能量消耗（可选）
  effect: CardEffect;
}
```

### 3.3 Buff / Debuff 模型

```typescript
interface Buff {
  id: string;
  sourceInstanceId?: string;   // 来源生物实例ID（生物来源）
  sourceCardId?: string;       // 来源卡牌ID（非生物来源如妙计）
  attackBonus: number;
  healthBonus: number;
  maxHealthBonus: number;
  remainingTurns?: number;     // null = 永久/直到来源离场
  keywordsGranted: Keyword[];  // 赋予的关键词（如突袭）
  type: 'AURA' | 'TEMPORARY' | 'PERMANENT';
}
```

### 3.4 运行时卡牌实例

```typescript
interface CardInstance {
  card: Card;                    // 引用卡牌定义
  instanceId: string;            // 运行时唯一实例ID
  ownerIndex: 0 | 1;             // 所属玩家

  // 当前属性（可能被buff修改）
  currentAttack: number;
  currentHealth: number;
  currentMaxHealth: number;

  // 状态标记
  remainingAttacks: number;      // 本回合剩余攻击次数（默认1，连斩触发后+1）
  justPlayed: boolean;           // 本回合刚打出（影响突袭/冲锋判断）
  sleepTurns: number;            // 剩余休眠回合数（研发等）
  garrisonTurns: number;         // 屯田剩余回合数
  usedGeneralSkills: number;     // 已使用的将领技能数（0-3）

  // buff/debuff 列表
  buffs: Buff[];

  // 位置信息（由引擎管理）
  position?: number;             // 在战场上的位置索引
}
```

### 3.5 英雄与帝王

```typescript
// 切换帝王时保留的被动累积效果（如护甲、已触发的全局增益等）
interface PersistentEffect {
  id: string;
  sourceEmperorId: string;       // 来源帝王ID
  description: string;           // 效果描述（用于UI展示）
  // 具体效果数据由各效果处理器自行解释
  data: Record<string, unknown>;
}

interface HeroState {
  emperorId: string | null;      // 当前帝王卡ID（null = 默认英雄）
  emperorName: string;
  health: number;                // 当前生命值（最大30）
  maxHealth: number;
  armor: number;                 // 护甲

  // 英雄技能
  heroSkill: HeroSkill | null;
  heroSkillUsedThisTurn: boolean;
  heroSkillCooldown: boolean;    // 切换帝王后的冷却

  // 被动累积效果（切换帝王时保留）
  persistentEffects: PersistentEffect[];
}

interface HeroSkill {
  name: string;
  description: string;
  cost: number;                  // 能量消耗
  effect: CardEffect;
}

interface EmperorData {
  emperorCard: Card;             // 帝王卡定义
  ministers: Minister[];         // 绑定的文臣列表（3-5个）
  boundGenerals: Card[];         // 绑定的将领卡（2张）
  boundSorceries: Card[];        // 绑定的巫术卡（2张）
}
```

### 3.6 持续妙计模型

```typescript
// 持续妙计（在场上以光环形式存在 N 回合的妙计卡）
interface ActiveStratagem {
  card: Card;                    // 妙计卡定义
  instanceId: string;
  ownerIndex: number;
  remainingTurns: number;        // 剩余回合数（每回合 UPKEEP 阶段 -1）
  appliedEffects: AppliedEffect[];
}

interface AppliedEffect {
  type: 'COST_MODIFIER' | 'STAT_MODIFIER' | 'RESTRICTION';
  params: Record<string, unknown>;
}

// 费用修正器（如"明修栈道"的抽牌费用-1效果）
interface CostModifier {
  sourceId: string;
  modifier: (baseCost: number) => number;
  condition: (card: Card, context: Readonly<GameState>) => boolean;
  expiresAtTurn?: number;        // null = 持续到妙计过期
}
```

### 3.7 文臣

```typescript
interface Minister {
  id: string;
  emperorId: string;             // 所属帝王ID（切换帝王时用于识别替换范围）
  name: string;
  type: MinisterType;
  activeSkill: MinisterSkill;    // 主动技能
  skillUsedThisTurn: boolean;    // 本回合是否已使用
  cooldown: boolean;             // 登场冷却（切换文臣或帝王后本回合不能使用）
}
```

### 3.8 玩家状态

```typescript
interface Player {
  id: string;
  name: string;
  hero: HeroState;
  civilization: Civilization;

  // 卡牌区域
  hand: CardInstance[];          // 手牌（超限自动弃掉最新抽到的牌）
  handLimit: number;             // 手牌上限（默认10，可被效果临时修改）
  deck: CardInstance[];          // 牌库
  graveyard: CardInstance[];     // 坟场
  battlefield: CardInstance[];   // 场上生物（有序列表，最多7个）

  // 持续妙计
  activeStratagems: ActiveStratagem[];

  // 费用修正器列表（来自持续妙计等来源）
  costModifiers: CostModifier[];

  // 能量
  energyCrystal: number;         // 当前可用能量
  maxEnergy: number;             // 能量上限

  // 抽牌限制
  cannotDrawNextTurn: boolean;   // 下回合不能抽牌（焚书坑儒等效果）

  // 文臣
  ministerPool: Minister[];      // 当前帝王的文臣池
  activeMinisterIndex: number;   // 当前活跃文臣索引（-1表示无）

  // 帝王绑定卡（切换帝王时消失）
  boundCards: CardInstance[];
}
```

### 3.9 游戏状态

```typescript
// GameState 是纯数据对象（PODO），不包含 EventBus
interface GameState {
  players: [Player, Player];
  currentPlayerIndex: 0 | 1;
  turnNumber: number;
  phase: GamePhase;
  isGameOver: boolean;
  winnerIndex: number | null;
  winReason: string | null;
}

// 游戏常量
const GAME_CONSTANTS = {
  INITIAL_HEALTH: 30,
  DECK_SIZE: 30,
  STARTING_HAND_SIZE: 4,
  MAX_HAND_SIZE: 10,
  MAX_BOARD_SIZE: 7,
  MAX_ENERGY: 10,
  EMPEROR_SOFT_LIMIT: 4,       // 套牌中帝王卡数量软上限（含起始帝王）
  GENERAL_DECK_LIMIT: 2,
  SORCERY_DECK_LIMIT: 2,
} as const;
```

---

## 四、事件系统

### 4.1 事件类型

引擎所有状态变更通过事件发布，UI 层订阅渲染：

```typescript
type GameEvent =
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
  | { type: 'MINION_KILLED'; attackerInstanceId: string; targetInstanceId: string }  // 击杀事件（触发连斩）
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

type TargetRef = { type: 'MINION'; instanceId: string } | { type: 'HERO'; playerIndex: number };
```

### 4.2 EventBus 接口

EventBus 从 GameState 中分离，作为 GameEngine 的独立成员：

```typescript
interface EventBus {
  emit(event: GameEvent): void;
  on(eventType: string, handler: (event: GameEvent) => void): () => void;  // 返回取消订阅函数
  removeAllListeners(): void;
}
```

### 4.3 操作结果类型

引擎操作统一返回结果类型，区分成功和失败：

```typescript
type EngineResult<T = GameEvent[]> =
  | { success: true; events: T }
  | { success: false; errorCode: EngineErrorCode; message: string };

type EngineErrorCode =
  | 'INVALID_PHASE'           // 不在正确的游戏阶段
  | 'INSUFFICIENT_ENERGY'     // 能量不足
  | 'INVALID_TARGET'          // 目标不合法
  | 'BOARD_FULL'              // 战场已满
  | 'NO_VALID_ACTIONS'        // 无可用操作
  | 'CARD_NOT_IN_HAND'        // 卡牌不在手牌中
  | 'MINION_CANNOT_ATTACK'    // 生物本回合无法攻击
  | 'SKILL_ON_COOLDOWN'       // 技能在冷却中
  | 'GAME_ALREADY_OVER';      // 游戏已结束
```

---

## 五、游戏引擎接口

### 5.1 GameEngine 主接口

```typescript
class GameEngine {
  private state: GameState;      // 纯数据状态（PODO）
  private eventBus: EventBus;    // 独立事件总线

  // 创建新游戏
  // - 随机决定先手/后手（后手获得一张额外卡牌）
  // - 牌库自动洗牌（Fisher-Yates 算法）
  // - 起始手牌：先手4张，后手4张+1张补偿
  // - 首发文臣自动激活文臣池中的第一个
  static create(
    deck1: Card[],
    deck2: Card[],
    startingEmperor1: EmperorData,
    startingEmperor2: EmperorData,
    rng?: RNG                   // 可注入随机数生成器（测试用）
  ): GameEngine;

  // ===== 查询接口（只读，不修改状态） =====
  getGameState(): Readonly<GameState>;
  getValidActions(playerIndex: number): ValidAction[];
  getCurrentPlayer(): Readonly<Player>;

  // ===== 操作接口（返回 EngineResult） =====
  // 操作保证原子性：成功时返回完整事件列表，GameState 已更新；
  // 失败时返回错误码，**保证 GameState 未被修改**（先校验后执行）
  playCard(playerIndex: number, handIndex: number, targetBoardPosition?: number, targets?: TargetRef[]): EngineResult;
  attack(attackerInstanceId: string, target: TargetRef): EngineResult;
  useHeroSkill(playerIndex: number, target?: TargetRef): EngineResult;
  useMinisterSkill(playerIndex: number, target?: TargetRef): EngineResult;
  useGeneralSkill(generalInstanceId: string, skillIndex: number, target?: TargetRef): EngineResult;
  switchMinister(playerIndex: number, ministerIndex: number): EngineResult;
  endTurn(): EngineResult;
}

// 随机数策略接口（支持注入不同实现）
interface RNG {
  nextInt(min: number, max: number): number;
  next(): number;                // [0, 1)
  pick<T>(array: T[]): T;       // 随机选一个元素
  shuffle<T>(array: T[]): T[];  // 洗牌（返回新数组）
}
```

### 5.2 有效操作查询

```typescript
type ValidAction =
  | { type: 'PLAY_CARD'; handIndex: number; card: Card }
  | { type: 'ATTACK'; attackerId: string; validTargets: TargetRef[] }
  | { type: 'USE_HERO_SKILL'; validTargets?: TargetRef[] }
  | { type: 'USE_MINISTER_SKILL'; validTargets?: TargetRef[] }
  | { type: 'USE_GENERAL_SKILL'; generalId: string; skillIndex: number; validTargets?: TargetRef[] }
  | { type: 'SWITCH_MINISTER'; ministerIndex: number }
  | { type: 'END_TURN' };
```

### 5.3 目标选择系统

需要玩家交互选择目标时，引擎返回目标选择请求：

```typescript
interface TargetSelectionRequest {
  source: CardInstance;
  effect: CardEffect;
  validTargets: TargetRef[];
  requiredCount: number;       // 必须选的目标数（0 = 不需要选择）
  optionalCount: number;       // 可选的目标数
  allowSameTargetMultipleTimes?: boolean;  // 是否可重复选同一目标
  selectionMode: 'SINGLE' | 'MULTIPLE' | 'RANDOM';
}

// 目标选择合法性规则
// - 嘲讽生物存在时，非忍杀生物必须优先选择嘲讽目标
// - 突袭/冲锋/刺客影响可选目标范围
// - 己方英雄默认不可选为攻击目标（除非特定效果允许）
// - "随机目标"由引擎内部 RNG 决定，不需要UI交互
```

---

## 六、效果结算系统

### 6.1 效果处理器架构

每种关键词/效果是一个独立的处理器：

```typescript
interface EffectHandler {
  keyword: Keyword;
  onPlay?(ctx: EffectContext): void;
  onDeath?(ctx: EffectContext): void;
  onKill?(ctx: EffectContext): void;    // 击杀后触发（连斩等）
  onTurnStart?(ctx: EffectContext): void;
  onTurnEnd?(ctx: EffectContext): void;
  onAttack?(ctx: EffectContext): void;
  aura?: AuraEffect;
}

// 光环效果定义
interface AuraEffect {
  scope: 'ALL_FRIENDLY' | 'ALL_ENEMY' | 'ADJACENT' | 'SELF';  // 作用范围
  apply(target: CardInstance): Partial<Buff>;                   // 应用时的buff
}

// 效果上下文：提供只读状态访问 + 受控修改通道
interface EffectContext {
  state: Readonly<GameState>;     // 只读状态访问
  mutator: StateMutator;          // 受控的状态修改通道
  source: CardInstance;
  target?: CardInstance | HeroState;
  playerIndex: number;
  eventBus: EventBus;
  rng: RNG;
}

// 受控的状态修改通道（统一日志、校验和副作用管理）
interface StateMutator {
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
  grantExtraAttack(instanceId: string): void;   // 连斩：额外攻击次数+1
}
```

### 6.2 效果注册表

```typescript
class EffectRegistry {
  private handlers: Map<Keyword, EffectHandler> = new Map();

  register(handler: EffectHandler): void;
  get(keyword: Keyword): EffectHandler | undefined;
  resolve(trigger: EffectTrigger, ctx: EffectContext): void;
}
```

### 6.3 Phase 1 支持的效果列表

Phase 1 至少需要正确实现以下效果：

| 关键词 | 触发时机 | 复杂度 |
|--------|----------|--------|
| 战吼 (BATTLECRY) | 打出时 (ON_PLAY) | 低 |
| 亡语 (DEATHRATTLE) | 死亡时 (ON_DEATH) | 中（需处理链式死亡） |
| 击杀触发 (ON_KILL) | 击杀敌方生物后 | 中（连斩机制） |
| 光环 (AURA) | 持续生效 | 中（需跟踪场上光环源） |
| 嘲讽 (TAUNT) | 攻击目标选择 | 低 |
| 突袭 (RUSH) | 攻击权限判断 | 低 |
| 冲锋 (CHARGE) | 攻击权限判断 | 低 |
| 刺客 (ASSASSIN) | 攻击权限判断 | 低 |
| 连斩 (COMBO_STRIKE) | 击杀后 (ON_KILL) | 中 |
| 动员 (MOBILIZE) | 打出时/持续检查 | 低 |
| 屯田 (GARRISON) | 回合开始计数 (ON_TURN_START) | 低 |

---

## 七、中国文明卡牌清单

### 7.1 帝王卡（3张）

> **注**：以下帝王技能描述以本设计文档为准。与 detailed_design.md 的差异将在后续同步更新。

| 卡名 | 费用 | 类型 | 品质 | 效果 |
|------|------|------|------|------|
| 秦始皇 | 4 | EMPEROR | LEGENDARY | **战吼**：召唤一个1/1兵马俑到战场；**英雄技能**(1费)：召唤一个1/1兵马俑到战场；**绑定文臣**：李斯、韩信、萧何、陈平；**绑定将领**：霍去病、卫青；**绑定巫术**：巫蛊之祸、焚书坑儒 |
| 汉武帝 | 6 | EMPEROR | LEGENDARY | **战吼**：本回合所有友方生物攻击力+1（若场上友方生物≥4则再+1）；**英雄技能**(2费)：所有友方生物获得+1/+1；**绑定文臣**：董仲舒、卫青(文)、东方朔、桑弘羊 |
| 唐太宗 | 8 | EMPEROR | LEGENDARY | **战吼**：所有友方生物获得屯田标记（2回合后触发）；**英雄技能**(3费)：选择一个友方生物，召唤其1/1复制体到战场；**绑定文臣**：房玄龄、杜如晦、魏征、李靖 |

### 7.2 文臣卡（Phase 1 范围：秦始皇绑定文臣 4张）

> **范围说明**：Phase 1 仅实现秦始皇的4位文臣。汉武帝和唐太宗的绑定文臣在后续阶段补充。
> 文臣卡不占用30张主套牌位，存放在独立文臣池中。

| 卡名 | 类型 | 技能费用 | 技能效果 |
|------|------|----------|----------|
| 李斯 | 谋臣型 | 1能量 | 抽一张牌 |
| 韩信 | 武将型 | 2能量 | 使一个友方生物获得+2/+1和突袭 |
| 萧何 | 内政型 | 1能量 | 恢复3点生命值 |
| 陈平 | 特使型 | 1能量 | 使一个敌方生物本回合无法攻击 |

### 7.3 将领卡（2张）

| 卡名 | 费用 | 攻/血 | 关键词 | 技能 |
|------|------|-------|--------|------|
| 霍去病 | 7 | 6/6 | RUSH, CHARGE | ①(0费)：对敌方生物造成6点伤害 ②(0费)：获得+3/+3和COMBO_STRIKE ③(0费)：所有友方生物获得CHARGE |
| 卫青 | 6 | 5/7 | TAUNT | ①(0费)：召唤两个2/2骑兵 ②(0费)：所有友方生物+0/+3 ③(0费)：下回合所有敌方生物攻击力-2 |

### 7.4 生物卡（6张示例）

| 卡名 | 费用 | 攻/血 | 品质 | 关键词/效果 |
|------|------|-------|------|-------------|
| 兵马俑 | 1 | 1/1 | COMMON | 无 |
| 秦军步兵 | 2 | 2/2 | COMMON | MOBILIZE(2)：若己方场上生物>=2，获得+1/+1 |
| 汉朝骑兵 | 3 | 3/2 | COMMON | CHARGE; MOBILIZE(3)：若己方场上生物>=3，抽一张牌 |
| 大唐精锐 | 4 | 4/4 | RARE | GARRISON(2)：存活2回合后获得+2/+2 |
| 长城守卫 | 3 | 1/6 | COMMON | TAUNT |
| 禁军统领 | 5 | 5/5 | RARE | BATTLECRY：其他友方生物获得+1/+1 |

### 7.5 妙计卡（4张）

| 卡名 | 费用 | 品质 | 效果 |
|------|------|------|------|
| 筑城令 | 2 | COMMON | 使一个友方生物获得+0/+3和TAUNT |
| 总动员 | 4 | RARE | 本回合所有友方生物获得+2/+2 |
| 兵法三十六计 | 3 | COMMON | 抽两张牌 |
| 明修栈道 | 2 | RARE | 持续妙计：下回合你抽的牌费用-1（持续1回合） |

### 7.6 巫术卡（2张）

| 卡名 | 费用 | 品质 | 正面效果 | 负面效果 |
|------|------|------|----------|----------|
| 巫蛊之祸 | 4 | EPIC | 随机消灭一个敌方生物 | 随机消灭一个己方生物 |
| 焚书坑儒 | 3 | EPIC | 敌方随机弃1张牌 | 下回合不能抽牌 |

> **Phase 1 卡牌总计**：3帝王 + 4文臣(秦始皇) + 2将领 + 6生物 + 4妙计 + 2巫术 = **21张**
> （汉武帝/唐太宗各+4张文臣待后续阶段补充）

---

## 八、Phaser 3 前端设计

### 8.1 战场布局

```
┌──────────────────────────────────────────────────────────┐
│                     敌方信息区                            │
│  ┌─────────┐  ┌──────────────────┐  ┌─────────┐        │
│  │ 英雄头像 │  │   能量水晶: ●●●●   │  │ 文臣头像 │       │
│  │  HP:30  │  │   手牌: [3张]     │  │  李斯    │       │
│  └─────────┘  └──────────────────┘  └─────────┘        │
│                                                          │
│    ←  敌 方 战 场（动态排列，最多7个）  →                 │
│  ┌────┐ ┌────┐ ┌────┐                                    │
│  │敌1 │ │敌2 │ │敌3 │       （空位无固定槽）              │
│  │3/5 │ │2/4 │ │4/3 │                                    │
│  └────┘ └────┘ └────┘                                    │
│                                                          │
│ ═════════════════════ 回合信息栏 ═══════════════════════ │
│      第3回合 · 玩家1的回合    [结束回合]                   │
│                                                          │
│    ←  己 方 战 场（动态排列，最多7个）  →                 │
│  ┌────┐ ┌────┐ ┌────┐                                    │
│  │己1 │ │己2 │ │己3 │       （空位无固定槽）              │
│  │2/3 │ │4/5 │ │3/4 │                                    │
│  └────┘ └────┘ └────┘                                    │
│                                                          │
│  ┌─────────┐  ┌──────────────────┐  ┌─────────┐        │
│  │ 英雄头像 │  │   能量水晶: ●●●○   │  │ 文臣头像 │       │
│  │  HP:27  │  │   手牌: [6张]     │  │  萧何    │       │
│  └─────────┘  └──────────────────┘  └─────────┘        │
│                                                          │
│           🂠 🂠 🂠 🂠 🂠 🂠                               │
│              手 牌 区 (扇形展开)                          │
└──────────────────────────────────────────────────────────┘
```

### 8.2 动态战场放置机制

**核心特性**：不使用固定槽位，采用动态排列 + 拖拽预览插入。

| 行为 | 效果 |
|------|------|
| 空场打出生物 | 新生物出现在战场正中间 |
| 拖拽到某生物左侧 | 显示半透明预览卡在该生物左边 |
| 拖拽到某生物右侧 | 显示半透明预览卡在该生物右边 |
| 拖拽到最左空白区 | 放置在所有生物最左边 |
| 拖拽到最右空白区 | 放置在所有生物最右边（默认） |

**排列算法**：N 个生物均匀分布在战场区域宽度内，居中对齐。

### 8.3 场景规划

| 场景 | 功能 |
|------|------|
| **BootScene** | 加载所有资源（卡框、字体、UI素材），显示加载进度条 |
| **MenuScene** | 选择起始帝王（秦始皇/汉武帝/唐太宗）、开始对战按钮 |
| **BattleScene** | 核心战场——包含所有游戏交互和渲染 |

### 8.4 核心组件

| 组件 | 职责 |
|------|------|
| **CardSprite** | 单张卡牌渲染——卡框、 artwork 区域、攻血文字、品质边框色、关键词图标 |
| **HandZone** | 手牌容器——扇形排列、悬停放大(Y轴上浮+缩放)、拖拽检测 |
| **BoardZone** | 动态战场——拖拽预览放置、确认后重排(带缓动动画)、最多7个 |
| **HeroPanel** | 英雄面板——头像、HP数值、护甲值、帝王名称、技能按钮 |
| **EnergyBar** | 能量水晶可视化——宝石图标阵列、消耗碎裂动画 |
| **MinisterPanel** | 文臣面板——头像、技能按钮、切换下拉 |
| **TurnIndicator** | 回合指示——当前玩家高亮、结束回合按钮 |

### 8.5 交互流程

```
用户操作 → InputHandler 捕获手势
  → 验证合法性(GameEngine.getValidActions)
  → 调用 GameEngine 执行操作
  → 接收返回的事件列表
  → AnimationQueue 排队播放对应动画
  → 动画完成后更新 UI 状态
  → 检查胜负条件
  → 等待下一操作
```

### 8.6 热座模式

- 玩家1操作完毕后点击"结束回合"
- 屏幕显示"请将设备交给玩家2"的过渡遮罩
- 玩家2操作完毕后点击"结束回合"
- 循环直到游戏结束

---

## 九、开发阶段

### Phase 1：项目脚手架 + 共享类型

- pnpm workspace 初始化
- TypeScript 配置（base + 各包独立）
- `shared` 包：核心枚举、类型别名、游戏常量（GAME_CONSTANTS）
- ESLint + Prettier + Vitest 配置
- 所有包能编译通过

### Phase 2：游戏引擎 — 数据模型

- Card / Buff / CardInstance / Player / GameState 完整模型
- ActiveStratagem / CostModifier 持续妙计模型
- EventBus 实现（独立于 GameState）
- RNG 接口和默认实现
- 可创建游戏状态实例并通过测试验证

### Phase 3a：游戏引擎 — 骨架

> **拆分原因**：原 Phase 3 工作量过大（规则引擎+效果系统+21张卡+测试），风险集中。先完成骨架可尽早验证游戏循环正确性。

- GameLoop 回合流程控制器（ENERGY_GAIN → DRAW → UPKEEP → MAIN → END）
- ActionExecutor 基础操作（出牌/攻击/结束回合）
- WinCondition 胜负判定（英雄HP≤0 / 牌库抽空且需抽牌）
- 抽牌/弃牌完整规则（手牌上限10、cannotDrawNextTurn、牌库为空判负）
- **基础测试**：能跑完一个最小对局循环（出生物→攻击→结束→换人）

### Phase 3b：游戏引擎 — 效果系统 + 卡牌注册

- EffectResolver 效果结算框架
- 11 种关键词处理器（BATTLECRY, DEATHRATTLE, ON_KILL, AURA, TAUNT, RUSH, CHARGE, ASSASSIN, COMBO_STRIKE, MOBILIZE, GARRISON）
- StateMutator 受控修改通道实现
- 目标选择合法性验证
- 中国文明 ~21 张卡牌数据注册和效果实现
- **完整单元测试覆盖**

### Phase 4：Phaser 前端 — 基础框架

- Phaser 3 项目初始化 + Vite 构建
- BootScene（资源加载 + 进度条）
- MenuScene（帝王选择 + 开始按钮）
- BattleScene 框架（区域容器划分）

### Phase 5：Phaser 前端 — 核心渲染组件

- CardSprite（卡牌完整渲染，尺寸约 181x250）
- HandZone（扇形排列 + 悬停放大(Y轴上浮+1.15x缩放) + 拖拽检测）
- BoardZone（动态排列 + 拖拽预览放置 + 边界处理）
- HeroPanel / EnergyBar / MinisterPanel / TurnIndicator

#### BoardZone 边界情况处理

| 场景 | 行为 |
|------|------|
| 战场已满(7个) | 拒绝放置，卡牌弹回手牌位置 |
| 拖拽取消（拖回手牌区） | 卡牌平滑动画还原到手牌原位 |
| 动画播放期间 | 锁定输入，忽略用户操作 |
| 快速连续拖拽 | 第二张预览位置基于第一张确认后的新排列计算 |
| 战场仅1个生物时的左右分区 | 以该生物中心X坐标为界，左侧=插入左边，右侧=插入右边 |

### Phase 6：前端引擎对接 + 动画

- InputHandler ↔ GameEngine 对接
- AnimationQueue 动画队列：
  - 串行执行：同一操作链的动画按顺序播放
  - 并行允许：伤害飘字可与攻击动画并行
  - 可配置时长：出牌(~300ms)、攻击(~400ms)、死亡(~500ms)、伤害飘字(~800ms)
  - 用户快速操作时等待当前动画完成后再处理下一个
- 事件订阅 → 动画队列 → UI 更新管线
- 出牌/攻击/死亡/伤害飘字/帝皇切换/文臣切换动画
- 热座模式完整流程（含"请交接设备"过渡遮罩）
- 胜利/失败结算画面

---

## 十、非目标（明确不做）

- 网络多人对战
- 账号/认证系统
- 除中国外的其他4个文明
- 卡牌收集/商店系统
- 高级粒子特效/震屏/全屏转场
- 移动端适配（Phase 1 以桌面端为主）
