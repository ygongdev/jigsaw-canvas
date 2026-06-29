export type JigsawEdgeShape = 0 | 1 | 2;

export type JigsawEdgeName = "TOP" | "RIGHT" | "BOTTOM" | "LEFT";

export type PuzzleImage = CanvasImageSource & {
  width: number;
  height: number;
};

export interface PuzzlePiece {
  shape: Partial<Record<JigsawEdgeName, JigsawEdgeShape>>;
  containerWidth: number;
  containerHeight: number;
  width: number;
  height: number;
  row: number;
  col: number;
  imageSrc: string;
  readonly widthPercentage: number;
  readonly heightPercentage: number;
}

export function generatePuzzle(
  img: PuzzleImage,
  rows: number,
  columns: number
): Promise<PuzzlePiece[]>;
