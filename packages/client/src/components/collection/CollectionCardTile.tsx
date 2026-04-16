import type { Card } from '@king-card/shared';
import { CardComponent } from '../board/CardComponent.js';

interface CollectionCardTileProps {
  card: Card;
  copyLimit: 1 | 2;
  highlighted?: boolean;
}

export function CollectionCardTile({ card, copyLimit, highlighted }: CollectionCardTileProps) {
  return (
    <div className="relative flex flex-col items-center">
      <div className={`rounded-[22px] p-1 transition ${highlighted ? 'bg-yellow-300/40 shadow-[0_0_24px_rgba(250,204,21,0.4)]' : ''}`}>
        <CardComponent card={card} size="collection" />
      </div>
      <div className="mt-2 rounded-full bg-amber-900/75 px-4 py-1 text-sm font-semibold tracking-[0.3em] text-amber-50">
        x{copyLimit}
      </div>
    </div>
  );
}