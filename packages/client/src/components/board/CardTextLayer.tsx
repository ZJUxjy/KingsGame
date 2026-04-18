import type { Card } from '@king-card/shared';
import { getKeywordText } from '../../utils/cardText.js';
import type { SupportedLocale } from '../../utils/locale.js';
import { TEXT_PANEL_BOTTOM_PCT, TEXT_PANEL_TOP_PCT, type CardSize } from './cardSize.js';

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
      className="pointer-events-none absolute flex flex-col items-stretch text-white"
      style={{
        // CSS percentages on top/bottom are resolved against the parent's HEIGHT,
        // unlike padding-top/bottom which resolve against WIDTH. Because the card
        // aspect ratio is 120:172 (≠ 1:1), the latter shifts the text band ~30%
        // upward and overlaps the SVG art region. top/bottom keep us aligned with
        // the SVG layout contract (art ends at y=ART_END_Y, banner at y=BANNER_Y).
        top: TEXT_PANEL_TOP_PCT,
        bottom: TEXT_PANEL_BOTTOM_PCT,
        left: '6%',
        right: '6%',
      }}
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
