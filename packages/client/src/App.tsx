import { useGameStore } from './stores/gameStore.js';
import { useGameSocket } from './hooks/useGameSocket.js';
import Lobby from './components/lobby/Lobby.js';
import HeroSelect from './components/lobby/HeroSelect.js';
import PvpWaiting from './components/lobby/PvpWaiting.js';
import GameBoard from './components/board/GameBoard.js';

function GameOverScreen() {
  const gameState = useGameStore(s => s.gameState);
  const playerIndex = useGameStore(s => s.playerIndex);
  const _reset = useGameStore(s => s._reset);

  const won = gameState?.winnerIndex === playerIndex;

  return (
    <div
      className="h-screen flex flex-col items-center justify-center bg-board-gradient"
    >
      <h1 className={`text-7xl font-bold mb-8 ${won ? 'text-yellow-400' : 'text-red-400'}`}>
        {won ? '胜利!' : '失败!'}
      </h1>
      <p className="text-gray-400 text-lg mb-12">
        {gameState?.winReason === 'HERO_KILLED' ? '英雄被击杀' : '牌库耗尽'}
      </p>
      <button
        onClick={() => { _reset(); }}
        className="px-8 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-lg cursor-pointer transition-colors"
      >
        再来一局
      </button>
    </div>
  );
}

export default function App() {
  const uiPhase = useGameStore((s) => s.uiPhase);

  useGameSocket();

  switch (uiPhase) {
    case 'lobby':
      return <Lobby />;
    case 'hero-select':
      return <HeroSelect />;
    case 'pvp-waiting':
      return <PvpWaiting />;
    case 'playing':
      return <GameBoard />;
    case 'game-over':
      return <GameOverScreen />;
  }
}
