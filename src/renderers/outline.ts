import { JIGSAW_SHAPE, type PuzzlePieceLayout } from "../core/types.js";
import { createScalarCurves, makeBeziers, type BezierCurve } from "./curves.js";

export interface Point {
  x: number;
  y: number;
}

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
  const points: Point[] = [];
  let x = piece.margins.left;
  let y = piece.margins.top;

  points.push({ x, y });

  if (piece.shape.TOP === JIGSAW_SHAPE.STRAIGHT) {
    points.push({ x: x + piece.width, y });
  } else {
    appendHorizontalCurves(
      points,
      x,
      y,
      piece.shape.TOP,
      piece.width,
      1,
      1,
      segmentsPerCurve
    );
  }

  x += piece.width;

  if (piece.shape.RIGHT === JIGSAW_SHAPE.STRAIGHT) {
    points.push({ x, y: y + piece.height });
  } else {
    appendVerticalCurves(
      points,
      x,
      y,
      piece.shape.RIGHT,
      piece.height,
      1,
      -1,
      segmentsPerCurve
    );
  }

  y += piece.height;

  if (piece.shape.BOTTOM === JIGSAW_SHAPE.STRAIGHT) {
    points.push({ x: x - piece.width, y });
  } else {
    appendHorizontalCurves(
      points,
      x,
      y,
      piece.shape.BOTTOM,
      piece.width,
      -1,
      1,
      segmentsPerCurve
    );
  }

  x -= piece.width;

  if (piece.shape.LEFT === JIGSAW_SHAPE.STRAIGHT) {
    points.push({ x, y: y - piece.height });
  } else {
    appendVerticalCurves(
      points,
      x,
      y,
      piece.shape.LEFT,
      piece.height,
      -1,
      -1,
      segmentsPerCurve
    );
  }

  removeRepeatedClosingPoint(points);

  return points;
}

/**
 * Adds sampled horizontal edge curves.
 *
 * @param points - Outline points.
 * @param x - Edge origin x.
 * @param y - Edge origin y.
 * @param edge - Edge shape.
 * @param width - Edge width.
 * @param xDirection - Horizontal direction.
 * @param yDirection - Vertical curve direction.
 * @param segmentsPerCurve - Sample count for each Bezier curve.
 * @returns Nothing.
 */
function appendHorizontalCurves(
  points: Point[],
  x: number,
  y: number,
  edge: PuzzlePieceLayout["shape"]["TOP"],
  width: number,
  xDirection: 1 | -1,
  yDirection: 1 | -1,
  segmentsPerCurve: number
): void {
  const curves = createScalarCurves(makeBeziers(edge), width / 100);

  appendCurves(
    points,
    curves,
    (curve) => ({
      cx1: x + xDirection * curve.cx1,
      cy1: y + yDirection * curve.cy1,
      cx2: x + xDirection * curve.cx2,
      cy2: y + yDirection * curve.cy2,
      ex: x + xDirection * curve.ex,
      ey: y + yDirection * curve.ey,
    }),
    segmentsPerCurve
  );
}

/**
 * Adds sampled vertical edge curves.
 *
 * @param points - Outline points.
 * @param x - Edge origin x.
 * @param y - Edge origin y.
 * @param edge - Edge shape.
 * @param height - Edge height.
 * @param yDirection - Vertical direction.
 * @param xDirection - Horizontal curve direction.
 * @param segmentsPerCurve - Sample count for each Bezier curve.
 * @returns Nothing.
 */
function appendVerticalCurves(
  points: Point[],
  x: number,
  y: number,
  edge: PuzzlePieceLayout["shape"]["RIGHT"],
  height: number,
  yDirection: 1 | -1,
  xDirection: 1 | -1,
  segmentsPerCurve: number
): void {
  const curves = createScalarCurves(makeBeziers(edge), height / 100);

  appendCurves(
    points,
    curves,
    (curve) => ({
      cx1: x + xDirection * curve.cy1,
      cy1: y + yDirection * curve.cx1,
      cx2: x + xDirection * curve.cy2,
      cy2: y + yDirection * curve.cx2,
      ex: x + xDirection * curve.ey,
      ey: y + yDirection * curve.ex,
    }),
    segmentsPerCurve
  );
}

/**
 * Adds sampled curves with renderer-specific coordinate transforms.
 *
 * @param points - Outline points.
 * @param curves - Scaled curves.
 * @param transform - Coordinate transform.
 * @param segmentsPerCurve - Sample count for each Bezier curve.
 * @returns Nothing.
 */
function appendCurves(
  points: Point[],
  curves: BezierCurve[],
  transform: (curve: BezierCurve) => BezierCurve,
  segmentsPerCurve: number
): void {
  for (const curve of curves) {
    const transformed = transform(curve);
    const start = points[points.length - 1];

    for (let segment = 1; segment <= segmentsPerCurve; segment += 1) {
      points.push(
        sampleBezier(
          start,
          { x: transformed.cx1, y: transformed.cy1 },
          { x: transformed.cx2, y: transformed.cy2 },
          { x: transformed.ex, y: transformed.ey },
          segment / segmentsPerCurve
        )
      );
    }
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
