import { describe, expect, it } from 'vitest';
import type { Card, EmperorData, Minister } from '../src/index.js';
import {
  GAME_CONSTANTS,
  getEditableDeckSize,
  materializeDeckCards,
  validateDeckDefinition,
} from '../src/index.js';

function makeCard(
  overrides: Partial<Card> & Pick<Card, 'id' | 'name' | 'civilization' | 'type'>,
): Card {
  return {
    id: overrides.id,
    name: overrides.name,
    civilization: overrides.civilization,
    type: overrides.type,
    rarity: overrides.rarity ?? 'COMMON',
    cost: overrides.cost ?? 1,
    attack: overrides.attack,
    health: overrides.health,
    description: overrides.description ?? overrides.name,
    keywords: overrides.keywords ?? [],
    effects: overrides.effects ?? [],
    heroSkill: overrides.heroSkill,
    generalSkills: overrides.generalSkills,
  };
}

const starterEmperor = makeCard({
  id: 'china_qin',
  name: '秦始皇',
  civilization: 'CHINA',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
  cost: 4,
});

const boundGeneral = makeCard({
  id: 'bound_general',
  name: '霍去病',
  civilization: 'CHINA',
  type: 'GENERAL',
  cost: 7,
});

const boundSorcery = makeCard({
  id: 'bound_sorcery',
  name: '焚书坑儒',
  civilization: 'CHINA',
  type: 'SORCERY',
  cost: 4,
});

const emperorData: EmperorData = {
  emperorCard: starterEmperor,
  ministers: [] as Minister[],
  boundGenerals: [
    boundGeneral,
    makeCard({ id: 'bound_general_2', name: '卫青', civilization: 'CHINA', type: 'GENERAL' }),
  ],
  boundSorceries: [
    boundSorcery,
    makeCard({ id: 'bound_sorcery_2', name: '巫蛊之祸', civilization: 'CHINA', type: 'SORCERY' }),
  ],
};

const chinaMinionA = makeCard({ id: 'china_minion_a', name: '秦军步兵', civilization: 'CHINA', type: 'MINION' });
const chinaMinionB = makeCard({ id: 'china_minion_b', name: '长城守卫', civilization: 'CHINA', type: 'MINION' });
const chinaMinionC = makeCard({ id: 'china_minion_c', name: '羽林郎', civilization: 'CHINA', type: 'MINION' });
const chinaMinionD = makeCard({ id: 'china_minion_d', name: '虎贲卫', civilization: 'CHINA', type: 'MINION' });
const chinaMinionE = makeCard({ id: 'china_minion_e', name: '大秦工匠', civilization: 'CHINA', type: 'MINION' });
const chinaMinionF = makeCard({ id: 'china_minion_f', name: '边郡骑士', civilization: 'CHINA', type: 'MINION' });
const chinaMinionG = makeCard({ id: 'china_minion_g', name: '太学弟子', civilization: 'CHINA', type: 'MINION' });
const chinaMinionH = makeCard({ id: 'china_minion_h', name: '都尉亲兵', civilization: 'CHINA', type: 'MINION' });
const chinaStratagemA = makeCard({ id: 'china_stratagem_a', name: '诏承令', civilization: 'CHINA', type: 'STRATAGEM' });
const chinaStratagemB = makeCard({ id: 'china_stratagem_b', name: '粮道转运', civilization: 'CHINA', type: 'STRATAGEM' });
const chinaStratagemC = makeCard({ id: 'china_stratagem_c', name: '烽火急报', civilization: 'CHINA', type: 'STRATAGEM' });
const chinaStratagemD = makeCard({ id: 'china_stratagem_d', name: '屯田令', civilization: 'CHINA', type: 'STRATAGEM' });
const chinaGeneral = makeCard({ id: 'china_general', name: '李靖', civilization: 'CHINA', type: 'GENERAL' });
const chinaSorcery = makeCard({ id: 'china_sorcery', name: '五谷之火', civilization: 'CHINA', type: 'SORCERY' });
const chinaEmperor = makeCard({
  id: 'china_emperor',
  name: '汉武帝',
  civilization: 'CHINA',
  type: 'EMPEROR',
  rarity: 'LEGENDARY',
});
const neutralMinionA = makeCard({ id: 'neutral_minion_a', name: '商旅护卫', civilization: 'NEUTRAL', type: 'MINION' });
const neutralMinionB = makeCard({ id: 'neutral_minion_b', name: '沙海向导', civilization: 'NEUTRAL', type: 'MINION' });
const neutralMinionC = makeCard({ id: 'neutral_minion_c', name: '边市调停者', civilization: 'NEUTRAL', type: 'MINION' });
const japanMinion = makeCard({ id: 'japan_minion', name: '足轻', civilization: 'JAPAN', type: 'MINION' });

