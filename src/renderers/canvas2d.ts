import { createPuzzleLayout } from "../core/layout.js";
import { createPiecePath } from "./canvas2d/paths.js";
import {
  type PieceShape,
  type PuzzleImage,
  type PuzzlePieceLayout,
  type RenderedPuzzlePiece,
} from "../core/types.js";

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

    const path = createPiecePath(piece, layout.lowPeak, layout.highPeak);
    newCanvasCtx.stroke(path);
    newCanvasCtx.clip(path);
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
