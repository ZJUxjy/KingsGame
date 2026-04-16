export interface FanCardTransform {
  x: number; // horizontal offset from center (px)
  y: number; // vertical arc offset (px)
  rotation: number; // rotation angle (degrees)
  zIndex: number; // layer order (center = highest)
}

const CARD_WIDTH = 90;

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
  maxAngle: number = 22,
): FanCardTransform[] {
  if (count <= 0) return [];
  if (count === 1) {
    return [{ x: 0, y: 0, rotation: 0, zIndex: 1 }];
  }

  const results: FanCardTransform[] = [];
  const compactSpacing = count <= 3 ? 74 : count <= 5 ? 82 : count <= 7 ? 88 : 92;
  const desiredSpread = Math.max(compactSpacing * (count - 1), CARD_WIDTH * 0.8);
  const maxSpread = Math.max(CARD_WIDTH, Math.min(containerWidth - CARD_WIDTH * 0.65, desiredSpread));
  const totalSpread = maxSpread;
  const arcDepth = Math.min(30, 12 + count * 2.6);
  const dynamicAngle = Math.min(maxAngle, 10 + count * 1.9);

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
    const x = t * (totalSpread / 2);
    const rotation = t * dynamicAngle;
    const y = t * t * arcDepth - arcDepth;
    const zIndex = count - Math.abs(i - Math.floor((count - 1) / 2));

    results.push({ x, y, rotation, zIndex });
  }

  return results;
}
