import type { BoundarySegment, Point } from "../types.js";

/**
 * Samples boundary segments into polygon points.
 *
 * @param outline - Boundary segments.
 * @param segmentsPerCurve - Sample count for each Bezier curve.
 * @returns Sampled outline points.
 */
export function sampleBoundarySegments(
  outline: BoundarySegment[],
  segmentsPerCurve = 8
): Point[] {
  const points: Point[] = [];

  for (const [index, segment] of outline.entries()) {
    if (index === 0) {
      points.push(segment.start);
    }

    appendSegmentPoints(points, segment, segmentsPerCurve);
  }

  removeRepeatedClosingPoint(points);

  return points;
}

function appendSegmentPoints(
  points: Point[],
  segment: BoundarySegment,
  segmentsPerCurve: number
): void {
  if (segment.kind === "line") {
    points.push(segment.end);
    return;
  }

  for (let index = 1; index <= segmentsPerCurve; index += 1) {
    points.push(
      sampleBezier(
        segment.start,
        segment.cp1,
        segment.cp2,
        segment.end,
        index / segmentsPerCurve
      )
    );
  }
}

/**
 * Samples one cubic Bezier curve.
 *
 * @param start - Curve start.
 * @param control1 - First control point.
 * @param control2 - Second control point.
 * @param end - Curve end.
 * @param t - Sample position.
 * @returns Sampled point.
 */
function sampleBezier(
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  t: number
): Point {
  const inverseT = 1 - t;
  const startWeight = inverseT ** 3;
  const control1Weight = 3 * inverseT ** 2 * t;
  const control2Weight = 3 * inverseT * t ** 2;
  const endWeight = t ** 3;

  return {
    x:
      startWeight * start.x +
      control1Weight * control1.x +
      control2Weight * control2.x +
      endWeight * end.x,
    y:
      startWeight * start.y +
      control1Weight * control1.y +
      control2Weight * control2.y +
      endWeight * end.y,
  };
}

/**
 * Removes the final point when it duplicates the starting point.
 *
 * @param points - Outline points.
 * @returns Nothing.
 */
function removeRepeatedClosingPoint(points: Point[]): void {
  const first = points[0];
  const last = points[points.length - 1];

  if (first && last && first.x === last.x && first.y === last.y) {
    points.pop();
  }
}
