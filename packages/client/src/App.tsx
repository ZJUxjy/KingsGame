import { useGameStore } from './stores/gameStore.js';
import { useGameSocket } from './hooks/useGameSocket.js';
import Lobby from './components/lobby/Lobby.js';
import HeroSelect from './components/lobby/HeroSelect.js';
import GameBoard from './components/board/GameBoard.js';

export default function App() {
  const uiPhase = useGameStore((s) => s.uiPhase);

  useGameSocket();

  switch (uiPhase) {
    case 'lobby':
      return <Lobby />;
    case 'hero-select':
      return <HeroSelect />;
    case 'playing':
      return <GameBoard />;
    case 'game-over':
      return <div className="h-screen bg-gray-900 flex items-center justify-center text-white text-2xl">游戏结束</div>;
  }
}
