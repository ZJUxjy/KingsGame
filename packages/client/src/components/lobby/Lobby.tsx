import { useGameStore } from '../../stores/gameStore.js';

export default function Lobby() {
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const connect = useGameStore((s) => s.connect);

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

  return (
    <div
      className="h-screen flex flex-col items-center justify-center bg-board-gradient"
    >
      <h1 className="text-7xl font-bold text-yellow-400 mb-16">帝王牌</h1>

      <div className="flex gap-8">
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
            单人模式
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
            双人模式
          </span>
          <span className="text-sm text-gray-400">PvP</span>
        </button>
      </div>
    </div>
  );
}
