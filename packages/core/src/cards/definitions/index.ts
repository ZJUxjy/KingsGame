import type { EmperorData } from '@king-card/shared';

// ─── Re-export all card definition arrays ───────────────────────────

export { CHINA_MINIONS } from './china-minions.js';
export { CHINA_STRATAGEMS } from './china-stratagems.js';
export { CHINA_SORCERIES } from './china-sorceries.js';
export { CHINA_EMPERORS } from './china-emperors.js';
export { CHINA_MINISTERS } from './china-ministers.js';
export { CHINA_GENERALS } from './china-generals.js';

export { JAPAN_MINIONS } from './japan-minions.js';
export { JAPAN_STRATAGEMS } from './japan-stratagems.js';
export { JAPAN_SORCERIES } from './japan-sorceries.js';
export { JAPAN_EMPERORS } from './japan-emperors.js';
export { JAPAN_MINISTERS } from './japan-ministers.js';
export { JAPAN_GENERALS } from './japan-generals.js';

export { GERMANY_MINIONS } from './germany-minions.js';
export { GERMANY_STRATAGEMS } from './germany-stratagems.js';
export { GERMANY_SORCERIES } from './germany-sorceries.js';
export { GERMANY_EMPERORS } from './germany-emperors.js';
export { GERMANY_MINISTERS } from './germany-ministers.js';
export { GERMANY_GENERALS } from './germany-generals.js';

export { USA_MINIONS } from './usa-minions.js';
export { USA_STRATAGEMS } from './usa-stratagems.js';
export { USA_SORCERIES } from './usa-sorceries.js';
export { USA_EMPERORS } from './usa-emperors.js';
export { USA_MINISTERS } from './usa-ministers.js';
export { USA_GENERALS } from './usa-generals.js';

export { UK_MINIONS } from './uk-minions.js';
export { UK_STRATAGEMS } from './uk-stratagems.js';
export { UK_SORCERIES } from './uk-sorceries.js';
export { UK_EMPERORS } from './uk-emperors.js';
export { UK_MINISTERS } from './uk-ministers.js';
export { UK_GENERALS } from './uk-generals.js';

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
  MENGTIAN,
  ZHAOGAO,
  HANXIN,
  XIAOHE,
  CHENPING,
  WEIZHI,
  FANGXUANLING,
  LIJING,
  QIN_MINISTERS,
  HAN_MINISTERS,
  TANG_MINISTERS,
} from './china-ministers.js';

export {
  HUOQUBING,
  WEIQING,
} from './china-generals.js';

export {
  ASHIGARU,
  NINJA,
  SAMURAI,
  SOUHEI,
  TEPPO,
  MUSHA,
} from './japan-minions.js';

export {
  BUSHIDO,
  NINJUTSU,
  HYOUROU,
  ISSHO_KENMEI,
} from './japan-stratagems.js';

export {
  KAMIKAZE,
  SEPPUKU,
} from './japan-sorceries.js';

export {
  ODA_NOBUNAGA,
} from './japan-emperors.js';

export {
  AKECHI,
  TOYOTOMI,
  MAEDA,
  ODA_MINISTERS,
} from './japan-ministers.js';

export {
  SANADA_YUKIMURA,
  BENKEI,
} from './japan-generals.js';

export {
  GI,
  MARINE,
  RANGER,
  MEDIC,
  AIRBORNE,
  SHERMAN_TANK,
} from './usa-minions.js';

export {
  ARSENAL_OF_DEMOCRACY,
  LEND_LEASE,
  AIR_SUPERIORITY,
  MARSHALL_PLAN,
} from './usa-stratagems.js';

export {
  MANHATTAN_PROJECT,
  MONROE_DOCTRINE,
} from './usa-sorceries.js';

export {
  LINCOLN,
} from './usa-emperors.js';

export {
  FRANKLIN,
  SHERMAN_MINISTER,
  HAMILTON,
  LINCOLN_MINISTERS,
} from './usa-ministers.js';

export {
  GRANT,
  PATTON,
} from './usa-generals.js';

export {
  REDCOAT,
  LONGBOWMAN,
  KNIGHT,
  ROYAL_GUARD,
  PRIVATEER,
  MAN_OF_WAR,
} from './uk-minions.js';

export {
  RULE_BRITANNIA,
  TEA_TIME,
  NAVAL_BLOCKADE,
  COLONIAL_EXPANSION,
} from './uk-stratagems.js';

export {
  GREAT_FIRE,
  ENCLOSURE_ACT,
} from './uk-sorceries.js';

export {
  VICTORIA,
} from './uk-emperors.js';

