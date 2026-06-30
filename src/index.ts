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
  type PieceMargins,
} from "./core/types.js";
export {
  generatePuzzleCanvas2D as generatePuzzle,
  generatePuzzleCanvas2D,
  type GeneratePuzzleOptions,
  type PuzzleGenerationProgress,
  type PuzzleImageOutput,
} from "./renderers/canvas2d.js";
export { revokePuzzleImageSource } from "./renderers/encoding.js";
export {
  generatePuzzleWebGPU,
  generatePuzzleWebGPUTextures,
  isWebGPUSupported,
  type GeneratePuzzleWebGPUOptions,
  type GeneratePuzzleWebGPUTextureOptions,
  type WebGPUPuzzlePiece,
} from "./renderers/webgpu.js";
