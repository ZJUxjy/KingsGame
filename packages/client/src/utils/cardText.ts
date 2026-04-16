import type { Card, GeneralSkill, HeroSkill, Keyword } from '@king-card/shared';

interface CardTextCarrier {
  name: string;
  description: string;
  heroSkill?: HeroSkill;
  generalSkills?: GeneralSkill[];
}

interface MinisterTextCarrier {
  name: string;
  activeSkill: {
    name: string;
    description: string;
  };
}

export const KEYWORD_LABELS: Record<string, string> = {
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
};

const DISPLAY_TEXT_MAP: Record<string, string> = {
  'GI (American Soldier)': '大兵',
  Marine: '海军陆战队',
  Ranger: '游骑兵',
  Medic: '战地医护兵',
  Airborne: '空降兵',
  'Sherman Tank': '谢尔曼坦克',
  'Arsenal of Democracy': '民主兵工厂',
  'Lend-Lease': '租借法案',
  'Air Superiority': '制空权',
  'Marshall Plan': '马歇尔计划',
  'Manhattan Project': '曼哈顿计划',
  'Monroe Doctrine': '门罗主义',
  'Benjamin Franklin': '本杰明·富兰克林',
  'William Sherman': '威廉·谢尔曼',
  'Alexander Hamilton': '亚历山大·汉密尔顿',
  'Ulysses S. Grant': '尤利西斯·格兰特',
  'George Patton': '乔治·巴顿',
  Diplomacy: '外交斡旋',
  'National Bank': '国家银行',
  'Total War': '总体战',
  Siege: '围攻',
  'March to the Sea': '向海进军',
  'Blitzkrieg Counter': '闪击反制',
  'Rally the Troops': '号召部队',
  'Third Army': '第三集团军',
  Redcoat: '红衫军',
  Longbowman: '长弓兵',
  Knight: '骑士',
  'Royal Guard': '皇家卫队',
  Privateer: '私掠船',
  'Man-of-War': '战列舰',
  'Rule Britannia': '统治不列颠',
  'Tea Time': '下午茶时光',
  'Naval Blockade': '海上封锁',
  'Colonial Expansion': '殖民扩张',
  'Great Fire': '伦敦大火',
  'Enclosure Act': '圈地法案',
  'William Pitt': '小威廉·皮特',
  'Francis Drake': '弗朗西斯·德雷克',
  'Robert Walpole': '罗伯特·沃波尔',
  'Duke of Wellington': '惠灵顿公爵',
  'Admiral Nelson': '纳尔逊上将',
  'Parliament Act': '议会法案',
  'Privateer Raid': '私掠突袭',
  'Fiscal Policy': '财政政策',
  Waterloo: '滑铁卢',
  'Iron Duke': '铁公爵',
  'Thin Red Line': '薄红线',
  Trafalgar: '特拉法加',
  'England Expects': '英格兰所望',
  Broadside: '齐射',
  Landsknecht: '雇佣枪兵',
  Hussar: '骠骑兵',
  Grenadier: '掷弹兵',
  Panzer: '装甲战车',
  'Teutonic Knight': '条顿骑士',
  Stormtrooper: '突击队',
  'Blitzkrieg Doctrine': '闪击战学说',
  Enigma: '恩尼格玛',
  'Artillery Barrage': '炮火齐射',
  Fortification: '筑垒工事',
  'V-2 Rocket': 'V2火箭',
  'Scorched Earth': '焦土战术',
  'Carl von Clausewitz': '卡尔·冯·克劳塞维茨',
  'Albrecht von Wallenstein': '阿尔布雷希特·冯·华伦斯坦',
  'Ludwig Erhard': '路德维希·艾哈德',
  'Otto von Bismarck': '奥托·冯·俾斯麦',
  'Erwin Rommel': '埃尔温·隆美尔',
  'On War': '战争论',
  'Mercenary Captain': '佣兵统帅',
  'Economic Miracle': '经济奇迹',
  'Blood and Iron': '铁血政策',
  Realpolitik: '现实政治',
  Unification: '统一帝国',
  'Desert Fox': '沙漠之狐',
  Blitzkrieg: '闪击战',
  'Afrika Korps': '非洲军团',
  'A standard American soldier.': '标准的美军士兵。',
  'A basic British infantry soldier.': '基础的不列颠步兵。',
  'A basic German infantry unit.': '基础的德意志步兵单位。',
  'Rush.': '突袭。',
  'Charge.': '冲锋。',
  'Taunt.': '嘲讽。',
  'Battlecry: Heal all friendly minions for 1.': '战吼：为所有友方生物恢复1点生命。',
  'Rush. Battlecry: Deal 2 damage to an enemy minion.': '突袭。战吼：对一个敌方生物造成2点伤害。',
  'Battlecry: Draw a card.': '战吼：抽一张牌。',
  'Battlecry: Deal 2 damage to an enemy minion.': '战吼：对一个敌方生物造成2点伤害。',
  'Draw 1 card': '抽一张牌',
  'Draw a card': '抽一张牌',
  'Deal 2 damage to a random enemy minion': '对一个随机敌方生物造成2点伤害',
  'Gain 1 armor': '获得1点护甲',
  'Gain 2 armor': '获得2点护甲',
  'Deal 3 damage to an enemy minion': '对一个敌方生物造成3点伤害',
  'Deal 4 damage to all minions.': '对所有生物造成4点伤害。',
  'Opponent discards 1 random card.': '对手随机弃一张牌。',
  'All friendly minions get +1/+1.': '所有友方生物获得+1/+1。',
  'All friendly minions gain +1/+1.': '所有友方生物获得+1/+1。',
  'Draw 2 cards.': '抽两张牌。',
  'Deal 2 damage to all enemy minions.': '对所有敌方生物造成2点伤害。',
  'Heal all friendly minions for 3.': '为所有友方生物恢复3点生命。',
  'Charge. Skill 1: Total War — deal 3 damage to all enemy minions. Skill 2: Siege — deal 5 damage to an enemy minion. Skill 3: March to the Sea — all friendly minions gain Charge this turn.': '冲锋。技能1：总体战，对所有敌方生物造成3点伤害。技能2：围攻，对一个敌方生物造成5点伤害。技能3：向海进军，所有友方生物本回合获得冲锋。',
  'Deal 3 damage to all enemy minions': '对所有敌方生物造成3点伤害',
  'Deal 5 damage to an enemy minion': '对一个敌方生物造成5点伤害',
  'All friendly minions gain Charge this turn': '所有友方生物本回合获得冲锋',
  'Rush. Skill 1: Blitzkrieg Counter — deal 4 damage to an enemy minion. Skill 2: Rally the Troops — all friendly minions get +2/+1. Skill 3: Third Army — summon a 3/3 GI.': '突袭。技能1：闪击反制，对一个敌方生物造成4点伤害。技能2：号召部队，所有友方生物获得+2/+1。技能3：第三集团军，召唤一个3/3大兵。',
  'Deal 4 damage to an enemy minion': '对一个敌方生物造成4点伤害',
  'All friendly minions get +2/+1': '所有友方生物获得+2/+1',
  'Summon a 3/3 GI': '召唤一个3/3大兵',
  'Taunt. Skill①Waterloo: Deal 5 damage to an enemy minion. Skill②Iron Duke: Gain +0/+3. Skill③Thin Red Line: All friendly minions gain Taunt this turn.': '嘲讽。技能①滑铁卢：对一个敌方生物造成5点伤害。技能②铁公爵：获得+0/+3。技能③薄红线：所有友方生物本回合获得嘲讽。',
  'Gain +0/+3': '获得+0/+3',
  'All friendly minions gain Taunt this turn': '所有友方生物本回合获得嘲讽',
  'Charge. Skill①Trafalgar: Deal 3 damage to all enemy minions. Skill②England Expects: All friendly minions gain +2 attack. Skill③Broadside: Deal 6 damage to an enemy minion.': '冲锋。技能①特拉法加：对所有敌方生物造成3点伤害。技能②英格兰所望：所有友方生物获得+2攻击力。技能③齐射：对一个敌方生物造成6点伤害。',
  'All friendly minions gain +2 attack': '所有友方生物获得+2攻击力',
  'Deal 6 damage to an enemy minion': '对一个敌方生物造成6点伤害',
  'Summon a 2/2 Redcoat.': '召唤一个2/2红衫军。',
  'Taunt. Skills: Blood and Iron, Realpolitik, Unification.': '嘲讽。技能：铁血政策、现实政治、统一帝国。',
  'All friendly minions get +1/+2': '所有友方生物获得+1/+2',
  'Gain 4 armor': '获得4点护甲',
  'Rush, Charge. Skills: Desert Fox, Blitzkrieg, Afrika Korps.': '突袭、冲锋。技能：沙漠之狐、闪击战、非洲军团。',
  'Summon a 3/3 Panzer': '召唤一个3/3装甲战车',
  'Taunt. Battlecry: Gain 2 armor.': '嘲讽。战吼：获得2点护甲。',
  'Deal 4 damage to a random enemy minion and 1 damage to all enemy minions.': '对一个随机敌方生物造成4点伤害，并对所有敌方生物造成1点伤害。',
  'Destroy a random enemy minion and a random friendly minion.': '随机消灭一个敌方生物和一个友方生物。',
  'All friendly minions get +2 attack.': '所有友方生物获得+2攻击力。',
  'All friendly minions get +3 health and Taunt this turn.': '所有友方生物获得+3生命值，并在本回合获得嘲讽。',
};

