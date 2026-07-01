import { sampleBoundarySegments } from "../geometry.js";
import type { Point, PuzzlePieceLayout } from "../types.js";
import type { Bounds, HitTestOptions, PieceHitArea } from "./types.js";

/**
 * Creates a cached hit area for a piece.
 *
 * @param piece - Piece layout.
 * @param options - Hit-test options.
 * @returns Piece hit area.
 */
export function createPieceHitArea(
  piece: PuzzlePieceLayout,
  options: HitTestOptions = {}
): PieceHitArea {
  const polygon = sampleBoundarySegments(piece.outline, options.segmentsPerCurve);
  const bounds = getPolygonBounds(polygon);

  return {
    bounds,
    piece,
    polygon,
    contains(point) {
      return boundsContainPoint(bounds, point) && pointInPolygon(point, polygon);
    },
  };
}

/**
 * Tests whether a local point is inside a piece outline.
 *
 * @param piece - Piece layout.
 * @param point - Local point in piece-container coordinates.
 * @param options - Hit-test options.
 * @returns True when the point is inside the piece outline.
 */
export function hitTestPiece(
  piece: PuzzlePieceLayout,
  point: Point,
  options: HitTestOptions = {}
): boolean {
  return createPieceHitArea(piece, options).contains(point);
}

export function getPolygonBounds(polygon: Point[]): Bounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of polygon) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function boundsContainPoint(bounds: Bounds, point: Point): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (isPointOnPolygonBoundary(point, polygon)) {
    return true;
  }

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

function isPointOnPolygonBoundary(point: Point, polygon: Point[]): boolean {
  for (
    let index = 0, previousIndex = polygon.length - 1;
    index < polygon.length;
    previousIndex = index, index += 1
  ) {
    if (isPointOnSegment(point, polygon[previousIndex], polygon[index])) {
      return true;
    }
  }

  return false;
}

function isPointOnSegment(point: Point, start: Point, end: Point): boolean {
  const cross =
    (point.y - start.y) * (end.x - start.x) -
    (point.x - start.x) * (end.y - start.y);

  if (Math.abs(cross) > 1e-7) {
    return false;
  }

  return (
    point.x >= Math.min(start.x, end.x) &&
    point.x <= Math.max(start.x, end.x) &&
    point.y >= Math.min(start.y, end.y) &&
    point.y <= Math.max(start.y, end.y)
  );
}
