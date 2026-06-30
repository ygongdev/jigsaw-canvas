import type { GeneratePuzzleOptions } from "./types.js";

/**
 * Creates a per-piece progress reporter for one generation run.
 *
 * @param totalPieces - Number of pieces in the puzzle.
 * @param options - Generator options.
 * @returns Progress reporting callback.
 */
export function createProgressReporter(
  totalPieces: number,
  options: GeneratePuzzleOptions
): (pieceIndex: number) => void {
  const startedAt = now();

  return (pieceIndex) => {
    const completedPieces = pieceIndex + 1;

    options.onProgress?.({
      completedPieces,
      elapsedMs: now() - startedAt,
      pieceIndex,
      progress: totalPieces === 0 ? 1 : completedPieces / totalPieces,
      totalPieces,
    });
  };
}

function now(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
