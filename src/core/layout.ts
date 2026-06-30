import { createPieceShape } from "./edges.js";
import type { RandomSource } from "./edges.js";
import type { PieceShape, PuzzleLayout, PuzzlePieceLayout } from "./types.js";

export interface CreatePuzzleLayoutOptions {
  rows: number;
  columns: number;
  imageWidth: number;
  imageHeight: number;
  random?: RandomSource;
}

/**
 * Builds DOM-free puzzle layout data for renderers to consume.
 *
 * @param options - Puzzle layout options.
 * @returns Puzzle layout data.
 */
export function createPuzzleLayout({
  rows,
  columns,
  imageWidth,
  imageHeight,
  random = Math.random,
}: CreatePuzzleLayoutOptions): PuzzleLayout {
  validatePositiveInteger(rows, "rows");
  validatePositiveInteger(columns, "columns");
  validatePositiveNumber(imageWidth, "imageWidth");
  validatePositiveNumber(imageHeight, "imageHeight");

  const pieceWidth = imageWidth / columns;
  const pieceHeight = imageHeight / rows;
  const scalarWidth = pieceWidth / 100;
  const scalarHeight = pieceHeight / 100;
  const lowPeak = 8.75;
  const highPeak = 20;
  const sideMargin = highPeak * scalarHeight;
  const verticalMargin = highPeak * scalarWidth;
  const pieceContainerWidth =
    pieceWidth + (columns > 1 ? sideMargin * 2 : 0);
  const pieceContainerHeight =
    pieceHeight + (rows > 1 ? verticalMargin * 2 : 0);
  const shapes: Array<Array<PieceShape | undefined>> = [];
  const pieces: PuzzlePieceLayout[] = [];

  for (let row = 0; row < rows; row += 1) {
    shapes[row] = [];

    for (let col = 0; col < columns; col += 1) {
      const shape = createPieceShape(
        row,
        col,
        rows,
        columns,
        shapes[row - 1]?.[col],
        shapes[row]?.[col - 1],
        random
      );

      shapes[row][col] = shape;
      const margins = {
        top: row === 0 ? 0 : verticalMargin,
        right: col === columns - 1 ? 0 : sideMargin,
        bottom: row === rows - 1 ? 0 : verticalMargin,
        left: col === 0 ? 0 : sideMargin,
      };

      pieces.push({
        shape,
        margins,
        containerWidth: pieceWidth + margins.left + margins.right,
        containerHeight: pieceHeight + margins.top + margins.bottom,
        width: pieceWidth,
        height: pieceHeight,
        row,
        col,
      });
    }
  }

  return {
    rows,
    columns,
    imageWidth,
    imageHeight,
    pieceWidth,
    pieceHeight,
    pieceContainerWidth,
    pieceContainerHeight,
    lowPeak,
    highPeak,
    pieces,
  };
}

/**
 * Validates a positive integer layout option.
 *
 * @param value - Option value.
 * @param name - Option name.
 * @returns Nothing.
 */
function validatePositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
}

/**
 * Validates a positive finite layout option.
 *
 * @param value - Option value.
 * @param name - Option name.
 * @returns Nothing.
 */
function validatePositiveNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}
