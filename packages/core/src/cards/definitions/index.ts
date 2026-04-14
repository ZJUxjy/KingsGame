import type { EmperorData } from '@king-card/shared';

// ─── Re-export all card definition arrays ───────────────────────────

export { CHINA_MINIONS } from './china-minions.js';
export { CHINA_STRATAGEMS } from './china-stratagems.js';
export { CHINA_SORCERIES } from './china-sorceries.js';
export { CHINA_EMPERORS } from './china-emperors.js';
export { CHINA_MINISTERS } from './china-ministers.js';
export { CHINA_GENERALS } from './china-generals.js';

// ─── Named re-exports for individual cards ──────────────────────────

export {
  BINGMAYONG,
  QINJUN_BUBING,
  HANCHAO_QIBING,
  DATANG_JINGRUI,
  CHANGCHENG_SHOUWEI,
  JINJUN_TONGLING,
} from './china-minions.js';

export {
  ZHUCHENGLING,
  ZONGDONGYUAN,
  BINGFA_SANSHILIUJI,
  MINGXIU_ZHANDAO,
} from './china-stratagems.js';

export {
  WUGUZHIHUO,
  FENSHU_KENGRU,
} from './china-sorceries.js';

export {
  QIN_SHIHUANG,
  HAN_WUDI,
  TANG_TAIZONG,
} from './china-emperors.js';

export {
  LISI,
  HANXIN,
  XIAOHE,
  CHENPING,
} from './china-ministers.js';

export {
  HUOQUBING,
  WEIQING,
} from './china-generals.js';

// ─── Aggregate all China cards ──────────────────────────────────────

import { CHINA_MINIONS } from './china-minions.js';
import { CHINA_STRATAGEMS } from './china-stratagems.js';
import { CHINA_SORCERIES } from './china-sorceries.js';
import { CHINA_EMPERORS } from './china-emperors.js';
import { CHINA_MINISTERS } from './china-ministers.js';
import { CHINA_GENERALS } from './china-generals.js';

export const CHINA_ALL_CARDS: Card[] = [
  ...CHINA_MINIONS,
  ...CHINA_STRATAGEMS,
  ...CHINA_SORCERIES,
  ...CHINA_EMPERORS,
  ...CHINA_GENERALS,
];

// ─── EmperorData assemblies ─────────────────────────────────────────

import { QIN_SHIHUANG } from './china-emperors.js';
import { HAN_WUDI } from './china-emperors.js';
import { TANG_TAIZONG } from './china-emperors.js';
import { LISI, HANXIN, XIAOHE, CHENPING } from './china-ministers.js';
import { HUOQUBING, WEIQING } from './china-generals.js';
import { WUGUZHIHUO, FENSHU_KENGRU } from './china-sorceries.js';

import type { Card } from '@king-card/shared';

export const EMPEROR_QIN: EmperorData = {
  emperorCard: QIN_SHIHUANG,
  ministers: [LISI, HANXIN, XIAOHE, CHENPING],
  boundGenerals: [HUOQUBING, WEIQING],
  boundSorceries: [WUGUZHIHUO, FENSHU_KENGRU],
};

export const EMPEROR_HAN: EmperorData = {
  emperorCard: HAN_WUDI,
  ministers: [LISI, HANXIN, XIAOHE, CHENPING],
  boundGenerals: [HUOQUBING, WEIQING],
  boundSorceries: [WUGUZHIHUO, FENSHU_KENGRU],
};

export const EMPEROR_TANG: EmperorData = {
  emperorCard: TANG_TAIZONG,
  ministers: [LISI, HANXIN, XIAOHE, CHENPING],
  boundGenerals: [HUOQUBING, WEIQING],
  boundSorceries: [WUGUZHIHUO, FENSHU_KENGRU],
};

export const CHINA_EMPEROR_DATA_LIST: EmperorData[] = [
  EMPEROR_QIN,
  EMPEROR_HAN,
  EMPEROR_TANG,
];
