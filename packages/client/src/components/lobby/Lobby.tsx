import { useGameStore } from '../../stores/gameStore.js';

export default function Lobby() {
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const connect = useGameStore((s) => s.connect);

  const handlePvE = () => {
    connect('http://localhost:3001');
    setUiPhase('hero-select');
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col items-center justify-center">
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

        {/* PvP Mode Card (disabled) */}
        <button
          disabled
          title="即将开放"
          className="w-72 h-48 rounded-2xl bg-gray-800 border-2 border-gray-600
                     flex flex-col items-center justify-center gap-4
                     opacity-50 cursor-not-allowed"
        >
          <span className="text-3xl">🤝</span>
          <span className="text-2xl font-bold text-gray-400">
            双人模式
          </span>
          <span className="text-sm text-gray-500">即将开放</span>
        </button>
      </div>
    </div>
  );
}
