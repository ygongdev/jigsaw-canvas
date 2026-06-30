export const JIGSAW_SHAPE = Object.freeze({
  TAB: "tab",
  SLOT: "slot",
  STRAIGHT: "straight",
} as const);

export type JigsawShapeValue =
  (typeof JIGSAW_SHAPE)[keyof typeof JIGSAW_SHAPE];

export type JigsawEdgeName = "TOP" | "RIGHT" | "BOTTOM" | "LEFT";

export type PieceShape = Record<JigsawEdgeName, JigsawShapeValue>;

export interface PieceMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PuzzlePieceLayout {
  shape: PieceShape;
  margins: PieceMargins;
  containerWidth: number;
  containerHeight: number;
  width: number;
  height: number;
  row: number;
  col: number;
}

export interface PuzzleLayout {
  rows: number;
  columns: number;
  imageWidth: number;
  imageHeight: number;
  pieceWidth: number;
  pieceHeight: number;
  pieceContainerWidth: number;
  pieceContainerHeight: number;
  lowPeak: number;
  highPeak: number;
  pieces: PuzzlePieceLayout[];
}

export interface RenderedPuzzlePiece extends PuzzlePieceLayout {
  imageSrc: string;
  readonly widthPercentage: number;
  readonly heightPercentage: number;
}

export type PuzzleImage = CanvasImageSource & {
  width: number;
  height: number;
};
