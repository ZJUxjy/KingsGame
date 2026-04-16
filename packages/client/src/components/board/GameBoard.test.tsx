import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import type { Card, CardInstance, HeroSkill, HeroState } from '@king-card/shared';
import type { SerializedGameState, ValidAction } from '../../stores/gameStore.js';
import { useGameStore } from '../../stores/gameStore.js';

class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = StubResizeObserver;

const { play } = vi.hoisted(() => ({
  play: vi.fn(),
}));

vi.mock('../../hooks/useAnimations.js', () => ({
  useAnimations: () => ({
    animationMap: new Map(),
    pendingRemovals: [],
  }),
}));

vi.mock('../../services/audioService.js', () => ({
  audioService: { play },
}));

import GameBoard, { StarParticleLayer, BoardMidlineDivider } from './GameBoard.js';

const stubHeroSkill: HeroSkill = {
  name: 'Hero Skill',
  description: 'Deal damage',
  cost: 0,
  cooldown: 0,
  effect: { trigger: 'ON_PLAY', type: 'DAMAGE', params: {} },
};

const stubHeroState: HeroState = {
  health: 30,
  maxHealth: 30,
  armor: 0,
  heroSkill: stubHeroSkill,
  skillUsedThisTurn: false,
  skillCooldownRemaining: 0,
};

const friendlyMinionCard: Card = {
  id: 'card-attacker-1',
  name: 'Friendly Vanguard',
  civilization: 'CHINA',
  type: 'MINION',
  rarity: 'COMMON',
  cost: 2,
  attack: 4,
  health: 5,
  description: '',
  keywords: [],
  effects: [],
};

const friendlyAttackReadyMinion: CardInstance = {
  card: friendlyMinionCard,
  instanceId: 'attacker-1',
  ownerIndex: 0,
  currentAttack: 4,
  currentHealth: 5,
  currentMaxHealth: 5,
  remainingAttacks: 1,
  justPlayed: false,
  sleepTurns: 0,
  garrisonTurns: 0,
  usedGeneralSkills: 0,
  buffs: [],
};

function createAttackReadyGameState(): SerializedGameState {
  return {
    turnNumber: 1,
    currentPlayerIndex: 0,
    phase: 'MAIN',
    isGameOver: false,
    winnerIndex: null,
    winReason: null,
    me: {
      id: 'me',
      name: 'Player 1',
      civilization: 'CHINA',
      hero: stubHeroState,
      hand: [],
      battlefield: [friendlyAttackReadyMinion],
      energyCrystal: 3,
      maxEnergy: 3,
      deckCount: 25,
      activeMinisterIndex: 0,
      ministerPool: [],
      activeStratagems: [],
      cannotDrawNextTurn: false,
      boundCards: [],
      graveyard: [],
    },
    opponent: {
      id: 'opponent',
      name: 'Player 2',
      civilization: 'JAPAN',
      hero: stubHeroState,
      hand: [],
      battlefield: [],
      energyCrystal: 3,
      maxEnergy: 3,
      deckCount: 25,
      activeMinisterIndex: 0,
      ministerPool: [],
      activeStratagems: [],
      cannotDrawNextTurn: false,
      boundCards: [],
      graveyard: [],
    },
  };
}

function seedPlayableBoard(overrides: {
  validActions?: ValidAction[];
  attack?: ReturnType<typeof vi.fn>;
} = {}) {
  useGameStore.setState({
    uiPhase: 'playing',
    playerIndex: 0,
    gameState: createAttackReadyGameState(),
    validActions: overrides.validActions ?? [
      { type: 'ATTACK', attackerInstanceId: 'attacker-1', targetInstanceId: 'HERO' },
    ],
    selectedAttacker: null,
    pendingSkillAction: null,
    attack: overrides.attack ?? useGameStore.getState().attack,
  });
}

beforeEach(() => {
  useGameStore.getState()._reset();
  vi.clearAllMocks();
});

afterEach(cleanup);

describe('StarParticleLayer', () => {
  it('renders a layer that is pointer-events-none and aria-hidden', () => {
    const { container } = render(<StarParticleLayer />);
    const layer = container.firstChild as HTMLElement;
    expect(layer).not.toBeNull();
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(layer.className).toContain('pointer-events-none');
  });

  it('renders multiple particle dots', () => {
    const { container } = render(<StarParticleLayer />);
    const particles = container.querySelectorAll('[data-particle]');
    expect(particles.length).toBeGreaterThan(0);
  });
});

describe('BoardMidlineDivider', () => {
  it('renders with data-board-midline attribute', () => {
    const { container } = render(<BoardMidlineDivider />);
    const el = container.querySelector('[data-board-midline]');
    expect(el).not.toBeNull();
  });

  it('is aria-hidden', () => {
    const { container } = render(<BoardMidlineDivider />);
    const el = container.querySelector('[data-board-midline]');
    expect(el!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('GameBoard targeting interactions', () => {
  it('clears selected attacker when clicking board background', () => {
    seedPlayableBoard();
    const { container } = render(<GameBoard />);

    const attacker = container.querySelector('[data-anchor-id="minion:attacker-1"]') as HTMLElement;
    expect(attacker).not.toBeNull();

    fireEvent.click(attacker);
    expect(useGameStore.getState().selectedAttacker).toBe('attacker-1');

    const boardRoot = container.firstElementChild as HTMLElement;
    expect(boardRoot).not.toBeNull();
    fireEvent.click(boardRoot);

    expect(useGameStore.getState().selectedAttacker).toBeNull();
  });

  it('clears selected attacker when Escape is pressed', () => {
    seedPlayableBoard();
    const { container } = render(<GameBoard />);

    const attacker = container.querySelector('[data-anchor-id="minion:attacker-1"]') as HTMLElement;
    expect(attacker).not.toBeNull();

    fireEvent.click(attacker);
    expect(useGameStore.getState().selectedAttacker).toBe('attacker-1');

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(useGameStore.getState().selectedAttacker).toBeNull();
  });

  it('does not clear selected attacker when clicking interactive board targets', () => {
    seedPlayableBoard();
    const { container } = render(<GameBoard />);

    const attacker = container.querySelector('[data-anchor-id="minion:attacker-1"]') as HTMLElement;
    const myHero = container.querySelector('[data-anchor-id="hero:me"]') as HTMLElement;
    expect(attacker).not.toBeNull();
    expect(myHero).not.toBeNull();

    fireEvent.click(attacker);
    expect(useGameStore.getState().selectedAttacker).toBe('attacker-1');

    fireEvent.click(myHero);
    expect(useGameStore.getState().selectedAttacker).toBe('attacker-1');
  });

  it('attacks enemy hero when ATTACK -> HERO is valid', () => {
    const attack = vi.fn();
    seedPlayableBoard({ attack });
    const { container } = render(<GameBoard />);

    const attacker = container.querySelector('[data-anchor-id="minion:attacker-1"]') as HTMLElement;
    const enemyHero = container.querySelector('[data-anchor-id="hero:enemy"]') as HTMLElement;

    expect(attacker).not.toBeNull();
    expect(enemyHero).not.toBeNull();

    fireEvent.click(attacker);
    fireEvent.click(enemyHero);

    expect(attack).toHaveBeenCalledWith('attacker-1', { type: 'HERO', playerIndex: 1 });
  });
});