function localizeText(text: string): string {
  return DISPLAY_TEXT_MAP[text] ?? text;
}

function localizeHeroSkill(skill: HeroSkill | undefined): HeroSkill | undefined {
  if (!skill) {
    return undefined;
  }

  return {
    ...skill,
    name: localizeText(skill.name),
    description: localizeText(skill.description),
  };
}

function localizeGeneralSkills(skills: GeneralSkill[] | undefined): GeneralSkill[] | undefined {
  if (!skills) {
    return undefined;
  }

  return skills.map((skill) => ({
    ...skill,
    name: localizeText(skill.name),
    description: localizeText(skill.description),
  }));
}

function localizeMinisterSkill<T extends MinisterTextCarrier['activeSkill']>(skill: T): T {
  return {
    ...skill,
    name: localizeText(skill.name),
    description: localizeText(skill.description),
  };
}

export function getKeywordText(keywords: Keyword[]): string {
  return keywords.map((keyword) => KEYWORD_LABELS[keyword] ?? keyword).join(' ');
}

export function getCardDisplayText<T extends CardTextCarrier>(card: T): T {
  return {
    ...card,
    name: localizeText(card.name),
    description: localizeText(card.description),
    heroSkill: localizeHeroSkill(card.heroSkill),
    generalSkills: localizeGeneralSkills(card.generalSkills),
  };
}

export function getMinisterDisplayText<T extends MinisterTextCarrier>(minister: T): T {
  return {
    ...minister,
    name: localizeText(minister.name),
    activeSkill: localizeMinisterSkill(minister.activeSkill),
  };
}

export function getCardSearchText(card: Card): string {
  const displayCard = getCardDisplayText(card);

  return [displayCard.name, displayCard.description, getKeywordText(displayCard.keywords)]
    .join(' ')
    .toLowerCase();
}
