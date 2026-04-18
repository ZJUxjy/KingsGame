export type CardSize = 'hand' | 'battlefield' | 'detail' | 'collection';

// Card artwork SVG viewBox is 120 x 172. The vertical layout is:
//   y=0..ART_END_Y           — illustration / type icon / civ emblem
//   y=ART_END_Y..BANNER_Y    — text panel (HTML overlay)
//   y=BANNER_Y..VIEWBOX.h    — bottom banner with ATK / HP
export const CARD_VIEWBOX = { width: 120, height: 172 } as const;
export const ART_END_Y = 96;
export const BANNER_Y = 148;
export const BANNER_HEIGHT = CARD_VIEWBOX.height - BANNER_Y;

function pct(value: number): string {
  return `${((value / CARD_VIEWBOX.height) * 100).toFixed(2)}%`;
}

export const ART_PADDING_TOP_PCT = pct(ART_END_Y);
export const BANNER_PADDING_BOTTOM_PCT = pct(BANNER_HEIGHT);
