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
