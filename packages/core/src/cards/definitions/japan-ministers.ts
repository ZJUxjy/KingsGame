import type { Minister } from '@king-card/shared';
import { japan, onPlay } from '../builders/index.js';
import {
  ODA_NOBUNAGA,
  TOKUGAWA_IEYASU,
  EMPEROR_MEIJI,
} from './japan-emperors.js';

// ─── 織田信長 Ministers (3) ──────────────────────────────────────────

export const AKECHI = japan.minister({
  slug: 'akechi',
  emperor: ODA_NOBUNAGA,
  name: '明智光秀',
  type: 'STRATEGIST',
  cooldown: 0,
  activeSkill: japan.ministerSkill({
    name: '本能寺の変',
    description: '对一个敌方生物造成3点伤害',
    cost: 2,
    effect: onPlay.damage('ENEMY_MINION', 3),
  }),
});

export const TOYOTOMI = japan.minister({
  slug: 'toyotomi',
  emperor: ODA_NOBUNAGA,
  name: '豊臣秀吉',
  type: 'ADMINISTRATOR',
  cooldown: 0,
  activeSkill: japan.ministerSkill({
    name: '太閤検地',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const MAEDA = japan.minister({
  slug: 'maeda',
  emperor: ODA_NOBUNAGA,
  name: '前田利家',
  type: 'WARRIOR',
  cooldown: 0,
  activeSkill: japan.ministerSkill({
    name: '槍の又左',
    description: '对一个敌方生物造成2点伤害',
    cost: 1,
    effect: onPlay.damage('ENEMY_MINION', 2),
  }),
});

// ─── 德川家康 Ministers (3) ──────────────────────────────────────────

export const HATTORI_HANZO = japan.minister({
  slug: 'hattori_hanzo',
  emperor: TOKUGAWA_IEYASU,
  name: '服部半藏',
  type: 'STRATEGIST',
  cooldown: 1,
  activeSkill: japan.ministerSkill({
    name: '伊贺密令',
    description: '对一个敌方生物造成2点伤害',
    cost: 1,
    effect: onPlay.damage('ENEMY_MINION', 2),
  }),
});

export const HONDA_MASANOBU = japan.minister({
  slug: 'honda_masanobu',
  emperor: TOKUGAWA_IEYASU,
  name: '本多正信',
  type: 'ADMINISTRATOR',
  cooldown: 1,
  activeSkill: japan.ministerSkill({
    name: '幕政整饬',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const SAKAI_TADATSUGU = japan.minister({
  slug: 'sakai_tadatsugu',
  emperor: TOKUGAWA_IEYASU,
  name: '酒井忠次',
  type: 'WARRIOR',
  cooldown: 2,
  activeSkill: japan.ministerSkill({
    name: '东海先锋',
    description: '一个友方生物获得+1/+2',
    cost: 2,
    effect: onPlay.applyBuff({
      target: 'FRIENDLY_MINION',
      attackBonus: 1,
      healthBonus: 2,
      type: 'TEMPORARY',
      remainingTurns: 2,
    }),
  }),
});

// ─── 明治天皇 Ministers (3) ─────────────────────────────────────────

export const ITO_HIROBUMI = japan.minister({
  slug: 'ito_hirobumi',
  emperor: EMPEROR_MEIJI,
  name: '伊藤博文',
  type: 'ADMINISTRATOR',
  cooldown: 1,
  activeSkill: japan.ministerSkill({
    name: '内阁制度',
    description: '获得2点护甲',
    cost: 1,
    effect: onPlay.gainArmor(2),
  }),
});

export const OKUBO_TOSHIMICHI = japan.minister({
  slug: 'okubo_toshimichi',
  emperor: EMPEROR_MEIJI,
  name: '大久保利通',
  type: 'STRATEGIST',
  cooldown: 1,
  activeSkill: japan.ministerSkill({
    name: '版籍奉还',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const KIDO_TAKAYOSHI = japan.minister({
  slug: 'kido_takayoshi',
  emperor: EMPEROR_MEIJI,
  name: '木户孝允',
  type: 'ENVOY',
  cooldown: 2,
  activeSkill: japan.ministerSkill({
    name: '五条誓文',
    description: '所有友方生物获得+1攻击',
    cost: 2,
    effect: onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
    }),
  }),
});

// ─── Per-emperor minister pools ─────────────────────────────────────

export const ODA_MINISTERS: Minister[] = [AKECHI, TOYOTOMI, MAEDA];
export const TOKUGAWA_MINISTERS: Minister[] = [
  HATTORI_HANZO,
  HONDA_MASANOBU,
  SAKAI_TADATSUGU,
];
export const MEIJI_MINISTERS: Minister[] = [
  ITO_HIROBUMI,
  OKUBO_TOSHIMICHI,
  KIDO_TAKAYOSHI,
];

export const JAPAN_MINISTERS: Minister[] = [
  ...ODA_MINISTERS,
  ...TOKUGAWA_MINISTERS,
  ...MEIJI_MINISTERS,
];
