import type { Card, GeneralSkill, HeroSkill, Keyword, Minister, MinisterSkill } from '@king-card/shared';
import { DEFAULT_LOCALE, type SupportedLocale } from './locale.js';

interface CardTextCarrier {
  name: string;
  description: string;
  heroSkill?: HeroSkill;
  generalSkills?: GeneralSkill[];
}

export const KEYWORD_LABELS: Record<SupportedLocale, Record<string, string>> = {
  'zh-CN': {
    BATTLECRY: '战吼',
    DEATHRATTLE: '亡语',
    AURA: '光环',
    TAUNT: '嘲讽',
    RUSH: '突袭',
    CHARGE: '冲锋',
    ASSASSIN: '刺杀',
    COMBO_STRIKE: '连击',
    STEALTH_KILL: '暗杀',
    MOBILIZE: '动员',
    GARRISON: '驻守',
    IRON_FIST: '铁拳',
    RESEARCH: '研究',
    BLOCKADE: '封锁',
    COLONY: '殖民',
    BLITZ: '闪击',
    MOBILIZATION_ORDER: '动员令',
  },
  'en-US': {
    BATTLECRY: 'Battlecry',
    DEATHRATTLE: 'Deathrattle',
    AURA: 'Aura',
    TAUNT: 'Taunt',
    RUSH: 'Rush',
    CHARGE: 'Charge',
    ASSASSIN: 'Assassin',
    COMBO_STRIKE: 'Combo Strike',
    STEALTH_KILL: 'Stealth Kill',
    MOBILIZE: 'Mobilize',
    GARRISON: 'Garrison',
    IRON_FIST: 'Iron Fist',
    RESEARCH: 'Research',
    BLOCKADE: 'Blockade',
    COLONY: 'Colony',
    BLITZ: 'Blitz',
    MOBILIZATION_ORDER: 'Mobilization Order',
  },
};