const cardCatalog = [
  starterEmperor,
  boundGeneral,
  boundSorcery,
  ...emperorData.boundGenerals.slice(1),
  ...emperorData.boundSorceries.slice(1),
  chinaMinionA,
  chinaMinionB,
  chinaMinionC,
  chinaMinionD,
  chinaMinionE,
  chinaMinionF,
  chinaMinionG,
  chinaMinionH,
  chinaStratagemA,
  chinaStratagemB,
  chinaStratagemC,
  chinaStratagemD,
  chinaGeneral,
  chinaSorcery,
  chinaEmperor,
  neutralMinionA,
  neutralMinionB,
  neutralMinionC,
  japanMinion,
];

function makeLegalMainDeck(): string[] {
  return [
    chinaMinionA.id,
    chinaMinionA.id,
    chinaMinionB.id,
    chinaMinionB.id,
    chinaMinionC.id,
    chinaMinionC.id,
    chinaMinionD.id,
    chinaMinionD.id,
    chinaMinionE.id,
    chinaMinionE.id,
    chinaMinionF.id,
    chinaMinionF.id,
    chinaMinionG.id,
    chinaMinionG.id,
    chinaMinionH.id,
    chinaMinionH.id,
    chinaStratagemA.id,
    chinaStratagemA.id,
    chinaStratagemB.id,
    chinaStratagemB.id,
    chinaStratagemC.id,
    chinaStratagemC.id,
    chinaStratagemD.id,
    chinaStratagemD.id,
    neutralMinionA.id,
    neutralMinionB.id,
  ];
}

