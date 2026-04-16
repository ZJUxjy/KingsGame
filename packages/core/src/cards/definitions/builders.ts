import type {
  Card,
  CardEffect,
  Civilization,
  EffectType,
  GeneralSkill,
  HeroSkill,
  Keyword,
  Minister,
  MinisterSkill,
  MinisterType,
  Rarity,
} from '@king-card/shared';

// ─── Effect Helpers ──────────────────────────────────────────────

export function onPlay(type: EffectType, params: Record<string, unknown>): CardEffect {
  return { trigger: 'ON_PLAY', type, params };
}

export function onDeath(type: EffectType, params: Record<string, unknown>): CardEffect {
  return { trigger: 'ON_DEATH', type, params };
}

export function onKill(type: EffectType, params: Record<string, unknown>): CardEffect {
  return { trigger: 'ON_KILL', type, params };
}

export function onTurnStart(type: EffectType, params: Record<string, unknown>): CardEffect {
  return { trigger: 'ON_TURN_START', type, params };
}

export function onTurnEnd(type: EffectType, params: Record<string, unknown>): CardEffect {
  return { trigger: 'ON_TURN_END', type, params };
}

export function onAttack(type: EffectType, params: Record<string, unknown>): CardEffect {
  return { trigger: 'ON_ATTACK', type, params };
}

// ─── Skill Helpers ───────────────────────────────────────────────

export interface MinisterSkillOptions {
  name: string;
  description: string;
  cost: number;
  effect: CardEffect;
}

export function createMinisterSkill(options: MinisterSkillOptions): MinisterSkill {
  return {
    name: options.name,
    description: options.description,
    cost: options.cost,
    effect: options.effect,
  };
}

export interface GeneralSkillOptions {
  name: string;
  description: string;
  effect: CardEffect;
  cost?: number;
  usesPerTurn?: number;
}

export function createGeneralSkill(options: GeneralSkillOptions): GeneralSkill {
  return {
    name: options.name,
    description: options.description,
    cost: options.cost ?? 0,
    usesPerTurn: options.usesPerTurn ?? 1,
    effect: options.effect,
  };
}

export interface HeroSkillOptions {
  name: string;
  description: string;
  cost: number;
  cooldown: number;
  effect: CardEffect;
}

export function createHeroSkill(options: HeroSkillOptions): HeroSkill {
  return {
    name: options.name,
    description: options.description,
    cost: options.cost,
    cooldown: options.cooldown,
    effect: options.effect,
  };
}

// ─── Entity Builders ─────────────────────────────────────────────

export interface CreateMinisterOptions {
  id: string;
  emperorId: string;
  name: string;
  type: MinisterType;
  activeSkill: MinisterSkill;
  cooldown: number;
}

export function createMinister(options: CreateMinisterOptions): Minister {
  return {
    id: options.id,
    emperorId: options.emperorId,
    name: options.name,
    type: options.type,
    activeSkill: options.activeSkill,
    skillUsedThisTurn: false,
    cooldown: options.cooldown,
  };
}

export interface CreateGeneralCardOptions {
  id: string;
  name: string;
  civilization: Civilization;
  cost: number;
  attack: number;
  health: number;
  description: string;
  keywords?: Keyword[];
  effects?: CardEffect[];
  generalSkills: GeneralSkill[];
  rarity?: Rarity;
}

export function createGeneralCard(options: CreateGeneralCardOptions): Card {
  return {
    id: options.id,
    name: options.name,
    civilization: options.civilization,
    type: 'GENERAL',
    rarity: options.rarity ?? 'LEGENDARY',
    cost: options.cost,
    attack: options.attack,
    health: options.health,
    description: options.description,
    keywords: options.keywords ?? [],
    effects: options.effects ?? [],
    generalSkills: options.generalSkills,
  };
}

export interface CreateEmperorCardOptions {
  id: string;
  name: string;
  civilization: Civilization;
  cost: number;
  health?: number;
  description: string;
  heroSkill: HeroSkill;
  effects?: CardEffect[];
  keywords?: Keyword[];
  rarity?: Rarity;
}

export function createEmperorCard(options: CreateEmperorCardOptions): Card {
  return {
    id: options.id,
    name: options.name,
    civilization: options.civilization,
    type: 'EMPEROR',
    rarity: options.rarity ?? 'LEGENDARY',
    cost: options.cost,
    attack: 0,
    health: options.health ?? 30,
    description: options.description,
    keywords: options.keywords ?? [],
    effects: options.effects ?? [],
    heroSkill: options.heroSkill,
  };
}
