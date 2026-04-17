import {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../stores/gameStore.js';
import { useDerivedActions } from '../../hooks/useDerivedActions.js';
import { useTargeting } from '../../hooks/useTargeting.js';
import type { HoveredTarget } from '../../hooks/useTargeting.js';
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
import type { ValidAction, CardInstance } from '@king-card/shared';
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

export default function GameBoard() {
  // Store state + actions via single shallow selector
  const {
    gameState, validActions, selectedAttacker, pendingSkillAction,
    playerIndex, playCard, attack, endTurn, useHeroSkill,
    useMinisterSkill, useGeneralSkill, switchMinister,
    setSelectedAttacker, setPendingSkillAction, clearTargetingSelection,
  } = useGameStore(useShallow((s) => ({
    gameState: s.gameState,
    validActions: s.validActions,
    selectedAttacker: s.selectedAttacker,
    pendingSkillAction: s.pendingSkillAction,
    playerIndex: s.playerIndex,
    playCard: s.playCard,
    attack: s.attack,
    endTurn: s.endTurn,
    useHeroSkill: s.useHeroSkill,
    useMinisterSkill: s.useMinisterSkill,
    useGeneralSkill: s.useGeneralSkill,
    switchMinister: s.switchMinister,
    setSelectedAttacker: s.setSelectedAttacker,
    setPendingSkillAction: s.setPendingSkillAction,
    clearTargetingSelection: s.clearTargetingSelection,
  })));
  const isMyTurn = useGameStore((s) => s.isMyTurn);
  const locale = useLocaleStore((state) => state.locale);

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
    validPlayIndices, validAttackerIds, attackTargetIds,
    canUseHeroSkill, canUseMinisterSkill, validSwitchMinisters,
    canAttackHero, availableGeneralSkillKeys,
  } = useDerivedActions(validActions, selectedAttacker);

  // Targeting logic (arrows, pointer tracking, skill targets, escape key, pointerup)
  const {
    hoveredTarget, setHoveredTarget, arrowSourceAnchorId, arrowStart, arrowEnd,
    pendingSkillTargets, clearTargetingUiState,
  } = useTargeting({
    selectedAttacker,
    pendingSkillAction,
    playerIndex,
    validActions,
    attack,
    useHeroSkill,
    useMinisterSkill,
    useGeneralSkill,
    clearTargetingSelection,
  });

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

  // Drag state for insertion slots
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);

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

  // Turn overlay effect
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
  }, [gameState?.turnNumber, playerIndex, locale]);

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

  const hoveredSlotRef = useRef(hoveredSlotIndex);
  hoveredSlotRef.current = hoveredSlotIndex;

  const handlePlayCardFromHand = useCallback((handIndex: number) => {
    if (validPlayIndices.has(handIndex)) {
      playCard(handIndex, hoveredSlotRef.current ?? undefined);
      setHoveredSlotIndex(null);
    }
  }, [playCard, validPlayIndices]);

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

  // Merge dying minions back into battlefield for death animation,
  // preserving their original position so the death animation plays in-place.
  function mergeWithDying(alive: CardInstance[], dying: CardInstance[]): CardInstance[] {
    if (dying.length === 0) return alive;
    const merged = [...alive];
    for (const d of dying) {
      const pos = d.position ?? merged.length;
      merged.splice(Math.min(pos, merged.length), 0, d);
    }
    return merged;
  }

  const myDying = pendingRemovals.filter((m) => m.ownerIndex === playerIndex);
  const oppDying = pendingRemovals.filter((m) => m.ownerIndex !== playerIndex);
  const myBattlefield = mergeWithDying(me.battlefield, myDying);
  const oppBattlefield = mergeWithDying(opponent.battlefield, oppDying);

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
              showInsertionSlots={isDraggingCard}
              hoveredSlotIndex={hoveredSlotIndex}
              onSlotHover={setHoveredSlotIndex}
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
              skillDescription={myHeroSkill?.description}
              skillCooldown={myHeroSkill?.cooldown}
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
              onDragStart={() => setIsDraggingCard(true)}
              onDragEnd={() => { setIsDraggingCard(false); setHoveredSlotIndex(null); }}
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
