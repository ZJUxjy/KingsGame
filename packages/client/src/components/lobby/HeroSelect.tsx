import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore.js';

const EMPERORS = [
  { name: '秦始皇', description: '统一六国，千秋霸业', cost: 4 },
  { name: '汉武帝', description: '开疆拓土，威震四方', cost: 6 },
  { name: '唐太宗', description: '贞观之治，万国来朝', cost: 8 },
];

export default function HeroSelect() {
  const joinGame = useGameStore((s) => s.joinGame);
  const joinPvp = useGameStore((s) => s.joinPvp);
  const gameMode = useGameStore((s) => s.gameMode);
  const connected = useGameStore((s) => s.connected);
  const error = useGameStore((s) => s.error);
  const [selected, setSelected] = useState<number | null>(null);

  const handleStart = () => {
    if (selected !== null) {
      if (gameMode === 'pvp') {
        joinPvp(selected);
      } else {
        joinGame(selected);
      }
    }
  };

  return (
    <div
      className="h-screen flex flex-col items-center justify-center bg-board-gradient"
    >
      <h2 className="text-4xl font-bold text-yellow-400 mb-12">选择帝王</h2>

      <div className="flex gap-6 mb-12">
        {EMPERORS.map((emperor, index) => (
          <button
            key={emperor.name}
            onClick={() => setSelected(index)}
            className={`w-64 h-80 rounded-2xl bg-gray-800 border-2 flex flex-col
                        items-center justify-center gap-4 p-6 transition-all duration-200
                        ${
                          selected === index
                            ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-400/20'
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
          >
            <span className="text-5xl font-bold text-yellow-400">
              {emperor.name}
            </span>
            <span className="text-gray-300 text-center">{emperor.description}</span>
            <span className="text-sm text-gray-500">费用: {emperor.cost}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-6 py-2 rounded-lg bg-red-900/80 text-red-200 text-sm">
          {error}
        </div>
      )}

      {!connected && !error && (
        <div className="mb-4 px-6 py-2 rounded-lg bg-yellow-900/80 text-yellow-200 text-sm animate-pulse">
          正在连接服务器...
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={selected === null || !connected}
        className={`px-12 py-4 rounded-xl text-xl font-bold transition-all duration-200
                    ${
                      selected !== null && connected
                        ? 'bg-yellow-600 text-white hover:bg-yellow-500 cursor-pointer'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
      >
        {gameMode === 'pvp' ? '匹配对手' : '开始对战'}
      </button>
    </div>
  );
}
