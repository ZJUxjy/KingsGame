import { useGameStore } from '../../stores/gameStore.js';
import { socketService } from '../../services/socketService.js';

export default function PvpWaiting() {
  const _reset = useGameStore((s) => s._reset);

  const handleCancel = () => {
    try {
      socketService.getSocket().emit('game:pvpCancel');
    } catch {
      // Socket may already be disconnected
    }
    _reset();
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-board-gradient">
      <h2 className="text-4xl font-bold text-blue-400 mb-8">等待对手加入…</h2>

      <div className="flex gap-2 mb-12">
        <span className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>

      <button
        onClick={handleCancel}
        className="px-8 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold text-lg cursor-pointer transition-colors"
      >
        返回主菜单
      </button>
    </div>
  );
}