export {
  PITT,
  DRAKE,
  WALPOLE,
  VICTORIA_MINISTERS,
} from './uk-ministers.js';

export {
  WELLINGTON,
  NELSON,
} from './uk-generals.js';

export {
  LANDSKNECHT,
  HUSSAR,
  GRENADIER,
  PANZER,
  TEUTONIC_KNIGHT,
  STORMTROOPER,
} from './germany-minions.js';

export {
  BLITZKRIEG_DOCTRINE,
  ENIGMA,
  ARTILLERY_BARRAGE,
  FORTIFICATION,
} from './germany-stratagems.js';

export {
  V2_ROCKET,
  SCORCHED_EARTH,
} from './germany-sorceries.js';

export {
  FRIEDRICH,
} from './germany-emperors.js';

export {
  CLAUSEWITZ,
  WALLENSTEIN,
  ERHARD,
  FRIEDRICH_MINISTERS,
} from './germany-ministers.js';

export {
  BISMARCK,
  ROMMEL,
} from './germany-generals.js';

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

// ─── Aggregate all Japan cards ──────────────────────────────────────

import { JAPAN_MINIONS } from './japan-minions.js';
import { JAPAN_STRATAGEMS } from './japan-stratagems.js';
import { JAPAN_SORCERIES } from './japan-sorceries.js';
import { JAPAN_EMPERORS } from './japan-emperors.js';
import { JAPAN_MINISTERS } from './japan-ministers.js';
import { JAPAN_GENERALS } from './japan-generals.js';

export const JAPAN_ALL_CARDS: Card[] = [
  ...JAPAN_MINIONS,
  ...JAPAN_STRATAGEMS,
  ...JAPAN_SORCERIES,
  ...JAPAN_EMPERORS,
  ...JAPAN_GENERALS,
];

// ─── Aggregate all USA cards ────────────────────────────────────────

import { USA_MINIONS } from './usa-minions.js';
import { USA_STRATAGEMS } from './usa-stratagems.js';
import { USA_SORCERIES } from './usa-sorceries.js';
import { USA_EMPERORS } from './usa-emperors.js';
import { USA_MINISTERS } from './usa-ministers.js';
import { USA_GENERALS } from './usa-generals.js';

export const USA_ALL_CARDS: Card[] = [
  ...USA_MINIONS,
  ...USA_STRATAGEMS,
  ...USA_SORCERIES,
  ...USA_EMPERORS,
  ...USA_GENERALS,
];

// ─── Aggregate all UK cards ─────────────────────────────────────────

import { UK_MINIONS } from './uk-minions.js';
import { UK_STRATAGEMS } from './uk-stratagems.js';
import { UK_SORCERIES } from './uk-sorceries.js';
import { UK_EMPERORS } from './uk-emperors.js';
import { UK_MINISTERS } from './uk-ministers.js';
import { UK_GENERALS } from './uk-generals.js';

export const UK_ALL_CARDS: Card[] = [
  ...UK_MINIONS,
  ...UK_STRATAGEMS,
  ...UK_SORCERIES,
  ...UK_EMPERORS,
  ...UK_GENERALS,
];

// ─── Aggregate all Germany cards ────────────────────────────────────

import { GERMANY_MINIONS } from './germany-minions.js';
import { GERMANY_STRATAGEMS } from './germany-stratagems.js';
import { GERMANY_SORCERIES } from './germany-sorceries.js';
import { GERMANY_EMPERORS } from './germany-emperors.js';
import { GERMANY_MINISTERS } from './germany-ministers.js';
import { GERMANY_GENERALS } from './germany-generals.js';

export const GERMANY_ALL_CARDS: Card[] = [
  ...GERMANY_MINIONS,
  ...GERMANY_STRATAGEMS,
  ...GERMANY_SORCERIES,
  ...GERMANY_EMPERORS,
  ...GERMANY_GENERALS,
];

// ─── EmperorData assemblies ─────────────────────────────────────────

import { QIN_SHIHUANG } from './china-emperors.js';
import { HAN_WUDI } from './china-emperors.js';
import { TANG_TAIZONG } from './china-emperors.js';
import { QIN_MINISTERS, HAN_MINISTERS, TANG_MINISTERS } from './china-ministers.js';
import { HUOQUBING, WEIQING } from './china-generals.js';
import { WUGUZHIHUO, FENSHU_KENGRU } from './china-sorceries.js';

import { ODA_NOBUNAGA } from './japan-emperors.js';
import { ODA_MINISTERS } from './japan-ministers.js';
import { SANADA_YUKIMURA, BENKEI } from './japan-generals.js';
import { KAMIKAZE, SEPPUKU } from './japan-sorceries.js';

