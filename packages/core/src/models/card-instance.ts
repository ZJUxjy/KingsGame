import type { Card, CardEffect, CardInstance, GeneralSkill, HeroSkill } from '@king-card/shared';

let instanceCounter = 0;

function cloneCardEffect(effect: CardEffect): CardEffect {
  return {
    ...effect,
    params: { ...effect.params },
  };
}

function cloneHeroSkill(skill: HeroSkill | undefined): HeroSkill | undefined {
  if (!skill) return undefined;

  return {
    ...skill,
    effect: cloneCardEffect(skill.effect),
  };
}

function cloneGeneralSkill(skill: GeneralSkill): GeneralSkill {
  return {
    ...skill,
    effect: cloneCardEffect(skill.effect),
  };
}

function cloneCard(card: Card): Card {
  return {
    ...card,
    keywords: [...card.keywords],
    effects: card.effects.map(cloneCardEffect),
    heroSkill: cloneHeroSkill(card.heroSkill),
    generalSkills: card.generalSkills?.map(cloneGeneralSkill),
  };
}

export function createCardInstance(card: Card, ownerIndex: 0 | 1): CardInstance {
  const instanceCard = cloneCard(card);
  const hasRush = instanceCard.keywords.includes('RUSH');
  const hasCharge = instanceCard.keywords.includes('CHARGE');
  const hasAssassin = instanceCard.keywords.includes('ASSASSIN');

  return {
    card: instanceCard,
    instanceId: `${card.id}_${++instanceCounter}`,
    ownerIndex,
    currentAttack: card.attack ?? 0,
    currentHealth: card.health ?? 0,
    currentMaxHealth: card.health ?? 0,
    remainingAttacks: (hasRush || hasCharge || hasAssassin) ? 1 : 0,
    justPlayed: true,
    sleepTurns: instanceCard.keywords.includes('RESEARCH') ? 1 : 0,
    garrisonTurns: 0,
    usedGeneralSkills: 0,
    buffs: [],
    position: undefined,
  };
}

export function resetInstanceCounter(): void {
  instanceCounter = 0;
}
