import { useGameStore } from '../../stores/gameStore.js';

export default function Toast() {
  const error = useGameStore(s => s.error);

  if (!error) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 text-white px-6 py-3 rounded-lg shadow-lg border border-red-700 animate-slide-up">
      <span className="text-sm">{error}</span>
    </div>
  );
}
