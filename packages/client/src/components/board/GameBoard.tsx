import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore.js';
import { HeroPanel } from './HeroPanel.js';
import { EnergyBar } from './EnergyBar.js';
import { MinisterPanel } from './MinisterPanel.js';
import { TurnIndicator } from './TurnIndicator.js';
import { Battlefield } from './Battlefield.js';
import { HandZone } from './HandZone.js';

export default function GameBoard() {
  // Store state
  const gameState = useGameStore((s) => s.gameState);
  const validActions = useGameStore((s) => s.validActions);
  const selectedAttacker = useGameStore((s) => s.selectedAttacker);
  const playerIndex = useGameStore((s) => s.playerIndex);
  const isMyTurn = useGameStore((s) => s.isMyTurn);

  // Store actions
  const playCard = useGameStore((s) => s.playCard);
  const attack = useGameStore((s) => s.attack);
  const endTurn = useGameStore((s) => s.endTurn);
  const useHeroSkill = useGameStore((s) => s.useHeroSkill);
  const useMinisterSkill = useGameStore((s) => s.useMinisterSkill);
  const switchMinister = useGameStore((s) => s.switchMinister);
  const setSelectedAttacker = useGameStore((s) => s.setSelectedAttacker);

  // Derived values from valid actions
  const {
    validPlayIndices,
    validAttackerIds,
    validTargetIds,
    canUseHeroSkill,
    canUseMinisterSkill,
    validSwitchMinisters,
    canAttackHero,
  } = useMemo(() => {
    const playIndices = new Set<number>();
    const attackerIds = new Set<string>();
    const targetIds = new Set<string>();
    let heroSkill = false;
    let ministerSkill = false;
    const switchIndices = new Set<number>();
    let attackHero = false;

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
        case 'SWITCH_MINISTER':
          switchIndices.add(action.ministerIndex as number);
          break;
      }
    }

    return {
      validPlayIndices: playIndices,
      validAttackerIds: attackerIds,
      validTargetIds: targetIds,
      canUseHeroSkill: heroSkill,
      canUseMinisterSkill: ministerSkill,
      validSwitchMinisters: switchIndices,
      canAttackHero: attackHero,
    };
  }, [validActions, selectedAttacker]);

  // --- Handlers ---

  const handleMinionClick = (instanceId: string, isMine: boolean) => {
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
      if (selectedAttacker && validTargetIds.has(instanceId)) {
        attack(selectedAttacker, { type: 'MINION', instanceId });
        setSelectedAttacker(null);
      }
    }
  };

  const handleEnemyHeroClick = () => {
    if (selectedAttacker && canAttackHero && playerIndex !== null) {
      attack(selectedAttacker, { type: 'HERO', playerIndex: 1 - playerIndex });
      setSelectedAttacker(null);
    }
  };

  const handleCardClick = (handIndex: number) => {
    if (validPlayIndices.has(handIndex)) {
      playCard(handIndex);
    }
  };

  const handleCardDragStart = (handIndex: number, e: React.DragEvent) => {
    if (validPlayIndices.has(handIndex)) {
      e.dataTransfer.setData('handIndex', String(handIndex));
      e.dataTransfer.effectAllowed = 'move';
    } else {
      e.preventDefault();
    }
  };

  const handleDropOnBattlefield = (handIndex: number) => {
    if (validPlayIndices.has(handIndex)) {
      playCard(handIndex);
    }
  };

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

  return (
    <div className="h-screen flex flex-col max-w-[1280px] mx-auto bg-gradient-to-b from-gray-900 to-gray-950 overflow-hidden">
      {/* Enemy hero bar */}
      <div className="flex items-center justify-between px-4 h-[100px] shrink-0">
        <HeroPanel
          heroName={oppHeroName}
          health={oppHero?.health ?? 30}
          maxHealth={oppHero?.maxHealth ?? 30}
          armor={oppHero?.armor ?? 0}
          isOpponent
        />
        <div
          className={`text-sm text-gray-400 ${
            selectedAttacker && canAttackHero
              ? 'text-red-400 cursor-pointer ring-2 ring-red-500 rounded px-2 py-1'
              : ''
          }`}
          onClick={handleEnemyHeroClick}
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
          validTargetIds={validTargetIds}
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

      {/* Player battlefield */}
      <div className="h-[180px] shrink-0">
        <Battlefield
          minions={me.battlefield as any[]}
          onMinionClick={handleMinionClick}
          selectedAttackerId={selectedAttacker}
          validTargetIds={validTargetIds}
          onDrop={handleDropOnBattlefield}
        />
      </div>

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
          onSkillClick={useHeroSkill}
        />
        <div className="flex items-center gap-4">
          <EnergyBar current={me.energyCrystal} max={me.maxEnergy} />
          <MinisterPanel
            ministers={ministers}
            activeIndex={me.activeMinisterIndex}
            canUseSkill={canUseMinisterSkill}
            canSwitch={validSwitchMinisters.size > 0}
            onSkillClick={useMinisterSkill}
            onSwitch={switchMinister}
          />
        </div>
      </div>

      {/* Player hand zone */}
      <div className="h-[180px] shrink-0">
        <HandZone
          cards={me.hand as any[]}
          onCardClick={handleCardClick}
          onCardDragStart={handleCardDragStart}
          validPlayIndices={validPlayIndices}
        />
      </div>
    </div>
  );
}
