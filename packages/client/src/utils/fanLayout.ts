export interface FanCardTransform {
  x: number; // horizontal offset from center (px)
  y: number; // vertical arc offset (px)
  rotation: number; // rotation angle (degrees)
  zIndex: number; // layer order (center = highest)
}

const CARD_WIDTH = 120;

/**
 * Compute fan layout transforms for a hand of cards.
 *
 * Cards are spread across `containerWidth` in an arc shape.
 * Edge cards rotate outward (up to `maxAngle` degrees) and dip downward,
 * while the center card sits at the front with the highest zIndex.
 */
export function computeFanLayout(
  count: number,
  containerWidth: number,
  maxAngle: number = 30,
): FanCardTransform[] {
  if (count <= 0) return [];
  if (count === 1) {
    return [{ x: 0, y: 0, rotation: 0, zIndex: 1 }];
  }

  const results: FanCardTransform[] = [];

  // Available horizontal space: we place the leftmost card at its center
  // at one edge and the rightmost card at its center at the other edge.
  const totalSpread = containerWidth - CARD_WIDTH;

  for (let i = 0; i < count; i++) {
    // Normalised position from -1 (leftmost) to +1 (rightmost)
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;

    // Horizontal offset from container center
    const x = t * (totalSpread / 2);

    // Rotation: linear interpolation from -maxAngle to +maxAngle
    const rotation = t * maxAngle;

    // Y offset: parabolic arc -- edges are lower (negative = upward in CSS),
    // center is highest (most forward). Using t^2 gives a symmetric arc.
    const arcDepth = 30; // max downward dip at the edges (px)
    const y = t * t * arcDepth - arcDepth; // range: [-arcDepth, 0]

    // zIndex: center cards are on top
    const zIndex = count - Math.abs(i - Math.floor((count - 1) / 2));

    results.push({ x, y, rotation, zIndex });
  }

  return results;
}
