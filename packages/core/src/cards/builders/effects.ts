// ─── Typed Effect DSL ────────────────────────────────────────────────
// 为常见的 CardEffect 提供强类型构造器，按 trigger 分组命名空间。
// 定义文件写：`onPlay.damage('ENEMY_MINION', 3)`
// 而不是：`{ trigger: 'ON_PLAY', type: 'DAMAGE', params: { target: 'ENEMY_MINION', amount: 3 } }`
//
// 好处：
//   1. params 形状由每个 builder 精确约束，拼写错误编译期暴露。
//   2. trigger 字符串不再裸写，杜绝 'ON_PLAY'/'ON-PLAY' 之类手抖。
//   3. 阅读定义文件时语义清晰、行数大幅缩减。
//
// 每个 builder 返回的仍是普通 `CardEffect`，下游 engine / dispatcher
// 无需任何改动即可消费。

import type { CardEffect, EffectType, EffectTrigger, Keyword } from '@king-card/shared';

// ─── Target Vocabulary ───────────────────────────────────────────────
// 现有定义中出现过的 target / targetFilter 枚举值

export type SingleTarget =
  | 'ENEMY_MINION'
  | 'FRIENDLY_MINION'
  | 'HERO'
  | 'SELF';

export type TargetFilter =
  | 'ALL_FRIENDLY_MINIONS'
  | 'ALL_ENEMY_MINIONS'
  | 'ALL_MINIONS'
  | 'RANDOM_FRIENDLY_MINION'
  | 'RANDOM_ENEMY_MINION'
  | 'SELF';

export type PlayerRef = 'SELF' | 'OPPONENT';

export type BuffKind = 'AURA' | 'TEMPORARY' | 'PERMANENT';

// ─── Option Shapes ───────────────────────────────────────────────────

export interface ModifyStatOpts {
  target?: SingleTarget;
  targetFilter?: TargetFilter;
  attackDelta?: number;
  healthDelta?: number;
  attackSet?: number;
}

export interface ApplyBuffOpts {
  target?: SingleTarget;
  targetFilter?: TargetFilter;
  attackDelta?: number;
  attackBonus?: number;
  healthBonus?: number;
  keywordsGranted?: Keyword[];
  type?: BuffKind;
  remainingTurns?: number;
}

export interface ConditionalBuffOpts {
  mobilizeThreshold: number;
  attackBonus?: number;
  healthBonus?: number;
  drawCount?: number;
}

export interface GarrisonMarkOpts {
  target?: SingleTarget;
  targetFilter?: TargetFilter;
  garrisonTurns: number;
}

export interface RandomDiscardOpts {
  targetPlayer: PlayerRef;
  count: number;
}

export interface SetDrawLockOpts {
  targetPlayer: PlayerRef;
  locked: boolean;
}

export interface SummonOpts {
  count?: number;
}

export interface AppliedEffectSpec {
  type: EffectType;
  params: Record<string, unknown>;
}

