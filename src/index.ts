export { createPieceShape } from "./core/edges.js";
export { createPuzzleLayout } from "./core/layout.js";
export {
  JIGSAW_SHAPE,
  type JigsawEdgeName,
  type JigsawShapeValue,
  type PieceShape,
  type PuzzleImage,
  type PuzzleLayout,
  type PuzzlePieceLayout,
  type RenderedPuzzlePiece,
} from "./core/types.js";
export { generatePuzzleCanvas2D as generatePuzzle } from "./renderers/canvas2d.js";
