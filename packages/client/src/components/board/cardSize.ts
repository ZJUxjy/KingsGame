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

// Used as CSS `top` / `bottom` (NOT padding-top/bottom) on the absolutely
// positioned HTML text overlay so percentages resolve against the card height
// and stay aligned with the SVG layout regardless of card aspect ratio.
export const TEXT_PANEL_TOP_PCT = pct(ART_END_Y);
export const TEXT_PANEL_BOTTOM_PCT = pct(BANNER_HEIGHT);

// When the card has no ATK/HP banner (non-minion / non-general cards), the
// text panel can extend almost to the card bottom — only a small edge gap
// is left so the description does not collide with the rounded card border.
export const TEXT_PANEL_BOTTOM_PCT_NO_BANNER = '3%';

// Horizontal safe area for the text overlay (CSS percentages on left/right
// resolve against the parent's WIDTH, so this stays simple and aspect-ratio
// agnostic).
export const TEXT_PANEL_INLINE_PCT = '6%';
