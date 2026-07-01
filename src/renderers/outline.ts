import { sampleBoundarySegments } from "../core/geometry.js";
import type { Point, PuzzlePieceLayout } from "../core/types.js";

/**
 * Creates sampled outline points for one jigsaw piece.
 *
 * @param piece - Piece layout.
 * @param segmentsPerCurve - Sample count for each Bezier curve.
 * @returns Clockwise-ish outline points.
 */
export function createPieceOutlinePoints(
  piece: PuzzlePieceLayout,
  segmentsPerCurve = 8
): Point[] {
  return sampleBoundarySegments(piece.outline, segmentsPerCurve);
}
