import type { BoundarySegment, RenderedPuzzlePiece } from "../../core/types.js";

/**
 * Creates one reusable jigsaw piece path.
 *
 * @param piece - Piece to create a path for.
 * @returns A reusable Path2D piece outline.
 */
export function createPiecePath(piece: RenderedPuzzlePiece): Path2D {
  const path = new Path2D();

  for (const [index, segment] of piece.outline.entries()) {
    if (index === 0) {
      path.moveTo(segment.start.x, segment.start.y);
    }

    appendSegment(path, segment);
  }

  path.closePath();

  return path;
}

function appendSegment(path: Path2D, segment: BoundarySegment): void {
  if (segment.kind === "line") {
    path.lineTo(segment.end.x, segment.end.y);
    return;
  }

  path.bezierCurveTo(
    segment.cp1.x,
    segment.cp1.y,
    segment.cp2.x,
    segment.cp2.y,
    segment.end.x,
    segment.end.y
  );
}
