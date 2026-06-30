import {
  JIGSAW_SHAPE,
  type JigsawShapeValue,
} from "../core/types.js";

export interface BezierCurve {
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  ex: number;
  ey: number;
}

/**
 * Scales normalized Bezier curves to piece dimensions.
 *
 * @param curve - Normalized Bezier curves.
 * @param scalar - Size scalar.
 * @returns Scaled Bezier curves.
 */
export function createScalarCurves(
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
export function makeBeziers(edge: JigsawShapeValue): BezierCurve[] {
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
