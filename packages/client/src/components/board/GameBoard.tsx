import { useMemo, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore.js';
import { HeroPanel } from './HeroPanel.js';
import { EnergyBar } from './EnergyBar.js';
import { MinisterPanel } from './MinisterPanel.js';
import { GeneralSkillsPanel } from './GeneralSkillsPanel.js';
import { TurnIndicator } from './TurnIndicator.js';
import { Battlefield } from './Battlefield.js';
import { HandZone } from './HandZone.js';
import { TargetingArrow } from './TargetingArrow.js';
import GameOverlay from './GameOverlay.js';
import Toast from './Toast.js';
import type { TargetRef, ValidAction } from '@king-card/shared';

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
      ? '选择技能目标'
      : null
    : null;

  // Turn overlay state
  const [overlayText, setOverlayText] = useState<string | null>(null);
  const [pointerPosition, setPointerPosition] = useState<ScreenPoint | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<HoveredTarget>(null);
  const [anchorCenters, setAnchorCenters] = useState<Record<string, ScreenPoint>>({});

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
    if (!gameState) return;
    const text = isMyTurn() ? '你的回合' : '对方回合';
    setOverlayText(text);
    const timer = setTimeout(() => setOverlayText(null), 1500);
    return () => clearTimeout(timer);
  }, [gameState?.turnNumber]); // trigger on turn change

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

  // --- Handlers ---

  const handleMinionClick = (instanceId: string, isMine: boolean) => {
    if (pendingSkillAction) {
      if (pendingSkillTargets.targetIds.has(instanceId)) {
        const target: TargetRef = { type: 'MINION', instanceId };
        if (pendingSkillAction.type === 'HERO') {
          useHeroSkill(target);
        } else if (pendingSkillAction.type === 'MINISTER') {
          useMinisterSkill(target);
        } else {
          useGeneralSkill(pendingSkillAction.instanceId, pendingSkillAction.skillIndex, target);
        }
        setPendingSkillAction(null);
        setHoveredTarget(null);
      }
      return;
    }

    if (isMine) {
      // Clicking own minion
      if (validAttackerIds.has(instanceId)) {
        if (selectedAttacker === instanceId) {
          // Deselect
          setSelectedAttacker(null);
        } else {
          // Select as attacker
          setSelectedAttacker(instanceId);
        }
      }
    } else {
      // Clicking enemy minion
      if (selectedAttacker && attackTargetIds.has(instanceId)) {
        attack(selectedAttacker, { type: 'MINION', instanceId });
        setSelectedAttacker(null);
        setHoveredTarget(null);
      }
    }
  };

  const handleEnemyHeroClick = () => {
    if (pendingSkillAction && canTargetEnemyHero && playerIndex !== null) {
      const target: TargetRef = { type: 'HERO', playerIndex: 1 - playerIndex };
      if (pendingSkillAction.type === 'HERO') {
        useHeroSkill(target);
      } else if (pendingSkillAction.type === 'MINISTER') {
        useMinisterSkill(target);
      } else {
        useGeneralSkill(pendingSkillAction.instanceId, pendingSkillAction.skillIndex, target);
      }
      setPendingSkillAction(null);
      setHoveredTarget(null);
      return;
    }

    if (selectedAttacker && canAttackHero && playerIndex !== null) {
      attack(selectedAttacker, { type: 'HERO', playerIndex: 1 - playerIndex });
      setSelectedAttacker(null);
      setHoveredTarget(null);
    }
  };

  const handleHeroSkillClick = () => {
    const requiresTarget = heroSkillActions.some((action) => action.target?.type === 'MINION');
    if (!requiresTarget) {
      useHeroSkill();
      return;
    }

    setPendingSkillAction(pendingSkillAction?.type === 'HERO' ? null : { type: 'HERO' });
  };

  const handleMinisterSkillClick = () => {
    const requiresTarget = ministerSkillActions.some((action) => action.target?.type === 'MINION');
    if (!requiresTarget) {
      useMinisterSkill();
      return;
    }

    setPendingSkillAction(pendingSkillAction?.type === 'MINISTER' ? null : { type: 'MINISTER' });
  };

  const handleGeneralSkillClick = (instanceId: string, skillIndex: number) => {
    const skillActions = generalSkillActions.filter(
      (action) => action.instanceId === instanceId && action.skillIndex === skillIndex,
    );
    const requiresTarget = skillActions.some((action) => action.target?.type === 'MINION');

    if (!requiresTarget) {
      useGeneralSkill(instanceId, skillIndex);
      return;
    }

    const isSamePending = pendingSkillAction?.type === 'GENERAL'
      && pendingSkillAction.instanceId === instanceId
      && pendingSkillAction.skillIndex === skillIndex;

    setPendingSkillAction(isSamePending ? null : { type: 'GENERAL', instanceId, skillIndex });
  };

  const handlePlayCardFromHand = useCallback((handIndex: number) => {
    if (validPlayIndices.has(handIndex)) {
      playCard(handIndex);
    }
  }, [playCard, validPlayIndices]);

  // --- Early return ---
  if (!gameState) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400 text-xl">
        连接中...
      </div>
    );
  }

  const { me, opponent } = gameState;
  const myTurn = isMyTurn();

  // Extract hero data with defaults
  const myHero = me.hero as any;
  const oppHero = opponent.hero as any;

  const myHeroName =
    myHero?.heroSkill?.name ?? myHero?.name ?? '帝王';
  const myHeroSkillName =
    myHero?.heroSkill?.name ?? '';
  const myHeroSkillCost = myHero?.heroSkill?.cost;

  const oppHeroName =
    oppHero?.heroSkill?.name ?? oppHero?.name ?? '帝王';

  // Minister data
  const ministers = (me.ministerPool as any[]) ?? [];

  const enemyHeroHighlighted = hoveredTarget?.type === 'HERO'
    && playerIndex !== null
    && hoveredTarget.playerIndex === 1 - playerIndex;

  return (
    <div className="min-w-[1024px]">
    <div className="h-screen flex flex-col max-w-[1280px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 overflow-hidden">
      <TargetingArrow
        start={arrowStart}
        end={arrowEnd}
        visible={Boolean(arrowSourceAnchorId && arrowStart && arrowEnd)}
      />

      {/* Enemy hero bar */}
      <div className="flex items-center justify-between px-4 h-[100px] shrink-0">
        <HeroPanel
          heroName={oppHeroName}
          health={oppHero?.health ?? 30}
          maxHealth={oppHero?.maxHealth ?? 30}
          armor={oppHero?.armor ?? 0}
          isOpponent
          targetable={selectedAttacker ? canAttackHero : canTargetEnemyHero}
          highlightedTarget={enemyHeroHighlighted}
          targetAnchorId="hero:enemy"
          onClick={handleEnemyHeroClick}
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
        <div
          className="text-sm text-gray-400"
        >
          牌堆: {opponent.deckCount}
        </div>
      </div>

      {/* Enemy battlefield */}
      <div className="h-[180px] shrink-0">
        <Battlefield
          minions={opponent.battlefield as any[]}
          isOpponent
          onMinionClick={handleMinionClick}
          selectedAttackerId={selectedAttacker}
          validTargetIds={activeTargetIds}
          hoveredTargetId={hoveredTarget?.type === 'MINION' ? hoveredTarget.instanceId : null}
          onTargetHover={(instanceId) => {
            setHoveredTarget(instanceId ? { type: 'MINION', instanceId } : null);
          }}
        />
      </div>

      {/* Turn indicator */}
      <div className="h-[50px] shrink-0">
        <TurnIndicator
          turnNumber={gameState.turnNumber}
          isMyTurn={myTurn}
          onEndTurn={endTurn}
        />
      </div>

      {pendingSkillPrompt && (
        <div className="px-4 py-1 text-center text-sm font-bold text-cyan-300">
          {pendingSkillPrompt}
        </div>
      )}

      {/* Player battlefield */}
      <div className="h-[180px] shrink-0">
        <Battlefield
          minions={me.battlefield as any[]}
          onMinionClick={handleMinionClick}
          actionableIds={validAttackerIds}
          selectedAttackerId={selectedAttacker}
          validTargetIds={activeTargetIds}
          hoveredTargetId={hoveredTarget?.type === 'MINION' ? hoveredTarget.instanceId : null}
          onTargetHover={(instanceId) => {
            setHoveredTarget(instanceId ? { type: 'MINION', instanceId } : null);
          }}
        />
      </div>

      <GeneralSkillsPanel
        generals={(me.battlefield as any[]).filter((minion) => minion.card?.type === 'GENERAL')}
        availableSkillKeys={availableGeneralSkillKeys}
        pendingSkillKey={pendingGeneralSkillKey}
        onSkillClick={handleGeneralSkillClick}
      />

      {/* Player info bar: hero + energy + minister */}
      <div className="flex items-center justify-between px-4 h-[100px] shrink-0">
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
          onSkillClick={handleHeroSkillClick}
        />
        <div className="flex items-center gap-4">
          <EnergyBar current={me.energyCrystal} max={me.maxEnergy} />
          <MinisterPanel
            ministers={ministers}
            activeIndex={me.activeMinisterIndex}
            canUseSkill={canUseMinisterSkill}
            skillPending={pendingSkillAction?.type === 'MINISTER'}
            canSwitch={validSwitchMinisters.size > 0}
            skillAnchorId="minister-skill:me"
            onSkillClick={handleMinisterSkillClick}
            onSwitch={switchMinister}
          />
        </div>
      </div>

      {/* Player hand zone */}
      <div className="h-[180px] shrink-0">
        <HandZone
          cards={me.hand as any[]}
          onPlayCard={handlePlayCardFromHand}
          validPlayIndices={validPlayIndices}
        />
      </div>

      {/* Turn transition overlay */}
      <GameOverlay text={overlayText ?? ''} visible={overlayText !== null} />

      {/* Error toast */}
      <Toast />
    </div>
    </div>
  );
}