import { LINCOLN } from './usa-emperors.js';
import { LINCOLN_MINISTERS } from './usa-ministers.js';
import { GRANT, PATTON } from './usa-generals.js';
import { MANHATTAN_PROJECT, MONROE_DOCTRINE } from './usa-sorceries.js';

import type { Card } from '@king-card/shared';

export const EMPEROR_QIN: EmperorData = {
  emperorCard: QIN_SHIHUANG,
  ministers: QIN_MINISTERS,
  boundGenerals: [HUOQUBING, WEIQING],
  boundSorceries: [WUGUZHIHUO, FENSHU_KENGRU],
};

export const EMPEROR_HAN: EmperorData = {
  emperorCard: HAN_WUDI,
  ministers: HAN_MINISTERS,
  boundGenerals: [HUOQUBING, WEIQING],
  boundSorceries: [WUGUZHIHUO, FENSHU_KENGRU],
};

export const EMPEROR_TANG: EmperorData = {
  emperorCard: TANG_TAIZONG,
  ministers: TANG_MINISTERS,
  boundGenerals: [HUOQUBING, WEIQING],
  boundSorceries: [WUGUZHIHUO, FENSHU_KENGRU],
};

export const CHINA_EMPEROR_DATA_LIST: EmperorData[] = [
  EMPEROR_QIN,
  EMPEROR_HAN,
  EMPEROR_TANG,
];

// ─── Japan EmperorData assemblies ───────────────────────────────────

export const EMPEROR_ODA: EmperorData = {
  emperorCard: ODA_NOBUNAGA,
  ministers: ODA_MINISTERS,
  boundGenerals: [SANADA_YUKIMURA, BENKEI],
  boundSorceries: [KAMIKAZE, SEPPUKU],
};

export const JAPAN_EMPEROR_DATA_LIST: EmperorData[] = [
  EMPEROR_ODA,
];

// ─── USA EmperorData assemblies ─────────────────────────────────────

export const EMPEROR_LINCOLN: EmperorData = {
  emperorCard: LINCOLN,
  ministers: LINCOLN_MINISTERS,
  boundGenerals: [GRANT, PATTON],
  boundSorceries: [MANHATTAN_PROJECT, MONROE_DOCTRINE],
};

export const USA_EMPEROR_DATA_LIST: EmperorData[] = [
  EMPEROR_LINCOLN,
];

// ─── Germany EmperorData assemblies ─────────────────────────────────

import { FRIEDRICH } from './germany-emperors.js';
import { FRIEDRICH_MINISTERS } from './germany-ministers.js';
import { BISMARCK, ROMMEL } from './germany-generals.js';
import { V2_ROCKET, SCORCHED_EARTH } from './germany-sorceries.js';

export const EMPEROR_FRIEDRICH: EmperorData = {
  emperorCard: FRIEDRICH,
  ministers: FRIEDRICH_MINISTERS,
  boundGenerals: [BISMARCK, ROMMEL],
  boundSorceries: [V2_ROCKET, SCORCHED_EARTH],
};

export const GERMANY_EMPEROR_DATA_LIST: EmperorData[] = [
  EMPEROR_FRIEDRICH,
];

// ─── UK EmperorData assemblies ──────────────────────────────────────

import { VICTORIA } from './uk-emperors.js';
import { VICTORIA_MINISTERS } from './uk-ministers.js';
import { WELLINGTON, NELSON } from './uk-generals.js';
import { GREAT_FIRE, ENCLOSURE_ACT } from './uk-sorceries.js';

export const EMPEROR_VICTORIA: EmperorData = {
  emperorCard: VICTORIA,
  ministers: VICTORIA_MINISTERS,
  boundGenerals: [WELLINGTON, NELSON],
  boundSorceries: [GREAT_FIRE, ENCLOSURE_ACT],
};

export const UK_EMPEROR_DATA_LIST: EmperorData[] = [
  EMPEROR_VICTORIA,
];

// ─── Global aggregates ──────────────────────────────────────────────

export const ALL_CARDS: Card[] = [
  ...CHINA_ALL_CARDS,
  ...JAPAN_ALL_CARDS,
  ...USA_ALL_CARDS,
  ...UK_ALL_CARDS,
  ...GERMANY_ALL_CARDS,
];

export const ALL_EMPEROR_DATA_LIST: EmperorData[] = [
  ...CHINA_EMPEROR_DATA_LIST,
  ...JAPAN_EMPEROR_DATA_LIST,
  ...USA_EMPEROR_DATA_LIST,
  ...UK_EMPEROR_DATA_LIST,
  ...GERMANY_EMPEROR_DATA_LIST,
];
