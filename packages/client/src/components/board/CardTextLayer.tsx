import type { Card } from '@king-card/shared';
import { getKeywordText } from '../../utils/cardText.js';
import type { SupportedLocale } from '../../utils/locale.js';
import {
  TEXT_PANEL_BOTTOM_PCT,
  TEXT_PANEL_BOTTOM_PCT_NO_BANNER,
  TEXT_PANEL_INLINE_PCT,
  TEXT_PANEL_TOP_PCT,
  type CardSize,
} from './cardSize.js';

interface SizeStyle {
  namePx: number;
  keywordPx: number;
  descriptionPx: number;
  descriptionLineClamp: number;
}

// Hand and battlefield render at the same physical size, so they share one
// style object reference — keeps the two from drifting silently when tuned.
const HAND_BATTLEFIELD_STYLE: SizeStyle = {
  namePx: 11,
  keywordPx: 9,
  descriptionPx: 9,
  descriptionLineClamp: 2,
};

const SIZE_STYLE: Record<CardSize, SizeStyle> = {
  hand: HAND_BATTLEFIELD_STYLE,
  battlefield: HAND_BATTLEFIELD_STYLE,
  collection: { namePx: 13, keywordPx: 10, descriptionPx: 10, descriptionLineClamp: 3 },
  detail: { namePx: 18, keywordPx: 12, descriptionPx: 13, descriptionLineClamp: 4 },
};

// Cards that show ATK / HP badges (minions and generals) reserve room at the
// bottom for the banner. Spell-like cards reclaim that space for description.
function hasBottomBanner(card: Card): boolean {
  return card.type === 'MINION' || card.type === 'GENERAL';
}

interface CardTextLayerProps {
  card: Card;
  size: CardSize;
  locale: SupportedLocale;
}

export function CardTextLayer({ card, size, locale }: CardTextLayerProps) {
  const style = SIZE_STYLE[size];
  const hasKeywords = card.keywords.length > 0;
  const hasDescription = Boolean(card.description);

  const bottomPct = hasBottomBanner(card) ? TEXT_PANEL_BOTTOM_PCT : TEXT_PANEL_BOTTOM_PCT_NO_BANNER;

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
        bottom: bottomPct,
        left: TEXT_PANEL_INLINE_PCT,
        right: TEXT_PANEL_INLINE_PCT,
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
