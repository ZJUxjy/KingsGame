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
  QINJUN_NUSHOU,
  GUANZHONG_SHUBING,
  JINJUN_TONGLING,
  GU_SORCERER,
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
  IGA_ASSASSIN,
  VENOM_BUSHI,
  MIST_NINJA,
  UNDYING_SAMURAI,
  BUSHIDO_PALADIN,
  REBORN_MONK,
  TWIN_BLADE_SAMURAI,
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
  SAKOKU_EDICT,
  SANKIN_KOTAI,
  MEIJI_RESTORATION,
  CONSCRIPTION_ORDINANCE,
} from './japan-sorceries.js';

export {
  ODA_NOBUNAGA,
  TOKUGAWA_IEYASU,
  EMPEROR_MEIJI,
} from './japan-emperors.js';

export {
  AKECHI,
  TOYOTOMI,
  MAEDA,
  ODA_MINISTERS,
  HATTORI_HANZO,
  HONDA_MASANOBU,
  SAKAI_TADATSUGU,
  TOKUGAWA_MINISTERS,
  ITO_HIROBUMI,
  OKUBO_TOSHIMICHI,
  KIDO_TAKAYOSHI,
  MEIJI_MINISTERS,
} from './japan-ministers.js';

export {
  SANADA_YUKIMURA,
  BENKEI,
  HONDA_TADAKATSU,
  II_NAOMASA,
  SAIGO_TAKAMORI,
  YAMAGATA_ARITOMO,
} from './japan-generals.js';

export {
  GI,
  MARINE,
  RANGER,
  MEDIC,
  AIRBORNE,
  SHERMAN_TANK,
  RESEARCH_SCIENTIST,
  MANHATTAN_ENGINEER,
  DRILL_SERGEANT,
  MILITIA_SHIELDMAN,
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
  CONTINENTAL_CONGRESS,
  VALLEY_FORGE,
  NEW_DEAL,
  D_DAY_LANDING,
} from './usa-sorceries.js';

export {
  LINCOLN,
  GEORGE_WASHINGTON,
  FRANKLIN_ROOSEVELT,
} from './usa-emperors.js';

export {
  FRANKLIN,
  SHERMAN_MINISTER,
  HAMILTON,
  LINCOLN_MINISTERS,
  JOHN_ADAMS,
  THOMAS_PAINE,
  HENRY_LAURENS,
  WASHINGTON_MINISTERS,
  ELEANOR_ROOSEVELT,
  HARRY_HOPKINS,
  GEORGE_MARSHALL,
  ROOSEVELT_MINISTERS,
} from './usa-ministers.js';

export {
  GRANT,
  PATTON,
  NATHANAEL_GREENE,
  HENRY_KNOX,
  DOUGLAS_MACARTHUR,
  DWIGHT_EISENHOWER,
} from './usa-generals.js';

export {
  REDCOAT,
  LONGBOWMAN,
  KNIGHT,
  ROYAL_GUARD,
  PRIVATEER,
  MAN_OF_WAR,
  PALACE_GUARD,
  DRAGOON,
  IMPERIAL_GUARD,
  ROYAL_MEDIC,
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
  SPANISH_ARMADA,
  ROYAL_CHARTER,
  FINEST_HOUR,
  RADAR_NETWORK,
} from './uk-sorceries.js';

export {
  VICTORIA,
  ELIZABETH_I,
  WINSTON_CHURCHILL,
} from './uk-emperors.js';

export {
  PITT,
  DRAKE,
  WALPOLE,
  VICTORIA_MINISTERS,
  WALSINGHAM,
  BURGHLEY,
  ESSEX,
  ELIZABETH_MINISTERS,
  ATTLEE,
  TURING,
  EDEN,
  CHURCHILL_MINISTERS,
} from './uk-ministers.js';

export {
  WELLINGTON,
  NELSON,
  ROBERT_DUDLEY,
  WILLIAM_CECIL,
  BERNARD_MONTGOMERY,
  ALAN_BROOKE,
} from './uk-generals.js';

export {
  LANDSKNECHT,
  HUSSAR,
  GRENADIER,
  PANZER,
  TEUTONIC_KNIGHT,
  STORMTROOPER,
  BLITZ_TROOPER,
  TWIN_SABER_HUSSAR,
  RECOVERY_TANK,
  FIELD_ENGINEER,
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
  NORTH_GERMAN_CONFEDERATION,
  FRANCO_PRUSSIAN_WAR,
  SCHLIEFFEN_PLAN,
  HIGH_SEAS_FLEET,
} from './germany-sorceries.js';

