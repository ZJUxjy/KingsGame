import {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useGameStore } from '../../stores/gameStore.js';
import { useAnimations } from '../../hooks/useAnimations.js';
import { audioService } from '../../services/audioService.js';
import { HeroPanel } from './HeroPanel.js';
import { MinisterPanel } from './MinisterPanel.js';
import { GeneralSkillsPanel } from './GeneralSkillsPanel.js';
import { SidePanel } from './SidePanel.js';
import { Battlefield } from './Battlefield.js';
import { HandZone } from './HandZone.js';
import { TargetingArrow } from './TargetingArrow.js';
import GameOverlay from './GameOverlay.js';
import Toast from './Toast.js';
import type { TargetRef, ValidAction } from '@king-card/shared';
import { useLocaleStore } from '../../stores/localeStore.js';
import { getCardDisplayText, getGeneralSkillsDisplayText, getHeroSkillDisplayText } from '../../utils/cardText.js';

// ---------------------------------------------------------------------------
// Decorative helpers (exported for unit tests)
// ---------------------------------------------------------------------------

const PARTICLES = [
  { top: '8%', left: '12%', delay: '0s' },
  { top: '15%', left: '35%', delay: '0.6s' },
  { top: '22%', left: '60%', delay: '1.1s' },
  { top: '30%', left: '82%', delay: '0.3s' },
  { top: '45%', left: '5%', delay: '1.8s' },
  { top: '52%', left: '25%', delay: '0.9s' },
  { top: '60%', left: '50%', delay: '2.1s' },
  { top: '70%', left: '74%', delay: '0.5s' },
  { top: '78%', left: '18%', delay: '1.4s' },
  { top: '88%', left: '90%', delay: '0.2s' },
  { top: '5%', left: '70%', delay: '1.6s' },
  { top: '40%', left: '44%', delay: '2.4s' },
  { top: '65%', left: '92%', delay: '0.7s' },
  { top: '93%', left: '55%', delay: '1.9s' },
  { top: '18%', left: '88%', delay: '1.2s' },
] as const;

/**
 * Purely decorative star-particle background layer.
 * @internal exported only so unit tests can render the component in isolation.
 */
