import type {
  PieceMargins,
  PieceShape,
  PuzzlePieceLayout,
  RenderedPuzzlePiece,
} from "../core/types.js";

export class RenderedPuzzlePieceData implements RenderedPuzzlePiece {
  imageSrc = "";

  /**
   * Wraps layout data with renderer output fields.
   *
   * @param layout - Piece layout data.
   */
  constructor(private readonly layout: PuzzlePieceLayout) {}

  /**
   * Returns the piece edge shape map.
   *
   * @returns Piece edge shape map.
   */
  get shape(): PieceShape {
    return this.layout.shape;
  }

  /**
   * Returns transparent margins around the base piece.
   *
   * @returns Piece margins.
   */
  get margins(): PieceMargins {
    return this.layout.margins;
  }

  /**
   * Returns the rendered canvas width.
   *
   * @returns Rendered canvas width.
   */
  get containerWidth(): number {
    return this.layout.containerWidth;
  }

  /**
   * Returns the rendered canvas height.
   *
   * @returns Rendered canvas height.
   */
  get containerHeight(): number {
    return this.layout.containerHeight;
  }

  /**
   * Returns the base piece width.
   *
   * @returns Base piece width.
   */
  get width(): number {
    return this.layout.width;
  }

  /**
   * Returns the base piece height.
   *
   * @returns Base piece height.
   */
  get height(): number {
    return this.layout.height;
  }

  /**
   * Returns the puzzle row.
   *
   * @returns Puzzle row.
   */
  get row(): number {
    return this.layout.row;
  }

  /**
   * Returns the puzzle column.
   *
   * @returns Puzzle column.
   */
  get col(): number {
    return this.layout.col;
  }

  /**
   * Returns the base width relative to rendered width.
   *
   * @returns Width ratio.
   */
  get widthPercentage(): number {
    return this.width / this.containerWidth;
  }

  /**
   * Returns the base height relative to rendered height.
   *
   * @returns Height ratio.
   */
  get heightPercentage(): number {
    return this.height / this.containerHeight;
  }
}
