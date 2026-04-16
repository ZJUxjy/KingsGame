import type { Civilization } from './types.js';

export interface CivilizationMeta {
  id: Civilization;
  name: string;
  description: string;
  icon: string;
}

export const CIVILIZATION_ORDER: Civilization[] = [
  'CHINA',
  'JAPAN',
  'USA',
  'UK',
  'GERMANY',
];

export const CIVILIZATION_META: Record<Civilization, CivilizationMeta> = {
  CHINA: {
    id: 'CHINA',
    name: '华夏',
    description: '千古帝业，万里长城',
    icon: '龙',
  },
  JAPAN: {
    id: 'JAPAN',
    name: '大和',
    description: '武士之道，战国风云',
    icon: '刀',
  },
  USA: {
    id: 'USA',
    name: '美利坚',
    description: '自由之光，民主先锋',
    icon: '星',
  },
  UK: {
    id: 'UK',
    name: '不列颠',
    description: '日不落帝国，海权霸主',
    icon: '冠',
  },
  GERMANY: {
    id: 'GERMANY',
    name: '普鲁士',
    description: '铁血意志，军事传统',
    icon: '鹰',
  },
  NEUTRAL: {
    id: 'NEUTRAL',
    name: '中立',
    description: '',
    icon: '衡',
  },
};