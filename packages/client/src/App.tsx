import { useEffect } from 'react';
import { useGameStore } from './stores/gameStore.js';
import { useGameSocket } from './hooks/useGameSocket.js';
import Lobby from './components/lobby/Lobby.js';
import HeroSelect from './components/lobby/HeroSelect.js';
import PvpWaiting from './components/lobby/PvpWaiting.js';
import GameBoard from './components/board/GameBoard.js';
import { ErrorBoundary } from './components/board/ErrorBoundary.js';
import CollectionPage from './components/collection/CollectionPage.js';
import DeckBuilderPage from './components/deck/DeckBuilderPage.js';
import { LocaleSwitcher } from './components/shared/LocaleSwitcher.js';
import { useLocaleStore } from './stores/localeStore.js';

function GameOverScreen() {
  const gameState = useGameStore(s => s.gameState);
  const playerIndex = useGameStore(s => s.playerIndex);
  const restartGame = useGameStore(s => s.restartGame);
  const backToMainMenu = useGameStore(s => s.backToMainMenu);
  const locale = useLocaleStore((state) => state.locale);

  const won = gameState?.winnerIndex === playerIndex;
  const title = won
    ? locale === 'en-US' ? 'Victory!' : '胜利!'
    : locale === 'en-US' ? 'Defeat!' : '失败!';
  const reason = gameState?.winReason === 'HERO_KILLED'
    ? locale === 'en-US' ? 'Hero defeated' : '英雄被击杀'
    : locale === 'en-US' ? 'Deck exhausted' : '牌库耗尽';
  const playAgainLabel = locale === 'en-US' ? 'Play Again' : '再来一局';
  const backLabel = locale === 'en-US' ? 'Back To Main Menu' : '返回主菜单';

  return (
    <div
      className="h-screen flex flex-col items-center justify-center bg-board-gradient"
    >
      <h1 className={`text-7xl font-bold mb-8 ${won ? 'text-yellow-400' : 'text-red-400'}`}>
        {title}
      </h1>
      <p className="text-gray-400 text-lg mb-12">
        {reason}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => { restartGame(); }}
          className="px-8 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-lg cursor-pointer transition-colors"
        >
          {playAgainLabel}
        </button>
        <button
          onClick={() => { backToMainMenu(); }}
          className="px-8 py-3 rounded-lg border border-gray-500 bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold text-lg cursor-pointer transition-colors"
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const uiPhase = useGameStore((s) => s.uiPhase);
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === 'en-US' ? 'King Card' : '帝王牌 - King Card';
  }, [locale]);

  useGameSocket();

  const screen = (() => {
    switch (uiPhase) {
      case 'lobby':
        return <Lobby />;
      case 'hero-select':
        return <HeroSelect />;
      case 'pvp-waiting':
        return <PvpWaiting />;
      case 'playing':
        return <ErrorBoundary><GameBoard /></ErrorBoundary>;
      case 'game-over':
        return <GameOverScreen />;
      case 'collection':
        return <CollectionPage />;
      case 'deck-builder':
        return <DeckBuilderPage />;
    }
  })();

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-4 z-50">
        <div className="pointer-events-auto">
          <LocaleSwitcher />
        </div>
      </div>
      {screen}
    </>
  );
}
