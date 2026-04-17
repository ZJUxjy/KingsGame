import { useDeckStore } from '../../stores/deckStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useLocaleStore } from '../../stores/localeStore.js';
import { resolveDeckBuilderEmperorCardId } from '../deck/deck-builder-utils.js';

export default function Lobby() {
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const connect = useGameStore((s) => s.connect);
  const locale = useLocaleStore((state) => state.locale);

  const title = locale === 'en-US' ? 'King Card' : '帝王牌';
  const pveLabel = locale === 'en-US' ? 'Solo Mode' : '单人模式';
  const pvpLabel = locale === 'en-US' ? 'Two-Player Mode' : '双人模式';
  const collectionLabel = locale === 'en-US' ? 'Card Collection' : '卡牌收藏';
  const deckBuilderLabel = locale === 'en-US' ? 'Deck Builder' : '套牌构筑';

  const handlePvE = () => {
    connect('http://localhost:3001');
    useGameStore.getState()._setGameMode('pve');
    setUiPhase('hero-select');
  };

  const handlePvP = () => {
    connect('http://localhost:3001');
    useGameStore.getState()._setGameMode('pvp');
    setUiPhase('hero-select');
  };

  const handleCollection = () => {
    setUiPhase('collection');
  };

  const handleDeckBuilder = () => {
    const { decksByEmperorId, editingEmperorCardId, setEditingEmperorCardId } = useDeckStore.getState();
    const nextEditingEmperorCardId = resolveDeckBuilderEmperorCardId(
      editingEmperorCardId,
      decksByEmperorId,
    );

    if (nextEditingEmperorCardId) {
      setEditingEmperorCardId(nextEditingEmperorCardId);
    }

    setUiPhase('deck-builder');
  };

  return (
    <div
      className="h-screen flex flex-col items-center justify-center bg-board-gradient"
    >
      <h1 className="text-7xl font-bold text-yellow-400 mb-16">{title}</h1>

      <div className="flex flex-wrap items-center justify-center gap-8">
        {/* PvE Mode Card */}
        <button
          onClick={handlePvE}
          className="group w-72 h-48 rounded-2xl bg-gray-800 border-2 border-yellow-600
                     flex flex-col items-center justify-center gap-4
                     hover:bg-gray-700 hover:border-yellow-400 hover:scale-105
                     transition-all duration-200 cursor-pointer"
        >
          <span className="text-3xl">⚔️</span>
          <span className="text-2xl font-bold text-yellow-400">
            {pveLabel}
          </span>
          <span className="text-sm text-gray-400">PvE</span>
        </button>

        {/* PvP Mode Card */}
        <button
          onClick={handlePvP}
          className="group w-72 h-48 rounded-2xl bg-gray-800 border-2 border-blue-600
                     flex flex-col items-center justify-center gap-4
                     hover:bg-gray-700 hover:border-blue-400 hover:scale-105
                     transition-all duration-200 cursor-pointer"
        >
          <span className="text-3xl">🤝</span>
          <span className="text-2xl font-bold text-blue-400">
            {pvpLabel}
          </span>
          <span className="text-sm text-gray-400">PvP</span>
        </button>

        <button
          onClick={handleCollection}
          className="group w-72 h-48 rounded-2xl bg-gray-800 border-2 border-amber-600
                     flex flex-col items-center justify-center gap-4
                     hover:bg-gray-700 hover:border-amber-400 hover:scale-105
                     transition-all duration-200 cursor-pointer"
        >
          <span className="text-3xl">📚</span>
          <span className="text-2xl font-bold text-amber-300">
            {collectionLabel}
          </span>
          <span className="text-sm text-gray-400">Collection</span>
        </button>

        <button
          onClick={handleDeckBuilder}
          className="group w-72 h-48 rounded-2xl bg-gray-800 border-2 border-emerald-600
                     flex flex-col items-center justify-center gap-4
                     hover:bg-gray-700 hover:border-emerald-400 hover:scale-105
                     transition-all duration-200 cursor-pointer"
        >
          <span className="text-3xl">🧩</span>
          <span className="text-2xl font-bold text-emerald-300">
            {deckBuilderLabel}
          </span>
          <span className="text-sm text-gray-400">Deck</span>
        </button>
      </div>
    </div>
  );
}
