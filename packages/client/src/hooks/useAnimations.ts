import { useRef, useState, useEffect } from 'react';
import type { CardInstance } from '@king-card/shared';
import type { SerializedGameState } from '../stores/gameStore.js';

/**
 * Compares previous and current game state to derive CSS animation classes
 * for battlefield minions. Animations auto-clear after their duration.
 */
export function useAnimations(gameState: SerializedGameState | null) {
  const prevState = useRef<SerializedGameState | null>(null);
  const [animationMap, setAnimationMap] = useState<Map<string, string>>(new Map());
  const [pendingRemovals, setPendingRemovals] = useState<CardInstance[]>([]);

  useEffect(() => {
    if (!gameState || !prevState.current) {
      prevState.current = gameState;
      return;
    }

    const prev = prevState.current;
    const next = gameState;
    const newAnimations = new Map<string, string>();

    const prevMinionIds = new Set([
      ...prev.me.battlefield.map((m) => m.instanceId),
      ...prev.opponent.battlefield.map((m) => m.instanceId),
    ]);

    const nextMinionIds = new Set([
      ...next.me.battlefield.map((m) => m.instanceId),
      ...next.opponent.battlefield.map((m) => m.instanceId),
    ]);

    // New minions on battlefield → card-play animation
    for (const id of nextMinionIds) {
      if (!prevMinionIds.has(id)) {
        newAnimations.set(id, 'animate-card-play');
      }
    }

    // Minions that lost health → damage flash; gained health → heal
    const prevHpMap = new Map<string, number>();
    const prevAttacksMap = new Map<string, number>();
    for (const m of [...prev.me.battlefield, ...prev.opponent.battlefield]) {
      prevHpMap.set(m.instanceId, m.currentHealth);
      prevAttacksMap.set(m.instanceId, m.remainingAttacks ?? 0);
    }
    for (const m of [...next.me.battlefield, ...next.opponent.battlefield]) {
      const prevHp = prevHpMap.get(m.instanceId);
      const prevAttacks = prevAttacksMap.get(m.instanceId);
      if (prevAttacks !== undefined && (m.remainingAttacks ?? 0) < prevAttacks) {
        // This minion used an attack
        newAnimations.set(m.instanceId, 'animate-attack');
      } else if (prevHp !== undefined && m.currentHealth < prevHp) {
        newAnimations.set(m.instanceId, 'animate-damage');
      } else if (prevHp !== undefined && m.currentHealth > prevHp) {
        newAnimations.set(m.instanceId, 'animate-heal');
      }
    }

    // Minions removed from battlefield → death animation with delayed removal
    const dying: CardInstance[] = [];
    for (const id of prevMinionIds) {
      if (!nextMinionIds.has(id)) {
        newAnimations.set(id, 'animate-death');
        const minion = [...prev.me.battlefield, ...prev.opponent.battlefield].find(
          (m) => m.instanceId === id,
        );
        if (minion) dying.push(minion);
      }
    }

    if (newAnimations.size > 0) {
      setAnimationMap(newAnimations);
      if (dying.length > 0) setPendingRemovals(dying);
      // Clear animations after longest duration (600ms)
      const timer = setTimeout(() => {
        setAnimationMap(new Map());
        setPendingRemovals([]);
      }, 600);
      prevState.current = next;
      return () => clearTimeout(timer);
    }

    prevState.current = next;
  }, [gameState]);

  return { animationMap, pendingRemovals };
}
