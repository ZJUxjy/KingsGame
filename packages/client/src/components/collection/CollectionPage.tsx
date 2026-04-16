import { useMemo, useState } from 'react';
import { CIVILIZATION_META, type Civilization } from '@king-card/shared';
import { useGameStore } from '../../stores/gameStore.js';
import { useLocaleStore } from '../../stores/localeStore.js';
import { CollectionGrid } from './CollectionGrid.js';
import { CollectionSidebar } from './CollectionSidebar.js';
import { CollectionToolbar } from './CollectionToolbar.js';
import {
  getCollectionCards,
  getCopyLimit,
  getEmperorsForCivilization,
  type CollectionCardTypeFilter,
} from './collection-utils.js';

export default function CollectionPage() {
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const locale = useLocaleStore((state) => state.locale);
  const [civilization, setCivilization] = useState<Civilization>('CHINA');
  const [selectedType, setSelectedType] = useState<CollectionCardTypeFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selectedEmperorId, setSelectedEmperorId] = useState<string | null>(null);
  const [showBoundOnly, setShowBoundOnly] = useState(false);

  const emperors = useMemo(() => getEmperorsForCivilization(civilization), [civilization]);

  const baseCards = useMemo(
    () => getCollectionCards({
      civilization,
      type: 'ALL',
      search: '',
      emperorId: null,
      showBoundOnly: false,
    }, locale),
    [civilization, locale],
  );

  const cards = useMemo(
    () => getCollectionCards({
      civilization,
      type: selectedType,
      search,
      emperorId: selectedEmperorId,
      showBoundOnly,
    }, locale),
    [civilization, locale, search, selectedEmperorId, selectedType, showBoundOnly],
  );

  const collectionLabel = locale === 'en-US' ? 'COLLECTION' : '收藏';
  const title = locale === 'en-US'
    ? `${CIVILIZATION_META[civilization].name} Card Collection`
    : `${CIVILIZATION_META[civilization].name} 卡牌收藏`;
  const description = locale === 'en-US'
    ? 'A Hearthstone-like wood-and-parchment collection layout adapted to emperors, bound cards, and civilization pools.'
    : '参考炉石收藏页的木框与羊皮纸结构，但语义适配帝王、绑定卡与文明卡池。';

  const totalCards = baseCards.length;

  const highlightedIds = useMemo(() => {
    if (!selectedEmperorId) {
      return new Set<string>();
    }

    const emperor = emperors.find((item) => item.emperorCard.id === selectedEmperorId);
    if (!emperor) {
      return new Set<string>();
    }

    return new Set([
      ...emperor.boundGenerals.map((card) => card.id),
      ...emperor.boundSorceries.map((card) => card.id),
    ]);
  }, [emperors, selectedEmperorId]);

  const handleCivilizationChange = (nextCivilization: Civilization) => {
    setCivilization(nextCivilization);
    setSelectedType('ALL');
    setSearch('');
    setSelectedEmperorId(null);
    setShowBoundOnly(false);
  };

  const handleSelectEmperor = (emperorId: string) => {
    setSelectedEmperorId((current) => (current === emperorId ? null : emperorId));
    setShowBoundOnly(false);
  };

  return (
    <div className="min-h-screen bg-collection-shell px-8 py-8 text-stone-900">
      <div className="mx-auto flex max-w-[1680px] gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-5 rounded-[30px] border border-amber-100/20 bg-black/15 px-6 py-5 text-stone-100">
            <div className="text-sm tracking-[0.35em] text-amber-100/70">{collectionLabel}</div>
            <div className="mt-2 text-4xl font-black text-amber-50">{title}</div>
            <div className="mt-2 text-base text-amber-50/75">{description}</div>
          </div>

          <CollectionToolbar
            civilization={civilization}
            selectedType={selectedType}
            search={search}
            canToggleBoundOnly={selectedEmperorId !== null}
            showBoundOnly={showBoundOnly}
            onCivilizationChange={handleCivilizationChange}
            onTypeChange={setSelectedType}
            onSearchChange={setSearch}
            onToggleBoundOnly={() => setShowBoundOnly((value) => !value)}
          />

          <div className="mt-6">
            <CollectionGrid
              cards={cards}
              highlightedIds={highlightedIds}
              getCopyLimit={getCopyLimit}
            />
          </div>
        </div>

        <CollectionSidebar
          civilization={civilization}
          emperors={emperors}
          selectedEmperorId={selectedEmperorId}
          visibleCount={cards.length}
          totalCount={totalCards}
          onSelectEmperor={handleSelectEmperor}
          onBack={() => setUiPhase('lobby')}
        />
      </div>
    </div>
  );
}