const TEXT_RESOURCE_TABLE: Record<string, Partial<Record<SupportedLocale, string>>> = {
  'Benjamin Franklin': { 'zh-CN': '本杰明·富兰克林' },
  'William Sherman': { 'zh-CN': '威廉·谢尔曼' },
  'Alexander Hamilton': { 'zh-CN': '亚历山大·汉密尔顿' },
  'William Pitt': { 'zh-CN': '威廉·皮特' },
  'Francis Drake': { 'zh-CN': '弗朗西斯·德雷克' },
  'Robert Walpole': { 'zh-CN': '罗伯特·沃波尔' },
  'Carl von Clausewitz': { 'zh-CN': '卡尔·冯·克劳塞维茨' },
  'Albrecht von Wallenstein': { 'zh-CN': '阿尔布雷希特·冯·华伦斯坦' },
  'Ludwig Erhard': { 'zh-CN': '路德维希·艾哈德' },
  Diplomacy: { 'zh-CN': '外交斡旋' },
  'National Bank': { 'zh-CN': '国家银行' },
  'Parliament Act': { 'zh-CN': '议会法案' },
  'Privateer Raid': { 'zh-CN': '私掠袭击' },
  'Fiscal Policy': { 'zh-CN': '财政政策' },
  'On War': { 'zh-CN': '战争论' },
  'Mercenary Captain': { 'zh-CN': '佣兵统帅' },
  'Economic Miracle': { 'zh-CN': '经济奇迹' },
  'GI (American Soldier)': { 'zh-CN': '大兵' },
  Marine: { 'zh-CN': '海军陆战队' },
  Ranger: { 'zh-CN': '游骑兵' },
  Medic: { 'zh-CN': '战地医护兵' },
  Airborne: { 'zh-CN': '空降兵' },
  'Sherman Tank': { 'zh-CN': '谢尔曼坦克' },
  'Arsenal of Democracy': { 'zh-CN': '民主兵工厂' },
  'Lend-Lease': { 'zh-CN': '租借法案' },
  'Air Superiority': { 'zh-CN': '制空权' },
  'Marshall Plan': { 'zh-CN': '马歇尔计划' },
  'Manhattan Project': { 'zh-CN': '曼哈顿计划' },
  'Monroe Doctrine': { 'zh-CN': '门罗主义' },
  'Ulysses S. Grant': { 'zh-CN': '尤利西斯·格兰特' },
  'George Patton': { 'zh-CN': '乔治·巴顿' },
  'Total War': { 'zh-CN': '总体战' },
  Siege: { 'zh-CN': '围攻' },
  'March to the Sea': { 'zh-CN': '向海进军' },
  'Blitzkrieg Counter': { 'zh-CN': '闪击反制' },
  'Rally the Troops': { 'zh-CN': '号召部队' },
  'Third Army': { 'zh-CN': '第三集团军' },
  Redcoat: { 'zh-CN': '红衫军' },
  Longbowman: { 'zh-CN': '长弓兵' },
  Knight: { 'zh-CN': '骑士' },
  'Royal Guard': { 'zh-CN': '皇家卫队' },
  Privateer: { 'zh-CN': '私掠船' },
  'Man-of-War': { 'zh-CN': '战列舰' },
  'Rule Britannia': { 'zh-CN': '统治不列颠' },
  'Tea Time': { 'zh-CN': '下午茶时光' },
  'Naval Blockade': { 'zh-CN': '海上封锁' },
  'Colonial Expansion': { 'zh-CN': '殖民扩张' },
  'Great Fire': { 'zh-CN': '伦敦大火' },
  'Enclosure Act': { 'zh-CN': '圈地法案' },
  'Duke of Wellington': { 'zh-CN': '惠灵顿公爵' },
  'Admiral Nelson': { 'zh-CN': '纳尔逊上将' },
  Waterloo: { 'zh-CN': '滑铁卢' },
  'Iron Duke': { 'zh-CN': '铁公爵' },
  'Thin Red Line': { 'zh-CN': '薄红线' },
  Trafalgar: { 'zh-CN': '特拉法加' },
  'England Expects': { 'zh-CN': '英格兰所望' },
  Broadside: { 'zh-CN': '齐射' },
  Landsknecht: { 'zh-CN': '雇佣枪兵' },
  Hussar: { 'zh-CN': '骠骑兵' },
  Grenadier: { 'zh-CN': '掷弹兵' },
  Panzer: { 'zh-CN': '装甲战车' },
  'Teutonic Knight': { 'zh-CN': '条顿骑士' },
  Stormtrooper: { 'zh-CN': '突击队' },
  'Blitzkrieg Doctrine': { 'zh-CN': '闪击战学说' },
  Enigma: { 'zh-CN': '恩尼格玛' },
  'Artillery Barrage': { 'zh-CN': '炮火齐射' },
  Fortification: { 'zh-CN': '筑垒工事' },
  'V-2 Rocket': { 'zh-CN': 'V2火箭' },
  'Scorched Earth': { 'zh-CN': '焦土战术' },
  'Otto von Bismarck': { 'zh-CN': '奥托·冯·俾斯麦' },
  'Erwin Rommel': { 'zh-CN': '埃尔温·隆美尔' },
  'Blood and Iron': { 'zh-CN': '铁血政策' },
  Realpolitik: { 'zh-CN': '现实政治' },
  Unification: { 'zh-CN': '统一帝国' },
  'Desert Fox': { 'zh-CN': '沙漠之狐' },
  Blitzkrieg: { 'zh-CN': '闪击战' },
  'Afrika Korps': { 'zh-CN': '非洲军团' },
  'A standard American soldier.': { 'zh-CN': '标准的美军士兵。' },
  'A basic British infantry soldier.': { 'zh-CN': '基础的不列颠步兵。' },
  'A basic German infantry unit.': { 'zh-CN': '基础的德意志步兵单位。' },
  'Rush.': { 'zh-CN': '突袭。' },
  'Charge.': { 'zh-CN': '冲锋。' },
  'Taunt.': { 'zh-CN': '嘲讽。' },
  'Battlecry: Heal all friendly minions for 1.': { 'zh-CN': '战吼：为所有友方生物恢复1点生命。' },
  'Rush. Battlecry: Deal 2 damage to an enemy minion.': { 'zh-CN': '突袭。战吼：对一个敌方生物造成2点伤害。' },
  'Battlecry: Draw a card.': { 'zh-CN': '战吼：抽一张牌。' },
  'Battlecry: Deal 2 damage to an enemy minion.': { 'zh-CN': '战吼：对一个敌方生物造成2点伤害。' },
  'Draw 1 card': { 'zh-CN': '抽一张牌' },
  'Draw a card': { 'zh-CN': '抽一张牌' },
  'Deal 2 damage to a random enemy minion': { 'zh-CN': '对一个随机敌方生物造成2点伤害' },
  'Gain 1 armor': { 'zh-CN': '获得1点护甲' },
  'Gain 2 armor': { 'zh-CN': '获得2点护甲' },
  'Deal 3 damage to an enemy minion': { 'zh-CN': '对一个敌方生物造成3点伤害' },
  'Deal 4 damage to all minions.': { 'zh-CN': '对所有生物造成4点伤害。' },
  'Opponent discards 1 random card.': { 'zh-CN': '对手随机弃一张牌。' },
  'All friendly minions get +1/+1.': { 'zh-CN': '所有友方生物获得+1/+1。' },
  'All friendly minions gain +1/+1.': { 'zh-CN': '所有友方生物获得+1/+1。' },
  'Draw 2 cards.': { 'zh-CN': '抽两张牌。' },
  'Deal 2 damage to all enemy minions.': { 'zh-CN': '对所有敌方生物造成2点伤害。' },
  'Heal all friendly minions for 3.': { 'zh-CN': '为所有友方生物恢复3点生命。' },
  'Charge. Skill 1: Total War — deal 3 damage to all enemy minions. Skill 2: Siege — deal 5 damage to an enemy minion. Skill 3: March to the Sea — all friendly minions gain Charge this turn.': { 'zh-CN': '冲锋。技能1：总体战，对所有敌方生物造成3点伤害。技能2：围攻，对一个敌方生物造成5点伤害。技能3：向海进军，所有友方生物本回合获得冲锋。' },
  'Deal 3 damage to all enemy minions': { 'zh-CN': '对所有敌方生物造成3点伤害' },
  'Deal 5 damage to an enemy minion': { 'zh-CN': '对一个敌方生物造成5点伤害' },
  'All friendly minions gain Charge this turn': { 'zh-CN': '所有友方生物本回合获得冲锋' },
  'Rush. Skill 1: Blitzkrieg Counter — deal 4 damage to an enemy minion. Skill 2: Rally the Troops — all friendly minions get +2/+1. Skill 3: Third Army — summon a 3/3 GI.': { 'zh-CN': '突袭。技能1：闪击反制，对一个敌方生物造成4点伤害。技能2：号召部队，所有友方生物获得+2/+1。技能3：第三集团军，召唤一个3/3大兵。' },
  'Deal 4 damage to an enemy minion': { 'zh-CN': '对一个敌方生物造成4点伤害' },
  'All friendly minions get +2/+1': { 'zh-CN': '所有友方生物获得+2/+1' },
  'Summon a 3/3 GI': { 'zh-CN': '召唤一个3/3大兵' },
  'Taunt. Skill①Waterloo: Deal 5 damage to an enemy minion. Skill②Iron Duke: Gain +0/+3. Skill③Thin Red Line: All friendly minions gain Taunt this turn.': { 'zh-CN': '嘲讽。技能①滑铁卢：对一个敌方生物造成5点伤害。技能②铁公爵：获得+0/+3。技能③薄红线：所有友方生物本回合获得嘲讽。' },
  'Gain +0/+3': { 'zh-CN': '获得+0/+3' },
  'All friendly minions gain Taunt this turn': { 'zh-CN': '所有友方生物本回合获得嘲讽' },
  'Charge. Skill①Trafalgar: Deal 3 damage to all enemy minions. Skill②England Expects: All friendly minions gain +2 attack. Skill③Broadside: Deal 6 damage to an enemy minion.': { 'zh-CN': '冲锋。技能①特拉法加：对所有敌方生物造成3点伤害。技能②英格兰所望：所有友方生物获得+2攻击力。技能③齐射：对一个敌方生物造成6点伤害。' },
  'All friendly minions gain +2 attack': { 'zh-CN': '所有友方生物获得+2攻击力' },
  'Deal 6 damage to an enemy minion': { 'zh-CN': '对一个敌方生物造成6点伤害' },
  'Summon a 2/2 Redcoat.': { 'zh-CN': '召唤一个2/2红衫军。' },
  'Taunt. Skills: Blood and Iron, Realpolitik, Unification.': { 'zh-CN': '嘲讽。技能：铁血政策、现实政治、统一帝国。' },
  'All friendly minions get +1/+2': { 'zh-CN': '所有友方生物获得+1/+2' },
  'Gain 4 armor': { 'zh-CN': '获得4点护甲' },
  'Rush, Charge. Skills: Desert Fox, Blitzkrieg, Afrika Korps.': { 'zh-CN': '突袭、冲锋。技能：沙漠之狐、闪击战、非洲军团。' },
  'Summon a 3/3 Panzer': { 'zh-CN': '召唤一个3/3装甲战车' },
  'Taunt. Battlecry: Gain 2 armor.': { 'zh-CN': '嘲讽。战吼：获得2点护甲。' },
  'Deal 4 damage to a random enemy minion and 1 damage to all enemy minions.': { 'zh-CN': '对一个随机敌方生物造成4点伤害，并对所有敌方生物造成1点伤害。' },
  'Destroy a random enemy minion and a random friendly minion.': { 'zh-CN': '随机消灭一个敌方生物和一个友方生物。' },
  'All friendly minions get +2 attack.': { 'zh-CN': '所有友方生物获得+2攻击力。' },
  'All friendly minions get +3 health and Taunt this turn.': { 'zh-CN': '所有友方生物获得+3生命值，并在本回合获得嘲讽。' },
};

