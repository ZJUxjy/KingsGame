import type { Card } from '@king-card/shared';
import { getKeywordText } from '../../utils/cardText.js';
import type { SupportedLocale } from '../../utils/locale.js';
import { ART_PADDING_TOP_PCT, BANNER_PADDING_BOTTOM_PCT, type CardSize } from './cardSize.js';

interface SizeStyle {
  namePx: number;
  keywordPx: number;
  descriptionPx: number;
  descriptionLineClamp: number;
}

const SIZE_STYLE: Record<CardSize, SizeStyle> = {
  hand: { namePx: 11, keywordPx: 9, descriptionPx: 9, descriptionLineClamp: 2 },
  battlefield: { namePx: 11, keywordPx: 9, descriptionPx: 9, descriptionLineClamp: 2 },
  collection: { namePx: 13, keywordPx: 10, descriptionPx: 10, descriptionLineClamp: 3 },
  detail: { namePx: 18, keywordPx: 12, descriptionPx: 13, descriptionLineClamp: 4 },
};

interface CardTextLayerProps {
  card: Card;
  size: CardSize;
  locale: SupportedLocale;
}

export function CardTextLayer({ card, size, locale }: CardTextLayerProps) {
  const style = SIZE_STYLE[size];
  const hasKeywords = card.keywords.length > 0;
  const hasDescription = Boolean(card.description);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-stretch text-white"
      style={{ paddingTop: ART_PADDING_TOP_PCT, paddingBottom: BANNER_PADDING_BOTTOM_PCT, paddingInline: '6%' }}
    >
      <div
        data-testid="card-name"
        className="text-center font-bold leading-tight overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ fontSize: `${style.namePx}px` }}
      >
        {card.name}
      </div>

      {hasKeywords && (
        <div
          data-testid="card-keywords"
          className="mt-0.5 text-center font-bold text-amber-300 leading-tight truncate"
          style={{ fontSize: `${style.keywordPx}px` }}
        >
          {getKeywordText(card.keywords, locale)}
        </div>
      )}

      {hasDescription && (
        <div
          data-testid="card-description-snippet"
          className="mt-1 text-center text-stone-200 leading-snug overflow-hidden break-words"
          style={{
            fontSize: `${style.descriptionPx}px`,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: style.descriptionLineClamp,
            wordBreak: 'normal',
            overflowWrap: 'anywhere',
          }}
        >
          {card.description}
        </div>
      )}
    </div>
  );
}
