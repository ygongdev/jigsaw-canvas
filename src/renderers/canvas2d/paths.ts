import {
  JIGSAW_SHAPE,
  type JigsawShapeValue,
  type RenderedPuzzlePiece,
} from "../../core/types.js";

interface BezierCurve {
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  ex: number;
  ey: number;
}

/**
 * Creates one reusable jigsaw piece path.
 *
 * @param piece - Piece to create a path for.
 * @param lowPeak - Lower edge peak scalar.
 * @param highPeak - Higher edge peak scalar.
 * @returns A reusable Path2D piece outline.
 */
export function createPiecePath(
  piece: RenderedPuzzlePiece,
  lowPeak: number,
  highPeak: number
): Path2D {
  const path = new Path2D();
  const scalarWidth = piece.width / 100;
  const scalarHeight = piece.height / 100;
  let x = piece.col <= 0 ? 0 : lowPeak * scalarHeight;
  let y = piece.row <= 0 ? 0 : highPeak * scalarWidth;

  path.moveTo(x, y);

  if (piece.shape.TOP === JIGSAW_SHAPE.STRAIGHT) {
    path.lineTo(x + piece.width, y);
  } else {
    const hCurves = createScalarCurves(
      makeBeziers(piece.shape.TOP),
      piece.width / 100
    );

    for (const curve of hCurves) {
      path.bezierCurveTo(
        x + curve.cx1,
        y + curve.cy1,
        x + curve.cx2,
        y + curve.cy2,
        x + curve.ex,
        y + curve.ey
      );
    }
  }

  x += piece.width;

  if (piece.shape.RIGHT === JIGSAW_SHAPE.STRAIGHT) {
    path.lineTo(x, y + piece.height);
  } else {
    const vCurves = createScalarCurves(
      makeBeziers(piece.shape.RIGHT),
      piece.height / 100
    );

    for (const curve of vCurves) {
      path.bezierCurveTo(
        x - curve.cy1,
        y + curve.cx1,
        x - curve.cy2,
        y + curve.cx2,
        x - curve.ey,
        y + curve.ex
      );
    }
  }

  y += piece.height;

  if (piece.shape.BOTTOM === JIGSAW_SHAPE.STRAIGHT) {
    path.lineTo(x - piece.width, y);
  } else {
    const hCurves = createScalarCurves(
      makeBeziers(piece.shape.BOTTOM),
      piece.width / 100
    );

    for (const curve of hCurves) {
      path.bezierCurveTo(
        x - curve.cx1,
        y + curve.cy1,
        x - curve.cx2,
        y + curve.cy2,
        x - curve.ex,
        y + curve.ey
      );
    }
  }

  x -= piece.width;

  if (piece.shape.LEFT === JIGSAW_SHAPE.STRAIGHT) {
    path.lineTo(x, y - piece.height);
  } else {
    const vCurves = createScalarCurves(
      makeBeziers(piece.shape.LEFT),
      piece.height / 100
    );

    for (const curve of vCurves) {
      path.bezierCurveTo(
        x - curve.cy1,
        y - curve.cx1,
        x - curve.cy2,
        y - curve.cx2,
        x - curve.ey,
        y - curve.ex
      );
    }
  }

  return path;
}

/**
 * Scales normalized Bezier curves to piece dimensions.
 *
 * @param curve - Normalized Bezier curves.
 * @param scalar - Size scalar.
 * @returns Scaled Bezier curves.
 */
function createScalarCurves(
  curve: BezierCurve[],
  scalar: number
): BezierCurve[] {
  return curve.map((entry) => ({
    cx1: entry.cx1 * scalar,
    cy1: entry.cy1 * scalar,
    cx2: entry.cx2 * scalar,
    cy2: entry.cy2 * scalar,
    ex: entry.ex * scalar,
    ey: entry.ey * scalar,
  }));
}

/**
 * Selects normalized curves for a tab or slot edge.
 *
 * @param edge - Edge shape.
 * @returns Normalized Bezier curves.
 */
function makeBeziers(edge: JigsawShapeValue): BezierCurve[] {
  return edge === JIGSAW_SHAPE.TAB ? makeTabBeziers() : makeSlotBeziers();
}

/**
 * Returns normalized slot Bezier curves.
 *
 * @returns Normalized slot Bezier curves.
 */
function makeSlotBeziers(): BezierCurve[] {
  return [
    { cx1: 0, cy1: 0, cx2: 35, cy2: 15, ex: 37, ey: 5 },
    { cx1: 37, cy1: 5, cx2: 40, cy2: 0, ex: 38, ey: -5 },
    { cx1: 38, cy1: -5, cx2: 20, cy2: -20, ex: 50, ey: -20 },
    { cx1: 50, cy1: -20, cx2: 80, cy2: -20, ex: 62, ey: -5 },
    { cx1: 62, cy1: -5, cx2: 60, cy2: 0, ex: 63, ey: 5 },
    { cx1: 63, cy1: 5, cx2: 65, cy2: 15, ex: 100, ey: 0 },
  ];
}

/**
 * Returns normalized tab Bezier curves.
 *
 * @returns Normalized tab Bezier curves.
 */
function makeTabBeziers(): BezierCurve[] {
  return [
    { cx1: 0, cy1: 0, cx2: 35, cy2: -15, ex: 37, ey: -5 },
    { cx1: 37, cy1: -5, cx2: 40, cy2: 0, ex: 38, ey: 5 },
    { cx1: 38, cy1: 5, cx2: 20, cy2: 20, ex: 50, ey: 20 },
    { cx1: 50, cy1: 20, cx2: 80, cy2: 20, ex: 62, ey: 5 },
    { cx1: 62, cy1: 5, cx2: 60, cy2: 0, ex: 63, ey: -5 },
    { cx1: 63, cy1: -5, cx2: 65, cy2: -15, ex: 100, ey: 0 },
  ];
}
