import type { RandomSource } from "../core/edges.js";

export type PuzzleImageOutput = "blob-url" | "data-url";

export interface PuzzleGenerationProgress {
  completedPieces: number;
  elapsedMs: number;
  pieceIndex: number;
  progress: number;
  totalPieces: number;
}

export interface GeneratePuzzleOptions {
  imageQuality?: number;
  imageOutput?: PuzzleImageOutput;
  imageType?: string;
  onProgress?: (progress: PuzzleGenerationProgress) => void;
  random?: RandomSource;
}
