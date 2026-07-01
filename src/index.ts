export { createPieceEdges, oppositeEdge } from "./core/edges.js";
export { createPuzzleLayout } from "./core/layout.js";
export {
  JIGSAW_CONNECTOR_STYLE,
  JIGSAW_EDGE_POLARITY,
  type BoundarySegment,
  type ConnectorStyle,
  type EdgePolarity,
  type JigsawEdgeName,
  type PieceEdge,
  type PieceEdges,
  type PuzzleImage,
  type PuzzleLayout,
  type PuzzlePieceLayout,
  type RenderedPuzzlePiece,
  type PieceMargins,
  type Point,
} from "./core/types.js";
export type { ConnectorStyleOption, RandomSource } from "./core/edges.js";
export {
  canPlacePiece,
  createPieceHitArea,
  findPhysicalSnapCandidate,
  getPlacedPolygon,
  hitTestPiece,
  type Bounds,
  type HitTestOptions,
  type PhysicalSnapCandidate,
  type PhysicalSnapKind,
  type PhysicalSnapOptions,
  type PieceHitArea,
  type PiecePosition,
  type PlacedPiece,
  type PlacementOptions,
} from "./core/placement/index.js";
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