export function StarParticleLayer() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          data-particle
          className="absolute w-[2px] h-[2px] rounded-full bg-white/30 animate-float-particle"
          style={{ top: p.top, left: p.left, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}

/**
 * Glowing midline divider between enemy and player battlefields.
 * @internal exported only so unit tests can render the component in isolation.
 */
export function BoardMidlineDivider() {
  return (
    <div
      data-board-midline
      className="shrink-0 py-0.5 px-4"
      aria-hidden="true"
    >
      <div
        style={{
          height: 1,
          background:
            'linear-gradient(90deg, transparent 0%, var(--midline-color, rgba(203,213,225,0.35)) 50%, transparent 100%)',
          boxShadow: '0 0 8px var(--midline-glow, rgba(148,163,184,0.18))',
        }}
      />
    </div>
  );
}

interface ScreenPoint {
  x: number;
  y: number;
}

type HoveredTarget =
  | { type: 'MINION'; instanceId: string }
  | { type: 'HERO'; playerIndex: number }
  | null;

export default function GameBoard() {
  // Store state
  const gameState = useGameStore((s) => s.gameState);
  const validActions = useGameStore((s) => s.validActions);
  const selectedAttacker = useGameStore((s) => s.selectedAttacker);
  const pendingSkillAction = useGameStore((s) => s.pendingSkillAction);
  const playerIndex = useGameStore((s) => s.playerIndex);
  const isMyTurn = useGameStore((s) => s.isMyTurn);
  const locale = useLocaleStore((state) => state.locale);

  // Store actions
  const playCard = useGameStore((s) => s.playCard);
  const attack = useGameStore((s) => s.attack);
  const endTurn = useGameStore((s) => s.endTurn);
  const useHeroSkill = useGameStore((s) => s.useHeroSkill);
  const useMinisterSkill = useGameStore((s) => s.useMinisterSkill);
  const useGeneralSkill = useGameStore((s) => s.useGeneralSkill);
  const switchMinister = useGameStore((s) => s.switchMinister);
  const setSelectedAttacker = useGameStore((s) => s.setSelectedAttacker);
  const setPendingSkillAction = useGameStore((s) => s.setPendingSkillAction);
  const clearTargetingSelection = useGameStore((s) => s.clearTargetingSelection);

  const heroSkillActions = validActions.filter(
    (action): action is Extract<ValidAction, { type: 'USE_HERO_SKILL' }> => action.type === 'USE_HERO_SKILL',
  );
  const ministerSkillActions = validActions.filter(
    (action): action is Extract<ValidAction, { type: 'USE_MINISTER_SKILL' }> => action.type === 'USE_MINISTER_SKILL',
  );
  const generalSkillActions = validActions.filter(
    (action): action is Extract<ValidAction, { type: 'USE_GENERAL_SKILL' }> => action.type === 'USE_GENERAL_SKILL',
  );

  // Derived values from valid actions
  const {
    validPlayIndices,
    validAttackerIds,
    attackTargetIds,
    canUseHeroSkill,
    canUseMinisterSkill,
    validSwitchMinisters,
    canAttackHero,
    availableGeneralSkillKeys,
  } = useMemo(() => {
    const playIndices = new Set<number>();
    const attackerIds = new Set<string>();
    const targetIds = new Set<string>();
    let heroSkill = false;
    let ministerSkill = false;
    const switchIndices = new Set<number>();
    let attackHero = false;
    const generalSkillKeys = new Set<string>();

    for (const action of validActions) {
      switch (action.type) {
        case 'PLAY_CARD':
          playIndices.add(action.handIndex as number);
          break;
        case 'ATTACK':
          attackerIds.add(action.attackerInstanceId as string);
          if (
            selectedAttacker &&
            (action.attackerInstanceId as string) === selectedAttacker
          ) {
            const tid = action.targetInstanceId as string;
            if (tid === 'HERO') {
              attackHero = true;
            } else {
              targetIds.add(tid);
            }
          }
          break;
        case 'USE_HERO_SKILL':
          heroSkill = true;
          break;
        case 'USE_MINISTER_SKILL':
          ministerSkill = true;
          break;
        case 'USE_GENERAL_SKILL':
          generalSkillKeys.add(`${action.instanceId}:${action.skillIndex}`);
          break;
        case 'SWITCH_MINISTER':
          switchIndices.add(action.ministerIndex as number);
          break;
      }
    }

    return {
      validPlayIndices: playIndices,
      validAttackerIds: attackerIds,
      attackTargetIds: targetIds,
      canUseHeroSkill: heroSkill,
      canUseMinisterSkill: ministerSkill,
      validSwitchMinisters: switchIndices,
      canAttackHero: attackHero,
      availableGeneralSkillKeys: generalSkillKeys,
    };
  }, [validActions, selectedAttacker]);

  const pendingSkillTargets = useMemo(() => {
    const targetIds = new Set<string>();

    if (!pendingSkillAction) {
      return {
        targetIds,
        canTargetEnemyHero: false,
      };
    }

    const matchingActions = validActions.filter((action): action is Extract<ValidAction, { target?: TargetRef }> => {
      if (pendingSkillAction.type === 'HERO') {
        return action.type === 'USE_HERO_SKILL';
      }

      if (pendingSkillAction.type === 'MINISTER') {
        return action.type === 'USE_MINISTER_SKILL';
      }

      return action.type === 'USE_GENERAL_SKILL'
        && action.instanceId === pendingSkillAction.instanceId
        && action.skillIndex === pendingSkillAction.skillIndex;
    });

    let canTargetEnemyHero = false;
    for (const action of matchingActions) {
      if (!action.target) {
        continue;
      }

      if (action.target.type === 'MINION') {
        targetIds.add(action.target.instanceId);
      }

      if (action.target.type === 'HERO' && playerIndex !== null && action.target.playerIndex === 1 - playerIndex) {
        canTargetEnemyHero = true;
      }
    }

    return { targetIds, canTargetEnemyHero };
  }, [pendingSkillAction, playerIndex, validActions]);

  const activeTargetIds = pendingSkillAction ? pendingSkillTargets.targetIds : attackTargetIds;
  const canTargetEnemyHero = pendingSkillAction ? pendingSkillTargets.canTargetEnemyHero : canAttackHero;
  const pendingGeneralSkillKey = pendingSkillAction?.type === 'GENERAL'
    ? `${pendingSkillAction.instanceId}:${pendingSkillAction.skillIndex}`
    : null;
  const pendingSkillPrompt = pendingSkillAction
    ? pendingSkillTargets.targetIds.size > 0 || pendingSkillTargets.canTargetEnemyHero
      ? locale === 'en-US' ? 'Choose a skill target' : '选择技能目标'
      : null
    : null;

  // Turn overlay state
  const [overlayText, setOverlayText] = useState<string | null>(null);
  const [pointerPosition, setPointerPosition] = useState<ScreenPoint | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<HoveredTarget>(null);
  const [anchorCenters, setAnchorCenters] = useState<Record<string, ScreenPoint>>({});

  // Animation state derived from game state diffs
  const { animationMap, pendingRemovals } = useAnimations(gameState);

  // Audio triggers based on animation events
  useEffect(() => {
    for (const anim of animationMap.values()) {
      if (anim === 'animate-card-play') audioService.play('card-play');
      else if (anim === 'animate-attack') audioService.play('attack');
      else if (anim === 'animate-damage') audioService.play('damage');
      else if (anim === 'animate-heal') audioService.play('heal');
      else if (anim === 'animate-death') audioService.play('damage');
    }
  }, [animationMap]);

  const measureAnchors = useCallback(() => {
    const nextCenters: Record<string, ScreenPoint> = {};
    const elements = document.querySelectorAll<HTMLElement>('[data-anchor-id]');

    for (const element of elements) {
      const anchorId = element.dataset.anchorId;
      if (!anchorId) {
        continue;
      }

      const rect = element.getBoundingClientRect();
      nextCenters[anchorId] = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setAnchorCenters(nextCenters);
  }, []);

  useEffect(() => {
    if (!gameState || playerIndex === null) return;
    const myTurn = gameState.currentPlayerIndex === playerIndex;
    const text =
      locale === 'en-US'
        ? myTurn
          ? 'Your Turn'
          : 'Opponent Turn'
        : myTurn
          ? '你的回合'
          : '对方回合';
    setOverlayText(text);
    audioService.play('turn-start');
    const timer = setTimeout(() => setOverlayText(null), 1500);
    return () => clearTimeout(timer);
  }, [gameState?.turnNumber, locale, playerIndex, gameState?.currentPlayerIndex]);

  useEffect(() => {
    if (!selectedAttacker && !pendingSkillAction) {
      setPointerPosition(null);
      setHoveredTarget(null);
      return;
    }

    const updatePointer = (event: PointerEvent) => {
      setPointerPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('pointermove', updatePointer);
    return () => window.removeEventListener('pointermove', updatePointer);
  }, [pendingSkillAction, selectedAttacker]);

  useEffect(() => {
    if (!gameState) {
      return;
    }

    const rafId = requestAnimationFrame(measureAnchors);
    const handleViewportChange = () => measureAnchors();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [
    gameState,
    measureAnchors,
    hoveredTarget,
    pendingSkillAction,
    selectedAttacker,
    gameState?.me.battlefield.length,
    gameState?.opponent.battlefield.length,
  ]);

  const arrowSourceAnchorId = pendingSkillAction
    ? pendingSkillAction.type === 'HERO'
      ? 'hero-skill:me'
      : pendingSkillAction.type === 'MINISTER'
        ? 'minister-skill:me'
        : `general-skill:${pendingSkillAction.instanceId}:${pendingSkillAction.skillIndex}`
    : selectedAttacker
      ? `minion:${selectedAttacker}`
      : null;

  const arrowStart = arrowSourceAnchorId ? anchorCenters[arrowSourceAnchorId] ?? null : null;
  const arrowEnd = hoveredTarget
    ? hoveredTarget.type === 'MINION'
      ? anchorCenters[`minion:${hoveredTarget.instanceId}`] ?? null
      : anchorCenters[hoveredTarget.playerIndex === playerIndex ? 'hero:me' : 'hero:enemy'] ?? null
    : pointerPosition;

  const clearTargetingUiState = useCallback(() => {
    clearTargetingSelection();
    setHoveredTarget(null);
    setPointerPosition(null);
  }, [clearTargetingSelection]);

  // Refs for latest values (used inside global pointerup handler to avoid stale closures)
  const hoveredTargetRef = useRef<HoveredTarget>(null);
  hoveredTargetRef.current = hoveredTarget;
  const selectedAttackerRef = useRef(selectedAttacker);
  selectedAttackerRef.current = selectedAttacker;
  const pendingSkillActionRef = useRef(pendingSkillAction);
  pendingSkillActionRef.current = pendingSkillAction;

  // --- Global pointerup: execute action on valid target or cancel ---
  useEffect(() => {
    const handlePointerUp = () => {
      const attacker = selectedAttackerRef.current;
      const skill = pendingSkillActionRef.current;
      if (!attacker && !skill) return;

      const target = hoveredTargetRef.current;
      if (target) {
        const targetRef: TargetRef = target.type === 'MINION'
          ? { type: 'MINION', instanceId: target.instanceId }
          : { type: 'HERO', playerIndex: target.playerIndex };

        if (skill) {
          if (skill.type === 'HERO') useHeroSkill(targetRef);
          else if (skill.type === 'MINISTER') useMinisterSkill(targetRef);
          else useGeneralSkill(skill.instanceId, skill.skillIndex, targetRef);
        } else {
          attack(attacker!, targetRef);
        }
      }

      clearTargetingUiState();
    };

    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [attack, useHeroSkill, useMinisterSkill, useGeneralSkill, clearTargetingUiState]);

  // --- Handlers ---

  const handleMinionPointerDown = (instanceId: string, isMine: boolean) => {
    if (!isMine) return; // enemy minions are targets, handled by pointerup
    if (pendingSkillAction) return; // don't interfere with skill targeting

    if (validAttackerIds.has(instanceId)) {
      setSelectedAttacker(instanceId);
    }
  };

  const handleHeroSkillPointerDown = () => {
    const requiresTarget = heroSkillActions.some((action) => action.target != null);
    if (!requiresTarget) {
      useHeroSkill();
      return;
    }

    if (pendingSkillAction?.type === 'HERO') {
      clearTargetingUiState();
      return;
    }

    setPendingSkillAction({ type: 'HERO' });
  };

  const handleMinisterSkillPointerDown = () => {
    const requiresTarget = ministerSkillActions.some((action) => action.target != null);
    if (!requiresTarget) {
      useMinisterSkill();
      return;
    }

    if (pendingSkillAction?.type === 'MINISTER') {
      clearTargetingUiState();
      return;
    }

    setPendingSkillAction({ type: 'MINISTER' });
  };

  const handleGeneralSkillPointerDown = (instanceId: string, skillIndex: number) => {
    const skillActions = generalSkillActions.filter(
      (action) => action.instanceId === instanceId && action.skillIndex === skillIndex,
    );
    const requiresTarget = skillActions.some((action) => action.target != null);

    if (!requiresTarget) {
      useGeneralSkill(instanceId, skillIndex);
      return;
    }

    const isSamePending = pendingSkillAction?.type === 'GENERAL'
      && pendingSkillAction.instanceId === instanceId
      && pendingSkillAction.skillIndex === skillIndex;

    if (isSamePending) {
      clearTargetingUiState();
      return;
    }

    setPendingSkillAction({ type: 'GENERAL', instanceId, skillIndex });
  };

  const handlePlayCardFromHand = useCallback((handIndex: number) => {
    if (validPlayIndices.has(handIndex)) {
      playCard(handIndex);
    }
  }, [playCard, validPlayIndices]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (!selectedAttacker && !pendingSkillAction) {
        return;
      }

      clearTargetingUiState();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [clearTargetingUiState, pendingSkillAction, selectedAttacker]);

  // --- Early return ---
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-xl">
        {locale === 'en-US' ? 'Connecting...' : '连接中...'}
      </div>
    );
  }

  const { me, opponent } = gameState;
  const myTurn = isMyTurn();

  // Merge dying minions back into battlefield for death animation
  const myDying = pendingRemovals.filter((m) => m.ownerIndex === playerIndex);
  const oppDying = pendingRemovals.filter((m) => m.ownerIndex !== playerIndex);
  const myBattlefield = [...me.battlefield, ...myDying];
  const oppBattlefield = [...opponent.battlefield, ...oppDying];

  // Extract hero data with defaults
  const myHero = me.hero;
  const oppHero = opponent.hero;
  const myHeroSkill = getHeroSkillDisplayText(myHero?.heroSkill, locale);
  const oppHeroSkill = getHeroSkillDisplayText(oppHero?.heroSkill, locale);

  const fallbackHero = locale === 'en-US' ? 'Hero' : '帝王';
  const myHeroName =
    myHeroSkill?.name ?? fallbackHero;
  const myHeroSkillName =
    myHeroSkill?.name ?? '';
  const myHeroSkillCost = myHero?.heroSkill?.cost;

  const oppHeroName =
    oppHeroSkill?.name ?? fallbackHero;

  // Minister data
  const ministers = me.ministerPool ?? [];
  const generalsWithDisplayText = me.battlefield
    .filter((minion) => minion.card?.type === 'GENERAL')
    .map((minion) => ({
      ...minion,
      card: {
        ...getCardDisplayText(minion.card, locale),
        generalSkills: getGeneralSkillsDisplayText(minion.card.generalSkills, locale),
      },
    }));

  const enemyHeroHighlighted = hoveredTarget?.type === 'HERO'
    && playerIndex !== null
    && hoveredTarget.playerIndex === 1 - playerIndex;

  return (
    <div
      data-testid="game-board-shell"
      className="min-h-screen w-full overflow-hidden relative bg-board-gradient flex justify-center"
      style={{
        paddingInline: 'var(--board-shell-padding-x)',
        paddingBlock: 'var(--board-shell-padding-y)',
      }}
    >
      {/* Decorative star-particle background — purely visual */}
      <StarParticleLayer />

      {/* Targeting arrow overlay */}
      <TargetingArrow
        start={arrowStart}
        end={arrowEnd}
        visible={Boolean(arrowSourceAnchorId && arrowStart && arrowEnd)}
      />

      {/* Main board layout: play area + right sidebar */}
      <div
        data-testid="game-board-layout"
        className="relative z-10 w-full flex flex-row"
        style={{
          maxWidth: 'var(--board-shell-max-width)',
          minHeight: 'calc(100vh - (var(--board-shell-padding-y) * 2))',
        }}
      >

        {/* ── Left / centre play area ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ rowGap: 'var(--board-row-gap)' }}>

          {/* Enemy hero bar */}
          <div
            className="flex items-center px-4 shrink-0"
            style={{ height: 'var(--hero-row-height)' }}
          >
            <HeroPanel
              heroName={oppHeroName}
              health={oppHero?.health ?? 30}
              maxHealth={oppHero?.maxHealth ?? 30}
              armor={oppHero?.armor ?? 0}
              isOpponent
              targetable={selectedAttacker ? canAttackHero : canTargetEnemyHero}
              highlightedTarget={enemyHeroHighlighted}
              targetAnchorId="hero:enemy"
              onPointerEnter={() => {
                if (playerIndex !== null && (selectedAttacker ? canAttackHero : canTargetEnemyHero)) {
                  setHoveredTarget({ type: 'HERO', playerIndex: 1 - playerIndex });
                }
              }}
              onPointerLeave={() => {
                if (enemyHeroHighlighted) {
                  setHoveredTarget(null);
                }
              }}
            />
          </div>

          {/* Enemy battlefield */}
          <div className="flex-1 min-h-[180px]">
            <Battlefield
              minions={oppBattlefield}
              isOpponent
              onMinionPointerDown={handleMinionPointerDown}
              selectedAttackerId={selectedAttacker}
              validTargetIds={activeTargetIds}
              hoveredTargetId={hoveredTarget?.type === 'MINION' ? hoveredTarget.instanceId : null}
              animationMap={animationMap}
              onTargetHover={(instanceId) => {
                setHoveredTarget(instanceId ? { type: 'MINION', instanceId } : null);
              }}
            />
          </div>

          {/* Glowing midline divider */}
          <BoardMidlineDivider />

          {/* Skill-targeting prompt */}
          {pendingSkillPrompt && (
            <div className="px-4 py-1 text-center text-sm font-bold text-cyan-300 shrink-0">
              {pendingSkillPrompt}
            </div>
          )}

          {/* Player battlefield */}
          <div className="flex-1 min-h-[180px]">
            <Battlefield
              minions={myBattlefield}
              onMinionPointerDown={handleMinionPointerDown}
              actionableIds={validAttackerIds}
              selectedAttackerId={selectedAttacker}
              validTargetIds={activeTargetIds}
              hoveredTargetId={hoveredTarget?.type === 'MINION' ? hoveredTarget.instanceId : null}
              animationMap={animationMap}
              onTargetHover={(instanceId) => {
                setHoveredTarget(instanceId ? { type: 'MINION', instanceId } : null);
              }}
            />
          </div>

          <GeneralSkillsPanel
            generals={generalsWithDisplayText}
            availableSkillKeys={availableGeneralSkillKeys}
            pendingSkillKey={pendingGeneralSkillKey}
            onSkillPointerDown={handleGeneralSkillPointerDown}
          />

          {/* Player info bar: hero + minister */}
          <div
            className="flex items-center justify-between px-4 shrink-0"
            style={{ height: 'var(--hero-row-height)' }}
          >
            <HeroPanel
              heroName={myHeroName}
              health={myHero?.health ?? 30}
              maxHealth={myHero?.maxHealth ?? 30}
              armor={myHero?.armor ?? 0}
              skillName={myHeroSkillName || undefined}
              skillCost={myHeroSkillCost}
              canUseSkill={canUseHeroSkill}
              skillPending={pendingSkillAction?.type === 'HERO'}
              targetAnchorId="hero:me"
              skillAnchorId="hero-skill:me"
              onSkillPointerDown={handleHeroSkillPointerDown}
            />
            <MinisterPanel
              ministers={ministers}
              activeIndex={me.activeMinisterIndex}
              canUseSkill={canUseMinisterSkill}
              skillPending={pendingSkillAction?.type === 'MINISTER'}
              canSwitch={validSwitchMinisters.size > 0}
              skillAnchorId="minister-skill:me"
              onSkillPointerDown={handleMinisterSkillPointerDown}
              onSwitch={switchMinister}
            />
          </div>

          {/* Player hand zone */}
          <div className="flex-1 min-h-[185px]">
            <HandZone
              cards={me.hand}
              onPlayCard={handlePlayCardFromHand}
              validPlayIndices={validPlayIndices}
            />
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <SidePanel
          enemyDeckCount={opponent.deckCount}
          playerDeckCount={me.deckCount}
          energyCrystal={me.energyCrystal}
          maxEnergy={me.maxEnergy}
          turnNumber={gameState.turnNumber}
          isMyTurn={myTurn}
          onEndTurn={endTurn}
        />
      </div>

      {/* Turn transition overlay */}
      <GameOverlay text={overlayText ?? ''} visible={overlayText !== null} />

      {/* Error toast */}
      <Toast />
    </div>
  );
}
