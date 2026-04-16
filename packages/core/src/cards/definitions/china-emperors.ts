import type { Card } from '@king-card/shared';
import { china, onPlay } from '../builders/index.js';

// ─── China Emperor Cards (3) ────────────────────────────────────────

export const QIN_SHIHUANG = china.emperor({
  slug: 'qin_shihuang',
  name: '秦始皇',
  cost: 4,
  description: '帝王技能：召唤一个1/1兵马俑。入场时召唤一个兵马俑。',
  effects: [onPlay.summon('china_bingmayong')],
  heroSkill: china.heroSkill({
    name: '召唤兵马俑',
    description: '召唤一个1/1兵马俑',
    cost: 1,
    cooldown: 1,
    effect: onPlay.summon('china_bingmayong'),
  }),
});

export const HAN_WUDI = china.emperor({
  slug: 'hanwudi',
  name: '汉武帝',
  cost: 6,
  description: '帝王技能：所有友方生物获得+1/+1。入场时所有友方生物获得+1攻击力。',
  effects: [
    onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
    }),
  ],
  heroSkill: china.heroSkill({
    name: '天威浩荡',
    description: '所有友方生物获得+1/+1',
    cost: 2,
    cooldown: 2,
    effect: onPlay.modifyStat({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      attackDelta: 1,
      healthDelta: 1,
    }),
  }),
});

export const TANG_TAIZONG = china.emperor({
  slug: 'tangtaizong',
  name: '唐太宗',
  cost: 8,
  description:
    '帝王技能：选择一个友方生物，召唤其1/1复制体。入场时所有友方生物获得驻守2回合。',
  effects: [
    onPlay.garrisonMark({
      targetFilter: 'ALL_FRIENDLY_MINIONS',
      garrisonTurns: 2,
    }),
  ],
  heroSkill: china.heroSkill({
    name: '天可汗',
    description: '选择一个友方生物，召唤其1/1复制体',
    cost: 3,
    cooldown: 2,
    effect: onPlay.summonCloneOfTarget(),
  }),
});

export const CHINA_EMPERORS: Card[] = [QIN_SHIHUANG, HAN_WUDI, TANG_TAIZONG];
