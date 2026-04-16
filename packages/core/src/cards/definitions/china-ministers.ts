import type { Minister } from '@king-card/shared';
import { china, onPlay } from '../builders/index.js';
import { QIN_SHIHUANG, HAN_WUDI, TANG_TAIZONG } from './china-emperors.js';

// ─── 秦始皇 Ministers (3) ───────────────────────────────────────────

export const LISI = china.minister({
  slug: 'lisi',
  emperor: QIN_SHIHUANG,
  name: '李斯',
  type: 'STRATEGIST',
  cooldown: 1,
  activeSkill: china.ministerSkill({
    name: '上书',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay.draw(1),
  }),
});

export const MENGTIAN = china.minister({
  slug: 'mengtian',
  emperor: QIN_SHIHUANG,
  name: '蒙恬',
  type: 'WARRIOR',
  cooldown: 2,
  activeSkill: china.ministerSkill({
    name: '北击匈奴',
    description: '对一个敌方生物造成2点伤害',
    cost: 2,
    effect: onPlay.damage('ENEMY_MINION', 2),
  }),
});

export const ZHAOGAO = china.minister({
  slug: 'zhaogao',
  emperor: QIN_SHIHUANG,
  name: '赵高',
  type: 'ENVOY',
  cooldown: 2,
  activeSkill: china.ministerSkill({
    name: '指鹿为马',
    description: '使一个敌方生物的攻击力变为1',
    cost: 1,
    effect: onPlay.modifyStat({ target: 'ENEMY_MINION', attackSet: 1 }),
  }),
});

// ─── 汉武帝 Ministers (3) ───────────────────────────────────────────

export const HANXIN = china.minister({
  slug: 'hanxin',
  emperor: HAN_WUDI,
  name: '韩信',
  type: 'WARRIOR',
  cooldown: 2,
  activeSkill: china.ministerSkill({
    name: '国士无双',
    description: '使一个友方生物获得+2/+1和突袭',
    cost: 2,
    effect: onPlay.applyBuff({
      target: 'FRIENDLY_MINION',
      attackBonus: 2,
      healthBonus: 1,
      keywordsGranted: ['RUSH'],
      type: 'TEMPORARY',
      remainingTurns: 1,
    }),
  }),
});

export const XIAOHE = china.minister({
  slug: 'xiaohe',
  emperor: HAN_WUDI,
  name: '萧何',
  type: 'ADMINISTRATOR',
  cooldown: 1,
  activeSkill: china.ministerSkill({
    name: '举荐',
    description: '恢复3点生命值',
    cost: 1,
    effect: onPlay.heal('HERO', 3),
  }),
});

export const CHENPING = china.minister({
  slug: 'chenping',
  emperor: HAN_WUDI,
  name: '陈平',
  type: 'ENVOY',
  cooldown: 1,
  activeSkill: china.ministerSkill({
    name: '反间',
    description: '使一个敌方生物本回合无法攻击',
    cost: 1,
    effect: onPlay.applyBuff({
      target: 'ENEMY_MINION',
      attackDelta: -100,
      type: 'TEMPORARY',
      remainingTurns: 1,
    }),
  }),
});

// ─── 唐太宗 Ministers (3) ───────────────────────────────────────────

export const WEIZHI = china.minister({
  slug: 'weizhi',
  emperor: TANG_TAIZONG,
  name: '魏征',
  type: 'STRATEGIST',
  cooldown: 1,
  activeSkill: china.ministerSkill({
    name: '直谏',
    description: '抽一张牌',
    cost: 2,
    effect: onPlay.draw(1),
  }),
});

export const FANGXUANLING = china.minister({
  slug: 'fangxuanling',
  emperor: TANG_TAIZONG,
  name: '房玄龄',
  type: 'ADMINISTRATOR',
  cooldown: 2,
  activeSkill: china.ministerSkill({
    name: '贞观之策',
    description: '获得2点护甲',
    cost: 2,
    effect: onPlay.gainArmor(2),
  }),
});

export const LIJING = china.minister({
  slug: 'lijing',
  emperor: TANG_TAIZONG,
  name: '李靖',
  type: 'WARRIOR',
  cooldown: 2,
  activeSkill: china.ministerSkill({
    name: '灭国之功',
    description: '使一个友方生物获得+1/+2',
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

// ─── Per-emperor minister pools ─────────────────────────────────────

export const QIN_MINISTERS: Minister[] = [LISI, MENGTIAN, ZHAOGAO];
export const HAN_MINISTERS: Minister[] = [HANXIN, XIAOHE, CHENPING];
export const TANG_MINISTERS: Minister[] = [WEIZHI, FANGXUANLING, LIJING];

// Aggregate all China ministers
export const CHINA_MINISTERS: Minister[] = [
  ...QIN_MINISTERS,
  ...HAN_MINISTERS,
  ...TANG_MINISTERS,
];
