import type { Card } from '@king-card/shared';
import { japan, onPlay } from '../builders/index.js';

// ─── Japan Sorcery Cards (6) ────────────────────────────────────────

export const KAMIKAZE = japan.sorcery({
  slug: 'kamikaze',
  name: '神風',
  cost: 5,
  description: '随机消灭一个敌方生物。',
  effects: [onPlay.randomDestroy('RANDOM_ENEMY_MINION')],
});

export const SEPPUKU = japan.sorcery({
  slug: 'seppuku',
  name: '切腹',
  cost: 3,
  description: '消灭一个友方生物，抽两张牌。',
  effects: [onPlay.destroy('FRIENDLY_MINION'), onPlay.draw(2)],
});

export const SAKOKU_EDICT = japan.sorcery({
  slug: 'sakoku_edict',
  name: '锁国令',
  cost: 4,
  description: '对手随机弃一张牌，并在下回合无法抽牌。',
  effects: [
    onPlay.randomDiscard({ targetPlayer: 'OPPONENT', count: 1 }),
    onPlay.setDrawLock({ targetPlayer: 'OPPONENT', locked: true }),
  ],
});

export const SANKIN_KOTAI = japan.sorcery({
  slug: 'sankin_kotai',
  name: '参勤交代',
  cost: 3,
  description: '抽一张牌并获得3点护甲。',
  effects: [onPlay.draw(1), onPlay.gainArmor(3)],
});

export const MEIJI_RESTORATION = japan.sorcery({
  slug: 'meiji_restoration',
  name: '明治维新',
  cost: 4,
  description: '所有友方生物获得+1/+1，并抽一张牌。',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
      healthDelta: 1,
    }),
    onPlay.draw(1),
  ],
});

export const CONSCRIPTION_ORDINANCE = japan.sorcery({
  slug: 'conscription_ordinance',
  name: '征兵令',
  cost: 4,
  description: '召唤两个1/1足轻。',
  effects: [onPlay.summon('japan_ashigaru'), onPlay.summon('japan_ashigaru')],
});

export const JAPAN_SORCERIES: Card[] = [
  KAMIKAZE,
  SEPPUKU,
  SAKOKU_EDICT,
  SANKIN_KOTAI,
  MEIJI_RESTORATION,
  CONSCRIPTION_ORDINANCE,
];
