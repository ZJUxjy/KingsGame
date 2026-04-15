interface GameOverlayProps {
  text: string;
  visible: boolean;
}

export default function GameOverlay({ text, visible }: GameOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in-out pointer-events-none">
      <span className="text-6xl font-bold text-yellow-400 drop-shadow-lg">{text}</span>
    </div>
  );
}
