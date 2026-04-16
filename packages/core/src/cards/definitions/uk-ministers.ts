import type { Minister } from '@king-card/shared';
import { onPlay, uk } from '../builders/index.js';
import {
  VICTORIA,
  ELIZABETH_I,
  WINSTON_CHURCHILL,
} from './uk-emperors.js';

// ─── Queen Victoria Ministers (3) ────────────────────────────────────

export const PITT = uk.minister({
  slug: 'pitt',
  emperor: VICTORIA,
  name: 'William Pitt',
  type: 'STRATEGIST',
  cooldown: 1,
  activeSkill: uk.ministerSkill({
    name: 'Parliament Act',
    description: 'Draw a card',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const DRAKE = uk.minister({
  slug: 'drake',
  emperor: VICTORIA,
  name: 'Francis Drake',
  type: 'WARRIOR',
  cooldown: 2,
  activeSkill: uk.ministerSkill({
    name: 'Privateer Raid',
    description: 'Deal 2 damage to a random enemy minion',
    cost: 2,
    // 原定义使用 `target: 'RANDOM_ENEMY_MINION'`（非标准 SingleTarget），
    // 走 custom 逃生舱原样保留。
    effect: onPlay.custom('DAMAGE', {
      target: 'RANDOM_ENEMY_MINION',
      amount: 2,
    }),
  }),
});

export const WALPOLE = uk.minister({
  slug: 'walpole',
  emperor: VICTORIA,
  name: 'Robert Walpole',
  type: 'ADMINISTRATOR',
  cooldown: 2,
  activeSkill: uk.ministerSkill({
    name: 'Fiscal Policy',
    description: 'Gain 2 armor',
    cost: 1,
    effect: onPlay.gainArmor(2),
  }),
});

// ─── Elizabeth I Ministers (3) ─────────────────────────────────────

export const WALSINGHAM = uk.minister({
  slug: 'walsingham',
  emperor: ELIZABETH_I,
  name: '弗朗西斯·沃尔辛厄姆',
  type: 'STRATEGIST',
  cooldown: 2,
  activeSkill: uk.ministerSkill({
    name: '王室密探',
    description: '对手随机弃一张牌',
    cost: 2,
    effect: onPlay.randomDiscard({ targetPlayer: 'OPPONENT', count: 1 }),
  }),
});

export const BURGHLEY = uk.minister({
  slug: 'burghley',
  emperor: ELIZABETH_I,
  name: '伯利勋爵',
  type: 'ADMINISTRATOR',
  cooldown: 1,
  activeSkill: uk.ministerSkill({
    name: '国库整顿',
    description: '获得2点护甲',
    cost: 1,
    effect: onPlay.gainArmor(2),
  }),
});

export const ESSEX = uk.minister({
  slug: 'essex',
  emperor: ELIZABETH_I,
  name: '埃塞克斯伯爵',
  type: 'WARRIOR',
  cooldown: 1,
  activeSkill: uk.ministerSkill({
    name: '女王宠臣',
    description: '一个友方生物获得+2攻击',
    cost: 1,
    effect: onPlay.applyBuff({
      target: 'FRIENDLY_MINION',
      attackBonus: 2,
      type: 'TEMPORARY',
      remainingTurns: 2,
    }),
  }),
});

// ─── Winston Churchill Ministers (3) ───────────────────────────────

export const ATTLEE = uk.minister({
  slug: 'attlee',
  emperor: WINSTON_CHURCHILL,
  name: '克莱门特·艾德礼',
  type: 'ADMINISTRATOR',
  cooldown: 1,
  activeSkill: uk.ministerSkill({
    name: '战时内阁',
    description: '获得3点护甲',
    cost: 1,
    effect: onPlay.gainArmor(3),
  }),
});

export const TURING = uk.minister({
  slug: 'turing',
  emperor: WINSTON_CHURCHILL,
  name: '艾伦·图灵',
  type: 'STRATEGIST',
  cooldown: 1,
  activeSkill: uk.ministerSkill({
    name: '密码破译',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const EDEN = uk.minister({
  slug: 'eden',
  emperor: WINSTON_CHURCHILL,
  name: '安东尼·艾登',
  type: 'ENVOY',
  cooldown: 2,
  activeSkill: uk.ministerSkill({
    name: '盟邦协调',
    description: '所有友方生物获得+1生命',
    cost: 2,
    effect: onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      healthDelta: 1,
    }),
  }),
});

export const VICTORIA_MINISTERS: Minister[] = [PITT, DRAKE, WALPOLE];
export const ELIZABETH_MINISTERS: Minister[] = [WALSINGHAM, BURGHLEY, ESSEX];
export const CHURCHILL_MINISTERS: Minister[] = [ATTLEE, TURING, EDEN];

export const UK_MINISTERS: Minister[] = [
  ...VICTORIA_MINISTERS,
  ...ELIZABETH_MINISTERS,
  ...CHURCHILL_MINISTERS,
];
