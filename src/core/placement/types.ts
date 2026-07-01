import type { JigsawEdgeName, Point, PuzzlePieceLayout } from "../types.js";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PiecePosition {
  x: number;
  y: number;
}

export interface PlacedPiece {
  piece: PuzzlePieceLayout;
  position: PiecePosition;
}

export interface PieceHitArea {
  bounds: Bounds;
  piece: PuzzlePieceLayout;
  polygon: Point[];
  contains(point: Point): boolean;
}

export interface HitTestOptions {
  segmentsPerCurve?: number;
}

export interface PlacementOptions {
  board: Bounds;
  ignorePieceIndexes?: number[];
  placedPieces: PlacedPiece[];
}

export interface PhysicalSnapOptions {
  board: Bounds;
  moving: PlacedPiece;
  targets: PlacedPiece[];
  tolerance: number;
}

export type PhysicalSnapKind = "piece" | "boundary";

export interface PhysicalSnapCandidate {
  boundary?: JigsawEdgeName;
  distance: number;
  edgeName: JigsawEdgeName;
  kind: PhysicalSnapKind;
  position: PiecePosition;
  target?: PlacedPiece;
  targetEdgeName?: JigsawEdgeName;
}
