import type { Card } from '@king-card/shared';
import { CollectionCardTile } from './CollectionCardTile.js';

interface CollectionGridProps {
  cards: Card[];
  highlightedIds: Set<string>;
  getCopyLimit: (card: Card) => 1 | 2;
}

export function CollectionGrid({ cards, highlightedIds, getCopyLimit }: CollectionGridProps) {
  return (
    <div className="collection-paper rounded-[34px] border border-[#d9c9a2] p-6 shadow-[inset_0_0_40px_rgba(120,75,26,0.12),0_30px_60px_rgba(0,0,0,0.18)]">
      <div className="grid grid-cols-4 gap-x-6 gap-y-10">
        {cards.map((card) => (
          <CollectionCardTile
            key={card.id}
            card={card}
            copyLimit={getCopyLimit(card)}
            highlighted={highlightedIds.has(card.id)}
          />
        ))}
      </div>
    </div>
  );
}