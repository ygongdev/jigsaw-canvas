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
  const pieceWidth = imageWidth / columns;
  const pieceHeight = imageHeight / rows;
  const scalarWidth = pieceWidth / 100;
  const scalarHeight = pieceHeight / 100;
  const lowPeak = 8.75;
  const highPeak = 20;
  const pieceContainerWidth =
    pieceWidth + lowPeak * scalarHeight + highPeak * scalarHeight;
  const pieceContainerHeight =
    pieceHeight + lowPeak * scalarWidth + highPeak * scalarWidth;
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
      pieces.push({
        shape,
        containerWidth: pieceContainerWidth,
        containerHeight: pieceContainerHeight,
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
