/**
 * SVG path for a ribbon of constant width between two columns.
 *
 * Top edge: cubic bezier from (x0, y0) to (x1, y1) with both control points
 * at the horizontal midpoint, giving the classic Sankey S-curve. Then a
 * vertical line down the target edge and the mirrored bezier back.
 */
export function ribbonPath(x0: number, y0: number, x1: number, y1: number, width: number): string {
  const y0b = y0 + width;
  const y1b = y1 + width;
  const mx = x0 + (x1 - x0) * 0.5;
  return (
    `M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1} ` +
    `L${x1},${y1b} C${mx},${y1b} ${mx},${y0b} ${x0},${y0b} Z`
  );
}
