import type {
  Card,
  CardInstance,
  HeroState,
  Minister,
  ActiveStratagem,
  GamePhase,
  WinReason,
  Civilization,
} from '@king-card/shared';

export interface HiddenCard {
  hidden: true;
}

export interface SerializedPlayer {
  id: string;
  name: string;
  civilization: Civilization;
  hero: HeroState;
  hand: (Card | HiddenCard)[];
  battlefield: CardInstance[];
  energyCrystal: number;
  maxEnergy: number;
  deckCount: number;
  activeMinisterIndex: number;
  ministerPool: Minister[];
  activeStratagems: ActiveStratagem[];
  cannotDrawNextTurn: boolean;
  boundCards: Card[];
  graveyard: Card[];
}

export interface SerializedGameState {
  turnNumber: number;
  currentPlayerIndex: 0 | 1;
  phase: GamePhase;
  isGameOver: boolean;
  winnerIndex: number | null;
  winReason: WinReason | null;
  me: SerializedPlayer;
  opponent: SerializedPlayer;
}
