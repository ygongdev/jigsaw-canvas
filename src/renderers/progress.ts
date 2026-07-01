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

/**
 * Gives the browser a frame to paint progress updates when a callback exists.
 *
 * @param options - Generator options.
 * @returns Nothing.
 */
export async function yieldForProgressPaint(
  options: GeneratePuzzleOptions
): Promise<void> {
  if (!options.onProgress || typeof requestAnimationFrame === "undefined") {
    return;
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function now(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
