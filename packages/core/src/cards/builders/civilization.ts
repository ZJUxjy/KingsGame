// ─── Civilization Factory ────────────────────────────────────────────
// 为每个文明生成一组类型化的卡牌 / 重臣构造器。
//
// 目标：
//   1. 消除 `civilization: 'CHINA'`、`id: 'china_xxx'` 等重复样板。
//   2. 按卡种（minion/general/emperor/sorcery/stratagem/minister）提供默认值。
//   3. 产出对象仍是普通 `Card` / `Minister`，engine / test / UI 全程零改动。
//
// 使用示例：
//   const china = createCivilization({ code: 'CHINA', idPrefix: 'china' });
//   export const BINGMAYONG = china.minion({
//     slug: 'bingmayong',
//     name: '兵马俑',
//     rarity: 'COMMON',
//     cost: 1, attack: 1, health: 1,
//     keywords: ['DEATHRATTLE'],
//     description: '亡语：抽一张牌。',
//     effects: [onDeath.draw(1)],
//   });

import type {
  Card,
  CardEffect,
  Civilization,
  GeneralSkill,
  HeroSkill,
  Keyword,
  Minister,
  MinisterSkill,
  MinisterType,
  Rarity,
} from '@king-card/shared';

// ─── Per-card-type Option Shapes ─────────────────────────────────────

export interface MinionOptions {
  slug: string;
  name: string;
  rarity: Rarity;
  cost: number;
  attack: number;
  health: number;
  description: string;
  keywords?: Keyword[];
  effects?: CardEffect[];
}

export interface StratagemOptions {
  slug: string;
  name: string;
  rarity: Rarity;
  cost: number;
  description: string;
  keywords?: Keyword[];
  effects?: CardEffect[];
}

export interface SorceryOptions {
  slug: string;
  name: string;
  rarity?: Rarity; // 默认 EPIC
  cost: number;
  description: string;
  keywords?: Keyword[];
  effects?: CardEffect[];
}

export interface EmperorOptions {
  slug: string;
  name: string;
  cost: number;
  description: string;
  health?: number; // 默认 30
  keywords?: Keyword[];
  effects?: CardEffect[];
  heroSkill: HeroSkill;
}

export interface GeneralOptions {
  slug: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  description: string;
  keywords?: Keyword[];
  effects?: CardEffect[];
  generalSkills: GeneralSkill[];
}

export interface MinisterOptions {
  slug: string;
  /** 所属皇帝的 Card 对象：避免手抄 emperorId 字符串。 */
  emperor: Card;
  name: string;
  type: MinisterType;
  activeSkill: MinisterSkill;
  cooldown: number;
}

/** `heroSkill({...})`：强制 effect 字段类型安全并消除 cooldown 默认遗忘。 */
export interface HeroSkillOptions {
  name: string;
  description: string;
  cost: number;
  cooldown: number;
  effect: CardEffect;
}

/** `generalSkill({...})`：cost 默认 0，usesPerTurn 默认 1。 */
export interface GeneralSkillOptions {
  name: string;
  description: string;
  cost?: number;
  usesPerTurn?: number;
  effect: CardEffect;
}

export interface MinisterSkillOptions {
  name: string;
  description: string;
  cost: number;
  effect: CardEffect;
}

// ─── Top-level Builder ───────────────────────────────────────────────

export interface CivilizationFactoryConfig {
  code: Civilization;
  idPrefix: string;
}

export function createCivilization(config: CivilizationFactoryConfig) {
  const { code, idPrefix } = config;
  const mkId = (slug: string) => `${idPrefix}_${slug}`;

  return {
    code,
    idPrefix,
    id: mkId,

    // ── Card variants ──────────────────────────────────────────────

    minion(opts: MinionOptions): Card {
      return {
        id: mkId(opts.slug),
        name: opts.name,
        civilization: code,
        type: 'MINION',
        rarity: opts.rarity,
        cost: opts.cost,
        attack: opts.attack,
        health: opts.health,
        description: opts.description,
        keywords: opts.keywords ?? [],
        effects: opts.effects ?? [],
      };
    },

    stratagem(opts: StratagemOptions): Card {
      return {
        id: mkId(opts.slug),
        name: opts.name,
        civilization: code,
        type: 'STRATAGEM',
        rarity: opts.rarity,
        cost: opts.cost,
        description: opts.description,
        keywords: opts.keywords ?? [],
        effects: opts.effects ?? [],
      };
    },

    sorcery(opts: SorceryOptions): Card {
      return {
        id: mkId(opts.slug),
        name: opts.name,
        civilization: code,
        type: 'SORCERY',
        rarity: opts.rarity ?? 'EPIC',
        cost: opts.cost,
        description: opts.description,
        keywords: opts.keywords ?? [],
        effects: opts.effects ?? [],
      };
    },

    emperor(opts: EmperorOptions): Card {
      return {
        id: mkId(opts.slug),
        name: opts.name,
        civilization: code,
        type: 'EMPEROR',
        rarity: 'LEGENDARY',
        cost: opts.cost,
        attack: 0,
        health: opts.health ?? 30,
        description: opts.description,
        keywords: opts.keywords ?? [],
        effects: opts.effects ?? [],
        heroSkill: opts.heroSkill,
      };
    },

    general(opts: GeneralOptions): Card {
      return {
        id: mkId(opts.slug),
        name: opts.name,
        civilization: code,
        type: 'GENERAL',
        rarity: 'LEGENDARY',
        cost: opts.cost,
        attack: opts.attack,
        health: opts.health,
        description: opts.description,
        keywords: opts.keywords ?? [],
        effects: opts.effects ?? [],
        generalSkills: opts.generalSkills,
      };
    },

    // ── Minister ───────────────────────────────────────────────────

    minister(opts: MinisterOptions): Minister {
      return {
        id: mkId(opts.slug),
        emperorId: opts.emperor.id,
        name: opts.name,
        type: opts.type,
        activeSkill: opts.activeSkill,
        skillUsedThisTurn: false,
        cooldown: opts.cooldown,
      };
    },

    // ── Skill helpers ──────────────────────────────────────────────

    heroSkill(opts: HeroSkillOptions): HeroSkill {
      return {
        name: opts.name,
        description: opts.description,
        cost: opts.cost,
        cooldown: opts.cooldown,
        effect: opts.effect,
      };
    },

    generalSkill(opts: GeneralSkillOptions): GeneralSkill {
      return {
        name: opts.name,
        description: opts.description,
        cost: opts.cost ?? 0,
        usesPerTurn: opts.usesPerTurn ?? 1,
        effect: opts.effect,
      };
    },

    ministerSkill(opts: MinisterSkillOptions): MinisterSkill {
      return {
        name: opts.name,
        description: opts.description,
        cost: opts.cost,
        effect: opts.effect,
      };
    },
  };
}

export type CivilizationFactory = ReturnType<typeof createCivilization>;
