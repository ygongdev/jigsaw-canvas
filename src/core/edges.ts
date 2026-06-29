import {
  JIGSAW_SHAPE,
  type JigsawShapeValue,
  type PieceShape,
} from "./types.js";

export type RandomSource = () => number;

/**
 * Creates edge shapes for one piece from its position and neighbors.
 *
 * @param row - Piece row index.
 * @param col - Piece column index.
 * @param rows - Total puzzle rows.
 * @param columns - Total puzzle columns.
 * @param topNeighbor - Shape of the piece above.
 * @param leftNeighbor - Shape of the piece to the left.
 * @param random - Random source for non-boundary edges.
 * @returns The edge shape map for the piece.
 */
export function createPieceShape(
  row: number,
  col: number,
  rows: number,
  columns: number,
  topNeighbor?: PieceShape,
  leftNeighbor?: PieceShape,
  random: RandomSource = Math.random
): PieceShape {
  return {
    TOP:
      row === 0
        ? JIGSAW_SHAPE.STRAIGHT
        : oppositeEdge(topNeighbor?.BOTTOM ?? JIGSAW_SHAPE.SLOT),
    RIGHT:
      col === columns - 1 ? JIGSAW_SHAPE.STRAIGHT : createRandomEdge(random),
    BOTTOM: row === rows - 1 ? JIGSAW_SHAPE.STRAIGHT : createRandomEdge(random),
    LEFT:
      col === 0
        ? JIGSAW_SHAPE.STRAIGHT
        : oppositeEdge(leftNeighbor?.RIGHT ?? JIGSAW_SHAPE.SLOT),
  };
}

/**
 * Returns the matching edge shape for the neighboring piece.
 *
 * @param edge - Edge shape to complement.
 * @returns The opposite edge shape.
 */
export function oppositeEdge(edge: PieceShape[keyof PieceShape]): JigsawShapeValue {
  if (edge === JIGSAW_SHAPE.TAB) {
    return JIGSAW_SHAPE.SLOT;
  }

  if (edge === JIGSAW_SHAPE.SLOT) {
    return JIGSAW_SHAPE.TAB;
  }

  return JIGSAW_SHAPE.STRAIGHT;
}

/**
 * Picks a non-boundary edge shape.
 *
 * @param random - Random source.
 * @returns A tab or slot edge shape.
 */
export function createRandomEdge(random: RandomSource): JigsawShapeValue {
  return random() < 0.5 ? JIGSAW_SHAPE.TAB : JIGSAW_SHAPE.SLOT;
}
