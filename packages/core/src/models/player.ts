import type {
  Card,
  Player,
  Civilization,
  EmperorData,
  HeroSkill,
} from '@king-card/shared';
import { GAME_CONSTANTS } from '@king-card/shared';
import { createCardInstance } from './card-instance.js';
import { IdCounter } from '../engine/id-counter.js';

const DEFAULT_HERO_SKILL: HeroSkill = {
  name: 'Default Hero Skill',
  description: 'A default hero skill.',
  cost: 0,
  cooldown: 0,
  effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: { amount: 0 } },
};

export function createPlayer(
  ownerIndex: 0 | 1,
  id: string,
  name: string,
  civilization: Civilization,
  deck: Card[],
  startingEmperor: EmperorData,
  counter: IdCounter = new IdCounter(),
): Player {
  const deckInstances = deck.map((card) => createCardInstance(card, ownerIndex, counter));

  const emperorCard = startingEmperor.emperorCard;

  return {
    id,
    name,
    hero: {
      health: GAME_CONSTANTS.INITIAL_HEALTH,
      maxHealth: GAME_CONSTANTS.INITIAL_HEALTH,
      armor: 0,
      heroSkill: emperorCard.heroSkill ?? DEFAULT_HERO_SKILL,
      skillUsedThisTurn: false,
      skillCooldownRemaining: 0,
    },
    civilization,
    hand: [],
    handLimit: GAME_CONSTANTS.MAX_HAND_SIZE,
    deck: deckInstances as unknown as Card[],
    graveyard: [],
    battlefield: [],
    activeStratagems: [],
    costModifiers: [],
    energyCrystal: 0,
    maxEnergy: 0,
    cardsPlayedThisTurn: 0,
    cannotDrawNextTurn: false,
    costReduction: 0,
    ministerPool: startingEmperor.ministers.map((m) => ({
      ...m,
      skillUsedThisTurn: false,
      cooldown: 0,
    })),
    activeMinisterIndex: startingEmperor.ministers.length > 0 ? 0 : -1,
    boundCards: [...startingEmperor.boundGenerals, ...startingEmperor.boundSorceries],
  };
}
