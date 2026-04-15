interface EnergyBarProps {
  current: number;
  max: number;
}

export function EnergyBar({ current, max }: EnergyBarProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-5 h-5 ${i < current ? 'text-blue-400' : 'text-gray-600'} transition-colors duration-200`}
        >
          &#x25C6;
        </div>
      ))}
      <span className="text-xs text-blue-300 ml-1">
        {current}/{max}
      </span>
    </div>
  );
}
