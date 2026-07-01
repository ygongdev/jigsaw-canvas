import { createPieceHitArea, getPolygonBounds } from "./hit-test.js";
import type { Point, PuzzlePieceLayout } from "../types.js";
import type {
  Bounds,
  PiecePosition,
  PlacedPiece,
  PlacementOptions,
} from "./types.js";

/**
 * Returns whether a piece can be placed without crossing the board or pieces.
 *
 * @param candidate - Candidate placed piece.
 * @param options - Placement options.
 * @returns True when placement is valid.
 */
export function canPlacePiece(
  candidate: PlacedPiece,
  { board, ignorePieceIndexes = [], placedPieces }: PlacementOptions
): boolean {
  const candidatePolygon = getPlacedPolygon(candidate.piece, candidate.position);
  const candidateBounds = getPolygonBounds(candidatePolygon);

  if (!boundsContainBounds(board, candidateBounds)) {
    return false;
  }

  for (const placedPiece of placedPieces) {
    if (placedPiece.piece.index === candidate.piece.index) {
      continue;
    }

    if (ignorePieceIndexes.includes(placedPiece.piece.index)) {
      continue;
    }

    const placedPolygon = getPlacedPolygon(
      placedPiece.piece,
      placedPiece.position
    );
    const placedBounds = getPolygonBounds(placedPolygon);

    if (
      boundsOverlap(candidateBounds, placedBounds) &&
      polygonsOverlap(candidatePolygon, placedPolygon)
    ) {
      return false;
    }
  }

  return true;
}

export function getPlacedPolygon(
  piece: PuzzlePieceLayout,
  position: PiecePosition
): Point[] {
  return createPieceHitArea(piece).polygon.map((point) => ({
    x: point.x + position.x,
    y: point.y + position.y,
  }));
}

export function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function boundsContainBounds(container: Bounds, candidate: Bounds): boolean {
  return (
    candidate.x >= container.x &&
    candidate.y >= container.y &&
    candidate.x + candidate.width <= container.x + container.width &&
    candidate.y + candidate.height <= container.y + container.height
  );
}

function polygonsOverlap(a: Point[], b: Point[]): boolean {
  if (hasProperSegmentIntersection(a, b)) {
    return true;
  }

  return pointInPolygonStrict(a[0], b) || pointInPolygonStrict(b[0], a);
}

function hasProperSegmentIntersection(a: Point[], b: Point[]): boolean {
  for (let aIndex = 0; aIndex < a.length; aIndex += 1) {
    const aStart = a[aIndex];
    const aEnd = a[(aIndex + 1) % a.length];

    for (let bIndex = 0; bIndex < b.length; bIndex += 1) {
      const bStart = b[bIndex];
      const bEnd = b[(bIndex + 1) % b.length];

      if (segmentsProperlyIntersect(aStart, aEnd, bStart, bEnd)) {
        return true;
      }
    }
  }

  return false;
}

function segmentsProperlyIntersect(
  aStart: Point,
  aEnd: Point,
  bStart: Point,
  bEnd: Point
): boolean {
  const ab1 = orientation(aStart, aEnd, bStart);
  const ab2 = orientation(aStart, aEnd, bEnd);
  const ba1 = orientation(bStart, bEnd, aStart);
  const ba2 = orientation(bStart, bEnd, aEnd);

  return ab1 * ab2 < 0 && ba1 * ba2 < 0;
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointInPolygonStrict(point: Point, polygon: Point[]): boolean {
  let inside = false;

  for (
    let index = 0, previousIndex = polygon.length - 1;
    index < polygon.length;
    previousIndex = index, index += 1
  ) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}
