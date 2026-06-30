import { createPuzzleLayout } from "../core/layout.js";
import { createPiecePath } from "./canvas2d/paths.js";
import { encodeCanvasImageSource } from "./encoding.js";
import { RenderedPuzzlePieceData } from "./piece.js";
import { createProgressReporter } from "./progress.js";
import type { PuzzleImage, RenderedPuzzlePiece } from "../core/types.js";
import type { GeneratePuzzleOptions } from "./types.js";

export type {
  GeneratePuzzleOptions,
  PuzzleGenerationProgress,
  PuzzleImageOutput,
} from "./types.js";

/**
 * Renders a puzzle with Canvas2D and returns image source pieces.
 *
 * @param img - Source image.
 * @param rows - Number of puzzle rows.
 * @param columns - Number of puzzle columns.
 * @returns Rendered puzzle pieces.
 */
export async function generatePuzzleCanvas2D(
  img: PuzzleImage,
  rows: number,
  columns: number,
  options: GeneratePuzzleOptions = {}
): Promise<RenderedPuzzlePiece[]> {
  const layout = createPuzzleLayout({
    rows,
    columns,
    imageWidth: img.width,
    imageHeight: img.height,
    random: options.random,
  });

  const puzzlePieces: RenderedPuzzlePiece[] = [];
  const reportProgress = createProgressReporter(layout.pieces.length, options);

  for (let index = 0; index < layout.pieces.length; index += 1) {
    const layoutPiece = layout.pieces[index];
    const piece = new RenderedPuzzlePieceData(layoutPiece);
    const newCanvas = document.createElement("canvas");
    newCanvas.width = piece.containerWidth;
    newCanvas.height = piece.containerHeight;

    const newCanvasCtx = newCanvas.getContext("2d");
    if (!newCanvasCtx) {
      throw new Error("Could not create a 2D canvas context for a puzzle piece.");
    }

    const path = createPiecePath(piece);
    newCanvasCtx.stroke(path);
    newCanvasCtx.clip(path);
    newCanvasCtx.drawImage(
      img,
      piece.margins.left - piece.col * piece.width,
      piece.margins.top - piece.row * piece.height
    );

    piece.imageSrc = await encodeCanvasImageSource(newCanvas, options);
    puzzlePieces.push(piece);
    reportProgress(index);
  }

  return puzzlePieces;
}