export interface ActivateStratagemOpts {
  duration: number;
  appliedEffects: AppliedEffectSpec[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function mkEffect(
  trigger: EffectTrigger,
  type: EffectType,
  params: Record<string, unknown>,
): CardEffect {
  return { trigger, type, params };
}

function isFilter(t: SingleTarget | TargetFilter): t is TargetFilter {
  return (
    t === 'ALL_FRIENDLY_MINIONS' ||
    t === 'ALL_ENEMY_MINIONS' ||
    t === 'ALL_MINIONS' ||
    t === 'RANDOM_FRIENDLY_MINION' ||
    t === 'RANDOM_ENEMY_MINION'
    // 'SELF' 在 SingleTarget 与 TargetFilter 中重名，统一视为 SingleTarget 走 target 字段。
  );
}

/**
 * 构造一组绑定在特定 trigger 上的 effect 构造器。
 * 每个文明定义文件只需导入 `onPlay` / `onDeath` 等命名空间即可。
 */
function makeTriggerBuilders(trigger: EffectTrigger) {
  return {
    /** 召唤指定 ID 的随从，可指定数量（>1 时写入 params.count） */
    summon: (cardId: string, opts: SummonOpts = {}): CardEffect => {
      const params: Record<string, unknown> = { cardId };
      if (opts.count && opts.count > 1) params.count = opts.count;
      return mkEffect(trigger, 'SUMMON', params);
    },

    /** 召唤当前目标生物的 1/1 复制体（引擎侧识别 `cloneOfInstanceId: 'TARGET'`） */
    summonCloneOfTarget: (): CardEffect =>
      mkEffect(trigger, 'SUMMON', { cloneOfInstanceId: 'TARGET' }),

    /** 抽 N 张牌 */
    draw: (count: number): CardEffect =>
      mkEffect(trigger, 'DRAW', { count }),

    /**
     * 造成伤害。第一个参数可以是单个目标（ENEMY_MINION 等）
     * 或群体过滤器（ALL_ENEMY_MINIONS / RANDOM_ENEMY_MINION / ALL_MINIONS 等）。
     */
    damage: (target: SingleTarget | TargetFilter, amount: number): CardEffect => {
      const params = isFilter(target)
        ? { targetFilter: target, amount }
        : { target, amount };
      return mkEffect(trigger, 'DAMAGE', params);
    },

    /** 治疗。支持单目标（HERO / FRIENDLY_MINION）或群体过滤器（ALL_FRIENDLY_MINIONS 等）。 */
    heal: (target: SingleTarget | TargetFilter, amount: number): CardEffect => {
      const params = isFilter(target)
        ? { targetFilter: target, amount }
        : { target, amount };
      return mkEffect(trigger, 'HEAL', params);
    },

    /** 数值修改（attack/health 的 delta 或 set） */
    modifyStat: (opts: ModifyStatOpts): CardEffect => {
      const params: Record<string, unknown> = {};
      if (opts.target !== undefined) params.target = opts.target;
      if (opts.targetFilter !== undefined) params.targetFilter = opts.targetFilter;
      if (opts.attackDelta !== undefined) params.attackDelta = opts.attackDelta;
      if (opts.healthDelta !== undefined) params.healthDelta = opts.healthDelta;
      if (opts.attackSet !== undefined) params.attackSet = opts.attackSet;
      return mkEffect(trigger, 'MODIFY_STAT', params);
    },

    /** 施加 buff（临时/永久/光环），可附带关键字授予 */
    applyBuff: (opts: ApplyBuffOpts): CardEffect => {
      const params: Record<string, unknown> = {};
      if (opts.target !== undefined) params.target = opts.target;
      if (opts.targetFilter !== undefined) params.targetFilter = opts.targetFilter;
      if (opts.attackDelta !== undefined) params.attackDelta = opts.attackDelta;
      if (opts.attackBonus !== undefined) params.attackBonus = opts.attackBonus;
      if (opts.healthBonus !== undefined) params.healthBonus = opts.healthBonus;
      if (opts.keywordsGranted !== undefined) params.keywordsGranted = opts.keywordsGranted;
      params.type = opts.type ?? 'TEMPORARY';
      if (opts.remainingTurns !== undefined) params.remainingTurns = opts.remainingTurns;
      return mkEffect(trigger, 'APPLY_BUFF', params);
    },

    /** 条件 buff（动员关键字相关） */
    conditionalBuff: (opts: ConditionalBuffOpts): CardEffect => {
      const params: Record<string, unknown> = {
        mobilizeThreshold: opts.mobilizeThreshold,
      };
      if (opts.attackBonus !== undefined) params.attackBonus = opts.attackBonus;
      if (opts.healthBonus !== undefined) params.healthBonus = opts.healthBonus;
      if (opts.drawCount !== undefined) params.drawCount = opts.drawCount;
      return mkEffect(trigger, 'CONDITIONAL_BUFF', params);
    },

    /** 获得护甲 */
    gainArmor: (amount: number): CardEffect =>
      mkEffect(trigger, 'GAIN_ARMOR', { amount }),

    /** 驻守标记 */
    garrisonMark: (opts: GarrisonMarkOpts): CardEffect => {
      const params: Record<string, unknown> = { garrisonTurns: opts.garrisonTurns };
      if (opts.target !== undefined) params.target = opts.target;
      if (opts.targetFilter !== undefined) params.targetFilter = opts.targetFilter;
      return mkEffect(trigger, 'GARRISON_MARK', params);
    },

    /** 消灭单个目标 */
    destroy: (target: SingleTarget): CardEffect =>
      mkEffect(trigger, 'DESTROY', { target }),

    /** 随机消灭（按过滤器指定友方/敌方） */
    randomDestroy: (targetFilter: TargetFilter): CardEffect =>
      mkEffect(trigger, 'RANDOM_DESTROY', { targetFilter }),

    /** 随机弃牌 */
    randomDiscard: (opts: RandomDiscardOpts): CardEffect =>
      mkEffect(trigger, 'RANDOM_DISCARD', {
        targetPlayer: opts.targetPlayer,
        count: opts.count,
      }),

    /** 抽牌锁定/解锁 */
    setDrawLock: (opts: SetDrawLockOpts): CardEffect =>
      mkEffect(trigger, 'SET_DRAW_LOCK', {
        targetPlayer: opts.targetPlayer,
        locked: opts.locked,
      }),

    /** 激活持续妙计（appliedEffects 交由 `applied.*` 构造） */
    activateStratagem: (opts: ActivateStratagemOpts): CardEffect =>
      mkEffect(trigger, 'ACTIVATE_STRATAGEM', {
        duration: opts.duration,
        appliedEffects: opts.appliedEffects,
      }),

    /**
     * 逃生舱：当前 DSL 未覆盖的 effect 类型或非常规 params 形状可用它。
     * 随机敌方/友方伤害请用 `damage('RANDOM_ENEMY_MINION' | 'RANDOM_FRIENDLY_MINION', amount)`。
     */
    custom: (type: EffectType, params: Record<string, unknown>): CardEffect =>
      mkEffect(trigger, type, params),
  };
}

// ─── Namespace Exports ───────────────────────────────────────────────

export const onPlay = makeTriggerBuilders('ON_PLAY');
export const onDeath = makeTriggerBuilders('ON_DEATH');
export const onKill = makeTriggerBuilders('ON_KILL');
export const onAttack = makeTriggerBuilders('ON_ATTACK');
export const onTurnStart = makeTriggerBuilders('ON_TURN_START');
export const onTurnEnd = makeTriggerBuilders('ON_TURN_END');
export const aura = makeTriggerBuilders('AURA');

// ─── Nested-effect Spec Builder ──────────────────────────────────────
// `ACTIVATE_STRATAGEM.appliedEffects` 需要的是 `{type, params}` 而非带 trigger 的 CardEffect。
// 这里提供一个薄包装，让类型约束同样适用。

export const applied = {
  costModifier: (costReduction: number): AppliedEffectSpec => ({
    type: 'COST_MODIFIER',
    params: { costReduction },
  }),
  custom: (type: EffectType, params: Record<string, unknown>): AppliedEffectSpec => ({
    type,
    params,
  }),
};
