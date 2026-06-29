import { createPuzzleLayout } from "../core/layout.js";
import {
  JIGSAW_SHAPE,
  type JigsawShapeValue,
  type PieceShape,
  type PuzzleImage,
  type PuzzlePieceLayout,
  type RenderedPuzzlePiece,
} from "../core/types.js";

interface BezierCurve {
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  ex: number;
  ey: number;
}

class CanvasPuzzlePiece implements RenderedPuzzlePiece {
  imageSrc = "";

  /**
   * Wraps layout data with renderer output fields.
   *
   * @param layout - Piece layout data.
   */
  constructor(private readonly layout: PuzzlePieceLayout) {}

  /**
   * Returns the piece edge shape map.
   *
   * @returns Piece edge shape map.
   */
  get shape(): PieceShape {
    return this.layout.shape;
  }

  /**
   * Returns the rendered canvas width.
   *
   * @returns Rendered canvas width.
   */
  get containerWidth(): number {
    return this.layout.containerWidth;
  }

  /**
   * Returns the rendered canvas height.
   *
   * @returns Rendered canvas height.
   */
  get containerHeight(): number {
    return this.layout.containerHeight;
  }

  /**
   * Returns the base piece width.
   *
   * @returns Base piece width.
   */
  get width(): number {
    return this.layout.width;
  }

  /**
   * Returns the base piece height.
   *
   * @returns Base piece height.
   */
  get height(): number {
    return this.layout.height;
  }

  /**
   * Returns the puzzle row.
   *
   * @returns Puzzle row.
   */
  get row(): number {
    return this.layout.row;
  }

  /**
   * Returns the puzzle column.
   *
   * @returns Puzzle column.
   */
  get col(): number {
    return this.layout.col;
  }

  /**
   * Returns the base width relative to rendered width.
   *
   * @returns Width ratio.
   */
  get widthPercentage(): number {
    return this.width / this.containerWidth;
  }

  /**
   * Returns the base height relative to rendered height.
   *
   * @returns Height ratio.
   */
  get heightPercentage(): number {
    return this.height / this.containerHeight;
  }
}

/**
 * Renders a puzzle with Canvas2D and returns data URL pieces.
 *
 * @param img - Source image.
 * @param rows - Number of puzzle rows.
 * @param columns - Number of puzzle columns.
 * @returns Rendered puzzle pieces.
 */
export async function generatePuzzleCanvas2D(
  img: PuzzleImage,
  rows: number,
  columns: number
): Promise<RenderedPuzzlePiece[]> {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create a 2D canvas context.");
  }

  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  const layout = createPuzzleLayout({
    rows,
    columns,
    imageWidth: img.width,
    imageHeight: img.height,
  });

  const puzzlePieces: RenderedPuzzlePiece[] = [];

  for (const layoutPiece of layout.pieces) {
    const piece = new CanvasPuzzlePiece(layoutPiece);
    const newCanvas = document.createElement("canvas");
    newCanvas.width = layout.pieceContainerWidth;
    newCanvas.height = layout.pieceContainerHeight;

    const newCanvasCtx = newCanvas.getContext("2d");
    if (!newCanvasCtx) {
      throw new Error("Could not create a 2D canvas context for a puzzle piece.");
    }

    drawPiecePath(newCanvasCtx, piece, layout.lowPeak, layout.highPeak);
    newCanvasCtx.stroke();
    newCanvasCtx.clip();
    newCanvasCtx.drawImage(
      img,
      getSourceX(piece, layout.lowPeak),
      getSourceY(piece, layout.highPeak),
      newCanvas.width,
      newCanvas.height,
      0,
      0,
      newCanvas.width,
      newCanvas.height
    );

    piece.imageSrc = newCanvas.toDataURL();
    puzzlePieces.push(piece);
  }

  return puzzlePieces;
}

/**
 * Draws one clipped jigsaw piece path.
 *
 * @param context - Canvas 2D context.
 * @param piece - Piece to draw.
 * @param lowPeak - Lower edge peak scalar.
 * @param highPeak - Higher edge peak scalar.
 * @returns Nothing.
 */
function drawPiecePath(
  context: CanvasRenderingContext2D,
  piece: RenderedPuzzlePiece,
  lowPeak: number,
  highPeak: number
): void {
  const scalarWidth = piece.width / 100;
  const scalarHeight = piece.height / 100;
  let x = piece.col <= 0 ? 0 : lowPeak * scalarHeight;
  let y = piece.row <= 0 ? 0 : highPeak * scalarWidth;

  context.beginPath();
  context.moveTo(x, y);

  if (piece.shape.TOP === JIGSAW_SHAPE.STRAIGHT) {
    context.lineTo(x + piece.width, y);
  } else {
    const hCurves = createScalarCurves(
      makeBeziers(piece.shape.TOP),
      piece.width / 100
    );

    for (const curve of hCurves) {
      context.bezierCurveTo(
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
    context.lineTo(x, y + piece.height);
  } else {
    const vCurves = createScalarCurves(
      makeBeziers(piece.shape.RIGHT),
      piece.height / 100
    );

    for (const curve of vCurves) {
      context.bezierCurveTo(
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
    context.lineTo(x - piece.width, y);
  } else {
    const hCurves = createScalarCurves(
      makeBeziers(piece.shape.BOTTOM),
      piece.width / 100
    );

    for (const curve of hCurves) {
      context.bezierCurveTo(
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
    context.lineTo(x, y - piece.height);
  } else {
    const vCurves = createScalarCurves(
      makeBeziers(piece.shape.LEFT),
      piece.height / 100
    );

    for (const curve of vCurves) {
      context.bezierCurveTo(
        x - curve.cy1,
        y - curve.cx1,
        x - curve.cy2,
        y - curve.cx2,
        x - curve.ey,
        y - curve.ex
      );
    }
  }
}

/**
 * Calculates the source image x offset for a piece.
 *
 * @param piece - Piece being rendered.
 * @param lowPeak - Lower edge peak scalar.
 * @returns Source image x offset.
 */
function getSourceX(piece: RenderedPuzzlePiece, lowPeak: number): number {
  const scalarHeight = piece.height / 100;
  const globalX = piece.col * piece.width;

  return Math.max(0, globalX - lowPeak * scalarHeight);
}

/**
 * Calculates the source image y offset for a piece.
 *
 * @param piece - Piece being rendered.
 * @param highPeak - Higher edge peak scalar.
 * @returns Source image y offset.
 */
function getSourceY(piece: RenderedPuzzlePiece, highPeak: number): number {
  const scalarWidth = piece.width / 100;
  const globalY = piece.row * piece.height;

  return Math.max(0, globalY - highPeak * scalarWidth);
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
