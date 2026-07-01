export type JigsawEdgeName = "TOP" | "RIGHT" | "BOTTOM" | "LEFT";

export const JIGSAW_EDGE_POLARITY = Object.freeze({
  IN: "in",
  OUT: "out",
  STRAIGHT: "straight",
} as const);

export const JIGSAW_CONNECTOR_STYLE = Object.freeze({
  ANGULAR: "angular",
  CLASSIC: "classic",
  DOVETAIL: "dovetail",
  ROUND: "round",
  WAVE: "wave",
} as const);

export type EdgePolarity =
  (typeof JIGSAW_EDGE_POLARITY)[keyof typeof JIGSAW_EDGE_POLARITY];

export type ConnectorStyle =
  (typeof JIGSAW_CONNECTOR_STYLE)[keyof typeof JIGSAW_CONNECTOR_STYLE];

export interface Point {
  x: number;
  y: number;
}

export type BoundarySegment =
  | {
      kind: "line";
      start: Point;
      end: Point;
    }
  | {
      kind: "cubic";
      start: Point;
      cp1: Point;
      cp2: Point;
      end: Point;
    };

export interface PieceEdge {
  polarity: EdgePolarity;
  sharedEdgeId?: string;
  style?: ConnectorStyle;
}

export type PieceEdges = Record<JigsawEdgeName, PieceEdge>;

export interface PieceMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PuzzlePieceLayout {
  index: number;
  edges: PieceEdges;
  grid?: {
    row: number;
    col: number;
  };
  outline: BoundarySegment[];
  sourceBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  containerWidth: number;
  containerHeight: number;
  margins: PieceMargins;
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
