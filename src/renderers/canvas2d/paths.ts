import {
  JIGSAW_SHAPE,
  type RenderedPuzzlePiece,
} from "../../core/types.js";
import { createScalarCurves, makeBeziers } from "../curves.js";

/**
 * Creates one reusable jigsaw piece path.
 *
 * @param piece - Piece to create a path for.
 * @returns A reusable Path2D piece outline.
 */
export function createPiecePath(piece: RenderedPuzzlePiece): Path2D {
  const path = new Path2D();
  let x = piece.margins.left;
  let y = piece.margins.top;

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

  path.closePath();

  return path;
}