export {
  FRIEDRICH,
  WILHELM_I,
  WILHELM_II,
} from './germany-emperors.js';

export {
  CLAUSEWITZ,
  WALLENSTEIN,
  ERHARD,
  FRIEDRICH_MINISTERS,
  DELBRUCK,
  BENNIGSEN,
  BLUMENTHAL,
  WILHELM_I_MINISTERS,
  BULOW,
  TIRPITZ_MINISTER,
  BETHMANN_HOLLWEG,
  WILHELM_II_MINISTERS,
} from './germany-ministers.js';

export {
  BISMARCK,
  ROMMEL,
  HELMUTH_VON_MOLTKE,
  ALBRECHT_VON_ROON,
  PAUL_VON_HINDENBURG,
  ALFRED_VON_TIRPITZ,
} from './germany-generals.js';

// ─── Aggregate all China cards ──────────────────────────────────────

import { CHINA_MINIONS } from './china-minions.js';
import { CHINA_STRATAGEMS } from './china-stratagems.js';
import { CHINA_SORCERIES } from './china-sorceries.js';
import { CHINA_EMPERORS } from './china-emperors.js';
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

import { ODA_NOBUNAGA, TOKUGAWA_IEYASU, EMPEROR_MEIJI } from './japan-emperors.js';
import { ODA_MINISTERS, TOKUGAWA_MINISTERS, MEIJI_MINISTERS } from './japan-ministers.js';
import { SANADA_YUKIMURA, BENKEI, HONDA_TADAKATSU, II_NAOMASA, SAIGO_TAKAMORI, YAMAGATA_ARITOMO } from './japan-generals.js';
import { KAMIKAZE, SEPPUKU, SAKOKU_EDICT, SANKIN_KOTAI, MEIJI_RESTORATION, CONSCRIPTION_ORDINANCE } from './japan-sorceries.js';

import { LINCOLN, GEORGE_WASHINGTON, FRANKLIN_ROOSEVELT } from './usa-emperors.js';
import { LINCOLN_MINISTERS, WASHINGTON_MINISTERS, ROOSEVELT_MINISTERS } from './usa-ministers.js';
import { GRANT, PATTON, NATHANAEL_GREENE, HENRY_KNOX, DOUGLAS_MACARTHUR, DWIGHT_EISENHOWER } from './usa-generals.js';
import { MANHATTAN_PROJECT, MONROE_DOCTRINE, CONTINENTAL_CONGRESS, VALLEY_FORGE, NEW_DEAL, D_DAY_LANDING } from './usa-sorceries.js';

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

export const EMPEROR_TOKUGAWA: EmperorData = {
  emperorCard: TOKUGAWA_IEYASU,
  ministers: TOKUGAWA_MINISTERS,
  boundGenerals: [HONDA_TADAKATSU, II_NAOMASA],
  boundSorceries: [SAKOKU_EDICT, SANKIN_KOTAI],
};

export const EMPEROR_MEIJI_DATA: EmperorData = {
  emperorCard: EMPEROR_MEIJI,
  ministers: MEIJI_MINISTERS,
  boundGenerals: [SAIGO_TAKAMORI, YAMAGATA_ARITOMO],
  boundSorceries: [MEIJI_RESTORATION, CONSCRIPTION_ORDINANCE],
};

export const JAPAN_EMPEROR_DATA_LIST: EmperorData[] = [
  EMPEROR_ODA,
  EMPEROR_TOKUGAWA,
  EMPEROR_MEIJI_DATA,
];

// ─── USA EmperorData assemblies ─────────────────────────────────────

export const EMPEROR_LINCOLN: EmperorData = {
  emperorCard: LINCOLN,
  ministers: LINCOLN_MINISTERS,
  boundGenerals: [GRANT, PATTON],
  boundSorceries: [MANHATTAN_PROJECT, MONROE_DOCTRINE],
};

export const EMPEROR_WASHINGTON: EmperorData = {
  emperorCard: GEORGE_WASHINGTON,
  ministers: WASHINGTON_MINISTERS,
  boundGenerals: [NATHANAEL_GREENE, HENRY_KNOX],
  boundSorceries: [CONTINENTAL_CONGRESS, VALLEY_FORGE],
};