describe('deck validation', () => {
  it('uses 26 editable slots when an emperor contributes 4 bound cards', () => {
    expect(getEditableDeckSize(emperorData)).toBe(GAME_CONSTANTS.DECK_SIZE - 4);
  });

  it('accepts a legal CHINA plus NEUTRAL deck and materializes a 30-card deck with bound cards first', () => {
    const deck = {
      id: 'qin-default',
      name: '秦始皇默认套牌',
      civilization: 'CHINA' as const,
      emperorCardId: starterEmperor.id,
      mainCardIds: makeLegalMainDeck(),
    };

    const result = validateDeckDefinition(deck, cardCatalog, emperorData);
    expect(result).toEqual({ ok: true, issues: [] });

    const playableDeck = materializeDeckCards(deck, cardCatalog, emperorData);
    expect(playableDeck).toHaveLength(30);
    expect(playableDeck.slice(0, 4).map((card) => card.id)).toEqual([
      boundGeneral.id,
      'bound_general_2',
      boundSorcery.id,
      'bound_sorcery_2',
    ]);
  });

  it('rejects decks with the wrong editable main-deck size', () => {
    const deck = {
      id: 'bad-size',
      name: '缺牌',
      civilization: 'CHINA' as const,
      emperorCardId: starterEmperor.id,
      mainCardIds: makeLegalMainDeck().slice(0, 25),
    };

    const result = validateDeckDefinition(deck, cardCatalog, emperorData);
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: 'MAIN_DECK_SIZE',
        limit: 26,
        actual: 25,
      }),
    );
  });

  it('rejects unknown cards with UNKNOWN_CARD', () => {
    const deck = {
      id: 'unknown-card',
      name: '幽灵卡',
      civilization: 'CHINA' as const,
      emperorCardId: starterEmperor.id,
      mainCardIds: [...makeLegalMainDeck().slice(0, 25), 'missing_card'],
    };

    const result = validateDeckDefinition(deck, cardCatalog, emperorData);
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: 'UNKNOWN_CARD',
        cardId: 'missing_card',
      }),
    );
  });

  it('rejects cards that exceed their copy limit', () => {
    const legalMainDeck = makeLegalMainDeck();
    const deck = {
      id: 'too-many-copies',
      name: '三连同名',
      civilization: 'CHINA' as const,
      emperorCardId: starterEmperor.id,
      mainCardIds: [...legalMainDeck.slice(0, 25), chinaMinionA.id],
    };

    const result = validateDeckDefinition(deck, cardCatalog, emperorData);
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: 'COPY_LIMIT',
        cardId: chinaMinionA.id,
        limit: 2,
        actual: 3,
      }),
    );
  });

  it('rejects cross-civilization picks with CROSS_CIVILIZATION', () => {
    const deck = {
      id: 'bad-civ',
      name: '跨文明',
      civilization: 'CHINA' as const,
      emperorCardId: starterEmperor.id,
      mainCardIds: [...makeLegalMainDeck().slice(0, 25), japanMinion.id],
    };

    const result = validateDeckDefinition(deck, cardCatalog, emperorData);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'CROSS_CIVILIZATION')).toBe(true);
  });

  it('rejects decks whose emperor card does not match the selected emperor', () => {
    const deck = {
      id: 'wrong-emperor',
      name: '错位帝王',
      civilization: 'CHINA' as const,
      emperorCardId: chinaEmperor.id,
      mainCardIds: makeLegalMainDeck(),
    };

    const result = validateDeckDefinition(deck, cardCatalog, emperorData);
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: 'EMPEROR_MISMATCH',
        cardId: chinaEmperor.id,
      }),
    );
  });

  it('rejects decks whose civilization does not match the selected emperor', () => {
    const deck = {
      id: 'wrong-civilization',
      name: '错位文明',
      civilization: 'JAPAN' as const,
      emperorCardId: starterEmperor.id,
      mainCardIds: makeLegalMainDeck(),
    };

    const result = validateDeckDefinition(deck, cardCatalog, emperorData);
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: 'CIVILIZATION_MISMATCH',
      }),
    );
  });

  it('rejects bound cards that are repeated inside mainCardIds', () => {
    const deck = {
      id: 'bound-repeat',
      name: '重复绑定卡',
      civilization: 'CHINA' as const,
      emperorCardId: starterEmperor.id,
      mainCardIds: [boundGeneral.id, ...makeLegalMainDeck().slice(1)],
    };

    const result = validateDeckDefinition(deck, cardCatalog, emperorData);
    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: 'BOUND_CARD_IN_MAIN_DECK',
        cardId: boundGeneral.id,
      }),
    );
  });

  it('rejects too many free generals, sorceries, or emperors', () => {
    const deck = {
      id: 'bad-limits',
      name: '超限',
      civilization: 'CHINA' as const,
      emperorCardId: starterEmperor.id,
      mainCardIds: [
        chinaGeneral.id,
        chinaGeneral.id,
        chinaGeneral.id,
        chinaSorcery.id,
        chinaSorcery.id,
        chinaSorcery.id,
        chinaEmperor.id,
        chinaEmperor.id,
        chinaEmperor.id,
        chinaEmperor.id,
        ...makeLegalMainDeck().slice(0, 16),
      ],
    };

    const result = validateDeckDefinition(deck, cardCatalog, emperorData);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'GENERAL_LIMIT')).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'SORCERY_LIMIT')).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'EMPEROR_LIMIT')).toBe(true);
  });
});