function localizeText(text: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  if (!text) {
    return text;
  }

  if (locale === 'en-US') {
    return text;
  }

  return TEXT_RESOURCE_TABLE[text]?.[locale] ?? text;
}

export function getHeroSkillDisplayText(
  skill: HeroSkill | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
): HeroSkill | undefined {
  if (!skill) {
    return undefined;
  }

  return {
    ...skill,
    name: localizeText(skill.name, locale),
    description: localizeText(skill.description, locale),
  };
}

export function getGeneralSkillsDisplayText(
  skills: GeneralSkill[] | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
): GeneralSkill[] | undefined {
  if (!skills) {
    return undefined;
  }

  return skills.map((skill) => ({
    ...skill,
    name: localizeText(skill.name, locale),
    description: localizeText(skill.description, locale),
  }));
}

export function getMinisterSkillDisplayText(
  skill: MinisterSkill,
  locale: SupportedLocale = DEFAULT_LOCALE,
): MinisterSkill {
  return {
    ...skill,
    name: localizeText(skill.name, locale),
    description: localizeText(skill.description, locale),
  };
}

export function getMinisterDisplayText(
  minister: Minister,
  locale: SupportedLocale = DEFAULT_LOCALE,
): Minister {
  return {
    ...minister,
    name: localizeText(minister.name, locale),
    activeSkill: getMinisterSkillDisplayText(minister.activeSkill, locale),
  };
}

export function getMinistersDisplayText(
  ministers: Minister[],
  locale: SupportedLocale = DEFAULT_LOCALE,
): Minister[] {
  return ministers.map((minister) => getMinisterDisplayText(minister, locale));
}

export function getKeywordText(
  keywords: Keyword[],
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const labels = KEYWORD_LABELS[locale] ?? KEYWORD_LABELS[DEFAULT_LOCALE];
  return keywords.map((keyword) => labels[keyword] ?? keyword).join(' ');
}

export function getCardDisplayText<T extends CardTextCarrier>(
  card: T,
  locale: SupportedLocale = DEFAULT_LOCALE,
): T {
  return {
    ...card,
    name: localizeText(card.name, locale),
    description: localizeText(card.description, locale),
    heroSkill: getHeroSkillDisplayText(card.heroSkill, locale),
    generalSkills: getGeneralSkillsDisplayText(card.generalSkills, locale),
  };
}

export function getCardSearchText(
  card: Card,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const displayCard = getCardDisplayText(card, locale);

  return [displayCard.name, displayCard.description, getKeywordText(displayCard.keywords, locale)]
    .join(' ')
    .toLowerCase();
}