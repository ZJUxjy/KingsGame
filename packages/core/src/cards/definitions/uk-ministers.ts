import type { Minister } from '@king-card/shared';
import { createMinister, createMinisterSkill, onPlay } from './builders';

// ─── Queen Victoria Ministers (3) ────────────────────────────────────

export const PITT = createMinister({
  id: 'uk_pitt',
  emperorId: 'uk_victoria',
  name: 'William Pitt',
  type: 'STRATEGIST',
  activeSkill: createMinisterSkill({
    name: 'Parliament Act',
    description: 'Draw a card',
    cost: 1,
    effect: onPlay('DRAW', { count: 1 }),
  }),
  cooldown: 1,
});

export const DRAKE = createMinister({
  id: 'uk_drake',
  emperorId: 'uk_victoria',
  name: 'Francis Drake',
  type: 'WARRIOR',
  activeSkill: createMinisterSkill({
    name: 'Privateer Raid',
    description: 'Deal 2 damage to a random enemy minion',
    cost: 2,
    effect: onPlay('DAMAGE', { target: 'RANDOM_ENEMY_MINION', amount: 2 }),
  }),
  cooldown: 2,
});

export const WALPOLE = createMinister({
  id: 'uk_walpole',
  emperorId: 'uk_victoria',
  name: 'Robert Walpole',
  type: 'ADMINISTRATOR',
  activeSkill: createMinisterSkill({
    name: 'Fiscal Policy',
    description: 'Gain 2 armor',
    cost: 1,
    effect: onPlay('GAIN_ARMOR', { amount: 2 }),
  }),
  cooldown: 2,
});

// ─── Elizabeth I Ministers (3) ─────────────────────────────────────

export const WALSINGHAM = createMinister({
  id: 'uk_walsingham',
  emperorId: 'uk_elizabeth_i',
  name: '弗朗西斯·沃尔辛厄姆',
  type: 'STRATEGIST',
  activeSkill: createMinisterSkill({
    name: '王室密探',
    description: '对手随机弃一张牌',
    cost: 2,
    effect: onPlay('RANDOM_DISCARD', { targetPlayer: 'OPPONENT', count: 1 }),
  }),
  cooldown: 2,
});

export const BURGHLEY = createMinister({
  id: 'uk_burghley',
  emperorId: 'uk_elizabeth_i',
  name: '伯利勋爵',
  type: 'ADMINISTRATOR',
  activeSkill: createMinisterSkill({
    name: '国库整顿',
    description: '获得2点护甲',
    cost: 1,
    effect: onPlay('GAIN_ARMOR', { amount: 2 }),
  }),
  cooldown: 1,
});

export const ESSEX = createMinister({
  id: 'uk_essex',
  emperorId: 'uk_elizabeth_i',
  name: '埃塞克斯伯爵',
  type: 'WARRIOR',
  activeSkill: createMinisterSkill({
    name: '女王宠臣',
    description: '一个友方生物获得+2攻击',
    cost: 1,
    effect: onPlay('APPLY_BUFF', {
      target: 'FRIENDLY_MINION',
      attackBonus: 2,
      type: 'TEMPORARY',
      remainingTurns: 2,
    }),
  }),
  cooldown: 1,
});

// ─── Winston Churchill Ministers (3) ───────────────────────────────

export const ATTLEE = createMinister({
  id: 'uk_attlee',
  emperorId: 'uk_winston_churchill',
  name: '克莱门特·艾德礼',
  type: 'ADMINISTRATOR',
  activeSkill: createMinisterSkill({
    name: '战时内阁',
    description: '获得3点护甲',
    cost: 1,
    effect: onPlay('GAIN_ARMOR', { amount: 3 }),
  }),
  cooldown: 1,
});

export const TURING = createMinister({
  id: 'uk_turing',
  emperorId: 'uk_winston_churchill',
  name: '艾伦·图灵',
  type: 'STRATEGIST',
  activeSkill: createMinisterSkill({
    name: '密码破译',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay('DRAW', { count: 1 }),
  }),
  cooldown: 1,
});

export const EDEN = createMinister({
  id: 'uk_eden',
  emperorId: 'uk_winston_churchill',
  name: '安东尼·艾登',
  type: 'ENVOY',
  activeSkill: createMinisterSkill({
    name: '盟邦协调',
    description: '所有友方生物获得+1生命',
    cost: 2,
    effect: onPlay('MODIFY_STAT', { targetFilter: 'ALL_FRIENDLY_MINIONS', healthDelta: 1 }),
  }),
  cooldown: 2,
});

// ─── Per-emperor minister pools ─────────────────────────────────────

export const VICTORIA_MINISTERS: Minister[] = [PITT, DRAKE, WALPOLE];
export const ELIZABETH_MINISTERS: Minister[] = [WALSINGHAM, BURGHLEY, ESSEX];
export const CHURCHILL_MINISTERS: Minister[] = [ATTLEE, TURING, EDEN];

// Aggregate all UK ministers
export const UK_MINISTERS: Minister[] = [
  ...VICTORIA_MINISTERS,
  ...ELIZABETH_MINISTERS,
  ...CHURCHILL_MINISTERS,
];
