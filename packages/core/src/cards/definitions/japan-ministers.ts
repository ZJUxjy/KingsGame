import type { Minister } from '@king-card/shared';
import { createMinister, createMinisterSkill, onPlay } from './builders';

// ─── 織田信長 Ministers (3) ──────────────────────────────────────────

export const AKECHI = createMinister({
  id: 'japan_akechi',
  emperorId: 'japan_oda_nobunaga',
  name: '明智光秀',
  type: 'STRATEGIST',
  activeSkill: createMinisterSkill({
    name: '本能寺の変',
    description: '对一个敌方生物造成3点伤害',
    cost: 2,
    effect: onPlay('DAMAGE', { target: 'ENEMY_MINION', amount: 3 }),
  }),
  cooldown: 0,
});

export const TOYOTOMI = createMinister({
  id: 'japan_toyotomi',
  emperorId: 'japan_oda_nobunaga',
  name: '豊臣秀吉',
  type: 'ADMINISTRATOR',
  activeSkill: createMinisterSkill({
    name: '太閤検地',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay('DRAW', { count: 1 }),
  }),
  cooldown: 0,
});

export const MAEDA = createMinister({
  id: 'japan_maeda',
  emperorId: 'japan_oda_nobunaga',
  name: '前田利家',
  type: 'WARRIOR',
  activeSkill: createMinisterSkill({
    name: '槍の又左',
    description: '对一个敌方生物造成2点伤害',
    cost: 1,
    effect: onPlay('DAMAGE', { target: 'ENEMY_MINION', amount: 2 }),
  }),
  cooldown: 0,
});

// ─── 德川家康 Ministers (3) ──────────────────────────────────────────

export const HATTORI_HANZO = createMinister({
  id: 'japan_hattori_hanzo',
  emperorId: 'japan_tokugawa_ieyasu',
  name: '服部半藏',
  type: 'STRATEGIST',
  activeSkill: createMinisterSkill({
    name: '伊贺密令',
    description: '对一个敌方生物造成2点伤害',
    cost: 1,
    effect: onPlay('DAMAGE', { target: 'ENEMY_MINION', amount: 2 }),
  }),
  cooldown: 1,
});

export const HONDA_MASANOBU = createMinister({
  id: 'japan_honda_masanobu',
  emperorId: 'japan_tokugawa_ieyasu',
  name: '本多正信',
  type: 'ADMINISTRATOR',
  activeSkill: createMinisterSkill({
    name: '幕政整饬',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay('DRAW', { count: 1 }),
  }),
  cooldown: 1,
});

export const SAKAI_TADATSUGU = createMinister({
  id: 'japan_sakai_tadatsugu',
  emperorId: 'japan_tokugawa_ieyasu',
  name: '酒井忠次',
  type: 'WARRIOR',
  activeSkill: createMinisterSkill({
    name: '东海先锋',
    description: '一个友方生物获得+1/+2',
    cost: 2,
    effect: onPlay('APPLY_BUFF', {
      target: 'FRIENDLY_MINION',
      attackBonus: 1,
      healthBonus: 2,
      type: 'TEMPORARY',
      remainingTurns: 2,
    }),
  }),
  cooldown: 2,
});

// ─── 明治天皇 Ministers (3) ─────────────────────────────────────────

export const ITO_HIROBUMI = createMinister({
  id: 'japan_ito_hirobumi',
  emperorId: 'japan_emperor_meiji',
  name: '伊藤博文',
  type: 'ADMINISTRATOR',
  activeSkill: createMinisterSkill({
    name: '内阁制度',
    description: '获得2点护甲',
    cost: 1,
    effect: onPlay('GAIN_ARMOR', { amount: 2 }),
  }),
  cooldown: 1,
});

export const OKUBO_TOSHIMICHI = createMinister({
  id: 'japan_okubo_toshimichi',
  emperorId: 'japan_emperor_meiji',
  name: '大久保利通',
  type: 'STRATEGIST',
  activeSkill: createMinisterSkill({
    name: '版籍奉还',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay('DRAW', { count: 1 }),
  }),
  cooldown: 1,
});

export const KIDO_TAKAYOSHI = createMinister({
  id: 'japan_kido_takayoshi',
  emperorId: 'japan_emperor_meiji',
  name: '木户孝允',
  type: 'ENVOY',
  activeSkill: createMinisterSkill({
    name: '五条誓文',
    description: '所有友方生物获得+1攻击',
    cost: 2,
    effect: onPlay('MODIFY_STAT', { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 }),
  }),
  cooldown: 2,
});

// ─── Per-emperor minister pools ─────────────────────────────────────

export const ODA_MINISTERS: Minister[] = [AKECHI, TOYOTOMI, MAEDA];
export const TOKUGAWA_MINISTERS: Minister[] = [HATTORI_HANZO, HONDA_MASANOBU, SAKAI_TADATSUGU];
export const MEIJI_MINISTERS: Minister[] = [ITO_HIROBUMI, OKUBO_TOSHIMICHI, KIDO_TAKAYOSHI];

// Aggregate all Japan ministers
export const JAPAN_MINISTERS: Minister[] = [
  ...ODA_MINISTERS,
  ...TOKUGAWA_MINISTERS,
  ...MEIJI_MINISTERS,
];
