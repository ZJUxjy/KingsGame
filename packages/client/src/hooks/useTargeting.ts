import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { TargetRef, ValidAction } from '@king-card/shared';

interface ScreenPoint {
  x: number;
  y: number;
}

export type HoveredTarget =
  | { type: 'MINION'; instanceId: string }
  | { type: 'HERO'; playerIndex: number }
  | null;

export type PendingSkillAction =
  | { type: 'HERO' }
  | { type: 'MINISTER' }
  | { type: 'GENERAL'; instanceId: string; skillIndex: number }
  | null;

interface UseTargetingDeps {
  selectedAttacker: string | null;
  pendingSkillAction: PendingSkillAction;
  playerIndex: number | null;
  validActions: ValidAction[];
  attack: (attackerId: string, target: TargetRef) => void;
  useHeroSkill: (target?: TargetRef) => void;
  useMinisterSkill: (target?: TargetRef) => void;
  useGeneralSkill: (instanceId: string, skillIndex: number, target?: TargetRef) => void;
  clearTargetingSelection: () => void;
}

export function useTargeting(deps: UseTargetingDeps) {
  const {
    selectedAttacker, pendingSkillAction, playerIndex, validActions,
    attack, useHeroSkill, useMinisterSkill, useGeneralSkill, clearTargetingSelection,
  } = deps;

  const [pointerPosition, setPointerPosition] = useState<ScreenPoint | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<HoveredTarget>(null);
  const [anchorCenters, setAnchorCenters] = useState<Record<string, ScreenPoint>>({});

  // Pending skill target computation
  const pendingSkillTargets = useMemo(() => {
    const targetIds = new Set<string>();
    if (!pendingSkillAction) return { targetIds, canTargetEnemyHero: false };

    const matchingActions = validActions.filter((action): action is Extract<ValidAction, { target?: TargetRef }> => {
      if (pendingSkillAction.type === 'HERO') return action.type === 'USE_HERO_SKILL';
      if (pendingSkillAction.type === 'MINISTER') return action.type === 'USE_MINISTER_SKILL';
      return action.type === 'USE_GENERAL_SKILL'
        && action.instanceId === pendingSkillAction.instanceId
        && action.skillIndex === pendingSkillAction.skillIndex;
    });

    let canTargetEnemyHero = false;
    for (const action of matchingActions) {
      if (!action.target) continue;
      if (action.target.type === 'MINION') targetIds.add(action.target.instanceId);
      if (action.target.type === 'HERO' && playerIndex !== null && action.target.playerIndex === 1 - playerIndex) {
        canTargetEnemyHero = true;
      }
    }
    return { targetIds, canTargetEnemyHero };
  }, [pendingSkillAction, playerIndex, validActions]);

  // Arrow source
  const arrowSourceAnchorId = pendingSkillAction
    ? pendingSkillAction.type === 'HERO'
      ? 'hero-skill:me'
      : pendingSkillAction.type === 'MINISTER'
        ? 'minister-skill:me'
        : `general-skill:${pendingSkillAction.instanceId}:${pendingSkillAction.skillIndex}`
    : selectedAttacker
      ? `minion:${selectedAttacker}`
      : null;

  // Arrow endpoints
  const arrowStart = arrowSourceAnchorId ? anchorCenters[arrowSourceAnchorId] ?? null : null;
  const arrowEnd = hoveredTarget
    ? hoveredTarget.type === 'MINION'
      ? anchorCenters[`minion:${hoveredTarget.instanceId}`] ?? null
      : anchorCenters[hoveredTarget.playerIndex === playerIndex ? 'hero:me' : 'hero:enemy'] ?? null
    : pointerPosition;

  // Measure anchors
  const measureAnchors = useCallback(() => {
    const nextCenters: Record<string, ScreenPoint> = {};
    const elements = document.querySelectorAll<HTMLElement>('[data-anchor-id]');
    for (const element of elements) {
      const anchorId = element.dataset.anchorId;
      if (!anchorId) continue;
      const rect = element.getBoundingClientRect();
      nextCenters[anchorId] = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    setAnchorCenters(nextCenters);
  }, []);

  // Clear all targeting UI state
  const clearTargetingUiState = useCallback(() => {
    clearTargetingSelection();
    setHoveredTarget(null);
    setPointerPosition(null);
  }, [clearTargetingSelection]);

  // Pointermove tracking
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

  // Anchor measurement on resize
  useEffect(() => {
    const rafId = requestAnimationFrame(measureAnchors);
    const handleViewportChange = () => measureAnchors();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [measureAnchors, selectedAttacker, pendingSkillAction]);

  // Global pointerup — execute action or cancel
  const hoveredTargetRef = useRef<HoveredTarget>(null);
  hoveredTargetRef.current = hoveredTarget;
  const selectedAttackerRef = useRef(selectedAttacker);
  selectedAttackerRef.current = selectedAttacker;
  const pendingSkillActionRef = useRef(pendingSkillAction);
  pendingSkillActionRef.current = pendingSkillAction;

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

  // Escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (!selectedAttacker && !pendingSkillAction) return;
      clearTargetingUiState();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [clearTargetingUiState, pendingSkillAction, selectedAttacker]);

  return {
    pointerPosition,
    hoveredTarget,
    setHoveredTarget,
    anchorCenters,
    measureAnchors,
    arrowSourceAnchorId,
    arrowStart,
    arrowEnd,
    pendingSkillTargets,
    clearTargetingUiState,
  };
}
