import type { Card } from '@king-card/shared';

// ─── Germany Emperor Cards (1) ──────────────────────────────────────

export const FRIEDRICH: Card = {
  id: 'germany_friedrich',
  name: '腓特烈大帝',
  civilization: 'GERMANY',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 5,
  attack: 0,
  health: 30,
  description: '帝王技能：对一个敌方生物造成2点伤害。入场时所有友方生物获得+1攻击。',
  keywords: [],
  effects: [
    {
      trigger: 'ON_PLAY',
      type: 'MODIFY_STAT',
      params: { targetFilter: 'ALL_FRIENDLY_MINIONS', attackDelta: 1 },
    },
  ],
  heroSkill: {
    name: '斜线阵',
    description: '对一个敌方生物造成2点伤害',
    cost: 1,
    cooldown: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DAMAGE',
      params: { target: 'ENEMY_MINION', amount: 2 },
    },
  },
};

export const GERMANY_EMPERORS: Card[] = [
  FRIEDRICH,
];
