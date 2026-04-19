import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../../src/engine/game-engine.js';
import { ALL_EMPEROR_DATA_LIST } from '../../../src/cards/definitions/index.js';
import { createCardInstance } from '../../../src/models/card-instance.js';
import { createStateMutator } from '../../../src/engine/state-mutator.js';
import { EventBus } from '../../../src/engine/event-bus.js';
import type { Buff, Card } from '@king-card/shared';

// ─── Test Fixtures ───────────────────────────────────────────────

function makeMinionCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    id: overrides.id,
    name: `Minion ${overrides.id}`,
    civilization: 'CHINA',
    type: 'MINION',
    rarity: 'COMMON',
    cost: 1,
    attack: 1,
    health: 1,
    description: 'A test minion',
    keywords: [],
    effects: [],
    ...overrides,
  };
}

/**
 * Build an engine with a vanilla deck. Caller can place minions on either
 * player's battlefield directly, then drive destruction either through a
 * side-mutator (`mutator.destroyMinion`) or through `engine.attack`.
 */
function setupEngine() {
  const filler = makeMinionCard({ id: 'filler' });
  const deck = Array.from({ length: 30 }, () => filler);
  const emperor = ALL_EMPEROR_DATA_LIST[0];
  const engine = GameEngine.create(deck, deck, emperor, emperor);
  const state = engine.getGameState();
  const bus = new EventBus();
  const mutator = createStateMutator(state, bus, undefined, engine.getCounter());
  return { engine, state, mutator };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('REBORN keyword', () => {
  it('a destroyed REBORN minion is summoned back at 1 HP, REBORN keyword removed', () => {
    const rebornCard = makeMinionCard({
      id: 'reborn_minion',
      attack: 2,
      health: 3,
      keywords: ['REBORN'],
    });

    const { engine, state, mutator } = setupEngine();
    const inst = createCardInstance(rebornCard, 0, engine.getCounter());
    state.players[0].battlefield.push(inst);

    mutator.destroyMinion(inst.instanceId);

    expect(state.players[0].battlefield).toHaveLength(1);
    const revived = state.players[0].battlefield[0];
    expect(revived.instanceId).not.toBe(inst.instanceId);
    expect(revived.currentAttack).toBe(2);
    expect(revived.currentHealth).toBe(1);
    expect(revived.card.keywords).not.toContain('REBORN');
  });

  it('reborn does not trigger a second time after first revival', () => {
    const rebornCard = makeMinionCard({
      id: 'reborn_minion',
      attack: 2,
      health: 3,
      keywords: ['REBORN'],
    });

    const { engine, state, mutator } = setupEngine();
    const inst = createCardInstance(rebornCard, 0, engine.getCounter());
    state.players[0].battlefield.push(inst);

    mutator.destroyMinion(inst.instanceId);
    expect(state.players[0].battlefield).toHaveLength(1);
    const revived = state.players[0].battlefield[0];
    expect(revived.card.keywords).not.toContain('REBORN');

    mutator.destroyMinion(revived.instanceId);
    expect(state.players[0].battlefield).toHaveLength(0);
  });

  it('reborn coexists with deathrattle: both effects fire (deathrattle draws, reborn revives)', () => {
    const rebornDeathrattle = makeMinionCard({
      id: 'reborn_deathrattle_minion',
      attack: 2,
      health: 3,
      keywords: ['REBORN', 'DEATHRATTLE'],
      effects: [
        { trigger: 'ON_DEATH', type: 'DRAW', params: { count: 1 } },
      ],
    });

    const { engine, state, mutator } = setupEngine();
    const handBefore = state.players[0].hand.length;
    const inst = createCardInstance(rebornDeathrattle, 0, engine.getCounter());
    state.players[0].battlefield.push(inst);

    mutator.destroyMinion(inst.instanceId);

    expect(state.players[0].hand.length).toBe(handBefore + 1);
    expect(state.players[0].battlefield).toHaveLength(1);
    const revived = state.players[0].battlefield[0];
    expect(revived.currentAttack).toBe(2);
    expect(revived.currentHealth).toBe(1);
    expect(revived.card.keywords).not.toContain('REBORN');
  });

  it('reborn triggers when poisonous kills the minion', () => {
    const attacker = makeMinionCard({
      id: 'poison_attacker',
      attack: 1,
      health: 1,
      keywords: ['POISONOUS'],
    });
    const defender = makeMinionCard({
      id: 'reborn_defender',
      attack: 2,
      health: 3,
      keywords: ['REBORN'],
    });

    const { engine, state } = setupEngine();
    const attackerInst = createCardInstance(attacker, 0, engine.getCounter());
    attackerInst.remainingAttacks = 1;
    attackerInst.justPlayed = false;
    state.players[0].battlefield.push(attackerInst);

    const defenderInst = createCardInstance(defender, 1, engine.getCounter());
    defenderInst.justPlayed = false;
    state.players[1].battlefield.push(defenderInst);

    const result = engine.attack(attackerInst.instanceId, {
      type: 'MINION',
      instanceId: defenderInst.instanceId,
    });

    expect(result.success).toBe(true);
    expect(state.players[1].battlefield).toHaveLength(1);
    const revived = state.players[1].battlefield[0];
    expect(revived.instanceId).not.toBe(defenderInst.instanceId);
    expect(revived.currentAttack).toBe(2);
    expect(revived.currentHealth).toBe(1);
    expect(revived.card.keywords).not.toContain('REBORN');
  });

  it('reborn does NOT bring back buffs from before death', () => {
    const rebornCard = makeMinionCard({
      id: 'reborn_buffable',
      attack: 2,
      health: 3,
      keywords: ['REBORN'],
    });

    const { engine, state, mutator } = setupEngine();
    const inst = createCardInstance(rebornCard, 0, engine.getCounter());
    state.players[0].battlefield.push(inst);

    const buff: Buff = {
      id: 'pre-death-buff',
      attackBonus: 2,
      healthBonus: 2,
      maxHealthBonus: 2,
      type: 'TEMPORARY',
      keywordsGranted: [],
    };
    mutator.applyBuff({ type: 'MINION', instanceId: inst.instanceId }, buff);
    expect(inst.currentAttack).toBe(4);
    expect(inst.currentHealth).toBe(5);

    mutator.destroyMinion(inst.instanceId);

    expect(state.players[0].battlefield).toHaveLength(1);
    const revived = state.players[0].battlefield[0];
    expect(revived.currentAttack).toBe(2);
    expect(revived.currentHealth).toBe(1);
    expect(revived.buffs).toHaveLength(0);
  });

  it('reborn does NOT carry buff-granted keywords into the revival', () => {
    const rebornCard = makeMinionCard({
      id: 'reborn_no_buff_kw',
      attack: 2,
      health: 3,
      keywords: ['REBORN'],
    });

    const { engine, state, mutator } = setupEngine();
    const inst = createCardInstance(rebornCard, 0, engine.getCounter());
    state.players[0].battlefield.push(inst);

    const buff: Buff = {
      id: 'windfury-grant-buff',
      attackBonus: 0,
      healthBonus: 0,
      maxHealthBonus: 0,
      type: 'TEMPORARY',
      keywordsGranted: ['WINDFURY'],
    };
    mutator.applyBuff({ type: 'MINION', instanceId: inst.instanceId }, buff);
    expect(inst.card.keywords).toContain('WINDFURY');

    mutator.destroyMinion(inst.instanceId);

    expect(state.players[0].battlefield).toHaveLength(1);
    const revived = state.players[0].battlefield[0];
    expect(revived.currentAttack).toBe(2);
    expect(revived.currentHealth).toBe(1);
    expect(revived.card.keywords).not.toContain('REBORN');
    expect(revived.card.keywords).not.toContain('WINDFURY');
  });
});