export const EMPEROR_ROOSEVELT: EmperorData = {
  emperorCard: FRANKLIN_ROOSEVELT,
  ministers: ROOSEVELT_MINISTERS,
  boundGenerals: [DOUGLAS_MACARTHUR, DWIGHT_EISENHOWER],
  boundSorceries: [NEW_DEAL, D_DAY_LANDING],
};

export const USA_EMPEROR_DATA_LIST: EmperorData[] = [
  EMPEROR_LINCOLN,
  EMPEROR_WASHINGTON,
  EMPEROR_ROOSEVELT,
];

// ─── Germany EmperorData assemblies ─────────────────────────────────

import { FRIEDRICH, WILHELM_I, WILHELM_II } from './germany-emperors.js';
import { FRIEDRICH_MINISTERS, WILHELM_I_MINISTERS, WILHELM_II_MINISTERS } from './germany-ministers.js';
import { BISMARCK, ROMMEL, HELMUTH_VON_MOLTKE, ALBRECHT_VON_ROON, PAUL_VON_HINDENBURG, ALFRED_VON_TIRPITZ } from './germany-generals.js';
import { V2_ROCKET, SCORCHED_EARTH, NORTH_GERMAN_CONFEDERATION, FRANCO_PRUSSIAN_WAR, SCHLIEFFEN_PLAN, HIGH_SEAS_FLEET } from './germany-sorceries.js';

export const EMPEROR_FRIEDRICH: EmperorData = {
  emperorCard: FRIEDRICH,
  ministers: FRIEDRICH_MINISTERS,
  boundGenerals: [BISMARCK, ROMMEL],
  boundSorceries: [V2_ROCKET, SCORCHED_EARTH],
};

export const EMPEROR_WILHELM_I: EmperorData = {
  emperorCard: WILHELM_I,
  ministers: WILHELM_I_MINISTERS,
  boundGenerals: [HELMUTH_VON_MOLTKE, ALBRECHT_VON_ROON],
  boundSorceries: [NORTH_GERMAN_CONFEDERATION, FRANCO_PRUSSIAN_WAR],
};

export const EMPEROR_WILHELM_II: EmperorData = {
  emperorCard: WILHELM_II,
  ministers: WILHELM_II_MINISTERS,
  boundGenerals: [PAUL_VON_HINDENBURG, ALFRED_VON_TIRPITZ],
  boundSorceries: [SCHLIEFFEN_PLAN, HIGH_SEAS_FLEET],
};

export const GERMANY_EMPEROR_DATA_LIST: EmperorData[] = [
  EMPEROR_FRIEDRICH,
  EMPEROR_WILHELM_I,
  EMPEROR_WILHELM_II,
];

// ─── UK EmperorData assemblies ──────────────────────────────────────

import { VICTORIA, ELIZABETH_I, WINSTON_CHURCHILL } from './uk-emperors.js';
import { VICTORIA_MINISTERS, ELIZABETH_MINISTERS, CHURCHILL_MINISTERS } from './uk-ministers.js';
import { WELLINGTON, NELSON, ROBERT_DUDLEY, WILLIAM_CECIL, BERNARD_MONTGOMERY, ALAN_BROOKE } from './uk-generals.js';
import { GREAT_FIRE, ENCLOSURE_ACT, SPANISH_ARMADA, ROYAL_CHARTER, FINEST_HOUR, RADAR_NETWORK } from './uk-sorceries.js';

export const EMPEROR_VICTORIA: EmperorData = {
  emperorCard: VICTORIA,
  ministers: VICTORIA_MINISTERS,
  boundGenerals: [WELLINGTON, NELSON],
  boundSorceries: [GREAT_FIRE, ENCLOSURE_ACT],
};

export const EMPEROR_ELIZABETH: EmperorData = {
  emperorCard: ELIZABETH_I,
  ministers: ELIZABETH_MINISTERS,
  boundGenerals: [ROBERT_DUDLEY, WILLIAM_CECIL],
  boundSorceries: [SPANISH_ARMADA, ROYAL_CHARTER],
};

export const EMPEROR_CHURCHILL: EmperorData = {
  emperorCard: WINSTON_CHURCHILL,
  ministers: CHURCHILL_MINISTERS,
  boundGenerals: [BERNARD_MONTGOMERY, ALAN_BROOKE],
  boundSorceries: [FINEST_HOUR, RADAR_NETWORK],
};

export const UK_EMPEROR_DATA_LIST: EmperorData[] = [
  EMPEROR_VICTORIA,
  EMPEROR_ELIZABETH,
  EMPEROR_CHURCHILL,
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
