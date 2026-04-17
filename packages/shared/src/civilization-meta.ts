import type { Civilization } from './types.js';

export interface CivilizationMeta {
  id: Civilization;
  name: string;
  description: string;
  icon: string;
}

export type SupportedUiLocale = 'zh-CN' | 'en-US';

export const CIVILIZATION_ORDER: Civilization[] = [
  'CHINA',
  'JAPAN',
  'USA',
  'UK',
  'GERMANY',
];

interface LocalizedCivilizationFields {
  name: string;
  description: string;
  icon: string;
}

const CIVILIZATION_I18N: Record<
  Civilization,
  Record<SupportedUiLocale, LocalizedCivilizationFields>
> = {
  CHINA: {
    'zh-CN': { name: '华夏', description: '千古帝业，万里长城', icon: '龙' },
    'en-US': {
      name: 'China',
      description: 'Millennia of empire, the Great Wall unending.',
      icon: '龙',
    },
  },
  JAPAN: {
    'zh-CN': { name: '大和', description: '武士之道，战国风云', icon: '刀' },
    'en-US': {
      name: 'Japan',
      description: 'The way of the samurai, the Sengoku storm.',
      icon: '刀',
    },
  },
  USA: {
    'zh-CN': { name: '美利坚', description: '自由之光，民主先锋', icon: '星' },
    'en-US': {
      name: 'United States',
      description: 'Torch of liberty, vanguard of democracy.',
      icon: '星',
    },
  },
  UK: {
    'zh-CN': { name: '不列颠', description: '日不落帝国，海权霸主', icon: '冠' },
    'en-US': {
      name: 'United Kingdom',
      description: 'The empire on which the sun never sets, master of the seas.',
      icon: '冠',
    },
  },
  GERMANY: {
    'zh-CN': { name: '普鲁士', description: '铁血意志，军事传统', icon: '鹰' },
    'en-US': {
      name: 'Prussia',
      description: 'Iron and blood resolve, a martial tradition.',
      icon: '鹰',
    },
  },
  NEUTRAL: {
    'zh-CN': { name: '中立', description: '', icon: '衡' },
    'en-US': { name: 'Neutral', description: '', icon: '衡' },
  },
};

export function getCivilizationMeta(
  civilization: Civilization,
  locale: SupportedUiLocale,
): CivilizationMeta {
  const row = CIVILIZATION_I18N[civilization][locale];
  return {
    id: civilization,
    name: row.name,
    description: row.description,
    icon: row.icon,
  };
}

export const CIVILIZATION_META: Record<Civilization, CivilizationMeta> = {
  CHINA: getCivilizationMeta('CHINA', 'zh-CN'),
  JAPAN: getCivilizationMeta('JAPAN', 'zh-CN'),
  USA: getCivilizationMeta('USA', 'zh-CN'),
  UK: getCivilizationMeta('UK', 'zh-CN'),
  GERMANY: getCivilizationMeta('GERMANY', 'zh-CN'),
  NEUTRAL: getCivilizationMeta('NEUTRAL', 'zh-CN'),
};
