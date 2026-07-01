export { canPlacePiece, getPlacedPolygon } from "./collision.js";
export { createPieceHitArea, hitTestPiece } from "./hit-test.js";
export { findPhysicalSnapCandidate } from "./snap.js";
export type {
  Bounds,
  HitTestOptions,
  PhysicalSnapCandidate,
  PhysicalSnapKind,
  PhysicalSnapOptions,
  PieceHitArea,
  PiecePosition,
  PlacedPiece,
  PlacementOptions,
} from "./types.js";
